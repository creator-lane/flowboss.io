// Deploy this to Supabase Edge Functions as "stripe-webhook"
// Environment variables needed:
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET            - from Stripe webhook endpoint config
//   STRIPE_MONTHLY_PRICE_ID          - GC monthly ($29.99)
//   STRIPE_ANNUAL_PRICE_ID           - GC annual ($199.99)
//   STRIPE_SUB_PRO_MONTHLY_PRICE_ID  - Sub Pro monthly ($14.99) [optional]
//   STRIPE_SUB_PRO_ANNUAL_PRICE_ID   - Sub Pro annual ($99)    [optional]

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

// Deno runs on SubtleCrypto, which is async-only. We must pass an async
// crypto provider AND use constructEventAsync, otherwise signature verification
// throws "SubtleCryptoProvider cannot be used in a synchronous context".
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Price-id → tier map, resolved once at cold start.
const GC_PRICE_IDS = new Set(
  [
    Deno.env.get('STRIPE_MONTHLY_PRICE_ID'),
    Deno.env.get('STRIPE_ANNUAL_PRICE_ID'),
  ].filter(Boolean) as string[],
);
const SUB_PRO_PRICE_IDS = new Set(
  [
    Deno.env.get('STRIPE_SUB_PRO_MONTHLY_PRICE_ID'),
    Deno.env.get('STRIPE_SUB_PRO_ANNUAL_PRICE_ID'),
  ].filter(Boolean) as string[],
);

function tierFromPriceId(priceId: string | null | undefined): 'gc' | 'sub_pro' | null {
  if (!priceId) return null;
  if (SUB_PRO_PRICE_IDS.has(priceId)) return 'sub_pro';
  if (GC_PRICE_IDS.has(priceId)) return 'gc';
  return null;
}

// Pull the first price id out of a subscription object.
function priceIdFromSubscription(sub: Stripe.Subscription): string | null {
  return sub.items?.data?.[0]?.price?.id ?? null;
}

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!;
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider,
    );
  } catch (err) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const plan = session.metadata?.plan || 'monthly';
      const metadataTier = session.metadata?.tier as 'gc' | 'sub_pro' | undefined;
      if (userId) {
        // Try to resolve tier: metadata first (set by create-checkout-session),
        // fall back to looking up the subscription's price id.
        let tier: 'gc' | 'sub_pro' | null = metadataTier ?? null;
        if (!tier && session.subscription) {
          try {
            const sub = await stripe.subscriptions.retrieve(session.subscription as string);
            tier = tierFromPriceId(priceIdFromSubscription(sub));
          } catch {
            /* noop - fall through with null tier */
          }
        }

        const update: Record<string, unknown> = {
          subscription_status: 'trialing',
          subscription_provider: 'stripe',
          stripe_subscription_id: session.subscription as string,
          subscription_plan: plan,
        };
        if (tier) update.subscription_tier = tier;

        await supabase.from('profiles').update(update).eq('id', userId);
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId = subscription.customer as string;

        // Find user by stripe customer id
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          const tier = tierFromPriceId(priceIdFromSubscription(subscription));
          const update: Record<string, unknown> = {
            subscription_status: 'active',
            subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_end: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
          };
          if (tier) update.subscription_tier = tier;
          await supabase.from('profiles').update(update).eq('id', profile.id);
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (profile) {
        await supabase.from('profiles').update({
          subscription_status: 'past_due',
        }).eq('id', profile.id);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      // Pull business_role so we can set the right post-cancel tier. A GC who
      // cancels shouldn't flip to 'sub_free' — that triggers sub-focused
      // upgrade prompts with the wrong persona copy. Let the tier reset to
      // null and let useSubscriptionTier derive state from status+role.
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, business_role')
        .eq('stripe_customer_id', customerId)
        .single();

      if (profile) {
        const isGcRole = profile.business_role === 'gc' || profile.business_role === 'both';
        await supabase.from('profiles').update({
          subscription_status: 'canceled',
          stripe_subscription_id: null,
          // GCs: clear tier so the app treats them as 'none' (bounced to pricing).
          // Subs: drop to 'sub_free' so they keep invited-project access.
          subscription_tier: isGcRole ? null : 'sub_free',
        }).eq('id', profile.id);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (profile) {
        const status = subscription.status === 'trialing' ? 'trialing'
          : subscription.status === 'active' ? 'active'
          : subscription.status === 'past_due' ? 'past_due'
          : 'canceled';

        const tier = tierFromPriceId(priceIdFromSubscription(subscription));
        const update: Record<string, unknown> = {
          subscription_status: status,
          subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        };
        if (tier) update.subscription_tier = tier;

        await supabase.from('profiles').update(update).eq('id', profile.id);
      }
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
