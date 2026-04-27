// Deploy to Supabase Edge Functions as "send-digest"
// Triggered by Supabase cron (pg_cron extension) or external scheduler
// Environment: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Surfaces partial failures: each user's send is awaited and counted as
// success or failure individually. Previously this was fire-and-forget so
// Resend rejections (rate limit, bounced, key revoked) were invisible.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendKey = Deno.env.get('RESEND_API_KEY')!;
const APP_URL = Deno.env.get('APP_URL') || 'https://flowboss.io';

serve(async (req) => {
  try {
    const { frequency } = await req.json(); // 'daily' or 'weekly'
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users who opted into this frequency
    const { data: users } = await supabase
      .from('profiles')
      .select('id, business_name, digest_email')
      .eq('digest_frequency', frequency);

    if (!users?.length) return new Response(JSON.stringify({ sent: 0, failed: 0 }));

    if (!resendKey) {
      console.error('[send-digest] RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured (RESEND_API_KEY missing)' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    let sent = 0;
    let failed = 0;
    const errors: Array<{ userId: string; status?: number; error: string }> = [];

    for (const user of users) {
      if (!user.digest_email) continue;

      // Get user's email from auth
      const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
      const email = user.digest_email || authUser?.user?.email;
      if (!email) continue;

      // Gather data
      const now = new Date();
      const periodStart = frequency === 'daily'
        ? new Date(now.getTime() - 24 * 60 * 60 * 1000)
        : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // For the weekly brief we also need the *current* outstanding book
      // and the next 7 days of scheduled work — not just the last period.
      const periodEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const [jobsRes, invoicesRes, projectsRes, allInvoicesRes, upcomingJobsRes] = await Promise.all([
        supabase.from('jobs').select('id, status, description').eq('user_id', user.id).gte('scheduled_start', periodStart.toISOString()),
        supabase.from('invoices').select('id, status, total').eq('user_id', user.id).gte('created_at', periodStart.toISOString()),
        supabase.from('gc_projects').select('id, name, status').eq('created_by', user.id),
        supabase.from('invoices').select('id, status, total, due_date').eq('user_id', user.id),
        supabase.from('jobs').select('id, status, description, scheduled_start').eq('user_id', user.id).gte('scheduled_start', now.toISOString()).lte('scheduled_start', periodEnd.toISOString()),
      ]);

      const jobs = jobsRes.data || [];
      const invoices = invoicesRes.data || [];
      const projects = projectsRes.data || [];
      const allInvoices = allInvoicesRes.data || [];
      const upcomingJobs = upcomingJobsRes.data || [];

      const completedJobs = jobs.filter((j: any) => j.status === 'COMPLETED').length;
      const totalJobs = jobs.length;
      const paidInvoices = invoices.filter((i: any) => i.status === 'paid');
      const revenue = paidInvoices.reduce((s: number, i: any) => s + Number(i.total || 0), 0);
      const activeProjects = projects.filter((p: any) => p.status === 'active').length;

      // Outstanding (receivables) + overdue snapshot across the full book.
      const unpaid = allInvoices.filter((i: any) => i.status !== 'paid' && i.status !== 'draft');
      const outstandingTotal = unpaid.reduce((s: number, i: any) => s + Number(i.total || 0), 0);
      const overdue = unpaid.filter((i: any) => i.due_date && new Date(i.due_date) < now);
      const overdueTotal = overdue.reduce((s: number, i: any) => s + Number(i.total || 0), 0);
      const upcomingCount = upcomingJobs.filter((j: any) => j.status !== 'COMPLETED' && j.status !== 'CANCELED').length;

      const periodLabel = frequency === 'daily' ? 'Yesterday' : 'This Week';
      const businessName = user.business_name || 'Your Business';
      const subject = `${businessName} — ${periodLabel} on FlowBoss`;
      const preheader = revenue > 0
        ? `$${revenue.toLocaleString()} in. ${completedJobs}/${totalJobs} jobs done. ${overdueTotal > 0 ? `$${overdueTotal.toLocaleString()} overdue.` : ''}`.trim()
        : `${completedJobs}/${totalJobs} jobs done${activeProjects > 0 ? `, ${activeProjects} active project${activeProjects > 1 ? 's' : ''}` : ''}.`;

      const fmtMoney = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

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
                  <td align="right" style="color:rgba(255,255,255,0.85);font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">${frequency === 'daily' ? 'Daily Digest' : 'Weekly Digest'}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:36px 32px 12px 32px;">
              <h1 style="margin:0 0 6px 0;font-size:24px;font-weight:700;color:#0f172a;line-height:1.25;letter-spacing:-0.02em;">
                ${periodLabel} at a glance
              </h1>
              <p style="margin:0;font-size:14px;color:#64748b;">
                ${businessName}
              </p>
            </td>
          </tr>

          <!-- Stats grid -->
          <tr>
            <td style="padding:20px 32px 8px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="50%" style="padding-right:6px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;">
                      <tr><td style="padding:18px 18px 16px 18px;">
                        <div style="font-size:11px;font-weight:700;color:#15803d;letter-spacing:0.08em;text-transform:uppercase;">Revenue</div>
                        <div style="font-size:26px;font-weight:700;color:#14532d;letter-spacing:-0.02em;margin-top:4px;">${fmtMoney(revenue)}</div>
                      </td></tr>
                    </table>
                  </td>
                  <td width="50%" style="padding-left:6px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;">
                      <tr><td style="padding:18px 18px 16px 18px;">
                        <div style="font-size:11px;font-weight:700;color:#1d4ed8;letter-spacing:0.08em;text-transform:uppercase;">Jobs Done</div>
                        <div style="font-size:26px;font-weight:700;color:#1e3a8a;letter-spacing:-0.02em;margin-top:4px;">${completedJobs}<span style="font-size:18px;color:#60a5fa;font-weight:600;">/${totalJobs}</span></div>
                      </td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${activeProjects > 0 || paidInvoices.length > 0 ? `
          <!-- Quick wins -->
          <tr>
            <td style="padding:8px 32px 0 32px;">
              ${activeProjects > 0 ? `<p style="margin:8px 0 0;font-size:14px;color:#475569;line-height:1.5;"><strong style="color:#0f172a;">${activeProjects}</strong> active project${activeProjects > 1 ? 's' : ''} in flight.</p>` : ''}
              ${paidInvoices.length > 0 ? `<p style="margin:8px 0 0;font-size:14px;color:#475569;line-height:1.5;"><strong style="color:#0f172a;">${paidInvoices.length}</strong> invoice${paidInvoices.length > 1 ? 's' : ''} paid.</p>` : ''}
            </td>
          </tr>
          ` : ''}

          ${outstandingTotal > 0 || upcomingCount > 0 ? `
          <!-- Focus card -->
          <tr>
            <td style="padding:24px 32px 8px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;">
                <tr><td style="padding:18px 20px;">
                  <div style="font-size:11px;font-weight:700;color:#92400e;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px;">This week's focus</div>
                  ${overdueTotal > 0 ? `<div style="font-size:14px;color:#1e293b;line-height:1.55;margin:6px 0;"><strong style="color:#b91c1c;">${fmtMoney(overdueTotal)}</strong> overdue across ${overdue.length} invoice${overdue.length > 1 ? 's' : ''} — chase these first.</div>` : ''}
                  ${outstandingTotal > 0 && overdueTotal < outstandingTotal ? `<div style="font-size:14px;color:#1e293b;line-height:1.55;margin:6px 0;"><strong style="color:#0f172a;">${fmtMoney(outstandingTotal - overdueTotal)}</strong> outstanding (not yet overdue).</div>` : ''}
                  ${upcomingCount > 0 ? `<div style="font-size:14px;color:#1e293b;line-height:1.55;margin:6px 0;"><strong style="color:#0f172a;">${upcomingCount}</strong> job${upcomingCount > 1 ? 's' : ''} on the schedule for the next 7 days.</div>` : ''}
                </td></tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:28px 32px 32px 32px;">
              <a href="${APP_URL}/dashboard/home" style="display:inline-block;background:#2563eb;color:#ffffff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;letter-spacing:-0.005em;box-shadow:0 1px 2px rgba(37,99,235,0.3);">
                Open Dashboard
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.55;">
                <strong style="color:#475569;">FlowBoss</strong> — coordination for contractors and trades.<br>
                You're receiving this because you opted in to ${frequency} digests. <a href="${APP_URL}/dashboard/settings" style="color:#2563eb;text-decoration:none;">Manage preferences</a>.
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

      // Send via Resend — now awaited and inspected so partial failures
      // are visible. The whole batch still completes; we just count.
      try {
        const resendResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'FlowBoss <digest@flowboss.io>',
            to: [email],
            subject,
            html,
          }),
        });

        if (!resendResp.ok) {
          const body = await resendResp.text();
          console.error('[send-digest] Resend rejected for user', user.id, resendResp.status, body);
          errors.push({ userId: user.id, status: resendResp.status, error: body.slice(0, 300) });
          failed++;
          continue;
        }
        sent++;
      } catch (err: any) {
        console.error('[send-digest] Network error for user', user.id, err);
        errors.push({ userId: user.id, error: err?.message || String(err) });
        failed++;
      }
    }

    return new Response(JSON.stringify({ sent, failed, errors: errors.slice(0, 10) }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
