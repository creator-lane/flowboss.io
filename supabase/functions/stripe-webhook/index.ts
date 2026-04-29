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
// Resend is optional here — if the key isn't configured, we skip the
// email send without throwing. The state flip to past_due still happens,
// and the in-app GracePeriodBanner will catch them the next time they
// open Command Center.
const resendKey = Deno.env.get('RESEND_API_KEY');
const appUrl = Deno.env.get('APP_URL') || 'https://flowboss.io';

// ──────────────────────────────────────────────────────────────────────
// Card-declined email. Tracker P0 #1 — highest per-user EV journey
// because the card already validated once; we just need them to update
// it before Stripe's retry window closes (~23 days).
//
// Deliberately warm, not aggressive: they trusted us with their card.
// Treat this like "hey, your bank bounced us" — not a dunning notice.
// ──────────────────────────────────────────────────────────────────────
async function sendCardDeclinedEmail(opts: {
  to: string;
  firstName?: string | null;
  amountDue?: number | null;
  nextAttempt?: Date | null;
}) {
  if (!resendKey) {
    console.log('[stripe-webhook] RESEND_API_KEY not set, skipping card-declined email');
    return;
  }
  const greeting = opts.firstName ? `Hi ${opts.firstName},` : 'Hi there,';
  const amountStr = opts.amountDue && opts.amountDue > 0
    ? `$${(opts.amountDue / 100).toFixed(2)}`
    : null;
  const retryDateStr = opts.nextAttempt
    ? opts.nextAttempt.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : null;

  const subject = 'Your FlowBoss card was declined — quick fix needed';
  const preheader = amountStr
    ? `Stripe couldn't collect ${amountStr}. Update your card to keep your account active.`
    : `Update your payment method to keep your FlowBoss account active.`;

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f4f6fb;">${preheader}</div>

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f4f6fb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;box-shadow:0 1px 3px rgba(15,23,42,0.06);overflow:hidden;">

          <!-- Header strip -->
          <tr>
            <td style="background:#2563eb;background-image:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);padding:28px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.01em;">FlowBoss</td>
                  <td align="right" style="color:rgba(255,255,255,0.85);font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">Billing Notice</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:36px 32px 12px 32px;">
              <h1 style="margin:0 0 12px 0;font-size:24px;font-weight:700;color:#0f172a;line-height:1.25;letter-spacing:-0.02em;">
                Your card didn't go through
              </h1>
              <p style="margin:0;font-size:15px;line-height:1.65;color:#475569;">
                ${greeting} your bank declined the charge for your FlowBoss subscription. Happens all the time — expired card, travel block, limit hit. No big deal, just need to update it.
              </p>
            </td>
          </tr>

          ${amountStr ? `
          <!-- Amount card -->
          <tr>
            <td style="padding:20px 32px 8px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:11px;font-weight:600;color:#b91c1c;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Amount declined</div>
                    <div style="font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;">${amountStr}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:24px 32px 8px 32px;">
              <a href="${appUrl}/dashboard" style="display:inline-block;background:#dc2626;color:#ffffff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;letter-spacing:-0.005em;box-shadow:0 1px 2px rgba(220,38,38,0.3);">
                Update payment method
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px 28px 32px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                Takes 30 seconds. No re-signup needed.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:0 32px;"><div style="height:1px;background:#e2e8f0;"></div></td></tr>

          <!-- What happens next -->
          <tr>
            <td style="padding:28px 32px 8px 32px;">
              <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;">What happens next</div>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td valign="top" style="padding:6px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td valign="top" width="28" style="padding-top:1px;">
                          <div style="width:22px;height:22px;border-radius:50%;background:#dbeafe;color:#1d4ed8;font-size:12px;font-weight:700;text-align:center;line-height:22px;">1</div>
                        </td>
                        <td valign="top" style="font-size:14px;color:#334155;line-height:1.55;padding-left:6px;">
                          ${retryDateStr
                            ? `Stripe will automatically retry the charge on <strong style="color:#0f172a;">${retryDateStr}</strong>.`
                            : `Stripe will automatically retry the charge in a few days.`}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td valign="top" style="padding:6px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td valign="top" width="28" style="padding-top:1px;">
                          <div style="width:22px;height:22px;border-radius:50%;background:#dbeafe;color:#1d4ed8;font-size:12px;font-weight:700;text-align:center;line-height:22px;">2</div>
                        </td>
                        <td valign="top" style="font-size:14px;color:#334155;line-height:1.55;padding-left:6px;">
                          If the retry fails too, access to <strong style="color:#0f172a;">jobs, invoices, and your pricebook pauses</strong> until the card is updated.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td valign="top" style="padding:6px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td valign="top" width="28" style="padding-top:1px;">
                          <div style="width:22px;height:22px;border-radius:50%;background:#dbeafe;color:#1d4ed8;font-size:12px;font-weight:700;text-align:center;line-height:22px;">3</div>
                        </td>
                        <td valign="top" style="font-size:14px;color:#334155;line-height:1.55;padding-left:6px;">
                          Update your payment method now and the retry will go through automatically — nothing for you to do after.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.55;">
                <strong style="color:#475569;">FlowBoss</strong> — coordination for contractors and trades.<br>
                Questions? Reply to this email and we'll help.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  // Awaited and inspected — Tracker P0 #1, the dunning email is the
  // critical path. Previously fire-and-forget meant Resend rejections
  // were silent; now they show up in webhook logs.
  try {
    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'FlowBoss <billing@flowboss.io>',
        to: [opts.to],
        subject,
        html,
      }),
    });
    if (!resendResp.ok) {
      const body = await resendResp.text();
      console.error('[stripe-webhook] card-declined email rejected:', resendResp.status, body);
    }
  } catch (err) {
    console.error('[stripe-webhook] card-declined email failed:', err);
  }
}

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

        // Ping the owner — paid signup. Pull a few details so the
        // notification carries the plan + amount + business name. Best-
        // effort: failure here MUST NOT break the webhook acknowledgment
        // (Stripe retries on non-200, and we don't want owner-notif
        // outages causing duplicate sub upgrades).
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('business_name, stripe_customer_id, email')
            .eq('id', userId)
            .single();
          const amountCents =
            (session.amount_total as number | null) ??
            ((session as any).amount_subtotal as number | undefined) ??
            null;
          const planLabels: Record<string, number> = {
            monthly: 29.99,
            annual: 199.99,
            sub_pro_monthly: 14.99,
            sub_pro_annual: 99.99,
          };
          const amount =
            typeof amountCents === 'number' ? amountCents / 100 : (planLabels[plan] ?? null);
          await fetch('https://besbtasjpqmfqjkudmgu.supabase.co/functions/v1/notify-owner', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'subscription',
              email: (profile as any)?.email || session.customer_email || session.customer_details?.email || 'unknown',
              businessName: (profile as any)?.business_name ?? null,
              plan,
              amount,
              trialDays: 14,
              userId,
              stripeCustomerId: (profile as any)?.stripe_customer_id ?? (session.customer as string | null),
            }),
          });
        } catch (notifyErr) {
          console.error('notify-owner subscription ping failed:', notifyErr);
        }
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId = subscription.customer as string;

        // Find user by stripe customer id. Pull subscription_status BEFORE
        // updating so we can detect the trial→paid conversion (status was
        // 'trialing' at the moment Stripe charged the trial-end invoice).
        // That's the magic moment Geoff most wants to know about — the
        // user didn't cancel, they're now a paying customer.
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, business_name, subscription_status, subscription_plan')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          const wasTrialing = (profile as any).subscription_status === 'trialing';
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

          // Owner ping for trial→paid conversion. This is the most
          // important conversion event in the SaaS funnel; Geoff wants
          // every one of these in his inbox. Fire-and-forget. We don't
          // ping on regular renewals (which would be noise after the
          // first 14 days) — only the first paid invoice after a trial.
          if (wasTrialing) {
            try {
              await fetch('https://besbtasjpqmfqjkudmgu.supabase.co/functions/v1/notify-owner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event: 'trial_converted',
                  email: (profile as any).email || 'unknown',
                  businessName: (profile as any).business_name ?? null,
                  plan: (profile as any).subscription_plan ?? null,
                  amount: typeof invoice.amount_paid === 'number' ? invoice.amount_paid / 100 : null,
                  userId: (profile as any).id,
                  stripeCustomerId: customerId,
                }),
              });
            } catch (notifyErr) {
              console.error('notify-owner trial-conversion ping failed:', notifyErr);
            }
          }
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, first_name, business_name')
        .eq('stripe_customer_id', customerId)
        .single();

      if (profile) {
        await supabase.from('profiles').update({
          subscription_status: 'past_due',
        }).eq('id', profile.id);

        // Fire the card-declined email. Non-blocking from the user's
        // point of view — we always 200 to Stripe regardless of the
        // Resend outcome, because the state flip is the critical part.
        const emailAddr: string | undefined = (profile as any).email;
        if (emailAddr) {
          const nextAttempt = invoice.next_payment_attempt
            ? new Date(invoice.next_payment_attempt * 1000)
            : null;
          await sendCardDeclinedEmail({
            to: emailAddr,
            firstName: (profile as any).first_name || (profile as any).business_name || null,
            amountDue: invoice.amount_due ?? null,
            nextAttempt,
          });
        }
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
        .select('id, business_role, email, business_name, subscription_plan, subscription_status')
        .eq('stripe_customer_id', customerId)
        .single();

      if (profile) {
        const wasTrialing = (profile as any).subscription_status === 'trialing';
        const isGcRole = profile.business_role === 'gc' || profile.business_role === 'both';
        await supabase.from('profiles').update({
          subscription_status: 'canceled',
          stripe_subscription_id: null,
          // GCs: clear tier so the app treats them as 'none' (bounced to pricing).
          // Subs: drop to 'sub_free' so they keep invited-project access.
          subscription_tier: isGcRole ? null : 'sub_free',
        }).eq('id', profile.id);

        // Owner ping. Cancellations matter — Geoff wants every one in
        // his inbox so he can ask for feedback. Annotate with whether
        // they bailed during trial vs after paying so the email is
        // useful at a glance.
        try {
          await fetch('https://besbtasjpqmfqjkudmgu.supabase.co/functions/v1/notify-owner', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'subscription_canceled',
              email: (profile as any).email || 'unknown',
              businessName: (profile as any).business_name ?? null,
              plan: (profile as any).subscription_plan ?? null,
              userId: (profile as any).id,
              stripeCustomerId: customerId,
              // Stuffed in trialDays as a flag: -1 means "they canceled
              // during trial (didn't convert)". Anything else = canceled
              // after paying. Lazy reuse of the existing schema field.
              trialDays: wasTrialing ? -1 : null,
            }),
          });
        } catch (notifyErr) {
          console.error('notify-owner cancellation ping failed:', notifyErr);
        }
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
