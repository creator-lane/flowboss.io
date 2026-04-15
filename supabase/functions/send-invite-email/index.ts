// Deploy to Supabase Edge Functions as "send-invite-email"
// Uses Resend (same provider as invoice emails)
// Environment: RESEND_API_KEY

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const resendKey = Deno.env.get('RESEND_API_KEY')!;

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { email, subName, projectName, tradeName, inviteUrl, gcCompanyName } = await req.json();

    if (!email) throw new Error('Email is required');

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'FlowBoss <invites@flowboss.io>',
        to: [email],
        subject: `You've been invited to a project on FlowBoss`,
        html: `
          <div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="display:inline-block;background:#2563eb;color:white;font-weight:700;font-size:18px;padding:10px 16px;border-radius:12px;">FlowBoss</div>
            </div>
            <h2 style="color:#1e293b;margin-bottom:8px;">You've been invited to a project</h2>
            <p style="color:#64748b;font-size:14px;line-height:1.6;">
              <strong>${gcCompanyName || 'A general contractor'}</strong> has invited you to join
              <strong>${projectName || 'a project'}</strong> as the <strong>${tradeName || 'assigned trade'}</strong>.
            </p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:20px 0;">
              <p style="color:#1e293b;font-weight:600;margin:0 0 4px;">Project: ${projectName || 'Unnamed'}</p>
              <p style="color:#64748b;font-size:13px;margin:0;">Trade: ${tradeName || 'Not specified'}</p>
            </div>
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

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
