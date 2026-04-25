import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  FileText,
  Clock,
  DollarSign,
  UserPlus,
  UserCheck,
  Hammer,
  StickyNote,
  Activity,
} from 'lucide-react';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';

interface ProjectActivityFeedProps {
  projectId: string;
  limit?: number;
  /** Compact variant without header/border — used inside existing cards */
  compact?: boolean;
}

const EVENT_ICON: Record<string, { icon: any; color: string }> = {
  task_completed:   { icon: CheckCircle2, color: 'green' },
  trade_completed:  { icon: Hammer,        color: 'green' },
  photo_uploaded:   { icon: FileText,      color: 'blue' },
  hours_logged:     { icon: Clock,         color: 'purple' },
  invoice_sent:     { icon: DollarSign,    color: 'indigo' },
  invoice_paid:     { icon: DollarSign,    color: 'green' },
  sub_invited:      { icon: UserPlus,      color: 'amber' },
  sub_accepted:     { icon: UserCheck,     color: 'green' },
  draw_requested:   { icon: DollarSign,    color: 'indigo' },
  note_added:       { icon: StickyNote,    color: 'blue' },
};

function iconBg(color: string) {
  const map: Record<string, string> = {
    green:  'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-300',
    blue:   'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300',
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
    amber:  'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  };
  return map[color] || map.blue;
}

function timeAgo(iso: string) {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dd = Math.floor(h / 24);
  if (dd < 7) return `${dd}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Cap the activity feed to a small number of events by default so it never
// pushes the rest of the page below the fold. Anyone who wants more can pass
// an explicit larger limit; the wrapper still uses max-h + overflow-auto so
// even larger limits don't blow out the layout.
export function ProjectActivityFeed({
  projectId,
  limit = 5,
  compact = false,
}: ProjectActivityFeedProps) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['project-activity', projectId, limit],
    queryFn: () => api.getProjectActivity(projectId, limit),
    enabled: !!projectId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!projectId) return;
    const channel = supabase
      .channel(`project-activity-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_activity',
          filter: `gc_project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project-activity', projectId] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  const events: any[] = useMemo(() => (data?.data || []).slice(0, limit), [data, limit]);

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    compact ? (
      <div className="space-y-2 max-h-72 overflow-y-auto">{children}</div>
    ) : (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-900 dark:text-white">
            <Activity className="w-3.5 h-3.5" />
            Live activity
          </div>
          <div className="flex items-center gap-1 text-[10px] text-green-600 font-semibold dark:text-green-300">
            <span className="relative flex w-1.5 h-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            LIVE
          </div>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">{children}</div>
      </div>
    );

  if (isLoading) {
    return (
      <Wrapper>
        <div className="text-xs text-gray-400 dark:text-gray-500 py-4 text-center">Loading activity...</div>
      </Wrapper>
    );
  }

  if (events.length === 0) {
    return (
      <Wrapper>
        <div className="text-xs text-gray-400 dark:text-gray-500 py-4 text-center">
          No activity yet. As tasks complete and subs engage, updates will land here live.
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      {events.map((e, i) => {
        const meta = EVENT_ICON[e.eventType] || EVENT_ICON.note_added;
        const Icon = meta.icon;
        const isNewest = i === 0;
        return (
          <div
            key={e.id}
            className={`flex items-start gap-2 p-2 rounded-lg transition-colors ${
              isNewest
                ? 'bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20'
                : 'bg-gray-50 dark:bg-white/5'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${iconBg(meta.color)}`}>
              <Icon className="w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
              {e.actorName && (
                <div className="text-xs font-medium text-gray-900 truncate dark:text-white">
                  {e.actorName}
                </div>
              )}
              <div className="text-[11px] text-gray-600 truncate dark:text-gray-300">
                {e.summary}
              </div>
            </div>
            <div className="text-[10px] text-gray-400 whitespace-nowrap dark:text-gray-500">
              {timeAgo(e.createdAt)}
            </div>
          </div>
        );
      })}
    </Wrapper>
  );
}

/** Aggregate feed across all of a GC's projects — for the dashboard index.
 *  Defaults to 3 events; this widget sits above the project grid stats and
 *  must not push them below the fold. */
export function MultiProjectActivityFeed({ limit = 3 }: { limit?: number }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['all-project-activity'],
    queryFn: () => api.getRecentActivityAcrossProjects(limit),
  });

  useEffect(() => {
    const channel = supabase
      .channel('all-project-activity')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'project_activity' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['all-project-activity'] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const events: any[] = (data?.data || []).slice(0, limit);

  if (isLoading) return null;
  if (events.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-900 dark:text-white">
          <Activity className="w-3.5 h-3.5" />
          Live activity across projects
        </div>
        <div className="flex items-center gap-1 text-[10px] text-green-600 font-semibold dark:text-green-300">
          <span className="relative flex w-1.5 h-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </span>
          LIVE
        </div>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {events.map((e, i) => {
          const meta = EVENT_ICON[e.eventType] || EVENT_ICON.note_added;
          const Icon = meta.icon;
          const isNewest = i === 0;
          const projectName = e.project?.name;
          return (
            <div
              key={e.id}
              className={`flex items-start gap-2 p-2 rounded-lg ${
                isNewest
                  ? 'bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20'
                  : 'bg-gray-50 dark:bg-white/5'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${iconBg(meta.color)}`}>
                <Icon className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-900 truncate dark:text-white">
                  {/* Seed data guarantees actorName; the legacy "Someone"
                      fallback read as a bug in the demo. If a real event
                      ever lands here without an actor we'd rather render
                      the project name than a generic placeholder. */}
                  {e.actorName || projectName || 'FlowBoss'}
                  {projectName && (
                    <span className="ml-1 text-[10px] text-gray-400 font-normal dark:text-gray-500">
                      · {projectName}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-gray-600 truncate dark:text-gray-300">
                  {e.summary}
                </div>
              </div>
              <div className="text-[10px] text-gray-400 whitespace-nowrap dark:text-gray-500">
                {timeAgo(e.createdAt)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
