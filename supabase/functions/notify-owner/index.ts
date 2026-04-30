// Supabase Edge Function: notify-owner
//
// Pings Geoff via email whenever a real conversion event happens on
// FlowBoss. Three triggers wired today:
//   - signup        — someone created an account on /signup
//   - subscription  — stripe-webhook saw checkout.session.completed
//   - invite_accept — a tradesperson accepted a GC's invite
//
// Cheap, reliable, works for an early-stage product where Geoff's
// own attention is the activation feedback loop. Slack / SMS / push
// can layer on later by adding channel branches; the contract here
// is "send a structured event to the owner, however we deliver it
// today."
//
// Auth: open. The function takes only metadata from the caller and
// pings Geoff's known email — there's no PII exfil risk and no need
// to gate it behind a session token. Frontend can fire it without
// the user being signed in (e.g. immediately after signup before
// the auth state hydrates).
//
// Required Supabase secrets:
//   RESEND_API_KEY      — same key invoice/invite emails use
//   OWNER_EMAIL         — Geoff's address; defaults to
//                         geoff@flowboss.io if not set

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
const OWNER_EMAIL = Deno.env.get('OWNER_EMAIL') || 'geoff@flowboss.io';
const SUPABASE_PROJECT_REF = 'besbtasjpqmfqjkudmgu';

type EventType =
  | 'signup'
  | 'subscription'        // checkout.session.completed (trial start, $0)
  | 'trial_converted'     // first paid invoice after trial = real conversion
  | 'subscription_canceled' // customer.subscription.deleted
  | 'invite_accept';

interface Payload {
  event: EventType;
  email: string;
  // Optional context — the more we know, the richer the email.
  businessName?: string | null;
  trade?: string | null;
  plan?: string | null;        // 'monthly' | 'annual' | 'sub_pro_monthly' | 'sub_pro_annual'
  amount?: number | null;      // dollars
  trialDays?: number | null;
  projectName?: string | null; // for invite_accept
  tradeOnInvite?: string | null;
  userId?: string | null;
  stripeCustomerId?: string | null;
}

const EVENT_LABELS: Record<EventType, { emoji: string; subject: string; lead: string }> = {
  signup: {
    emoji: '👋',
    subject: 'New FlowBoss signup',
    lead: 'A new contractor just created an account.',
  },
  subscription: {
    emoji: '🎉',
    subject: 'New FlowBoss trial started',
    lead: 'Someone started a paid subscription with a 14-day free trial.',
  },
  trial_converted: {
    emoji: '💰',
    subject: 'A trial just converted to paid',
    lead: 'They didn\'t cancel — Stripe successfully billed the trial-end invoice. This is real revenue.',
  },
  subscription_canceled: {
    emoji: '👋',
    subject: 'A FlowBoss subscription was canceled',
    lead: 'Someone canceled their FlowBoss subscription.',
  },
  invite_accept: {
    emoji: '🤝',
    subject: 'A tradesperson accepted a GC invite',
    lead: 'A sub just joined a GC project as an invited tradesperson.',
  },
};

const PLAN_LABELS: Record<string, string> = {
  monthly: 'Contractor Monthly · $29.99/mo',
  annual: 'Contractor Annual · $199.99/yr',
  sub_pro_monthly: 'Trade Pro Monthly · $14.99/mo',
  sub_pro_annual: 'Trade Pro Annual · $99.99/yr',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!RESEND_KEY) {
      return json({ error: 'RESEND_API_KEY not configured' }, 500);
    }

    const body: Payload = await req.json().catch(() => ({}) as Payload);
    if (!body.event || !body.email) {
      return json({ error: 'event and email are required' }, 400);
    }

    const cfg = { ...EVENT_LABELS[body.event] };
    if (!cfg) return json({ error: `unknown event: ${body.event}` }, 400);

    // Cancellation special-casing: trialDays === -1 = canceled during the
    // free trial (never converted to paid). Different signal from a paid
    // customer canceling — the latter cost us actual revenue. Clearer
    // emails make Geoff's "ask why" follow-up more targeted.
    if (body.event === 'subscription_canceled' && body.trialDays === -1) {
      cfg.subject = 'Trial canceled before converting';
      cfg.lead = 'Someone canceled during their 14-day free trial — they never paid.';
    }

    const planLabel = body.plan ? PLAN_LABELS[body.plan] || body.plan : null;
    const supabaseUserUrl = body.userId
      ? `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/auth/users?filter=${encodeURIComponent(body.email)}`
      : `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/auth/users`;
    const stripeCustomerUrl = body.stripeCustomerId
      ? `https://dashboard.stripe.com/customers/${body.stripeCustomerId}`
      : 'https://dashboard.stripe.com/customers';

    // Plain-text first. Email clients render this fine and Resend
    // doesn't need a heavy template for a one-recipient owner ping.
    const lines: string[] = [
      `${cfg.emoji} ${cfg.lead}`,
      '',
      `Email: ${body.email}`,
    ];
    if (body.businessName) lines.push(`Business: ${body.businessName}`);
    if (body.trade) lines.push(`Trade: ${body.trade}`);
    if (planLabel) lines.push(`Plan: ${planLabel}${body.trialDays ? ` (${body.trialDays}-day trial)` : ''}`);
    if (typeof body.amount === 'number') lines.push(`Amount: $${body.amount.toFixed(2)}`);
    if (body.projectName) lines.push(`Project: ${body.projectName}`);
    if (body.tradeOnInvite) lines.push(`Trade on invite: ${body.tradeOnInvite}`);
    lines.push('');
    lines.push(`Supabase user: ${supabaseUserUrl}`);
    lines.push(`Stripe customer: ${stripeCustomerUrl}`);

    const html = `
      <!doctype html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 24px;">
          <table style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb;">
            <tr>
              <td>
                <p style="font-size: 13px; color: #6b7280; margin: 0 0 4px 0;">FlowBoss · ${cfg.emoji}</p>
                <h1 style="font-size: 18px; color: #111827; margin: 0 0 12px 0;">${cfg.subject}</h1>
                <p style="font-size: 14px; color: #4b5563; margin: 0 0 16px 0;">${cfg.lead}</p>
                <table style="width: 100%; font-size: 14px; color: #111827; border-collapse: collapse;">
                  <tr><td style="padding: 6px 0; color: #6b7280; width: 110px;">Email</td><td style="padding: 6px 0;">${escapeHtml(body.email)}</td></tr>
                  ${body.businessName ? `<tr><td style="padding: 6px 0; color: #6b7280;">Business</td><td style="padding: 6px 0;">${escapeHtml(body.businessName)}</td></tr>` : ''}
                  ${body.trade ? `<tr><td style="padding: 6px 0; color: #6b7280;">Trade</td><td style="padding: 6px 0;">${escapeHtml(body.trade)}</td></tr>` : ''}
                  ${planLabel ? `<tr><td style="padding: 6px 0; color: #6b7280;">Plan</td><td style="padding: 6px 0;">${escapeHtml(planLabel)}${body.trialDays ? ` <span style="color:#6b7280;">(${body.trialDays}-day trial)</span>` : ''}</td></tr>` : ''}
                  ${typeof body.amount === 'number' ? `<tr><td style="padding: 6px 0; color: #6b7280;">Amount</td><td style="padding: 6px 0;">$${body.amount.toFixed(2)}</td></tr>` : ''}
                  ${body.projectName ? `<tr><td style="padding: 6px 0; color: #6b7280;">Project</td><td style="padding: 6px 0;">${escapeHtml(body.projectName)}</td></tr>` : ''}
                  ${body.tradeOnInvite ? `<tr><td style="padding: 6px 0; color: #6b7280;">Trade on invite</td><td style="padding: 6px 0;">${escapeHtml(body.tradeOnInvite)}</td></tr>` : ''}
                </table>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 18px 0;" />
                <p style="font-size: 12px; color: #6b7280; margin: 0;">
                  <a href="${supabaseUserUrl}" style="color: #2563eb; text-decoration: none;">View in Supabase</a> &middot;
                  <a href="${stripeCustomerUrl}" style="color: #2563eb; text-decoration: none;">View in Stripe</a>
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'FlowBoss <alerts@flowboss.io>',
        to: [OWNER_EMAIL],
        subject: cfg.subject,
        text: lines.join('\n'),
        html,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text().catch(() => '');
      console.error('notify-owner Resend failure:', resendRes.status, errText);
      return json({ error: `Resend ${resendRes.status}: ${errText.slice(0, 240)}` }, 500);
    }

    return json({ ok: true }, 200);
  } catch (err: any) {
    console.error('notify-owner error:', err);
    return json({ error: err?.message || 'unknown' }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
