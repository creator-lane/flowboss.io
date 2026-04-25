import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckSquare,
  Mail,
  MessageSquare,
  Package,
  Phone,
  Plus,
  Square,
  Star,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { DemoHint } from '../../demo/DemoHint';
import { RateSubModal } from './RateSubModal';

// Extracted from GCProjectDetailPage as part of the carve-out audit item.
// This bundle ships the entire "slide-in trade detail" feature:
//   - TradeDetailPanel     (thin wrapper that computes derived props)
//   - TradeDetailPanelInner (the actual panel UI with tasks, status, rating)
//   - TradeBudgetEditor    (labor hours × rate + materials budget, inline save)
//   - TradeMaterialsSection (materials list + add-row affordance)
//   - MaterialRow          (single material row with purchased/delete controls)
//
// Constants (TRADE_STATUS, TRADE_STATUSES, TRADE_ACCENT, TRADE_EMOJI,
// MATERIAL_UNITS) are duplicated from the page intentionally — this is now
// the third carve-out (after ProjectBanner, EditGCProjectModal) that needs
// trade-status styling, so a shared `src/components/gc/tradeConstants.ts`
// is the obvious next step. Deferred to keep this diff reviewable.

// -- Local constants (duplicated from GCProjectDetailPage) --------------------

const TRADE_STATUSES = ['not_started', 'in_progress', 'completed', 'blocked'] as const;

const TRADE_STATUS: Record<string, { dot: string; label: string; color: string; lineColor: string }> = {
  not_started: { dot: 'bg-gray-400', label: 'Not Started', color: '#9ca3af', lineColor: '#d1d5db' },
  in_progress: { dot: 'bg-blue-500', label: 'In Progress', color: '#3b82f6', lineColor: '#93c5fd' },
  completed: { dot: 'bg-green-500', label: 'Completed', color: '#22c55e', lineColor: '#86efac' },
  blocked: { dot: 'bg-red-500', label: 'Blocked', color: '#ef4444', lineColor: '#fca5a5' },
};

const TRADE_ACCENT: Record<string, string> = {
  Plumbing: '#3b82f6',
  Electrical: '#eab308',
  HVAC: '#06b6d4',
  Framing: '#f97316',
  Drywall: '#a8a29e',
  Painting: '#a855f7',
  Roofing: '#ef4444',
  Concrete: '#6b7280',
  Flooring: '#f59e0b',
  Landscaping: '#22c55e',
};

const TRADE_EMOJI: Record<string, string> = {
  Plumbing: '\u{1F6BF}',
  Electrical: '\u{26A1}',
  HVAC: '\u{2744}\u{FE0F}',
  Framing: '\u{1F3D7}\u{FE0F}',
  Drywall: '\u{1F9F1}',
  Painting: '\u{1F3A8}',
  Roofing: '\u{1F3E0}',
  Concrete: '\u{1FAA8}',
  Flooring: '\u{1F6AA}',
  Landscaping: '\u{1F333}',
};

const MATERIAL_UNITS = ['ea', 'ft', 'sq ft', 'gal', 'box', 'roll', 'bag'];

// -- Local helpers ------------------------------------------------------------

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

// -- TradeDetailPanel (wrapper) -----------------------------------------------

export function TradeDetailPanel({
  trade,
  projectId,
  messages,
  onClose,
  onBack,
  onInviteSub,
}: {
  trade: any | null;
  projectId: string;
  messages: any[];
  onClose: () => void;
  onBack?: () => void;
  onInviteSub?: (tradeId: string, tradeName: string) => void;
}) {
  const [, setNewTask] = useState('');
  const [, setStatusOpen] = useState(false);

  // Reset state when trade changes
  useEffect(() => {
    setNewTask('');
    setStatusOpen(false);
  }, [trade?.id]);

  if (!trade) return null;

  const tasks: any[] = trade.tasks || [];
  const statusCfg = TRADE_STATUS[trade.status] || TRADE_STATUS.not_started;
  const accent = TRADE_ACCENT[trade.trade] || '#6b7280';
  const emoji = TRADE_EMOJI[trade.trade] || '\u{1F527}';
  const tradeMessages = messages.filter((m: any) => m.tradeId === trade.id);
  // Check for placeholder/invited name in notes
  const placeholderMatch2 = trade.notes?.match(/^Placeholder:\s*(.+?)(?:\s*\(|$)/);
  const placeholderName2 = placeholderMatch2 ? placeholderMatch2[1].trim() : null;
  const invitedMatch2 = trade.notes?.match(/^Invited:\s*(.+)/);
  const invitedEmail2 = invitedMatch2 ? invitedMatch2[1].trim() : null;
  const hasAssignee = !!(trade.assignedUserId || trade.assignedOrgId || trade.assignedBusinessName || placeholderName2 || invitedEmail2);
  const subName = trade.assignedBusinessName || placeholderName2 || (invitedEmail2 ? `Invited: ${invitedEmail2}` : null) || (trade.assignedUserId ? 'Assigned Sub' : null);
  const doneTasks = tasks.filter((t: any) => t.done).length;

  // Build sub identifier for profile link
  const subProfileId = trade.assignedUserId || (placeholderName2 ? encodeURIComponent(placeholderName2) : null);

  return (
    <TradeDetailPanelInner
      trade={trade}
      projectId={projectId}
      tasks={tasks}
      statusCfg={statusCfg}
      accent={accent}
      emoji={emoji}
      tradeMessages={tradeMessages}
      hasAssignee={hasAssignee}
      subName={subName}
      subProfileId={subProfileId}
      doneTasks={doneTasks}
      onClose={onClose}
      onBack={onBack}
      onInviteSub={onInviteSub}
    />
  );
}

// -- TradeDetailPanelInner (the actual panel) ---------------------------------

function TradeDetailPanelInner({
  trade,
  projectId,
  tasks,
  statusCfg,
  accent,
  emoji,
  tradeMessages,
  subName,
  subProfileId,
  doneTasks,
  onClose,
  onBack,
  onInviteSub,
}: {
  trade: any;
  projectId: string;
  tasks: any[];
  statusCfg: { dot: string; label: string; color: string; lineColor: string };
  accent: string;
  emoji: string;
  tradeMessages: any[];
  hasAssignee: boolean;
  subName: string | null;
  subProfileId: string | null;
  doneTasks: number;
  onClose: () => void;
  onBack?: () => void;
  onInviteSub?: (tradeId: string, tradeName: string) => void;
}) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const navigateToSub = useNavigate();
  const [newTask, setNewTask] = useState('');
  const [statusOpen, setStatusOpen] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);

  const canRate = trade.status === 'completed' && !!trade.assignedUserId;
  const ratingQuery = useQuery({
    queryKey: ['trade-rating', trade.assignedUserId],
    queryFn: () => api.getSubPerformance(trade.assignedUserId),
    enabled: !!trade.assignedUserId,
  });
  const subScore = ratingQuery.data?.data?.score;
  const totalRatings = ratingQuery.data?.data?.totalRatings || 0;

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
      addToast('Failed to update task', 'error');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] }),
  });

  const addTask = useMutation({
    mutationFn: (name: string) => api.addGCTask(trade.id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] });
      setNewTask('');
    },
    onError: (err: any) => addToast(err.message || 'Failed to add task', 'error'),
  });

  const updateTradeStatus = useMutation({
    mutationFn: (status: string) => api.updateGCTrade(trade.id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['gc-projects'] });
      addToast('Status updated', 'success');
      setStatusOpen(false);
    },
    onError: (err: any) => addToast(err.message || 'Failed to update status', 'error'),
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40 transition-opacity duration-200 dark:bg-black/60"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto dark:bg-gray-900 dark:border-l dark:border-white/10"
        style={{ animation: 'slideInRight 0.25s ease-out' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b border-gray-100 dark:bg-gray-900 dark:border-white/10">
          {/* Back button row */}
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-4 pt-3 pb-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors dark:text-blue-300"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Zone
            </button>
          )}
          <div className="flex items-center justify-between p-4 pt-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg">{emoji}</span>
              <h2 className="text-lg font-bold text-gray-900 truncate dark:text-white">{trade.trade}</h2>
              {subName && subProfileId && (
                <button
                  onClick={() => navigateToSub(`/dashboard/subs/${subProfileId}`)}
                  className="text-sm text-brand-600 hover:text-brand-700 truncate hidden sm:inline transition-colors hover:underline dark:text-blue-300"
                >
                  - {subName}
                </button>
              )}
              {subName && !subProfileId && (
                <span className="text-sm text-gray-400 truncate hidden sm:inline dark:text-gray-500">- {subName}</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 dark:hover:bg-white/10 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="h-1" style={{ backgroundColor: accent }} />
        </div>

        <div className="p-4 space-y-5">
          {/* Status */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block dark:text-gray-500">Status</label>
            <div className="relative">
              <button
                onClick={() => setStatusOpen(!statusOpen)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors w-full dark:border-white/10 dark:hover:bg-white/10"
              >
                <span className={`w-2.5 h-2.5 rounded-full ${statusCfg.dot}`} />
                <span className="font-medium text-gray-700 dark:text-gray-200">{statusCfg.label}</span>
              </button>
              {statusOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-full dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
                    {TRADE_STATUSES.map((s) => {
                      const c = TRADE_STATUS[s];
                      return (
                        <button
                          key={s}
                          onClick={() => updateTradeStatus.mutate(s)}
                          className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 transition-colors dark:hover:bg-white/10${
                            s === trade.status ? 'font-semibold bg-gray-50' : ''
                          } dark:hover:bg-white/10`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Subcontractor */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block dark:text-gray-500">Subcontractor</label>
            {subName ? (
              <div className="bg-gray-50 rounded-lg p-3 dark:bg-white/[0.02]">
                {subProfileId ? (
                  <button
                    onClick={() => navigateToSub(`/dashboard/subs/${subProfileId}`)}
                    className="font-medium text-brand-600 hover:text-brand-700 text-sm hover:underline transition-colors dark:text-blue-300"
                  >
                    {subName}
                  </button>
                ) : (
                  <p className="font-medium text-gray-900 text-sm dark:text-white">{subName}</p>
                )}
                {trade.assignedEmail && (
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <Mail className="w-3 h-3" /> {trade.assignedEmail}
                  </div>
                )}
                {trade.assignedPhone && (
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    <Phone className="w-3 h-3" /> {trade.assignedPhone}
                  </div>
                )}
                {/* Rating section */}
                {canRate && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-white/10">
                    <button
                      onClick={() => setShowRateModal(true)}
                      className="flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors dark:text-amber-300"
                    >
                      <Star className="w-3.5 h-3.5" />
                      Rate Performance
                    </button>
                    {subScore !== null && subScore !== undefined && totalRatings > 0 && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${s <= Math.round(subScore) ? 'fill-current text-amber-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className={`text-xs font-semibold ${subScore >= 4 ? 'text-green-600' : subScore >= 3 ? 'text-amber-500' : 'text-red-500'}`}>
                          {subScore.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">({totalRatings})</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <DemoHint
                  id="trade-invite-sub"
                  emoji="🤝"
                  title={`Assign a sub-contractor to ${trade.trade}`}
                  body="Click below to invite a sub. They get a free dashboard with their tasks, schedule, and chat — you stay in control of the budget and timeline. No more chasing texts, no more missed deadlines."
                  cta="Sign up free → send real invites"
                />
                <button
                  onClick={() => onInviteSub?.(trade.id, trade.trade)}
                  className="flex items-center gap-2 w-full px-3 py-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-brand-600 font-medium hover:border-brand-300 hover:bg-brand-50/50 transition-all dark:border-white/10 dark:text-blue-300"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite Sub
                </button>
              </div>
            )}
          </div>

          {/* Budget & Labor (Inline Editable) */}
          <TradeBudgetEditor trade={trade} projectId={projectId} />

          {/* Schedule */}
          {(trade.startDate || trade.endDate) && (
            <div className="bg-gray-50 rounded-lg p-3 dark:bg-white/[0.02]">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider dark:text-gray-500">Schedule</label>
              <p className="text-sm font-medium text-gray-700 mt-0.5 dark:text-gray-200">
                {formatDate(trade.startDate)}{trade.startDate && trade.endDate ? ' - ' : ''}{formatDate(trade.endDate)}
              </p>
            </div>
          )}

          {/* Tasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider dark:text-gray-500">
                Tasks ({doneTasks}/{tasks.length})
              </label>
            </div>

            {tasks.length > 0 && (
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3 dark:bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${tasks.length > 0 ? (doneTasks / tasks.length) * 100 : 0}%`,
                    backgroundColor: accent,
                  }}
                />
              </div>
            )}

            <div className="space-y-0.5">
              {tasks.map((task: any) => (
                <label
                  key={task.id}
                  className="flex items-start gap-2.5 py-2 px-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group dark:hover:bg-white/10"
                >
                  <button
                    onClick={() => toggleTask.mutate({ taskId: task.id, done: !task.done })}
                    className="flex-shrink-0 mt-0.5"
                  >
                    {task.done ? (
                      <CheckSquare className="w-[18px] h-[18px] text-brand-500 dark:text-blue-300" />
                    ) : (
                      <Square className="w-[18px] h-[18px] text-gray-300 group-hover:text-gray-400 transition-colors" />
                    )}
                  </button>
                  <span className={`text-sm leading-snug ${task.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {task.name}
                  </span>
                </label>
              ))}
            </div>

            {/* Add task input */}
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                placeholder="Add a task..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTask.trim()) addTask.mutate(newTask.trim());
                }}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              />
              <button
                onClick={() => newTask.trim() && addTask.mutate(newTask.trim())}
                disabled={!newTask.trim() || addTask.isPending}
                className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors disabled:opacity-40 dark:text-blue-300 dark:hover:bg-blue-500/20"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Materials */}
          <TradeMaterialsSection tradeId={trade.id} projectId={projectId} />

          {/* Trade messages */}
          {tradeMessages.length > 0 && (
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1 dark:text-gray-500">
                <MessageSquare className="w-3 h-3" />
                Messages ({tradeMessages.length})
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {tradeMessages.map((m: any) => (
                  <div key={m.id} className="bg-gray-50 rounded-lg p-2.5 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{m.sender?.businessName || 'Unknown'}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatTime(m.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{m.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block dark:text-gray-500">Notes</label>
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-400 italic min-h-[48px] dark:bg-white/[0.02] dark:text-gray-500">
              {trade.notes || 'No notes for this trade.'}
            </div>
          </div>
        </div>
      </div>

      {/* Rate Sub Modal */}
      {canRate && (
        <RateSubModal
          open={showRateModal}
          onClose={() => setShowRateModal(false)}
          tradeId={trade.id}
          projectId={projectId}
          subName={subName || 'Sub'}
          subUserId={trade.assignedUserId}
          tradeName={trade.trade}
        />
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

// -- TradeBudgetEditor --------------------------------------------------------

function TradeBudgetEditor({ trade, projectId }: { trade: any; projectId: string }) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [laborHours, setLaborHours] = useState<string>(String(trade.laborHours || trade.labor_hours || ''));
  const [laborRate, setLaborRate] = useState<string>(String(trade.laborRate || trade.labor_rate || ''));
  const [materialsBudget, setMaterialsBudget] = useState<string>(String(trade.materialsBudget || trade.materials_budget || ''));

  useEffect(() => {
    setLaborHours(String(trade.laborHours || trade.labor_hours || ''));
    setLaborRate(String(trade.laborRate || trade.labor_rate || ''));
    setMaterialsBudget(String(trade.materialsBudget || trade.materials_budget || ''));
  }, [trade.id]);

  const saveBudget = useMutation({
    mutationFn: (updates: any) => api.updateGCTrade(trade.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['gc-projects'] });
    },
    onError: (err: any) => addToast(err.message || 'Failed to save budget', 'error'),
  });

  const hours = parseFloat(laborHours) || 0;
  const rate = parseFloat(laborRate) || 0;
  const matBudget = parseFloat(materialsBudget) || 0;
  const laborCost = hours * rate;
  const tradeTotal = laborCost + matBudget;

  const handleBlur = () => {
    saveBudget.mutate({
      labor_hours: hours,
      labor_rate: rate,
      materials_budget: matBudget,
    });
  };

  return (
    <div>
      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block dark:text-gray-500">
        Budget & Labor
      </label>
      <div className="bg-gray-50 rounded-lg p-3 space-y-2.5 dark:bg-white/[0.02]">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-400 font-medium dark:text-gray-500">Labor Hours</label>
            <input
              type="number"
              value={laborHours}
              onChange={(e) => setLaborHours(e.target.value)}
              onBlur={handleBlur}
              placeholder="0"
              className="w-full mt-0.5 px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:bg-white/5 dark:backdrop-blur-sm"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 font-medium dark:text-gray-500">Rate $/hr</label>
            <input
              type="number"
              value={laborRate}
              onChange={(e) => setLaborRate(e.target.value)}
              onBlur={handleBlur}
              placeholder="0"
              className="w-full mt-0.5 px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:bg-white/5 dark:backdrop-blur-sm"
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400 dark:text-gray-500">Labor Cost</span>
          <span className="font-medium text-gray-700 dark:text-gray-200">{formatCurrency(laborCost)}</span>
        </div>
        <div>
          <label className="text-[10px] text-gray-400 font-medium dark:text-gray-500">Materials Budget</label>
          <input
            type="number"
            value={materialsBudget}
            onChange={(e) => setMaterialsBudget(e.target.value)}
            onBlur={handleBlur}
            placeholder="0"
            className="w-full mt-0.5 px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:bg-white/5 dark:backdrop-blur-sm"
          />
        </div>
        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-gray-200 dark:border-white/10">
          <span className="font-semibold text-gray-600 dark:text-gray-300">Trade Total</span>
          <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(tradeTotal)}</span>
        </div>
      </div>
    </div>
  );
}

// -- TradeMaterialsSection ----------------------------------------------------

function TradeMaterialsSection({ tradeId, projectId }: { tradeId: string; projectId: string }) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newUnit, setNewUnit] = useState('ea');
  const [newCost, setNewCost] = useState('');

  // projectId kept in the signature for future invalidation wiring — intentionally unused.
  void projectId;

  const { data: materialsRes } = useQuery({
    queryKey: ['gc-trade-materials', tradeId],
    queryFn: () => api.getGCTradeMaterials(tradeId),
    enabled: !!tradeId,
  });

  const materials: any[] = materialsRes?.data || [];
  const materialsTotal = materials.reduce((s: number, m: any) => s + (m.total_cost || (m.quantity * m.unit_cost) || 0), 0);

  const addMaterial = useMutation({
    mutationFn: (mat: { name: string; quantity: number; unit: string; unit_cost: number }) =>
      api.addGCTradeMaterial(tradeId, mat),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-trade-materials', tradeId] });
      setNewName('');
      setNewQty('');
      setNewCost('');
    },
    onError: (err: any) => addToast(err.message || 'Failed to add material', 'error'),
  });

  const updateMaterial = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      api.updateGCTradeMaterial(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-trade-materials', tradeId] });
    },
    onError: (err: any) => addToast(err.message || 'Failed to update material', 'error'),
  });

  const deleteMaterial = useMutation({
    mutationFn: (id: string) => api.deleteGCTradeMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-trade-materials', tradeId] });
    },
    onError: (err: any) => addToast(err.message || 'Failed to delete material', 'error'),
  });

  const handleAdd = () => {
    const qty = parseFloat(newQty) || 0;
    const cost = parseFloat(newCost) || 0;
    if (!newName.trim() || qty <= 0) return;
    addMaterial.mutate({ name: newName.trim(), quantity: qty, unit: newUnit, unit_cost: cost });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 dark:text-gray-500">
          <Package className="w-3 h-3" />
          Materials
        </label>
        {materialsTotal > 0 && (
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{formatCurrency(materialsTotal)}</span>
        )}
      </div>

      {/* Material rows */}
      {materials.length > 0 && (
        <div className="space-y-1 mb-2">
          {materials.map((mat: any) => (
            <MaterialRow
              key={mat.id}
              material={mat}
              onTogglePurchased={(purchased) =>
                updateMaterial.mutate({ id: mat.id, updates: { purchased } })
              }
              onDelete={() => deleteMaterial.mutate(mat.id)}
            />
          ))}
        </div>
      )}

      {/* Add material row */}
      <div className="bg-gray-50 rounded-lg p-2.5 space-y-2 dark:bg-white/[0.02]">
        <input
          type="text"
          placeholder="Material name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:bg-white/5 dark:backdrop-blur-sm"
        />
        <div className="flex gap-1.5">
          <input
            type="number"
            placeholder="Qty"
            value={newQty}
            onChange={(e) => setNewQty(e.target.value)}
            className="w-16 px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:bg-white/5 dark:backdrop-blur-sm"
          />
          <select
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            className="px-1.5 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:bg-white/5 dark:backdrop-blur-sm"
          >
            {MATERIAL_UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="$/unit"
            value={newCost}
            onChange={(e) => setNewCost(e.target.value)}
            className="w-20 px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:bg-white/5 dark:backdrop-blur-sm"
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim() || addMaterial.isPending}
            className="px-2 py-1.5 text-xs font-medium text-white bg-brand-500 rounded-md hover:bg-brand-600 transition-colors disabled:opacity-40 flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// -- MaterialRow --------------------------------------------------------------

function MaterialRow({
  material,
  onTogglePurchased,
  onDelete,
}: {
  material: any;
  onTogglePurchased: (purchased: boolean) => void;
  onDelete: () => void;
}) {
  const total = (material.quantity || 0) * (material.unit_cost || 0);
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 group text-xs dark:hover:bg-white/10">
      <button onClick={() => onTogglePurchased(!material.purchased)} className="flex-shrink-0">
        {material.purchased ? (
          <CheckSquare className="w-4 h-4 text-green-500" />
        ) : (
          <Square className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />
        )}
      </button>
      <span className={`flex-1 truncate font-medium ${material.purchased ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
        {material.name}
      </span>
      <span className="text-gray-400 flex-shrink-0 dark:text-gray-500">
        {material.quantity} {material.unit}
      </span>
      <span className="text-gray-400 flex-shrink-0 dark:text-gray-500">@${material.unit_cost}</span>
      <span className="font-semibold text-gray-700 flex-shrink-0 dark:text-gray-200">{formatCurrency(total)}</span>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all flex-shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
