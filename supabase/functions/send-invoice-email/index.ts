// Deploy to Supabase Edge Functions as "send-invoice-email"
// Sends a contractor's invoice to their customer via Resend.
//
// Auth: requires a valid user session (Bearer <session.access_token>).
// The anon key was sufficient for the older implementation but that
// allowed anyone with the public key to spam FlowBoss-branded mail
// to any address — closed that vector here too.
//
// Environment: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const resendKey = Deno.env.get('RESEND_API_KEY')!;
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_URL = Deno.env.get('APP_URL') || 'https://flowboss.io';

interface LineItem {
  description?: string;
  quantity?: number;
  unitPrice?: number;
}

interface InvoicePayload {
  customerEmail: string;
  customerName?: string;
  companyName?: string;
  invoiceNumber?: string;
  amount?: number;
  subtotal?: number;
  taxRate?: number;
  tax?: number;
  dueDate?: string;
  notes?: string;
  payLink?: string;
  lineItems?: LineItem[];
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const fmtMoney = (n: number) =>
  `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (s?: string) => {
  if (!s) return null;
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return null;
  }
};

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // --- Auth check ----------------------------------------------------------
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Payload -------------------------------------------------------------
    const payload = await req.json() as InvoicePayload;
    const {
      customerEmail,
      customerName,
      companyName,
      invoiceNumber,
      amount,
      subtotal,
      taxRate,
      tax,
      dueDate,
      notes,
      payLink,
      lineItems,
    } = payload;

    if (!customerEmail) {
      return new Response(JSON.stringify({ error: 'customerEmail is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!resendKey) {
      console.error('[send-invoice-email] RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured (RESEND_API_KEY missing)' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // --- Compose -------------------------------------------------------------
    const senderName = companyName?.trim() || 'FlowBoss';
    const greeting = customerName?.trim()
      ? `Hi ${escapeHtml(customerName.trim())},`
      : 'Hi there,';
    const invoiceLabel = invoiceNumber?.trim() ? `Invoice #${escapeHtml(invoiceNumber.trim())}` : 'Invoice';
    const total = Number(amount) || 0;
    const dueDateLabel = fmtDate(dueDate);

    const subject = invoiceNumber?.trim()
      ? `${senderName} sent you Invoice #${invoiceNumber.trim()} — ${fmtMoney(total)}`
      : `${senderName} sent you an invoice — ${fmtMoney(total)}`;
    const preheader = dueDateLabel
      ? `${fmtMoney(total)} due ${dueDateLabel}. Pay online in seconds.`
      : `${fmtMoney(total)} due. Pay online in seconds.`;

    // Line items table (only if provided)
    const lineItemsHtml = (lineItems && lineItems.length > 0)
      ? `
      <tr>
        <td style="padding:20px 32px 8px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <tr style="background:#f8fafc;">
              <td style="padding:12px 16px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Description</td>
              <td align="right" style="padding:12px 16px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Qty</td>
              <td align="right" style="padding:12px 16px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Amount</td>
            </tr>
            ${lineItems.map((li) => {
              const desc = escapeHtml(li.description || '');
              const qty = Number(li.quantity) || 0;
              const unit = Number(li.unitPrice) || 0;
              const lineTotal = qty * unit;
              return `
              <tr style="border-top:1px solid #e2e8f0;">
                <td style="padding:14px 16px;font-size:14px;color:#0f172a;line-height:1.5;">${desc}</td>
                <td align="right" style="padding:14px 16px;font-size:14px;color:#475569;">${qty}</td>
                <td align="right" style="padding:14px 16px;font-size:14px;color:#0f172a;font-weight:600;white-space:nowrap;">${fmtMoney(lineTotal)}</td>
              </tr>`;
            }).join('')}
          </table>
        </td>
      </tr>`
      : '';

    // Totals block
    const subtotalNum = Number(subtotal);
    const taxNum = Number(tax);
    const taxRateNum = Number(taxRate);
    const showSubtotal = !isNaN(subtotalNum) && subtotalNum > 0 && subtotalNum !== total;
    const showTax = !isNaN(taxNum) && taxNum > 0;

    const totalsHtml = `
      <tr>
        <td style="padding:8px 32px 0 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            ${showSubtotal ? `
            <tr>
              <td style="padding:4px 0;font-size:14px;color:#64748b;">Subtotal</td>
              <td align="right" style="padding:4px 0;font-size:14px;color:#0f172a;">${fmtMoney(subtotalNum)}</td>
            </tr>` : ''}
            ${showTax ? `
            <tr>
              <td style="padding:4px 0;font-size:14px;color:#64748b;">Tax${!isNaN(taxRateNum) && taxRateNum > 0 ? ` (${taxRateNum}%)` : ''}</td>
              <td align="right" style="padding:4px 0;font-size:14px;color:#0f172a;">${fmtMoney(taxNum)}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:10px 0 4px 0;border-top:1px solid #e2e8f0;font-size:15px;font-weight:700;color:#0f172a;">Total Due</td>
              <td align="right" style="padding:10px 0 4px 0;border-top:1px solid #e2e8f0;font-size:18px;font-weight:700;color:#0f172a;letter-spacing:-0.01em;">${fmtMoney(total)}</td>
            </tr>
          </table>
        </td>
      </tr>`;

    const notesHtml = notes?.trim() ? `
      <tr>
        <td style="padding:20px 32px 0 32px;">
          <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Note from ${escapeHtml(senderName)}</div>
          <p style="margin:0;font-size:14px;color:#334155;line-height:1.55;white-space:pre-wrap;">${escapeHtml(notes.trim())}</p>
        </td>
      </tr>` : '';

    const ctaHtml = payLink ? `
      <tr>
        <td align="center" style="padding:24px 32px 8px 32px;">
          <a href="${escapeHtml(payLink)}" style="display:inline-block;background:#16a34a;color:#ffffff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;letter-spacing:-0.005em;box-shadow:0 1px 2px rgba(22,163,74,0.3);">
            Pay ${fmtMoney(total)}
          </a>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:0 32px 28px 32px;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">
            Secure payment via Stripe. Card or bank transfer.
          </p>
        </td>
      </tr>` : `
      <tr>
        <td align="center" style="padding:24px 32px 28px 32px;">
          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.55;">
            Reply to this email to arrange payment, or contact ${escapeHtml(senderName)} directly.
          </p>
        </td>
      </tr>`;

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f4f6fb;">${escapeHtml(preheader)}</div>

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f4f6fb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;box-shadow:0 1px 3px rgba(15,23,42,0.06);overflow:hidden;">

          <!-- Header strip -->
          <tr>
            <td style="background:#2563eb;background-image:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);padding:28px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.01em;">${escapeHtml(senderName)}</td>
                  <td align="right" style="color:rgba(255,255,255,0.85);font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">${escapeHtml(invoiceLabel)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:36px 32px 8px 32px;">
              <h1 style="margin:0 0 12px 0;font-size:24px;font-weight:700;color:#0f172a;line-height:1.25;letter-spacing:-0.02em;">
                You've got an invoice
              </h1>
              <p style="margin:0;font-size:15px;line-height:1.65;color:#475569;">
                ${greeting} ${escapeHtml(senderName)} sent you ${invoiceNumber?.trim() ? `<strong style="color:#0f172a;">Invoice #${escapeHtml(invoiceNumber.trim())}</strong>` : 'an invoice'}${dueDateLabel ? `, due <strong style="color:#0f172a;">${escapeHtml(dueDateLabel)}</strong>` : ''}.
              </p>
            </td>
          </tr>

          <!-- Amount card -->
          <tr>
            <td style="padding:20px 32px 8px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Amount due</div>
                    <div style="font-size:28px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;">${fmtMoney(total)}</div>
                    ${dueDateLabel ? `<div style="font-size:13px;color:#64748b;margin-top:4px;">Due ${escapeHtml(dueDateLabel)}</div>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${lineItemsHtml}
          ${totalsHtml}
          ${notesHtml}

          ${ctaHtml}

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.55;">
                Sent by <strong style="color:#475569;">${escapeHtml(senderName)}</strong> via FlowBoss.<br>
                If you weren't expecting this invoice, just reply to this email and ${escapeHtml(senderName)} will follow up.
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

    // --- Send via Resend ----------------------------------------------------
    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${senderName} via FlowBoss <invoices@flowboss.io>`,
        // The contractor's customer should be able to reply to the
        // contractor directly — but we don't have the contractor's
        // email here without an extra DB lookup. For now reply-to is
        // implicit (no header), so replies go to invoices@flowboss.io.
        // TODO: thread reply-to through to the sender's email.
        to: [customerEmail],
        subject,
        html,
      }),
    });

    if (!resendResp.ok) {
      const resendBody = await resendResp.text();
      console.error('[send-invoice-email] Resend rejected:', resendResp.status, resendBody);
      return new Response(
        JSON.stringify({
          error: `Resend rejected the email (${resendResp.status}): ${resendBody}`,
          resendStatus: resendResp.status,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const resendJson = await resendResp.json().catch(() => ({}));
    return new Response(JSON.stringify({ success: true, resendId: resendJson?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
