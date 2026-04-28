import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../components/ui/Toast';
import {
  ChevronRight,
  Building2,
  CheckSquare,
  Square,
  Clock,
  DollarSign,
  Phone,
  Mail,
  Package,
  Plus,
  Sparkles,
  StickyNote,
  Megaphone,
  Trash2,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { TemplatePicker } from '../../components/sub/TemplatePicker';
import { SubOnboardingOverlay } from '../../components/sub/SubOnboardingOverlay';

/* ─── Zone color / emoji maps (mirrored from ZoneClusterDiagram) ─── */

const ZONE_EMOJI: Record<string, string> = {
  'Kitchen': '\u{1F373}',
  'Bathroom': '\u{1F6BF}', 'Bathroom 1': '\u{1F6BF}', 'Bathroom 2': '\u{1F6BF}', 'Master Bathroom': '\u{1F6BF}',
  'Master Suite': '\u{1F6CF}\u{FE0F}', 'Master Bedroom': '\u{1F6CF}\u{FE0F}',
  'Bedroom': '\u{1F6CF}\u{FE0F}', 'Bedroom 1': '\u{1F6CF}\u{FE0F}', 'Bedroom 2': '\u{1F6CF}\u{FE0F}', 'Bedroom 3': '\u{1F6CF}\u{FE0F}',
  'Living Room': '\u{1F6CB}\u{FE0F}', 'Family Room': '\u{1F6CB}\u{FE0F}',
  'Garage': '\u{1F697}',
  'Exterior': '\u{1F3E1}',
  'Basement': '\u{1F3E0}',
  'Laundry': '\u{1F9FA}',
  'Office': '\u{1F4BC}',
  'Dining Room': '\u{1F37D}\u{FE0F}',
  'General': '\u{1F527}', 'Site-Wide': '\u{1F527}',
};

const ZONE_COLORS: Record<string, string> = {
  'Kitchen': '#f59e0b',
  'Bathroom': '#06b6d4', 'Bathroom 1': '#06b6d4', 'Bathroom 2': '#0891b2', 'Master Bathroom': '#0e7490',
  'Master Suite': '#8b5cf6', 'Master Bedroom': '#8b5cf6',
  'Living Room': '#22c55e', 'Family Room': '#22c55e',
  'Garage': '#64748b',
  'Exterior': '#16a34a',
  'Basement': '#6b7280',
  'General': '#2563eb', 'Site-Wide': '#2563eb',
};

const DEFAULT_ZONE_COLOR = '#6b7280';

/* ─── Tailwind color class maps for zone accent ─── */

function getZoneAccentClasses(zoneName: string) {
  const n = zoneName?.toLowerCase() || '';
  if (n.includes('kitchen')) return { bg: 'from-amber-500/15 to-amber-600/5', bar: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800', ring: 'ring-amber-200', text: 'text-amber-700' };
  if (n.includes('bathroom') || n.includes('bath')) return { bg: 'from-cyan-500/15 to-cyan-600/5', bar: 'bg-cyan-500', badge: 'bg-cyan-100 text-cyan-800', ring: 'ring-cyan-200', text: 'text-cyan-700' };
  if (n.includes('master') || n.includes('bedroom')) return { bg: 'from-violet-500/15 to-violet-600/5', bar: 'bg-violet-500', badge: 'bg-violet-100 text-violet-800', ring: 'ring-violet-200', text: 'text-violet-700' };
  if (n.includes('living') || n.includes('family')) return { bg: 'from-green-500/15 to-green-600/5', bar: 'bg-green-500', badge: 'bg-green-100 text-green-800', ring: 'ring-green-200', text: 'text-green-700' };
  if (n.includes('garage')) return { bg: 'from-slate-500/15 to-slate-600/5', bar: 'bg-slate-500', badge: 'bg-slate-100 text-slate-800', ring: 'ring-slate-200', text: 'text-slate-700' };
  if (n.includes('exterior')) return { bg: 'from-emerald-500/15 to-emerald-600/5', bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800', ring: 'ring-emerald-200', text: 'text-emerald-700' };
  return { bg: 'from-blue-500/15 to-blue-600/5', bar: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800', ring: 'ring-blue-200', text: 'text-blue-700' };
}

/* ─── Helpers ─── */

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

/* ─── Task notes ─────────────────────────────────────────────────────────
   Previously stored in localStorage, which meant:
     - The GC never saw the sub's notes.
     - The sub lost them when switching browsers or phones.
   Now persisted server-side on phase_tasks.notes (see task-notes-migration.sql).
   ─── */

/* ========================================================================= */
/*  Main Page                                                                 */
/* ========================================================================= */

export function SubProjectViewPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { user } = useAuth();

  // Fallback for user ID if useAuth doesn't have it yet
  const [currentUserId, setCurrentUserId] = useState<string | null>(user?.id ?? null);
  useEffect(() => {
    if (user?.id) { setCurrentUserId(user.id); return; }
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user?.id ?? null);
    });
  }, [user?.id]);

  const projectQuery = useQuery({
    queryKey: ['gc-project', id],
    queryFn: () => api.getGCProject(id!),
    enabled: !!id,
  });

  const project = projectQuery.data?.data;
  const trades: any[] = project?.trades || [];
  const zones: any[] = project?.zones || [];

  // Filter to trades assigned to the current user
  const myTrades = trades.filter(
    (t: any) => t.assignedUserId === currentUserId || t.assignedOrgId === currentUserId || t.assigned_user_id === currentUserId
  );
  const visibleTrades = myTrades.length > 0 ? myTrades : trades;

  // Group my trades by zone so a multi-trade / multi-zone sub sees distinct
  // sections. Pre-refactor this picked visibleTrades[0]'s zone as "the" zone,
  // which broke the hero + timeline for a plumber working Kitchen + Bath.
  type ZoneGroup = { zoneId: string | null; zoneName: string; trades: any[] };
  const zoneGroups: ZoneGroup[] = (() => {
    const byZone = new Map<string, ZoneGroup>();
    const unzoned: any[] = [];
    for (const t of visibleTrades) {
      const zid = t.zoneId || t.zone_id || null;
      if (!zid) { unzoned.push(t); continue; }
      const zone = zones.find((z: any) => z.id === zid);
      const key = zid;
      if (!byZone.has(key)) {
        byZone.set(key, { zoneId: zid, zoneName: zone?.name || 'Zone', trades: [] });
      }
      byZone.get(key)!.trades.push(t);
    }
    const result: ZoneGroup[] = Array.from(byZone.values());
    if (unzoned.length > 0) {
      result.push({ zoneId: null, zoneName: 'General', trades: unzoned });
    }
    return result;
  })();

  const myZoneIds = zoneGroups.map((g) => g.zoneId).filter(Boolean) as string[];

  // Stats across all visible trades — this is correct aggregate regardless of
  // how many zones the sub owns.
  const allTasks = visibleTrades.flatMap((t: any) => t.tasks || []);
  const doneTasks = allTasks.filter((t: any) => t.done).length;
  const totalTasks = allTasks.length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Earliest due date across visible tasks
  const dueDates = allTasks
    .map((t: any) => t.dueDate || t.due_date)
    .filter(Boolean)
    .map((d: string) => new Date(d).getTime());
  const earliestDue = dueDates.length > 0 ? new Date(Math.min(...dueDates)) : null;
  // Earliest trade end date as fallback (across all of my trades, not just first)
  const tradeEndDates = visibleTrades
    .map((t: any) => t.endDate || t.end_date)
    .filter(Boolean)
    .map((d: string) => new Date(d).getTime());
  const tradeEndDate = tradeEndDates.length > 0 ? new Date(Math.min(...tradeEndDates)).toISOString() : null;

  // Hero accent: single-zone subs get that zone's color (kitchen amber, bath
  // cyan, etc). Multi-zone subs get a neutral brand blue — pre-fix, the hero
  // gradient was kitchen-amber for a "Kitchen + Master Bath" sub, which read
  // as inconsistent with the per-zone chips below. Brand blue avoids picking
  // a winner. Per-section accents (task cards) still use each zone's color,
  // so the visual signal of "these are different zones" is preserved.
  const isMultiZone = zoneGroups.length > 1;
  const heroZoneName = zoneGroups[0]?.zoneName || 'General';
  const uniqueTrades = Array.from(new Set(visibleTrades.map((t: any) => t.trade))).filter(Boolean);
  const tradeName = uniqueTrades.length > 0 ? uniqueTrades.join(', ') : 'Your Assignment';
  const accent = isMultiZone
    ? { bg: 'from-blue-500/15 to-blue-600/5', bar: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800', ring: 'ring-blue-200', text: 'text-blue-700' }
    : getZoneAccentClasses(heroZoneName);
  const emoji = isMultiZone ? '\u{1F527}' : (ZONE_EMOJI[heroZoneName] || '\u{1F527}');

  if (projectQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">Project not found or you don't have access.</p>
        <Link to="/dashboard/schedule" className="mt-4 text-brand-600 hover:underline text-sm dark:text-blue-300">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      {/* First-visit walkthrough — fires once per browser, dismissible. */}
      <SubOnboardingOverlay />
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm">
        <Link to="/dashboard/schedule" className="text-gray-500 hover:text-gray-700 transition-colors dark:text-gray-400 dark:hover:text-gray-200">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
        <span className="text-gray-900 font-medium truncate max-w-[200px] dark:text-white">{project.name}</span>
      </div>

      {/* ── 1. Hero Banner ── */}
      <div className={`rounded-2xl bg-gradient-to-br ${accent.bg} border border-gray-200 p-6 lg:p-8 dark:border-white/10`}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1 dark:text-white">
              {emoji} {zoneGroups.length === 1
                ? <>{zoneGroups[0].zoneName} — {tradeName}</>
                : <>{tradeName} — {zoneGroups.length} zones</>}
            </h1>
            {zoneGroups.length > 1 && (
              <div className="flex flex-wrap gap-1.5 mt-2 mb-1">
                {zoneGroups.map((g) => {
                  const color = ZONE_COLORS[g.zoneName] || DEFAULT_ZONE_COLOR;
                  return (
                    <span
                      key={g.zoneId || g.zoneName}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-white/70 text-gray-800 dark:bg-white/10 dark:text-gray-200"
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                      {ZONE_EMOJI[g.zoneName] || ''} {g.zoneName}
                    </span>
                  );
                })}
              </div>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {project.name}
              {project.gcBusinessName ? ` \u00B7 Assigned by ${project.gcBusinessName}` : ''}
            </p>
          </div>
        </div>

        {/* Big progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{progress}% Complete</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {doneTasks} of {totalTasks} tasks done
              {(earliestDue || tradeEndDate) && (
                <> &middot; Due {formatDate(earliestDue?.toISOString() || tradeEndDate)}</>
              )}
            </span>
          </div>
          <div className="h-3 rounded-full bg-white/60 overflow-hidden">
            <div
              className={`h-full rounded-full ${accent.bar} transition-all duration-700 ease-out`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── 2. Quick update to the GC ── */}
      <UpdateGCComposer projectId={id!} gcName={project.gcBusinessName} />

      {/* ── 3. My Tasks — grouped by zone when the sub is in more than one ── */}
      {zoneGroups.length === 1 ? (
        // Single-zone: flat list of task sections per trade (legacy layout).
        zoneGroups[0].trades.map((trade: any) => (
          <TaskSection
            key={trade.id}
            trade={trade}
            projectId={id!}
            accent={accent}
          />
        ))
      ) : (
        zoneGroups.map((group) => {
          const zoneAccent = getZoneAccentClasses(group.zoneName);
          const zoneColor = ZONE_COLORS[group.zoneName] || DEFAULT_ZONE_COLOR;
          const zoneEmoji = ZONE_EMOJI[group.zoneName] || '';
          return (
            <div key={group.zoneId || group.zoneName} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: zoneColor }} />
                <h2 className="text-sm font-bold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                  {zoneEmoji} {group.zoneName}
                </h2>
              </div>
              {group.trades.map((trade: any) => (
                <TaskSection
                  key={trade.id}
                  trade={trade}
                  projectId={id!}
                  accent={zoneAccent}
                />
              ))}
            </div>
          );
        })
      )}

      {/* ── 3. My Budget ── */}
      <BudgetCard trades={visibleTrades} accent={accent} />

      {/* ── 4. Project Banner from GC ── */}
      <SubProjectBanner project={project} />

      {/* ── 5. Project Timeline ── */}
      <ProjectTimeline
        zones={zones}
        trades={trades}
        myZoneIds={myZoneIds}
        accent={accent}
      />

      {/* ── 6. GC Contact Card ── */}
      <GCContactCard project={project} />
    </div>
  );
}

/* ========================================================================= */
/*  2. Task Section                                                           */
/* ========================================================================= */

function TaskSection({ trade, projectId, accent }: { trade: any; projectId: string; accent: ReturnType<typeof getZoneAccentClasses> }) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const tasks: any[] = (trade.tasks || []).slice().sort((a: any, b: any) => {
    // completed tasks at the bottom
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (a.sortOrder ?? a.sort_order ?? 0) - (b.sortOrder ?? b.sort_order ?? 0);
  });

  const toggleTask = useMutation({
    mutationFn: ({ taskId, done }: { taskId: string; done: boolean }) =>
      api.toggleGCTask(taskId, done),
    onMutate: async ({ taskId, done }) => {
      await queryClient.cancelQueries({ queryKey: ['gc-project', projectId] });
      const prev = queryClient.getQueryData(['gc-project', projectId]);
      queryClient.setQueryData(['gc-project', projectId], (old: any) => {
        if (!old?.data?.trades) return old;
        return {
          ...old,
          data: {
            ...old.data,
            trades: old.data.trades.map((t: any) =>
              t.id === trade.id
                ? { ...t, tasks: t.tasks.map((tk: any) => tk.id === taskId ? { ...tk, done } : tk) }
                : t
            ),
          },
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['gc-project', projectId], ctx.prev);
      addToast('Failed to update task', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] });
    },
  });

  // Persist task notes server-side with optimistic update so the GC sees them
  // and the sub keeps them across devices. (Was localStorage — lost everywhere.)
  // Note: was previously calling api.updateTask which writes to the
  // unrelated phase_tasks table. Notes silently never persisted for
  // gc_project_tasks. updateGCTask hits the right table.
  const saveNote = useMutation({
    mutationFn: ({ taskId, notes }: { taskId: string; notes: string }) =>
      api.updateGCTask(taskId, { notes }),
    onMutate: async ({ taskId, notes }) => {
      await queryClient.cancelQueries({ queryKey: ['gc-project', projectId] });
      const prev = queryClient.getQueryData(['gc-project', projectId]);
      queryClient.setQueryData(['gc-project', projectId], (old: any) => {
        if (!old?.data?.trades) return old;
        return {
          ...old,
          data: {
            ...old.data,
            trades: old.data.trades.map((t: any) =>
              t.id === trade.id
                ? { ...t, tasks: t.tasks.map((tk: any) => tk.id === taskId ? { ...tk, notes } : tk) }
                : t
            ),
          },
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['gc-project', projectId], ctx.prev);
      addToast('Failed to save note', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] });
    },
  });

  // Subs run their own job. The original page treated this list as "tasks
  // the GC assigned" and offered no way to add anything — culturally wrong
  // for trades, who don't take a checklist from the GC, they make their
  // own. Let the sub add and remove their own line items inline; RLS on
  // gc_project_tasks already allows it via the assigned_user_id branch.
  const [newTask, setNewTask] = useState('');
  const addTask = useMutation({
    mutationFn: (name: string) => api.addGCTask(trade.id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] });
      setNewTask('');
    },
    onError: (err: any) => addToast(err.message || 'Failed to add task', 'error'),
  });
  const removeTask = useMutation({
    mutationFn: (taskId: string) => api.deleteGCTask(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['gc-project', projectId] });
      const prev = queryClient.getQueryData(['gc-project', projectId]);
      queryClient.setQueryData(['gc-project', projectId], (old: any) => {
        if (!old?.data?.trades) return old;
        return {
          ...old,
          data: {
            ...old.data,
            trades: old.data.trades.map((t: any) =>
              t.id === trade.id
                ? { ...t, tasks: t.tasks.filter((tk: any) => tk.id !== taskId) }
                : t
            ),
          },
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['gc-project', projectId], ctx.prev);
      addToast('Failed to remove task', 'error');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] }),
  });

  function handleAddTask() {
    const trimmed = newTask.trim();
    if (!trimmed || addTask.isPending) return;
    addTask.mutate(trimmed);
  }

  // Inline rename — the sub typo'd "Hand rock" instead of "Hang rock"; let
  // them fix it without delete + retype. Optimistic so the field worker
  // doesn't see a flash of stale text on a slow connection.
  const renameTask = useMutation({
    mutationFn: ({ taskId, name }: { taskId: string; name: string }) =>
      api.updateGCTask(taskId, { name }),
    onMutate: async ({ taskId, name }) => {
      await queryClient.cancelQueries({ queryKey: ['gc-project', projectId] });
      const prev = queryClient.getQueryData(['gc-project', projectId]);
      queryClient.setQueryData(['gc-project', projectId], (old: any) => {
        if (!old?.data?.trades) return old;
        return {
          ...old,
          data: {
            ...old.data,
            trades: old.data.trades.map((t: any) =>
              t.id === trade.id
                ? { ...t, tasks: t.tasks.map((tk: any) => tk.id === taskId ? { ...tk, name } : tk) }
                : t
            ),
          },
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['gc-project', projectId], ctx.prev);
      addToast('Failed to rename task', 'error');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] }),
  });

  // Sub-driven trade status: this is the most product-defining change in
  // the sub view. Subs decide when their portion is in_progress and when
  // it's done — the GC reads status, they don't dictate it. The GC
  // dashboard's existing TradeDetailPanel (read by the GC, not editable)
  // already reflects this column live.
  const updateStatus = useMutation({
    mutationFn: (status: string) => api.updateGCTrade(trade.id, { status }),
    onSuccess: (_data, status) => {
      queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] });
      const friendly: Record<string, string> = {
        not_started: 'Marked not started',
        in_progress: 'Marked in progress',
        completed: 'Marked complete',
        blocked: 'Marked blocked',
      };
      addToast(friendly[status] || 'Status updated', 'success');
    },
    onError: (err: any) => addToast(err.message || 'Failed to update status', 'error'),
  });

  const allDone = tasks.length > 0 && tasks.every((t: any) => t.done);
  const currentStatus: string = trade.status || 'not_started';
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10 dark:shadow-black/30">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2 dark:border-white/10">
        {/* "My work plan" frames the section as the sub's, not a checklist
            handed down by the GC. The trade name still leads when there are
            multiple, so a sub on "Plumbing + HVAC" doesn't see two
            indistinguishable "My work plan" cards. */}
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {trade.trade ? `${trade.trade} · my work plan` : 'My work plan'}
        </h2>
        <div className="flex items-center gap-2">
          <SubStatusPill
            status={currentStatus}
            onChange={(next) => updateStatus.mutate(next)}
            disabled={updateStatus.isPending}
          />
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            {tasks.filter((t: any) => t.done).length}/{tasks.length || 0}
          </span>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Plan your work for this job</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 max-w-sm mx-auto mb-4">
            Start from a {trade.trade || 'trade'} starter template (phases, tasks, materials &mdash; all editable) or build your plan inline below.
          </p>
          {/* Template CTA leads when the plan is empty — that's the "wow"
              moment Geoff has on mobile and the sub view shipped without.
              Purple matches the mobile design system's template accent
              (#7c3aed) so the visual identity stays consistent across
              surfaces. Big, prominent, free for invited subs. */}
          <button
            onClick={() => setTemplatePickerOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-purple-500 hover:to-purple-500 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Use a starter template
          </button>
          <p className="text-[11px] text-gray-400 mt-3 dark:text-gray-500">Free on this project &mdash; no subscription needed.</p>
        </div>
      ) : (
        <PhaseGroupedList
          tasks={tasks}
          accent={accent}
          onToggle={(taskId, done) => toggleTask.mutate({ taskId, done })}
          onSaveNote={(taskId, notes) => saveNote.mutate({ taskId, notes })}
          onRemove={(taskId) => removeTask.mutate(taskId)}
          onRename={(taskId, name) => renameTask.mutate({ taskId, name })}
        />
      )}

      {/* Inline composer — single-line entry, no modal. Trades are on a
          phone in the field; a modal would be hostile. Enter submits,
          empty input is a no-op. The Sparkles button next to it opens
          the template picker for "I want to dump in a whole scope at
          once" moments — most useful on a fresh job, but also works
          mid-plan when something pivots (e.g. a kitchen rough-in scope
          gets added to a bathroom remodel). */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
        <form
          onSubmit={(e) => { e.preventDefault(); handleAddTask(); }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-gray-400 flex-shrink-0 dark:text-gray-500" />
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a step to your plan&hellip;"
            className="flex-1 bg-transparent text-sm placeholder:text-gray-400 focus:outline-none dark:text-white dark:placeholder:text-gray-500"
            disabled={addTask.isPending}
          />
          {newTask.trim() ? (
            <button
              type="submit"
              disabled={addTask.isPending}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50 transition-colors dark:text-blue-300"
            >
              {addTask.isPending ? 'Adding…' : 'Add'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setTemplatePickerOpen(true)}
              title="Add a whole scope from a starter template"
              className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-brand-700 transition-colors dark:text-gray-400 dark:hover:text-blue-300"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Template</span>
            </button>
          )}
        </form>
        {/* Celebratory finish-line CTA: when every line is checked but the
            trade isn't yet flagged complete, surface a single big-deal
            button that does the closing transition. Skipping this used to
            require digging into the (read-only) GC dashboard. */}
        {allDone && currentStatus !== 'completed' && (
          <button
            onClick={() => updateStatus.mutate('completed')}
            disabled={updateStatus.isPending}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <CheckSquare className="w-4 h-4" />
            {updateStatus.isPending ? 'Marking complete…' : `Mark ${trade.trade || 'this trade'} complete`}
          </button>
        )}
      </div>

      {/* Materials list — populated by template applies, editable inline.
          Mobile pairs materials with each phase; web stores them flat per
          trade (gc_trade_materials), so we render a single section
          beneath the work plan rather than slotting them into phases.
          Folded by default to keep the work plan card compact when
          there's nothing in there yet. */}
      <MaterialsSection tradeId={trade.id} projectId={projectId} />

      {/* Template picker modal — single instance per TaskSection, so a sub
          on multiple trades (Plumbing + HVAC) gets the right trade-specific
          library each time. */}
      <TemplatePicker
        open={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        tradeId={trade.id}
        tradeLabel={trade.trade || ''}
        projectId={projectId}
      />
    </div>
  );
}

/* ─── Materials section ────────────────────────────────────────────────── */
//
// Templates apply both tasks and materials, but the sub view shipped
// without anywhere to *see* the materials — they sat in
// gc_trade_materials read by no one. This component reads them, lets the
// sub check off purchased rows, edit/remove inline, and add new lines.
// Same RLS path as tasks (assigned_user_id branch on the trade row).

function MaterialsSection({ tradeId, projectId }: { tradeId: string; projectId: string }) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCost, setNewCost] = useState('');

  const { data: materials = [] } = useQuery({
    queryKey: ['gc-trade-materials', tradeId],
    queryFn: async () => {
      const { data } = await api.getGCTradeMaterials(tradeId);
      return data as any[];
    },
    enabled: !!tradeId,
    staleTime: 30_000,
  });

  const togglePurchased = useMutation({
    mutationFn: ({ id, purchased }: { id: string; purchased: boolean }) =>
      api.updateGCTradeMaterial(id, { purchased }),
    onMutate: async ({ id, purchased }) => {
      await queryClient.cancelQueries({ queryKey: ['gc-trade-materials', tradeId] });
      const prev = queryClient.getQueryData(['gc-trade-materials', tradeId]);
      queryClient.setQueryData(['gc-trade-materials', tradeId], (old: any[] = []) =>
        old.map((m) => (m.id === id ? { ...m, purchased } : m)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['gc-trade-materials', tradeId], ctx.prev);
      addToast('Failed to update', 'error');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['gc-trade-materials', tradeId] }),
  });

  const removeMaterial = useMutation({
    mutationFn: (id: string) => api.deleteGCTradeMaterial(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['gc-trade-materials', tradeId] });
      const prev = queryClient.getQueryData(['gc-trade-materials', tradeId]);
      queryClient.setQueryData(['gc-trade-materials', tradeId], (old: any[] = []) =>
        old.filter((m) => m.id !== id),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['gc-trade-materials', tradeId], ctx.prev);
      addToast('Failed to remove', 'error');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['gc-trade-materials', tradeId] }),
  });

  const addMaterial = useMutation({
    mutationFn: ({ name, cost }: { name: string; cost: number }) =>
      api.addGCTradeMaterial(tradeId, { name, quantity: 1, unit: 'ea', unit_cost: cost }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-trade-materials', tradeId] });
      queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] });
      setNewName('');
      setNewCost('');
    },
    onError: (err: any) => addToast(err?.message || 'Failed to add material', 'error'),
  });

  function handleAddMaterial() {
    const trimmed = newName.trim();
    if (!trimmed || addMaterial.isPending) return;
    const parsed = parseFloat(newCost);
    addMaterial.mutate({ name: trimmed, cost: Number.isFinite(parsed) ? parsed : 0 });
  }

  const total = materials.reduce((s: number, m: any) => s + (Number(m.unit_cost) || 0) * (Number(m.quantity) || 1), 0);
  const purchased = materials.filter((m: any) => m.purchased)
    .reduce((s: number, m: any) => s + (Number(m.unit_cost) || 0) * (Number(m.quantity) || 1), 0);
  const purchasedCount = materials.filter((m: any) => m.purchased).length;

  if (materials.length === 0 && !expanded) {
    // Don't render anything when there's no materials data yet — the
    // template picker is the canonical "load a starter materials list"
    // entry point. Avoid yet another empty state on the sub view.
    return null;
  }

  return (
    <div className="border-t border-gray-100 dark:border-white/10">
      <button
        type="button"
        onClick={() => setExpanded((x) => !x)}
        className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-50/60 transition-colors dark:hover:bg-white/[0.02]"
      >
        <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 dark:bg-purple-500/15">
          <Package className="w-3.5 h-3.5 text-purple-600 dark:text-purple-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Materials</h3>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            {purchasedCount}/{materials.length} purchased &middot; {formatCurrency(purchased)} of {formatCurrency(total)}
          </p>
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div>
          {materials.length > 0 && (
            <div className="divide-y divide-gray-100 dark:divide-white/10">
              {materials.map((m: any) => {
                const lineTotal = (Number(m.unit_cost) || 0) * (Number(m.quantity) || 1);
                return (
                  <div
                    key={m.id}
                    className={`flex items-center gap-3 px-5 py-2.5 transition-colors ${m.purchased ? 'bg-green-50/30 dark:bg-green-500/[0.04]' : ''}`}
                  >
                    <button
                      onClick={() => togglePurchased.mutate({ id: m.id, purchased: !m.purchased })}
                      className="flex-shrink-0"
                      title={m.purchased ? 'Mark not purchased' : 'Mark purchased'}
                    >
                      {m.purchased ? (
                        <CheckSquare className="w-4 h-4 text-green-500" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-300 hover:text-gray-500" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${m.purchased ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                        {m.name}
                      </p>
                      {m.category && (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">{m.category}</p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold flex-shrink-0 ${m.purchased ? 'text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                      {formatCurrency(lineTotal)}
                    </span>
                    <button
                      onClick={() => removeMaterial.mutate(m.id)}
                      title="Remove material"
                      className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Inline composer — name + cost in one row, Enter to submit. */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleAddMaterial(); }}
            className="flex items-center gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50/50 dark:border-white/10 dark:bg-white/[0.02]"
          >
            <Plus className="w-4 h-4 text-gray-400 flex-shrink-0 dark:text-gray-500" />
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Add a material&hellip;"
              className="flex-1 bg-transparent text-sm placeholder:text-gray-400 focus:outline-none dark:text-white dark:placeholder:text-gray-500"
              disabled={addMaterial.isPending}
            />
            <input
              type="number"
              inputMode="decimal"
              value={newCost}
              onChange={(e) => setNewCost(e.target.value)}
              placeholder="$"
              className="w-20 bg-transparent text-sm text-right placeholder:text-gray-400 focus:outline-none dark:text-white dark:placeholder:text-gray-500"
              disabled={addMaterial.isPending}
            />
            {newName.trim() && (
              <button
                type="submit"
                disabled={addMaterial.isPending}
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 disabled:opacity-50 transition-colors dark:text-purple-300"
              >
                {addMaterial.isPending ? 'Adding…' : 'Add'}
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

/* ─── Phase-grouped task list (mobile-aligned) ─────────────────────────── */
//
// Mobile's project [id] screen organizes work as collapsible phase cards —
// number badge → phase name → progress % → mini progress bar, with the
// task checklist nested inside on expand. Web's flat list got chaotic
// the moment a template applied 50+ tasks across 5 phases. This brings
// the same accordion structure to web, so a sub looking at a Bathroom
// Remodel sees: Demo & Rough-In (8/11), Shower Pan (3/7), Tile (0/12)…
//
// Tasks the sub added inline (no phase column) collect under a "Your
// additions" group at the bottom — distinct from the templated phases
// so it's clear which line items the sub created vs which came from the
// starter scope.

// Progress palette mirrors mobile's project-context coloration:
//   purple = upcoming (not started yet — purple is the project surface
//            accent across the in-app UI)
//   orange = in progress (some checked, not yet done — same warning /
//            attention-needed tone mobile uses for overdue and active)
//   green  = complete (every task in the phase is done)
// Bar uses #EA580C (semantic.orange) and #16A34A (semantic.success) to
// match mobile's exact tokens; purple uses #7C3AED (projects.accent).
const PHASE_PROGRESS_TONE = (pct: number) => {
  if (pct === 100) {
    return { bar: '#16A34A', dot: 'bg-green-500',  text: 'text-green-700 dark:text-green-300',   soft: 'bg-green-100 dark:bg-green-500/20' };
  }
  if (pct > 0) {
    return { bar: '#EA580C', dot: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-300', soft: 'bg-orange-100 dark:bg-orange-500/20' };
  }
  return     { bar: '#7C3AED', dot: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-300', soft: 'bg-purple-100 dark:bg-purple-500/20' };
};

function PhaseGroupedList({
  tasks,
  accent,
  onToggle,
  onSaveNote,
  onRemove,
  onRename,
}: {
  tasks: any[];
  accent: ReturnType<typeof getZoneAccentClasses>;
  onToggle: (taskId: string, done: boolean) => void;
  onSaveNote: (taskId: string, notes: string) => void;
  onRemove: (taskId: string) => void;
  onRename: (taskId: string, name: string) => void;
}) {
  // Group preserving the order phases first appeared in (sort_order is
  // already monotonic per phase from applyTemplateToTrade). Tasks with no
  // phase land in the catch-all bucket at the bottom.
  const groups: { phase: string | null; tasks: any[] }[] = [];
  for (const t of tasks) {
    const phase: string | null = t.phase ?? null;
    let g = groups.find((x) => x.phase === phase);
    if (!g) {
      g = { phase, tasks: [] };
      groups.push(g);
    }
    g.tasks.push(t);
  }
  // Move the unphased "Your additions" group to the end if it exists
  // alongside named phases. If there are ONLY unphased tasks (the sub
  // hasn't applied a template), don't bother showing the group label —
  // just render the flat list. This avoids labeling someone's hand-typed
  // checklist as "Your additions" when there's nothing else to compare to.
  const onlyUnphased = groups.length === 1 && groups[0].phase === null;
  if (onlyUnphased) {
    return (
      <div className="divide-y divide-gray-100 dark:divide-white/10">
        {groups[0].tasks.map((task: any) => (
          <TaskCard
            key={task.id}
            task={task}
            accent={accent}
            onToggle={(done) => onToggle(task.id, done)}
            onSaveNote={(notes) => onSaveNote(task.id, notes)}
            onRemove={() => onRemove(task.id)}
            onRename={(name) => onRename(task.id, name)}
          />
        ))}
      </div>
    );
  }

  // Push unphased to bottom for the mixed case.
  groups.sort((a, b) => {
    if (a.phase === null) return 1;
    if (b.phase === null) return -1;
    return 0;
  });

  // Pick the first not-fully-done phase as the default-expanded one (the
  // "current" phase in mobile parlance). Memoized via key so toggling a
  // task in an earlier phase doesn't auto-collapse the user's open phase.
  const activePhaseIndex = (() => {
    for (let i = 0; i < groups.length; i++) {
      const allDone = groups[i].tasks.length > 0 && groups[i].tasks.every((t: any) => t.done);
      if (!allDone) return i;
    }
    return 0;
  })();

  return (
    <div className="divide-y divide-gray-100 dark:divide-white/10">
      {groups.map((g, idx) => (
        <PhaseGroup
          key={g.phase ?? '__no_phase__'}
          phaseName={g.phase}
          phaseNumber={g.phase ? idx + 1 : null}
          tasks={g.tasks}
          totalPhases={groups.filter((x) => x.phase !== null).length}
          defaultExpanded={idx === activePhaseIndex}
          accent={accent}
          onToggle={onToggle}
          onSaveNote={onSaveNote}
          onRemove={onRemove}
          onRename={onRename}
        />
      ))}
    </div>
  );
}

function PhaseGroup({
  phaseName,
  phaseNumber,
  tasks,
  defaultExpanded,
  accent,
  onToggle,
  onSaveNote,
  onRemove,
  onRename,
}: {
  phaseName: string | null;
  phaseNumber: number | null;
  tasks: any[];
  totalPhases: number;
  defaultExpanded: boolean;
  accent: ReturnType<typeof getZoneAccentClasses>;
  onToggle: (taskId: string, done: boolean) => void;
  onSaveNote: (taskId: string, notes: string) => void;
  onRemove: (taskId: string) => void;
  onRename: (taskId: string, name: string) => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const done = tasks.filter((t: any) => t.done).length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const tone = PHASE_PROGRESS_TONE(pct);
  const isComplete = pct === 100;
  const headerLabel = phaseName ?? 'Your additions';

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((x) => !x)}
        className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-50/60 transition-colors dark:hover:bg-white/[0.02]"
      >
        {/* Phase number / status badge — the same visual rhythm as
            mobile's phaseNumber / phaseNumberActive / checkmark cycle. */}
        {phaseNumber !== null ? (
          isComplete ? (
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 dark:bg-green-500/20">
              <CheckSquare className="w-4 h-4 text-green-600 dark:text-green-300" />
            </div>
          ) : (
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-bold ${tone.soft} ${tone.text}`}>
              {phaseNumber}
            </div>
          )
        ) : (
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 dark:bg-white/10">
            <Plus className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold truncate ${isComplete ? 'text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-white'}`}>
            {headerLabel}
          </h3>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            {done}/{total} task{total === 1 ? '' : 's'} done
          </p>
        </div>

        <div className={`text-[11px] font-bold flex-shrink-0 px-2 py-0.5 rounded-full ${tone.soft} ${tone.text}`}>
          {pct}%
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Mini progress bar pinned under the header — same affordance mobile
          uses to give a phase a sense of momentum even when collapsed. */}
      <div className="h-0.5 bg-gray-100 dark:bg-white/10">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: tone.bar }}
        />
      </div>

      {expanded && (
        <div className="divide-y divide-gray-100 dark:divide-white/10">
          {tasks.map((task: any) => (
            <TaskCard
              key={task.id}
              task={task}
              accent={accent}
              onToggle={(d) => onToggle(task.id, d)}
              onSaveNote={(notes) => onSaveNote(task.id, notes)}
              onRemove={() => onRemove(task.id)}
              onRename={(name) => onRename(task.id, name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Sub-driven trade status pill ─── */

// Status palette tracks the same progress coloration as the phase
// accordion: purple = upcoming (the project accent reserved for "not
// started"), orange = in progress (active/working tone, mobile uses
// the same orange for "needs attention"), green = complete. Blocked
// stays red because it's a hard alert state, not a progress step.
const SUB_STATUS_OPTIONS: { key: string; label: string; color: string }[] = [
  { key: 'not_started', label: 'Not started', color: 'text-purple-700 bg-purple-100 dark:bg-purple-500/20 dark:text-purple-200' },
  { key: 'in_progress', label: 'In progress', color: 'text-orange-700 bg-orange-100 dark:bg-orange-500/20 dark:text-orange-200' },
  { key: 'blocked',     label: 'Blocked',     color: 'text-red-700 bg-red-100 dark:bg-red-500/20 dark:text-red-200' },
  { key: 'completed',   label: 'Complete',    color: 'text-green-700 bg-green-100 dark:bg-green-500/20 dark:text-green-200' },
];

function SubStatusPill({
  status,
  onChange,
  disabled,
}: {
  status: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = SUB_STATUS_OPTIONS.find((s) => s.key === status) || SUB_STATUS_OPTIONS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${current.color} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
      >
        {current.label}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-40 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 dark:bg-gray-900 dark:border-white/10">
            {SUB_STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => { setOpen(false); if (opt.key !== status) onChange(opt.key); }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-white/10 ${opt.key === status ? 'font-semibold' : ''}`}
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${opt.color.split(' ')[1]}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Quick "Update the GC" composer ─── */
//
// Subs message GCs constantly: "I'm here, started today", "rough-in
// passed inspection", "we're going to need a 6-foot ladder, no power
// run yet". Forcing them to navigate to a separate Chat tab would be
// hostile — the most natural place to send a status update is on the
// project page itself. This posts straight into the existing
// gc_project_messages thread (so chat history stays unified) and shows
// a small Sent confirmation in place of the textarea after.

function UpdateGCComposer({ projectId, gcName }: { projectId: string; gcName?: string | null }) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [justSent, setJustSent] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && taRef.current) taRef.current.focus();
  }, [open]);

  const sendMessage = useMutation({
    mutationFn: (message: string) => api.sendGCMessage(projectId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] });
      setDraft('');
      setJustSent(true);
      setOpen(false);
      // Auto-clear the "Sent ✓" badge after a few seconds — confirmation
      // is reassuring; permanent triumphalism is not.
      setTimeout(() => setJustSent(false), 3500);
    },
    onError: (err: any) => addToast(err.message || 'Failed to send update', 'error'),
  });

  function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed || sendMessage.isPending) return;
    sendMessage.mutate(trimmed);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10 dark:shadow-black/30">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50/60 transition-colors rounded-xl dark:hover:bg-white/5"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center dark:bg-blue-500/10">
              <Megaphone className="w-4 h-4 text-brand-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {justSent ? 'Sent to the GC ✓' : `Update ${gcName || 'the GC'}`}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {justSent ? "They'll see it in the project chat." : 'Status, blockers, photos coming, anything they should know.'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </button>
      ) : (
        <div className="p-4 space-y-3">
          <textarea
            ref={taRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSend(); }
              if (e.key === 'Escape') { setOpen(false); setDraft(''); }
            }}
            rows={3}
            placeholder={`What should ${gcName || 'the GC'} know? (Cmd+Enter to send)`}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400"
          />
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              Posts to the project chat &mdash; the GC sees it instantly.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setOpen(false); setDraft(''); }}
                disabled={sendMessage.isPending}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!draft.trim() || sendMessage.isPending}
                className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sendMessage.isPending ? 'Sending…' : 'Send update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Individual Task Card ─── */

function TaskCard({
  task,
  accent,
  onToggle,
  onSaveNote,
  onRemove,
  onRename,
}: {
  task: any;
  accent: ReturnType<typeof getZoneAccentClasses>;
  onToggle: (done: boolean) => void;
  onSaveNote: (notes: string) => void;
  onRemove?: () => void;
  onRename?: (name: string) => void;
}) {
  // Inline rename — click the task name to edit, Enter to save, Esc to
  // cancel. Disabled when the task is already marked done so a stray
  // click on a finished line doesn't unintentionally re-open editing.
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState<string>(task.name ?? '');
  const renameInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (renaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renaming]);
  useEffect(() => {
    if (!renaming) setDraftName(task.name ?? '');
  }, [task.name, renaming]);
  function commitRename() {
    const trimmed = draftName.trim();
    setRenaming(false);
    if (!trimmed || trimmed === task.name || !onRename) return;
    onRename(trimmed);
  }
  // Inline confirm — small surface; a modal is overkill for "remove a
  // line item from your own checklist." First click arms it for ~3s,
  // second click removes. Cancels on outside click.
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  useEffect(() => {
    if (!confirmingRemove) return;
    const t = setTimeout(() => setConfirmingRemove(false), 3000);
    return () => clearTimeout(t);
  }, [confirmingRemove]);
  // Server-backed note — stays in sync with the task row so the GC sees the
  // sub's notes and the sub keeps them across devices.
  const serverNote: string = task.notes ?? '';
  const [note, setNote] = useState(serverNote);
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // If the server version changes (refetch, another device), pick it up —
  // but don't clobber an in-progress edit.
  useEffect(() => {
    if (!editing) setNote(serverNote);
  }, [serverNote, editing]);

  const handleSaveNote = useCallback(() => {
    setEditing(false);
    if (note !== serverNote) onSaveNote(note);
  }, [note, serverNote, onSaveNote]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editing]);

  const isDone = task.done;

  return (
    <div className={`px-5 py-4 transition-colors ${isDone ? 'bg-gray-50/50' : 'hover:bg-gray-50/30'}`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(!isDone)}
          className="flex-shrink-0 mt-0.5 transition-colors"
        >
          {isDone ? (
            <CheckSquare className="w-5 h-5 text-green-500" />
          ) : (
            <Square className="w-5 h-5 text-gray-300 hover:text-gray-500" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            {renaming && onRename && !isDone ? (
              <input
                ref={renameInputRef}
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
                  if (e.key === 'Escape') { setDraftName(task.name ?? ''); setRenaming(false); }
                }}
                className="flex-1 text-sm font-medium bg-transparent border-b border-brand-400 focus:outline-none focus:border-brand-600 dark:text-white dark:border-blue-400"
              />
            ) : (
              <button
                onClick={() => { if (onRename && !isDone) setRenaming(true); }}
                className={`text-left text-sm font-medium truncate ${isDone ? 'text-gray-400 line-through cursor-default' : 'text-gray-900 dark:text-white hover:text-brand-700 dark:hover:text-blue-300'}`}
                title={onRename && !isDone ? 'Click to rename' : undefined}
              >
                {task.name}
              </button>
            )}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {isDone ? 'Complete' : 'To Do'}
              </span>
              {onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirmingRemove) {
                      onRemove();
                      setConfirmingRemove(false);
                    } else {
                      setConfirmingRemove(true);
                    }
                  }}
                  title={confirmingRemove ? 'Click again to remove' : 'Remove task'}
                  className={`p-1 rounded transition-colors ${confirmingRemove ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300' : 'text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Due date */}
          {(task.dueDate || task.due_date) && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400 dark:text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Due {formatDate(task.dueDate || task.due_date)}</span>
            </div>
          )}

          {/* Notes display / edit */}
          {isDone && note ? (
            <div className="mt-2 text-xs text-gray-500 bg-gray-100 rounded-lg px-3 py-2 dark:text-gray-400 dark:bg-white/10">
              <div className="flex items-center gap-1 mb-0.5">
                <StickyNote className="w-3 h-3" />
                <span className="font-medium">Note:</span>
              </div>
              {note}
            </div>
          ) : isDone && !note ? (
            <p className="mt-1.5 text-xs text-gray-400 italic dark:text-gray-500">No notes</p>
          ) : editing ? (
            <div className="mt-2">
              <textarea
                ref={textareaRef}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={handleSaveNote}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveNote(); } }}
                placeholder="Add a note..."
                rows={2}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              />
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  onClick={handleSaveNote}
                  className={`text-xs font-medium px-3 py-1 rounded-md text-white ${accent.bar} hover:opacity-90 transition-opacity`}
                >
                  Save
                </button>
                <button
                  onClick={() => { setNote(serverNote); setEditing(false); }}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors dark:text-gray-500 dark:hover:text-gray-300"
              >
                <StickyNote className="w-3 h-3" />
                {note ? 'Edit note' : 'Add note...'}
              </button>
              {/* TODO(photo-upload): Re-enable when task photo upload is wired
                  to a storage bucket + task_photos table. The button used to
                  render here with no onClick — removing until it actually works
                  so we're not advertising a dead feature. See the product
                  audit (AUDIT_2026-04-16) finding B2 for scope. */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/*  3. Budget Card                                                            */
/* ========================================================================= */

function BudgetCard({ trades, accent }: { trades: any[]; accent: ReturnType<typeof getZoneAccentClasses> }) {
  let totalLabor = 0;
  let totalMaterials = 0;

  for (const t of trades) {
    const hours = t.laborHours || t.labor_hours || 0;
    const rate = t.laborRate || t.labor_rate || 0;
    totalLabor += hours * rate;
    totalMaterials += t.materialsBudget || t.materials_budget || 0;
  }

  const total = totalLabor + totalMaterials;

  if (total === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10 dark:shadow-black/30">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2 dark:border-white/10">
        <DollarSign className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Your Budget</h2>
      </div>
      <div className="px-5 py-5">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 dark:text-gray-400">Labor</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(totalLabor)}</p>
          </div>
          <div className="text-center border-x border-gray-100 dark:border-white/10">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 dark:text-gray-400">Materials</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(totalMaterials)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 dark:text-gray-400">Total</p>
            <p className={`text-lg font-bold ${accent.text}`}>{formatCurrency(total)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/*  4. Project Banner (read-only for subs)                                    */
/* ========================================================================= */

const SUB_BANNER_TYPE_CONFIG: Record<string, { bg: string; borderColor: string; textColor: string; Icon: typeof Megaphone }> = {
  info:    { bg: 'bg-blue-50',  borderColor: 'border-blue-600',  textColor: 'text-blue-600',  Icon: Megaphone },
  warning: { bg: 'bg-amber-50', borderColor: 'border-amber-500', textColor: 'text-amber-500', Icon: AlertTriangle },
  urgent:  { bg: 'bg-red-50',   borderColor: 'border-red-500',   textColor: 'text-red-500',   Icon: AlertCircle },
};

function SubProjectBanner({ project }: { project: any }) {
  const bannerMessage: string | null = project?.bannerMessage ?? null;
  const bannerType: string = project?.bannerType ?? 'info';
  const bannerUpdatedAt: string | null = project?.bannerUpdatedAt ?? null;

  if (!bannerMessage) return null;

  const cfg = SUB_BANNER_TYPE_CONFIG[bannerType] || SUB_BANNER_TYPE_CONFIG.info;
  const TypeIcon = cfg.Icon;

  return (
    <div className={`${cfg.bg} border-l-4 ${cfg.borderColor} rounded-r-xl px-4 py-3 shadow-sm dark:shadow-black/30`}>
      <div className="flex items-start gap-3">
        <TypeIcon className={`w-5 h-5 ${cfg.textColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${cfg.textColor}`}>{bannerMessage}</p>
          {bannerUpdatedAt && (
            <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">{formatTime(bannerUpdatedAt)}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/*  5. Project Timeline                                                       */
/* ========================================================================= */

function ProjectTimeline({
  zones,
  trades,
  myZoneIds,
  accent,
}: {
  zones: any[];
  trades: any[];
  /** Zones owned by the current sub — can be multiple. All get highlighted. */
  myZoneIds: string[];
  accent: ReturnType<typeof getZoneAccentClasses>;
}) {
  const myZoneSet = new Set(myZoneIds);
  // Group trades by zone
  const zoneMap = new Map<string, { name: string; trades: any[] }>();

  for (const z of zones) {
    zoneMap.set(z.id, { name: z.name, trades: [] });
  }

  // Unzoned trades go under "General"
  let unzonedTrades: any[] = [];

  for (const t of trades) {
    const zId = t.zoneId || t.zone_id;
    if (zId && zoneMap.has(zId)) {
      zoneMap.get(zId)!.trades.push(t);
    } else {
      unzonedTrades.push(t);
    }
  }

  const entries = [
    ...Array.from(zoneMap.entries()).map(([zId, v]) => ({ id: zId, name: v.name, trades: v.trades })),
    ...(unzonedTrades.length > 0 ? [{ id: '__unzoned', name: 'General', trades: unzonedTrades }] : []),
  ];

  // Don't render if there's only one zone
  if (entries.length <= 1) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10 dark:shadow-black/30">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-white/10">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Project Timeline</h2>
        <p className="text-xs text-gray-400 mt-0.5 dark:text-gray-500">See where your work fits in the overall project</p>
      </div>
      <div className="px-5 py-4 space-y-3">
        {entries.map((entry) => {
          const allZoneTasks = entry.trades.flatMap((t: any) => t.tasks || []);
          const done = allZoneTasks.filter((t: any) => t.done).length;
          const total = allZoneTasks.length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          const isMyZone = myZoneSet.has(entry.id);
          const zoneColor = ZONE_COLORS[entry.name] || DEFAULT_ZONE_COLOR;

          return (
            <div key={entry.id} className={`flex items-center gap-3 ${isMyZone ? 'py-1' : ''}`}>
              <span className={`text-sm w-28 truncate flex-shrink-0 ${isMyZone ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                {entry.name}
              </span>
              <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden dark:bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: zoneColor }}
                />
              </div>
              <span className={`text-xs w-10 text-right flex-shrink-0 ${isMyZone ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
                {pct}%
              </span>
              {isMyZone && (
                <span className="text-xs text-gray-400 flex-shrink-0 dark:text-gray-500">&larr; You</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ========================================================================= */
/*  6. GC Contact Card                                                        */
/* ========================================================================= */

function GCContactCard({ project }: { project: any }) {
  const gcName = project.gcBusinessName || project.gc_business_name;
  if (!gcName) return null;

  const gcPhone = project.gcPhone || project.gc_phone;
  const gcEmail = project.gcEmail || project.gc_email;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10 dark:shadow-black/30">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2 dark:border-white/10">
        <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Your GC</h2>
      </div>
      <div className="px-5 py-4">
        <p className="font-semibold text-gray-900 mb-2 dark:text-white">{gcName}</p>
        <div className="space-y-1.5">
          {gcPhone && (
            <a href={`tel:${gcPhone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 transition-colors dark:text-gray-300">
              <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              {gcPhone}
            </a>
          )}
          {gcEmail && (
            <a href={`mailto:${gcEmail}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 transition-colors dark:text-gray-300">
              <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              {gcEmail}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
