// Deploy to Supabase Edge Functions as "accept-invite"
// Environment: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Why this exists: the gc_project_trades RLS policy only grants UPDATE access
// to GC org members or already-assigned users. A brand-new invited sub
// matches NEITHER — they're not in the org yet (the org_member insert is
// itself gated to GC org owners) and they're not yet assigned. So when an
// invited sub clicked Accept on the web, supabase.from('gc_project_trades')
// .update() silently returned 0 rows and the post-accept navigation bounced
// them to /pricing.
//
// This function bypasses the RLS riddle for the assignment step:
//   • verify the caller is authenticated (their JWT)
//   • read the trade row with service-role (no RLS)
//   • validate the slot is open (or already theirs)
//   • assign the trade + insert org membership in a single server-side pass
//
// Accepting an invite must be bulletproof. It can't depend on subscription
// status, the sub already being a GC org member, or any of the other RLS
// preconditions that have piled up on this table over time.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

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
      return json({ error: 'Sign in to accept this invite.' }, 401, corsHeaders);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return json({ error: 'Your session expired. Sign in again to accept this invite.' }, 401, corsHeaders);
    }

    // --- Payload -------------------------------------------------------------
    const body = await req.json().catch(() => ({}));
    const { tradeId } = body as { tradeId?: string };
    if (!tradeId) {
      return json({ error: 'Missing tradeId.' }, 400, corsHeaders);
    }

    // --- Read the trade with service-role so RLS doesn't hide anything ------
    const { data: trade, error: readErr } = await supabase
      .from('gc_project_trades')
      .select('id, assigned_user_id, gc_project_id, trade')
      .eq('id', tradeId)
      .maybeSingle();
    if (readErr) {
      return json({ error: readErr.message }, 500, corsHeaders);
    }
    if (!trade) {
      return json({
        error: 'This invite no longer exists. The trade may have been removed by the GC.',
      }, 404, corsHeaders);
    }

    // --- Validate the assignment is allowed ---------------------------------
    if (trade.assigned_user_id && trade.assigned_user_id !== user.id) {
      return json({
        error: "This trade slot has already been claimed by someone else. If that's wrong, ask the GC to reassign it.",
      }, 409, corsHeaders);
    }

    // Already-assigned-to-this-user is a no-op success — return the row so the
    // client lands them in the project. Subs sometimes click invite links
    // twice and we shouldn't make that look like a failure.
    if (trade.assigned_user_id === user.id) {
      return json({ data: { tradeId: trade.id, projectId: trade.gc_project_id, alreadyAssigned: true } }, 200, corsHeaders);
    }

    // Block GCs from claiming a trade in their own project. The web client
    // also short-circuits this with the amber "this invite is for the trade
    // you invited" branch, but defend in depth — a stale link, a different
    // browser, or a direct API call shouldn't allow it either.
    const { data: project } = await supabase
      .from('gc_projects')
      .select('id, org_id, created_by')
      .eq('id', trade.gc_project_id)
      .maybeSingle();
    if (project && project.created_by === user.id) {
      return json({
        error: "This invite is for the trade you invited — not your GC account. Sign out and accept it from the trade's email address.",
      }, 403, corsHeaders);
    }

    // --- Perform the assignment with service-role ---------------------------
    const { data: updated, error: updateErr } = await supabase
      .from('gc_project_trades')
      .update({ assigned_user_id: user.id })
      .eq('id', tradeId)
      .select('id, assigned_user_id, gc_project_id, trade, zone_id')
      .single();
    if (updateErr) {
      return json({ error: updateErr.message }, 500, corsHeaders);
    }

    // --- Add the sub to the GC's org so their normal RLS works going forward.
    // Idempotent — onConflict ignores the row if they're already a member.
    if (project?.org_id) {
      try {
        await supabase
          .from('org_members')
          .upsert({
            org_id: project.org_id,
            user_id: user.id,
            role: 'sub_contractor',
            status: 'active',
            invited_by: project.created_by ?? null,
            joined_at: new Date().toISOString(),
          }, { onConflict: 'org_id,user_id' });
      } catch (memErr) {
        // Membership add failed — log but don't fail the whole accept. The
        // trade is assigned; the sub can still see their project via the
        // assigned_user_id RLS path. Membership is a "nice to have" that
        // unlocks org-wide pages, not the immediate accept moment.
        console.error('org_members upsert failed', memErr);
      }
    }

    // --- Activity feed: the GC sees "X accepted Drywall" in real time -------
    if (trade.gc_project_id) {
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('business_name, email')
          .eq('id', user.id)
          .maybeSingle();
        const subName = (prof as any)?.business_name
          || (prof as any)?.email?.split('@')[0]
          || (user.email ? user.email.split('@')[0] : 'A sub');
        await supabase.from('project_activity').insert({
          gc_project_id: trade.gc_project_id,
          actor_user_id: user.id,
          actor_name: subName,
          event_type: 'sub_accepted',
          summary: `${subName} accepted ${updated.trade || 'the invite'}`,
          trade_id: tradeId,
        });
      } catch (actErr) {
        console.error('project_activity insert failed', actErr);
      }
    }

    return json({
      data: {
        tradeId: updated.id,
        projectId: updated.gc_project_id,
        trade: updated.trade,
        zoneId: updated.zone_id,
        assignedUserId: updated.assigned_user_id,
      },
    }, 200, corsHeaders);
  } catch (err: any) {
    console.error('accept-invite error', err);
    return json({ error: err?.message || 'Something went wrong accepting this invite.' }, 500, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    });
  }
});

function json(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
