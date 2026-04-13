import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  CheckSquare,
  Square,
  Send,
  MessageSquare,
  ChevronRight,
  Building2,
  Clock,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  planning: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', label: 'Planning' },
  active: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Active' },
  on_hold: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'On Hold' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', label: 'Completed' },
};

const TRADE_STATUS: Record<string, { dot: string; label: string }> = {
  not_started: { dot: 'bg-gray-400', label: 'Not Started' },
  in_progress: { dot: 'bg-blue-500', label: 'In Progress' },
  completed: { dot: 'bg-green-500', label: 'Completed' },
  blocked: { dot: 'bg-red-500', label: 'Blocked' },
};

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

export function SubProjectViewPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const projectQuery = useQuery({
    queryKey: ['gc-project', id],
    queryFn: () => api.getGCProject(id!),
    enabled: !!id,
  });

  const messagesQuery = useQuery({
    queryKey: ['gc-messages', id],
    queryFn: () => api.getGCMessages(id!),
    enabled: !!id,
    refetchInterval: 15000,
  });

  // Get current user id to filter trades
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user?.id ?? null);
    });
  }, []);

  const project = projectQuery.data?.data;
  const allMessages: any[] = messagesQuery.data?.data || [];
  const trades: any[] = project?.trades || [];

  // Filter to only trades assigned to the current user
  const myTrades = trades.filter(
    (t: any) => t.assignedUserId === currentUserId || t.assignedOrgId === currentUserId
  );
  // If no trades matched by user ID, show all trades (the sub may be viewing via invite before assignment is linked)
  const visibleTrades = myTrades.length > 0 ? myTrades : trades;

  const projectStatus = STATUS_CONFIG[project?.status] || STATUS_CONFIG.planning;

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
        <p className="text-gray-500">Project not found or you don't have access.</p>
        <Link to="/dashboard/schedule" className="mt-4 text-brand-600 hover:underline text-sm">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm mb-4">
        <Link to="/dashboard/schedule" className="text-gray-500 hover:text-gray-700 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-gray-900 font-medium truncate max-w-[200px]">{project.name}</span>
      </div>

      {/* Project header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{project.name}</h1>
            {project.gcBusinessName && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
                <Building2 className="w-4 h-4" />
                <span>{project.gcBusinessName}</span>
              </div>
            )}
            {project.address && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
                <MapPin className="w-4 h-4" />
                <span>{project.address}</span>
              </div>
            )}
            {(project.startDate || project.endDate) && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatDate(project.startDate)}
                  {project.endDate ? ` - ${formatDate(project.endDate)}` : ''}
                </span>
              </div>
            )}
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${projectStatus.bg} ${projectStatus.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${projectStatus.dot}`} />
            {projectStatus.label}
          </span>
        </div>
      </div>

      {/* Your Assignment(s) */}
      <div className="space-y-6 mb-8">
        {visibleTrades.map((trade: any) => (
          <TradeAssignment
            key={trade.id}
            trade={trade}
            projectId={id!}
          />
        ))}
      </div>

      {/* Messages */}
      <SubMessageSection
        projectId={id!}
        messages={allMessages}
        myTradeIds={visibleTrades.map((t: any) => t.id)}
      />
    </div>
  );
}

/* ========================================================================= */
/*  Trade Assignment Card                                                     */
/* ========================================================================= */

function TradeAssignment({ trade, projectId }: { trade: any; projectId: string }) {
  const queryClient = useQueryClient();
  const tasks: any[] = trade.tasks || [];
  const doneTasks = tasks.filter((t: any) => t.done).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const statusCfg = TRADE_STATUS[trade.status] || TRADE_STATUS.not_started;

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
                ? {
                    ...t,
                    tasks: t.tasks.map((tk: any) =>
                      tk.id === taskId ? { ...tk, done } : tk
                    ),
                  }
                : t
            ),
          },
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['gc-project', projectId], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] });
    },
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-base font-semibold text-gray-900">
              Your Assignment: {trade.trade}
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
            {(trade.startDate || trade.endDate) && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(trade.startDate)}
                {trade.endDate ? ` - ${formatDate(trade.endDate)}` : ''}
              </span>
            )}
          </div>
        </div>
        {totalTasks > 0 && (
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">{progress}%</p>
            <p className="text-xs text-gray-400">
              {doneTasks}/{totalTasks} tasks
            </p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-brand-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Task list */}
      <div className="px-5 py-4">
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No tasks assigned yet. Check back later.
          </p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task: any) => (
              <li key={task.id} className="flex items-center gap-3 group">
                <button
                  onClick={() => toggleTask.mutate({ taskId: task.id, done: !task.done })}
                  className="flex-shrink-0 text-gray-400 hover:text-brand-600 transition-colors"
                >
                  {task.done ? (
                    <CheckSquare className="w-5 h-5 text-green-500" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
                <span
                  className={`text-sm ${
                    task.done ? 'text-gray-400 line-through' : 'text-gray-700'
                  }`}
                >
                  {task.name}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ========================================================================= */
/*  Message Section (filtered for sub)                                        */
/* ========================================================================= */

function SubMessageSection({
  projectId,
  messages,
  myTradeIds,
}: {
  projectId: string;
  messages: any[];
  myTradeIds: string[];
}) {
  const queryClient = useQueryClient();
  const [msg, setMsg] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Show project-wide messages (no tradeId) + messages for the sub's trades
  const filteredMessages = messages.filter(
    (m: any) => !m.tradeId || myTradeIds.includes(m.tradeId)
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredMessages.length]);

  const sendMessage = useMutation({
    mutationFn: (message: string) => api.sendGCMessage(projectId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-messages', projectId] });
      setMsg('');
    },
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-900">Messages</h2>
        {filteredMessages.length > 0 && (
          <span className="text-xs text-gray-400">({filteredMessages.length})</span>
        )}
      </div>

      <div ref={scrollRef} className="h-64 overflow-y-auto p-4 space-y-3">
        {filteredMessages.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No messages yet. Send a message to the GC below.
          </p>
        ) : (
          filteredMessages.map((m: any) => (
            <div key={m.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {(m.sender?.businessName || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-sm font-medium text-gray-900">
                    {m.sender?.businessName || 'Unknown'}
                  </span>
                  <span className="text-xs text-gray-400">{formatTime(m.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{m.message}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a message to the GC..."
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && msg.trim()) sendMessage.mutate(msg.trim());
            }}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
          <button
            onClick={() => msg.trim() && sendMessage.mutate(msg.trim())}
            disabled={!msg.trim() || sendMessage.isPending}
            className="p-2 text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
