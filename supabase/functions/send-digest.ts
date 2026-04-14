// Deploy to Supabase Edge Functions as "send-digest"
// Triggered by Supabase cron (pg_cron extension) or external scheduler
// Environment: RESEND_API_KEY (same as invoice emails)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendKey = Deno.env.get('RESEND_API_KEY')!;

serve(async (req) => {
  try {
    const { frequency } = await req.json(); // 'daily' or 'weekly'
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users who opted into this frequency
    const { data: users } = await supabase
      .from('profiles')
      .select('id, business_name, digest_email')
      .eq('digest_frequency', frequency);

    if (!users?.length) return new Response(JSON.stringify({ sent: 0 }));

    let sent = 0;

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

      const [jobsRes, invoicesRes, projectsRes] = await Promise.all([
        supabase.from('jobs').select('id, status, description').eq('user_id', user.id).gte('scheduled_start', periodStart.toISOString()),
        supabase.from('invoices').select('id, status, total').eq('user_id', user.id).gte('created_at', periodStart.toISOString()),
        supabase.from('gc_projects').select('id, name, status').eq('created_by', user.id),
      ]);

      const jobs = jobsRes.data || [];
      const invoices = invoicesRes.data || [];
      const projects = projectsRes.data || [];

      const completedJobs = jobs.filter((j: any) => j.status === 'COMPLETED').length;
      const totalJobs = jobs.length;
      const paidInvoices = invoices.filter((i: any) => i.status === 'paid');
      const revenue = paidInvoices.reduce((s: number, i: any) => s + Number(i.total || 0), 0);
      const activeProjects = projects.filter((p: any) => p.status === 'active').length;

      const periodLabel = frequency === 'daily' ? 'Yesterday' : 'This Week';

      // Send via Resend
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'FlowBoss <digest@flowboss.io>',
          to: [email],
          subject: `FlowBoss ${frequency === 'daily' ? 'Daily' : 'Weekly'} Digest — ${user.business_name || 'Your Business'}`,
          html: `
            <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #1e293b; margin-bottom: 4px;">${periodLabel} at a Glance</h2>
              <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">${user.business_name || 'FlowBoss'}</p>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
                <div style="background: #f0fdf4; border-radius: 12px; padding: 16px;">
                  <p style="color: #16a34a; font-size: 12px; font-weight: 600; margin: 0;">REVENUE</p>
                  <p style="color: #166534; font-size: 24px; font-weight: 700; margin: 4px 0 0;">$${revenue.toLocaleString()}</p>
                </div>
                <div style="background: #eff6ff; border-radius: 12px; padding: 16px;">
                  <p style="color: #2563eb; font-size: 12px; font-weight: 600; margin: 0;">JOBS</p>
                  <p style="color: #1e40af; font-size: 24px; font-weight: 700; margin: 4px 0 0;">${completedJobs}/${totalJobs}</p>
                </div>
              </div>

              ${activeProjects > 0 ? `<p style="color: #64748b; font-size: 14px;">📋 ${activeProjects} active project${activeProjects > 1 ? 's' : ''}</p>` : ''}
              ${paidInvoices.length > 0 ? `<p style="color: #64748b; font-size: 14px;">💰 ${paidInvoices.length} invoice${paidInvoices.length > 1 ? 's' : ''} paid</p>` : ''}

              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                <a href="https://flowboss.io/dashboard/home" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Open Dashboard</a>
              </div>

              <p style="color: #94a3b8; font-size: 11px; margin-top: 24px;">
                You're receiving this because you opted in to ${frequency} digests.
                <a href="https://flowboss.io/dashboard/settings" style="color: #2563eb;">Manage preferences</a>
              </p>
            </div>
          `,
        }),
      });

      sent++;
    }

    return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
