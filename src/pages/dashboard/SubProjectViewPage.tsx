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
  StickyNote,
  Megaphone,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';

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

  // Hero accent: if sub is in just one zone, use that zone's color. If multi-zone,
  // use the first zone's color but the hero makes clear they span several zones.
  const heroZoneName = zoneGroups[0]?.zoneName || 'General';
  const uniqueTrades = Array.from(new Set(visibleTrades.map((t: any) => t.trade))).filter(Boolean);
  const tradeName = uniqueTrades.length > 0 ? uniqueTrades.join(', ') : 'Your Assignment';
  const accent = getZoneAccentClasses(heroZoneName);
  const emoji = ZONE_EMOJI[heroZoneName] || '\u{1F527}';

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

      {/* ── 2. My Tasks — grouped by zone when the sub is in more than one ── */}
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
  const saveNote = useMutation({
    mutationFn: ({ taskId, notes }: { taskId: string; notes: string }) =>
      api.updateTask(taskId, { notes }),
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10 dark:shadow-black/30">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2 dark:border-white/10">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">My Tasks</h2>
        <span className="text-xs text-gray-400 dark:text-gray-500">({trade.trade})</span>
      </div>

      {tasks.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">No tasks assigned yet. Check back later.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-white/10">
          {tasks.map((task: any) => (
            <TaskCard
              key={task.id}
              task={task}
              accent={accent}
              onToggle={(done) => toggleTask.mutate({ taskId: task.id, done })}
              onSaveNote={(notes) => saveNote.mutate({ taskId: task.id, notes })}
            />
          ))}
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
}: {
  task: any;
  accent: ReturnType<typeof getZoneAccentClasses>;
  onToggle: (done: boolean) => void;
  onSaveNote: (notes: string) => void;
}) {
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
            <span className={`text-sm font-medium ${isDone ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
              {task.name}
            </span>
            <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${isDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {isDone ? 'Complete' : 'To Do'}
            </span>
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
