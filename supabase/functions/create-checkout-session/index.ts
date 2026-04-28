// Deploy this to Supabase Edge Functions as "create-checkout-session"
// Environment variables needed in Supabase:
//   STRIPE_SECRET_KEY                - FlowBoss's own Stripe secret key (not Connect)
//   STRIPE_MONTHLY_PRICE_ID          - GC monthly ($29.99)
//   STRIPE_ANNUAL_PRICE_ID           - GC annual  ($199.99)
//   STRIPE_SUB_PRO_MONTHLY_PRICE_ID  - Sub Pro monthly ($14.99) [optional]
//   STRIPE_SUB_PRO_ANNUAL_PRICE_ID   - Sub Pro annual  ($99)    [optional]
//   SITE_URL                          - https://flowboss.io

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Stripe from 'https://esm.sh/stripe@14.14.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

/** Map the plan slug the client sends to a price id + tier tag. */
function resolvePlan(plan: string): { priceId: string; tier: 'gc' | 'sub_pro'; trialDays: number } | null {
  switch (plan) {
    case 'annual':
      return {
        priceId: Deno.env.get('STRIPE_ANNUAL_PRICE_ID')!,
        tier: 'gc',
        trialDays: 14,
      };
    case 'monthly':
      return {
        priceId: Deno.env.get('STRIPE_MONTHLY_PRICE_ID')!,
        tier: 'gc',
        trialDays: 14,
      };
    case 'sub_pro_monthly': {
      const priceId = Deno.env.get('STRIPE_SUB_PRO_MONTHLY_PRICE_ID');
      if (!priceId) return null;
      return { priceId, tier: 'sub_pro', trialDays: 14 };
    }
    case 'sub_pro_annual': {
      const priceId = Deno.env.get('STRIPE_SUB_PRO_ANNUAL_PRICE_ID');
      if (!priceId) return null;
      return { priceId, tier: 'sub_pro', trialDays: 14 };
    }
    default:
      return null;
  }
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { plan } = await req.json();

    const resolved = resolvePlan(plan);
    if (!resolved) {
      return new Response(
        JSON.stringify({
          error: `Unknown or unconfigured plan: ${plan}. Make sure the matching STRIPE_*_PRICE_ID env var is set on the edge function.`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) throw new Error('Not authenticated');

    // Check if user already has a Stripe customer + read business_role so we
    // can enforce plan-vs-role match.
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, business_role')
      .eq('id', user.id)
      .single();

    // Server-side guardrail: a GC-role user cannot buy the Sub Pro plan
    // (Sub Pro is specifically for self-employed subs without crews). The
    // UpgradeModal hides the option for GCs, but someone constructing the
    // /checkout URL by hand could still bypass the UI. Reject here to keep
    // the tier logic honest.
    if (resolved.tier === 'sub_pro') {
      const role = profile?.business_role;
      if (role === 'gc' || role === 'both') {
        return new Response(
          JSON.stringify({
            error:
              'Sub Pro is for self-employed subs. Your account is set up as a General Contractor — use the Contractor plan instead.',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'https://flowboss.io';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: resolved.priceId, quantity: 1 }],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: resolved.trialDays,
      },
      // ?welcome=1 fires the PostCheckoutWelcome modal on first land
       // /dashboard/home so a fresh paid user sees the celebration +
      // gets pointed at the activation checklist below. ?checkout=success
      // keeps the RequireSubscription grace-period polling flow intact —
      // it watches for that param to wait for the webhook to write
      // profiles.subscription_status before bouncing the user to /pricing.
      success_url: `${siteUrl}/dashboard/home?checkout=success&welcome=1`,
      cancel_url: `${siteUrl}/pricing?checkout=canceled`,
      metadata: {
        supabase_user_id: user.id,
        plan,
        tier: resolved.tier,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
