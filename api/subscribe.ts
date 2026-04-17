import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Newsletter signup endpoint.
 *
 * Formerly wired to OneSignal (which required separately configuring their
 * Email product and never got finished). Now uses Resend:
 *
 *   1. Adds the subscriber to a Resend Audience (if RESEND_AUDIENCE_ID is set)
 *   2. Sends a "New signup" notification to NOTIFY_EMAIL so Geoff sees every
 *      lead in his inbox, not in a dashboard he has to remember to check
 *
 * Required env vars on Vercel:
 *   RESEND_API_KEY     - from https://resend.com/api-keys
 *   NOTIFY_EMAIL       - where to send "new signup" alerts (e.g. geoff@flowboss.io)
 *   EMAIL_FROM         - verified sender address (e.g. hello@flowboss.io)
 *
 * Optional:
 *   RESEND_AUDIENCE_ID - if set, signups are added to this Resend Audience so
 *                        you can broadcast to them later. Create at
 *                        https://resend.com/audiences.
 */

const TRADE_LABELS: Record<string, string> = {
  gc: 'General Contractor',
  plumbing: 'Plumbing Sub',
  hvac: 'HVAC Sub',
  electrical: 'Electrical Sub',
  solo: 'Solo Contractor',
  other: 'Other',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://flowboss.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, trade } = req.body || {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;
  const fromEmail = process.env.EMAIL_FROM || 'hello@flowboss.io';
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!apiKey) {
    console.error('RESEND_API_KEY not configured');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const tradeLabel = TRADE_LABELS[trade] || trade || 'unknown';

  // Run both side-effects in parallel. We only fail the request if BOTH fail —
  // a broken audience-add shouldn't block a successful notification (or vice
  // versa). Each is best-effort.
  const tasks: Promise<{ kind: string; ok: boolean; detail?: string }>[] = [];

  // 1. Add to Resend Audience (if configured)
  if (audienceId) {
    tasks.push(
      fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          email: cleanEmail,
          unsubscribed: false,
        }),
      })
        .then(async (r) => ({
          kind: 'audience',
          ok: r.ok,
          detail: r.ok ? undefined : await r.text(),
        }))
        .catch((e) => ({ kind: 'audience', ok: false, detail: String(e) })),
    );
  }

  // 2. Send notification email to Geoff
  if (notifyEmail) {
    tasks.push(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: `FlowBoss Signups <${fromEmail}>`,
          to: [notifyEmail],
          subject: `New signup: ${cleanEmail} (${tradeLabel})`,
          text: buildNotificationText(cleanEmail, tradeLabel),
          html: buildNotificationHtml(cleanEmail, tradeLabel),
          reply_to: cleanEmail, // hit reply to message the lead directly
        }),
      })
        .then(async (r) => ({
          kind: 'notify',
          ok: r.ok,
          detail: r.ok ? undefined : await r.text(),
        }))
        .catch((e) => ({ kind: 'notify', ok: false, detail: String(e) })),
    );
  }

  // If nothing is configured, just accept the signup so the user doesn't see an
  // error — Geoff will notice when he wires up env vars.
  if (tasks.length === 0) {
    console.warn('subscribe: no RESEND_AUDIENCE_ID and no NOTIFY_EMAIL; signup accepted but not persisted', { cleanEmail, trade });
    return res.status(200).json({ success: true });
  }

  const results = await Promise.all(tasks);
  for (const r of results) {
    if (!r.ok) console.error(`subscribe ${r.kind} failed:`, r.detail);
  }
  const allFailed = results.every((r) => !r.ok);
  if (allFailed) {
    return res.status(502).json({ error: 'Failed to subscribe' });
  }

  return res.status(200).json({ success: true });
}

function buildNotificationText(email: string, trade: string): string {
  return [
    `New FlowBoss signup`,
    ``,
    `Email: ${email}`,
    `Trade: ${trade}`,
    `Source: flowboss.io`,
    ``,
    `Reply to this email to respond directly to the lead.`,
  ].join('\n');
}

function buildNotificationHtml(email: string, trade: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:24px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:16px 24px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;font-weight:600;font-size:14px;letter-spacing:0.3px;">
            New FlowBoss Signup
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <p style="margin:0 0 4px 0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Email</p>
            <p style="margin:0 0 16px 0;font-size:16px;color:#111827;font-weight:600;"><a href="mailto:${email}" style="color:#2563eb;text-decoration:none;">${email}</a></p>

            <p style="margin:0 0 4px 0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Trade</p>
            <p style="margin:0 0 16px 0;font-size:16px;color:#111827;">${trade}</p>

            <p style="margin:0 0 4px 0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Source</p>
            <p style="margin:0 0 20px 0;font-size:14px;color:#374151;">flowboss.io newsletter form</p>

            <p style="margin:20px 0 0 0;padding-top:16px;border-top:1px solid #f3f4f6;font-size:12px;color:#9ca3af;">
              Hit reply to respond directly to the lead.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
