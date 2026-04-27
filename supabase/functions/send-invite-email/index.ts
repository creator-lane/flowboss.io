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

    const greeting = subName ? `Hey ${subName},` : 'Hey,';
    const gcLine = gcCompanyName
      ? `<strong>${gcCompanyName}</strong> has invited you to join`
      : 'A general contractor has invited you to join';
    const projectLine = projectName
      ? `<strong>${projectName}</strong>.`
      : '<strong>their project</strong>.';

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
        subject: projectName
          ? `You've been invited to ${projectName} on FlowBoss`
          : `You've been invited to a project on FlowBoss`,
        html: `
          <div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="display:inline-block;background:#2563eb;color:white;font-weight:700;font-size:18px;padding:10px 16px;border-radius:12px;">FlowBoss</div>
            </div>
            <h2 style="color:#1e293b;margin-bottom:8px;">You've been invited to a project</h2>
            <p style="color:#64748b;font-size:14px;line-height:1.6;">
              ${greeting} ${gcLine} ${projectLine}
            </p>
            ${projectName ? `
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:20px 0;">
              <p style="color:#1e293b;font-weight:600;margin:0;">Project: ${projectName}</p>
            </div>
            ` : ''}
            <div style="text-align:center;margin:24px 0;">
              <a href="${inviteUrl}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Join Project</a>
            </div>
            <p style="color:#94a3b8;font-size:12px;text-align:center;">
              FlowBoss — Field service management for contractors
            </p>
          </div>
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
