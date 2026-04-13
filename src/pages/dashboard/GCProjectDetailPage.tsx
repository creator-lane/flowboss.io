import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Calendar,
  Plus,
  Send,
  CheckSquare,
  Square,
  UserPlus,
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

const PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'completed'];
const TRADE_STATUSES = ['not_started', 'in_progress', 'completed', 'blocked'];

const TRADE_OPTIONS = [
  'Plumbing', 'Electrical', 'HVAC', 'Framing', 'Drywall',
  'Painting', 'Roofing', 'Concrete', 'Flooring', 'Landscaping',
];

const TRADE_CARD_COLORS: Record<string, string> = {
  Plumbing: 'border-t-blue-500',
  Electrical: 'border-t-yellow-500',
  HVAC: 'border-t-cyan-500',
  Framing: 'border-t-orange-500',
  Drywall: 'border-t-stone-400',
  Painting: 'border-t-purple-500',
  Roofing: 'border-t-red-500',
  Concrete: 'border-t-gray-500',
  Flooring: 'border-t-amber-500',
  Landscaping: 'border-t-green-500',
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

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

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function GCProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  const project = projectQuery.data?.data;
  const messages: any[] = messagesQuery.data?.data || [];
  const trades: any[] = project?.trades || [];

  // Overall progress
  const totalTasks = trades.reduce((s: number, t: any) => s + (t.tasks?.length || 0), 0);
  const doneTasks = trades.reduce((s: number, t: any) => s + (t.tasks?.filter((tk: any) => tk.done).length || 0), 0);
  const overallProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

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
        <p className="text-gray-500">Project not found.</p>
        <button onClick={() => navigate('/dashboard/gc')} className="mt-4 text-brand-600 hover:underline text-sm">
          Back to GC Projects
        </button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;

  return (
    <div className="p-4 lg:p-6 max-w-full">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/gc')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to GC Projects
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <ProjectStatusDropdown projectId={id!} currentStatus={project.status} />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {(project.city || project.state) && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {[project.address, project.city, project.state, project.zip].filter(Boolean).join(', ')}
                </span>
              )}
              {project.budget && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  {formatCurrency(project.budget)}
                </span>
              )}
              {(project.startDate || project.targetEndDate) && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(project.startDate)} {project.startDate && project.targetEndDate ? ' - ' : ''} {formatDate(project.targetEndDate)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Overall progress */}
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Overall Progress</span>
            <span className="text-gray-500">{doneTasks} of {totalTasks} tasks completed ({overallProgress}%)</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Trade Lane Board */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Trade Board</h2>
        <div className="overflow-x-auto pb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
          <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
            {trades.map((trade: any) => (
              <TradeColumn key={trade.id} trade={trade} projectId={id!} />
            ))}
            <AddTradeColumn projectId={id!} />
          </div>
        </div>
      </div>

      {/* Messages */}
      <MessageSection projectId={id!} messages={messages} />
    </div>
  );
}

/* ─── Project Status Dropdown ─── */
function ProjectStatusDropdown({ projectId, currentStatus }: { projectId: string; currentStatus: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: (status: string) => api.updateGCProject(projectId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['gc-projects'] });
      setOpen(false);
    },
  });

  const cfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.planning;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text} hover:opacity-80 transition-opacity`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px]">
            {PROJECT_STATUSES.map((s) => {
              const c = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => updateStatus.mutate(s)}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                    s === currentStatus ? 'font-semibold' : ''
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Trade Column ─── */
function TradeColumn({ trade, projectId }: { trade: any; projectId: string }) {
  const queryClient = useQueryClient();
  const [newTask, setNewTask] = useState('');
  const [statusOpen, setStatusOpen] = useState(false);

  const tasks: any[] = trade.tasks || [];
  const tradeDone = tasks.filter((t: any) => t.done).length;
  const tradeTotal = tasks.length;
  const statusCfg = TRADE_STATUS[trade.status] || TRADE_STATUS.not_started;
  const topColor = TRADE_CARD_COLORS[trade.trade] || 'border-t-gray-400';

  const toggleTask = useMutation({
    mutationFn: ({ taskId, done }: { taskId: string; done: boolean }) => api.toggleGCTask(taskId, done),
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
                ? { ...t, tasks: t.tasks.map((tk: any) => (tk.id === taskId ? { ...tk, done } : tk)) }
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
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] }),
  });

  const addTask = useMutation({
    mutationFn: (name: string) => api.addGCTask(trade.id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] });
      setNewTask('');
    },
  });

  const updateTradeStatus = useMutation({
    mutationFn: (status: string) => api.updateGCTrade(trade.id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['gc-projects'] });
      setStatusOpen(false);
    },
  });

  return (
    <div className={`w-72 flex-shrink-0 bg-white rounded-xl border border-gray-200 border-t-4 ${topColor} shadow-sm flex flex-col`}>
      {/* Trade header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-gray-900 text-sm">{trade.trade}</h3>
          <div className="relative">
            <button
              onClick={() => setStatusOpen(!statusOpen)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </button>
            {statusOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[130px]">
                  {TRADE_STATUSES.map((s) => {
                    const c = TRADE_STATUS[s];
                    return (
                      <button
                        key={s}
                        onClick={() => updateTradeStatus.mutate(s)}
                        className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${
                          s === trade.status ? 'font-semibold' : ''
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Assigned sub */}
        <div className="text-xs text-gray-500 mb-2">
          {trade.assignedUserId || trade.assignedOrgId ? (
            <span className="text-gray-700 font-medium">Assigned</span>
          ) : (
            <button
              onClick={() => alert('Sub invitations coming soon! This feature will let you invite subs by email to collaborate on trades.')}
              className="flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium"
            >
              <UserPlus className="w-3 h-3" />
              Invite Sub
            </button>
          )}
        </div>

        {/* Progress */}
        {tradeTotal > 0 && (
          <div className="mb-1">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>{tradeDone}/{tradeTotal} tasks</span>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all"
                style={{ width: `${tradeTotal > 0 ? (tradeDone / tradeTotal) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tasks */}
      <div className="flex-1 px-4 pb-2 space-y-1 min-h-[60px]">
        {tasks.map((task: any) => (
          <label
            key={task.id}
            className="flex items-start gap-2 py-1 cursor-pointer group"
          >
            <button
              onClick={() => toggleTask.mutate({ taskId: task.id, done: !task.done })}
              className="flex-shrink-0 mt-0.5"
            >
              {task.done ? (
                <CheckSquare className="w-4 h-4 text-brand-500" />
              ) : (
                <Square className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />
              )}
            </button>
            <span className={`text-sm ${task.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
              {task.name}
            </span>
          </label>
        ))}
      </div>

      {/* Add task */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            placeholder="Add task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newTask.trim()) {
                addTask.mutate(newTask.trim());
              }
            }}
            className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
          <button
            onClick={() => newTask.trim() && addTask.mutate(newTask.trim())}
            disabled={!newTask.trim() || addTask.isPending}
            className="px-2 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 space-y-0.5">
        {trade.budget && <div className="font-medium text-gray-600">{formatCurrency(trade.budget)}</div>}
        {(trade.startDate || trade.endDate) && (
          <div>
            {formatDate(trade.startDate)} {trade.startDate && trade.endDate ? ' - ' : ''} {formatDate(trade.endDate)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Add Trade Column ─── */
function AddTradeColumn({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState('');

  const addTrade = useMutation({
    mutationFn: (trade: string) => api.addGCTrade(projectId, { trade }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['gc-projects'] });
      setOpen(false);
      setSelectedTrade('');
    },
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-72 flex-shrink-0 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors min-h-[200px]"
      >
        <Plus className="w-5 h-5" />
        Add Trade
      </button>
    );
  }

  return (
    <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-medium text-sm text-gray-900 mb-3">Add Trade</h3>
      <select
        value={selectedTrade}
        onChange={(e) => setSelectedTrade(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white mb-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
      >
        <option value="">Select trade...</option>
        {TRADE_OPTIONS.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          onClick={() => { setOpen(false); setSelectedTrade(''); }}
          className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => selectedTrade && addTrade.mutate(selectedTrade)}
          disabled={!selectedTrade || addTrade.isPending}
          className="flex-1 px-3 py-2 text-xs font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-60"
        >
          {addTrade.isPending ? 'Adding...' : 'Add'}
        </button>
      </div>
    </div>
  );
}

/* ─── Message Section ─── */
function MessageSection({ projectId, messages }: { projectId: string; messages: any[] }) {
  const queryClient = useQueryClient();
  const [msg, setMsg] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const sendMessage = useMutation({
    mutationFn: (message: string) => api.sendGCMessage(projectId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-messages', projectId] });
      setMsg('');
    },
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Project Messages</h2>
      </div>

      {/* Messages list */}
      <div ref={scrollRef} className="h-64 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No messages yet. Start the conversation below.</p>
        ) : (
          messages.map((m: any) => (
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

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && msg.trim()) {
                sendMessage.mutate(msg.trim());
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
          <button
            onClick={() => msg.trim() && sendMessage.mutate(msg.trim())}
            disabled={!msg.trim() || sendMessage.isPending}
            className="p-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

