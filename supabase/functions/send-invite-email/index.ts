// Deploy to Supabase Edge Functions as "send-invite-email"
// Uses Resend (same provider as invoice emails)
// Environment: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Auth: requires a valid user session (Bearer <session.access_token>).
// Previously accepted the public anon key which meant anyone could spam
// FlowBoss-branded emails to any address — closed that vector.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const resendKey = Deno.env.get('RESEND_API_KEY')!;
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    // Note: `tradeName` may be present in the request body from older clients
    // but we intentionally do NOT render it in the email. Subs are
    // professionals — they know what they do and don't need the GC's
    // internal trade label shown back at them.
    const { email, subName, projectName, inviteUrl, gcCompanyName } = await req.json();

    if (!email) throw new Error('Email is required');

    const greeting = subName ? `Hi ${subName},` : 'Hi there,';
    const gcLabel = gcCompanyName || 'A general contractor';
    const projectLabel = projectName || 'their project';
    const subject = gcCompanyName
      ? `${gcCompanyName} invited you to ${projectName || 'a project'} on FlowBoss`
      : `You've been invited to ${projectName || 'a project'} on FlowBoss`;
    const preheader = `${gcLabel} added you to ${projectLabel}. Accept your invitation and see your scope.`;

    if (!resendKey) {
      console.error('[send-invite-email] RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured (RESEND_API_KEY missing)' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Check Resend's response — previously this was fire-and-forget which
    // meant Resend could reject with 401/403/422 and the function would still
    // return {success:true}, so the GC saw "Sent!" while no email actually
    // went out. Now we propagate the real status + error back to the caller.
    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'FlowBoss <invites@flowboss.io>',
        to: [email],
        subject,
        html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased;">
  <!-- Preheader (hidden in body, shown as inbox preview) -->
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
                  <td align="right" style="color:rgba(255,255,255,0.85);font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">Project Invitation</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:36px 32px 12px 32px;">
              <h1 style="margin:0 0 12px 0;font-size:24px;font-weight:700;color:#0f172a;line-height:1.25;letter-spacing:-0.02em;">
                You've been added to a project
              </h1>
              <p style="margin:0;font-size:15px;line-height:1.65;color:#475569;">
                ${greeting} <strong style="color:#0f172a;">${gcLabel}</strong> has invited you to collaborate on <strong style="color:#0f172a;">${projectLabel}</strong>.
              </p>
            </td>
          </tr>

          ${projectName ? `
          <!-- Project card -->
          <tr>
            <td style="padding:20px 32px 8px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Project</div>
                    <div style="font-size:16px;font-weight:600;color:#0f172a;">${projectName}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:24px 32px 8px 32px;">
              <a href="${inviteUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;letter-spacing:-0.005em;box-shadow:0 1px 2px rgba(37,99,235,0.3);">
                Accept invitation
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px 28px 32px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                Free for trades. No credit card required.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:0 32px;"><div style="height:1px;background:#e2e8f0;"></div></td></tr>

          <!-- What is FlowBoss -->
          <tr>
            <td style="padding:28px 32px 4px 32px;">
              <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">What is FlowBoss?</div>
              <p style="margin:0;font-size:14px;line-height:1.65;color:#334155;">
                FlowBoss is the workspace contractors and trades use to run jobs together. The GC plans the project; you see exactly what you're on the hook for, mark progress as you go, and keep everyone on the same page — no group texts, no missed updates.
              </p>
            </td>
          </tr>

          <!-- Next steps -->
          <tr>
            <td style="padding:24px 32px 8px 32px;">
              <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;">What you need to do</div>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td valign="top" style="padding:6px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td valign="top" width="28" style="padding-top:1px;">
                          <div style="width:22px;height:22px;border-radius:50%;background:#dbeafe;color:#1d4ed8;font-size:12px;font-weight:700;text-align:center;line-height:22px;">1</div>
                        </td>
                        <td valign="top" style="font-size:14px;color:#334155;line-height:1.55;padding-left:6px;">
                          <strong style="color:#0f172a;">Tap "Accept invitation"</strong> above. It takes you to a short signup — name, email, password. Takes 30 seconds.
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
                          <strong style="color:#0f172a;">Open the project</strong> to see the scope assigned to you, the timeline, and any notes from ${gcCompanyName ? gcCompanyName : 'the GC'}.
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
                          <strong style="color:#0f172a;">Mark tasks as you finish them</strong> so the GC always knows where the project stands. That's it.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Fallback link -->
          <tr>
            <td style="padding:24px 32px 32px 32px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.55;">
                Button not working? Paste this into your browser:<br>
                <a href="${inviteUrl}" style="color:#2563eb;text-decoration:none;word-break:break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.55;">
                <strong style="color:#475569;">FlowBoss</strong> — coordination for contractors and trades.<br>
                You received this because ${gcCompanyName || 'a contractor'} added your email to their project on FlowBoss. If this wasn't expected, you can safely ignore this message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      }),
    });

    if (!resendResp.ok) {
      const resendBody = await resendResp.text();
      console.error('[send-invite-email] Resend rejected:', resendResp.status, resendBody);
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
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
