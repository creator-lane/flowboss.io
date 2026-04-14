import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { InviteSubModal } from '../../components/gc/InviteSubModal';
import { RateSubModal } from '../../components/gc/RateSubModal';
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
  Share2,
  LayoutDashboard,
  GanttChart,
  X,
  Phone,
  Mail,
  MessageSquare,
  ChevronRight,
  Trash2,
  Package,
  Pencil,
  ChevronDown,
  ChevronUp,
  Star,
} from 'lucide-react';
import { TimelineBoard } from '../../components/gc/TimelineBoard';
import { ZoneClusterDiagram } from '../../components/gc/ZoneClusterDiagram';
import { OnboardingOverlay } from '../../components/gc/OnboardingOverlay';
import { Tooltip } from '../../components/ui/Tooltip';
import { useToast } from '../../components/ui/Toast';

/* ═══════════════════════════════════════════════════════════════════════════
   Constants & Helpers
   ═══════════════════════════════════════════════════════════════════════════ */

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  planning: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', label: 'Planning' },
  active: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Active' },
  on_hold: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'On Hold' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', label: 'Completed' },
};

const TRADE_STATUS: Record<string, { dot: string; label: string; color: string; lineColor: string }> = {
  not_started: { dot: 'bg-gray-400', label: 'Not Started', color: '#9ca3af', lineColor: '#d1d5db' },
  in_progress: { dot: 'bg-blue-500', label: 'In Progress', color: '#3b82f6', lineColor: '#93c5fd' },
  completed: { dot: 'bg-green-500', label: 'Completed', color: '#22c55e', lineColor: '#86efac' },
  blocked: { dot: 'bg-red-500', label: 'Blocked', color: '#ef4444', lineColor: '#fca5a5' },
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

/* ═══════════════════════════════════════════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════════════════════════════════════════ */

export function GCProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [viewMode, setViewMode] = useState<'visual' | 'board' | 'timeline'>('visual');
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [inviteModalTrade, setInviteModalTrade] = useState<{ id: string; name: string } | null>(null);
  const [showAddTradeVisual, setShowAddTradeVisual] = useState(false);
  const [addTradeValue, setAddTradeValue] = useState('');
  const [showEditProject, setShowEditProject] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const addTradeMutation = useMutation({
    mutationFn: (trade: string) => api.addGCTrade(id!, { trade }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-project', id] });
      queryClient.invalidateQueries({ queryKey: ['gc-projects'] });
      setShowAddTradeVisual(false);
      setAddTradeValue('');
    },
    onError: (err: any) => addToast(err.message || 'Failed to add trade', 'error'),
  });

  const projectQuery = useQuery({
    queryKey: ['gc-project', id],
    queryFn: () => api.getGCProject(id!),
    enabled: !!id,
    refetchInterval: 30000, // Auto-refresh every 30s to pick up sub updates
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
  const zones: any[] = project?.zones || [];

  const totalTasks = trades.reduce((s: number, t: any) => s + (t.tasks?.length || 0), 0);
  const doneTasks = trades.reduce((s: number, t: any) => s + (t.tasks?.filter((tk: any) => tk.done).length || 0), 0);

  // Weighted progress: each trade's completion is weighted by its labor hours (or budget as fallback)
  // A trade with 40 labor hours counts 4x more than one with 10 hours
  const overallProgress = useMemo(() => {
    if (trades.length === 0) return 0;
    let totalWeight = 0;
    let weightedDone = 0;

    for (const trade of trades) {
      const tasks = trade.tasks || [];
      const tradeTotal = tasks.length;
      const tradeDone = tasks.filter((t: any) => t.done).length;
      const tradeProgress = tradeTotal > 0 ? tradeDone / tradeTotal : 0;

      // Weight by labor hours, then budget, then equal weight of 1
      const weight = Number(trade.laborHours || trade.labor_hours) || Number(trade.budget) / 100 || 1;
      totalWeight += weight;
      weightedDone += tradeProgress * weight;
    }

    return totalWeight > 0 ? Math.round((weightedDone / totalWeight) * 100) : 0;
  }, [trades]);

  const selectedTrade = trades.find((t: any) => t.id === selectedTradeId) || null;

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
        <button onClick={() => navigate('/dashboard/projects')} className="mt-4 text-brand-600 hover:underline text-sm">
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-full">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm mb-4">
        <Link to="/dashboard/projects" className="text-gray-500 hover:text-gray-700 transition-colors">
          Projects
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-gray-900 font-medium truncate max-w-[200px]">{project.name}</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <ProjectStatusDropdown projectId={id!} currentStatus={project.status} />
              <button
                onClick={() => setShowEditProject(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
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

        {/* Budget summary bar */}
        <BudgetBar trades={trades} budget={project.budget} />

        {/* View toggle + progress row */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented control */}
          <div className="inline-flex items-center bg-gray-100 rounded-lg p-1" data-tour="view-toggle">
            <button
              onClick={() => setViewMode('visual')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'visual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Share2 className="w-4 h-4" />
              Visual
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'board'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Board
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'timeline'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <GanttChart className="w-4 h-4" />
              Timeline
            </button>
          </div>

          {/* Progress pill */}
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>{doneTasks}/{totalTasks} tasks</span>
            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <span className="font-medium text-gray-700">{overallProgress}%</span>
            <Tooltip text="Weighted completion based on labor hours per trade" />
          </div>
        </div>
      </div>

      {/* ─── Visual View ─── */}
      {viewMode === 'visual' && (
        <div className="relative">
          {zones.length > 0 ? (
            <ZoneClusterDiagram
              project={project}
              trades={trades}
              zones={zones}
              overallProgress={overallProgress}
              selectedZoneId={selectedZoneId}
              onSelectZone={(zoneId) => setSelectedZoneId(zoneId === selectedZoneId ? null : zoneId)}
            />
          ) : (
            <HubSpokeDiagram
              project={project}
              trades={trades}
              overallProgress={overallProgress}
              selectedTradeId={selectedTradeId}
              onSelectTrade={(tradeId) => setSelectedTradeId(tradeId === selectedTradeId ? null : tradeId)}
              onAddTrade={() => setShowAddTradeVisual(true)}
            />
          )}

          {/* Quick Add Trade Popup (Visual View) */}
          {showAddTradeVisual && (
            <div className="absolute top-4 right-4 z-30 bg-white rounded-xl border border-gray-200 shadow-lg p-4 w-64">
              <h3 className="font-medium text-sm text-gray-900 mb-3">Add Trade</h3>
              <select
                value={addTradeValue}
                onChange={(e) => setAddTradeValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white mb-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              >
                <option value="">Select trade...</option>
                {TRADE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAddTradeVisual(false); setAddTradeValue(''); }}
                  className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => addTradeValue && addTradeMutation.mutate(addTradeValue)}
                  disabled={!addTradeValue || addTradeMutation.isPending}
                  className="flex-1 px-3 py-2 text-xs font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-60"
                >
                  {addTradeMutation.isPending ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          )}

          {/* Slide-in detail panel */}
          <TradeDetailPanel
            trade={selectedTrade}
            projectId={id!}
            messages={messages}
            onClose={() => setSelectedTradeId(null)}
            onInviteSub={(tradeId, tradeName) => setInviteModalTrade({ id: tradeId, name: tradeName })}
          />
        </div>
      )}

      {/* ─── Board View (original trade lane board) ─── */}
      {viewMode === 'board' && (
        <div className="mb-8">
          <div className="overflow-x-auto pb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
            <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
              {trades.map((trade: any) => (
                <TradeColumn key={trade.id} trade={trade} projectId={id!} onInviteSub={(tradeId, tradeName) => setInviteModalTrade({ id: tradeId, name: tradeName })} />
              ))}
              <AddTradeColumn projectId={id!} />
            </div>
          </div>
        </div>
      )}

      {/* ─── Timeline View ─── */}
      {viewMode === 'timeline' && (
        <TimelineBoard project={project} trades={trades} projectId={id!} />
      )}

      {/* Messages */}
      <div className="mt-8">
        <MessageSection projectId={id!} messages={messages} />
      </div>

      {/* Invite Sub Modal */}
      <InviteSubModal
        open={!!inviteModalTrade}
        onClose={() => setInviteModalTrade(null)}
        tradeId={inviteModalTrade?.id || ''}
        tradeName={inviteModalTrade?.name || ''}
        projectId={id!}
        projectName={project.name}
      />

      {/* Edit Project Modal */}
      {showEditProject && (
        <EditGCProjectModal
          project={project}
          projectId={id!}
          onClose={() => setShowEditProject(false)}
        />
      )}

      {/* Onboarding */}
      <OnboardingOverlay onDismiss={() => {}} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Budget Bar
   ═══════════════════════════════════════════════════════════════════════════ */

function BudgetBar({ trades, budget }: { trades: any[]; budget?: number }) {
  const totalLabor = trades.reduce((s: number, t: any) => s + ((t.laborHours || t.labor_hours || 0) * (t.laborRate || t.labor_rate || 0)), 0);
  const totalMaterials = trades.reduce((s: number, t: any) => s + (t.materialsBudget || t.materials_budget || 0), 0);
  const tradeBudgets = trades.reduce((s: number, t: any) => s + (t.budget || 0), 0);
  const allocated = totalLabor + totalMaterials || tradeBudgets;
  const projectBudget = budget || allocated;

  if (!projectBudget || projectBudget <= 0) return null;

  const pct = Math.min(100, Math.round((allocated / projectBudget) * 100));
  const margin = projectBudget > 0 && allocated > 0 ? Math.round(((projectBudget - allocated) / projectBudget) * 100) : 0;

  const barColor =
    pct > 100 ? 'bg-red-500' :
    pct >= 80 ? 'bg-amber-500' :
    'bg-green-500';

  return (
    <div className="mt-4 bg-white border border-gray-200 rounded-lg px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm mb-2">
        <span className="flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-500">Budget:</span>
          <span className="font-semibold text-gray-900">{formatCurrency(projectBudget)}</span>
        </span>
        {totalLabor > 0 && (
          <span>
            <span className="text-gray-500">Labor:</span>{' '}
            <span className="font-medium text-gray-700">{formatCurrency(totalLabor)}</span>
          </span>
        )}
        {totalMaterials > 0 && (
          <span>
            <span className="text-gray-500">Materials:</span>{' '}
            <span className="font-medium text-gray-700">{formatCurrency(totalMaterials)}</span>
          </span>
        )}
        {margin > 0 && (
          <span>
            <span className="text-gray-500">Margin:</span>{' '}
            <span className="font-medium text-green-600">{margin}%</span>
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-500 w-12 text-right">{pct}% allocated</span>
        <Tooltip text="Total allocated vs budgeted across all trades" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Hub-Spoke Visual Diagram
   ═══════════════════════════════════════════════════════════════════════════ */

function HubSpokeDiagram({
  project,
  trades,
  overallProgress,
  selectedTradeId,
  onSelectTrade,
  onAddTrade,
}: {
  project: any;
  trades: any[];
  overallProgress: number;
  selectedTradeId: string | null;
  onSelectTrade: (id: string) => void;
  onAddTrade: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Dynamic sizing based on trade count
  const tradeCount = trades.length;
  const minHeight = tradeCount <= 4 ? 500 : tradeCount <= 6 ? 600 : tradeCount <= 8 ? 700 : 800;
  const [dimensions, setDimensions] = useState({ width: 900, height: minHeight });

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const h = tradeCount <= 4 ? 500 : tradeCount <= 6 ? 600 : tradeCount <= 8 ? 700 : 800;
        setDimensions({
          width: Math.max(rect.width, 600),
          height: Math.max(h, Math.min(900, rect.width * 0.7)),
        });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [tradeCount]);

  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;

  // Larger radius for more trades to prevent overlap
  const baseRadius = Math.min(dimensions.width, dimensions.height) * 0.38;
  const radius = tradeCount <= 3 ? baseRadius * 0.7
    : tradeCount <= 5 ? baseRadius * 0.85
    : tradeCount <= 7 ? baseRadius * 0.95
    : baseRadius * 1.05;

  const tradePositions = useMemo(() => {
    if (trades.length === 0) return [];
    const angleStep = (2 * Math.PI) / trades.length;
    return trades.map((trade: any, i: number) => {
      const angle = angleStep * i - Math.PI / 2;
      return {
        trade,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        angle,
      };
    });
  }, [trades, centerX, centerY, radius]);

  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;

  return (
    <div
      ref={containerRef}
      className="relative bg-gradient-to-br from-slate-50 via-white to-gray-50 rounded-2xl border border-gray-200 overflow-hidden"
      style={{ height: dimensions.height }}
    >
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* SVG connecting lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        <defs>
          {tradePositions.map(({ trade }) => {
            const tStatus = TRADE_STATUS[trade.status] || TRADE_STATUS.not_started;
            return (
              <linearGradient
                key={`grad-${trade.id}`}
                id={`line-grad-${trade.id}`}
                x1="0%" y1="0%" x2="100%" y2="0%"
              >
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
                <stop offset="100%" stopColor={tStatus.color} stopOpacity="0.5" />
              </linearGradient>
            );
          })}
        </defs>
        {tradePositions.map(({ trade, x, y }) => {
          const tStatus = TRADE_STATUS[trade.status] || TRADE_STATUS.not_started;
          const isSelected = trade.id === selectedTradeId;
          return (
            <line
              key={`line-${trade.id}`}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke={isSelected ? tStatus.color : `url(#line-grad-${trade.id})`}
              strokeWidth={isSelected ? 3 : 2}
              strokeDasharray={trade.status === 'not_started' ? '6 4' : undefined}
              className="transition-all duration-300"
            />
          );
        })}
      </svg>

      {/* Center Hub Node */}
      <div
        className="absolute z-20"
        style={{ left: centerX, top: centerY, transform: 'translate(-50%, -50%)' }}
      >
        <div className="relative w-36 h-36">
          {/* Outer glow */}
          <div className="absolute -inset-2 rounded-full bg-brand-500/5 blur-md" />
          {/* Progress ring via conic-gradient */}
          <div
            className="absolute inset-0 rounded-full shadow-xl shadow-brand-500/15"
            style={{
              background: `conic-gradient(
                #2563eb ${overallProgress * 3.6}deg,
                #f1f5f9 ${overallProgress * 3.6}deg
              )`,
              padding: '4px',
            }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-white to-gray-50" />
          </div>

          {/* Inner content */}
          <div className="absolute inset-[5px] rounded-full bg-gradient-to-br from-white to-slate-50 flex flex-col items-center justify-center overflow-hidden">
            <span className="text-xs font-bold text-gray-900 text-center leading-tight px-2 max-w-[100px] truncate">
              {project.name}
            </span>
            <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </div>
            <span className="mt-0.5 text-xl font-extrabold bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">{overallProgress}%</span>
          </div>
        </div>
      </div>

      {/* Trade Nodes */}
      {tradePositions.map(({ trade, x, y }) => (
        <TradeNode
          key={trade.id}
          trade={trade}
          x={x}
          y={y}
          isSelected={trade.id === selectedTradeId}
          onSelect={() => onSelectTrade(trade.id)}
        />
      ))}

      {/* Empty state + Add Trade button */}
      {trades.length === 0 && (
        <div className="absolute left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3" style={{ top: centerY + 100 }}>
          <p className="text-gray-400 text-sm">No trades yet</p>
          <button
            onClick={onAddTrade}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Trade
          </button>
        </div>
      )}

      {/* Add Trade button when trades exist */}
      {trades.length > 0 && (
        <button
          onClick={onAddTrade}
          className="absolute z-20 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
          style={{ left: centerX, bottom: 16, transform: 'translateX(-50%)' }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Trade
        </button>
      )}
    </div>
  );
}

/* ─── Trade Node (Card around the hub) ─── */
function TradeNode({
  trade,
  x,
  y,
  isSelected,
  onSelect,
}: {
  trade: any;
  x: number;
  y: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const tasks: any[] = trade.tasks || [];
  const done = tasks.filter((t: any) => t.done).length;
  const total = tasks.length;
  const progress = total > 0 ? (done / total) * 100 : 0;
  const statusCfg = TRADE_STATUS[trade.status] || TRADE_STATUS.not_started;
  const accent = TRADE_ACCENT[trade.trade] || '#6b7280';
  const emoji = TRADE_EMOJI[trade.trade] || '\u{1F527}';
  // Check for placeholder name in notes (format: "Placeholder: Company Name")
  const placeholderMatch = trade.notes?.match(/^Placeholder:\s*(.+?)(?:\s*\(|$)/);
  const placeholderName = placeholderMatch ? placeholderMatch[1].trim() : null;
  const invitedMatch = trade.notes?.match(/^Invited:\s*(.+)/);
  const invitedEmail = invitedMatch ? invitedMatch[1].trim() : null;
  const hasAssignee = !!(trade.assignedUserId || trade.assignedOrgId || trade.assignedBusinessName || placeholderName || invitedEmail);
  const subName = trade.assignedBusinessName || placeholderName || (invitedEmail ? `Invited: ${invitedEmail}` : null) || (trade.assignedUserId ? 'Assigned' : null);

  return (
    <button
      onClick={onSelect}
      className={`absolute z-10 w-[140px] text-left transition-all duration-300 group focus:outline-none ${
        isSelected ? 'scale-110' : 'hover:scale-105'
      }`}
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
    >
      <div
        className={`rounded-2xl overflow-hidden transition-all duration-300 ${
          isSelected
            ? 'shadow-xl shadow-brand-500/20 ring-2 ring-brand-400'
            : 'shadow-md shadow-gray-200/60 group-hover:shadow-lg group-hover:shadow-gray-300/50'
        }`}
        style={{ borderTop: `3px solid ${accent}` }}
      >
        {/* Gradient background */}
        <div className="bg-gradient-to-b from-white to-gray-50/80 p-3">
          {/* Trade emoji large */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: `${accent}15` }}>
              {emoji}
            </div>
            <span className="text-[13px] font-bold text-gray-900 truncate">{trade.trade}</span>
          </div>

          {/* Sub name or unassigned */}
          {subName ? (
            <p className="text-[11px] text-gray-500 truncate mb-1.5 pl-9">{subName}</p>
          ) : (
            <p className="text-[11px] text-red-400 font-semibold mb-1.5 pl-9">⊘ Unassigned</p>
          )}

          {/* Status dot + label */}
          <div className="flex items-center gap-1.5 pl-9">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusCfg.dot}`} />
            <span className="text-[10px] text-gray-400">{statusCfg.label}</span>
          </div>

          {/* Task progress with % */}
          <div className="mt-2 pl-9">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] text-gray-400">{total > 0 ? `${done}/${total}` : 'No tasks'}</span>
              {total > 0 && (
                <span className="text-[10px] font-bold" style={{ color: accent }}>{Math.round(progress)}%</span>
              )}
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${total > 0 ? progress : 0}%`, backgroundColor: accent }}
              />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Trade Detail Slide-in Panel
   ═══════════════════════════════════════════════════════════════════════════ */

function TradeDetailPanel({
  trade,
  projectId,
  messages,
  onClose,
  onInviteSub,
}: {
  trade: any | null;
  projectId: string;
  messages: any[];
  onClose: () => void;
  onInviteSub?: (tradeId: string, tradeName: string) => void;
}) {
  const queryClient = useQueryClient();
  const [newTask, setNewTask] = useState('');
  const [statusOpen, setStatusOpen] = useState(false);

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
      doneTasks={doneTasks}
      onClose={onClose}
      onInviteSub={onInviteSub}
    />
  );
}

function TradeDetailPanelInner({
  trade,
  projectId,
  tasks,
  statusCfg,
  accent,
  emoji,
  tradeMessages,
  subName,
  doneTasks,
  onClose,
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
  doneTasks: number;
  onClose: () => void;
  onInviteSub?: (tradeId: string, tradeName: string) => void;
}) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
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
        className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
        style={{ animation: 'slideInRight 0.25s ease-out' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b border-gray-100">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg">{emoji}</span>
              <h2 className="text-lg font-bold text-gray-900 truncate">{trade.trade}</h2>
              {subName && <span className="text-sm text-gray-400 truncate hidden sm:inline">- {subName}</span>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="h-1" style={{ backgroundColor: accent }} />
        </div>

        <div className="p-4 space-y-5">
          {/* Status */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Status</label>
            <div className="relative">
              <button
                onClick={() => setStatusOpen(!statusOpen)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors w-full"
              >
                <span className={`w-2.5 h-2.5 rounded-full ${statusCfg.dot}`} />
                <span className="font-medium text-gray-700">{statusCfg.label}</span>
              </button>
              {statusOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-full">
                    {TRADE_STATUSES.map((s) => {
                      const c = TRADE_STATUS[s];
                      return (
                        <button
                          key={s}
                          onClick={() => updateTradeStatus.mutate(s)}
                          className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            s === trade.status ? 'font-semibold bg-gray-50' : ''
                          }`}
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
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Subcontractor</label>
            {subName ? (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-900 text-sm">{subName}</p>
                {trade.assignedEmail && (
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                    <Mail className="w-3 h-3" /> {trade.assignedEmail}
                  </div>
                )}
                {trade.assignedPhone && (
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
                    <Phone className="w-3 h-3" /> {trade.assignedPhone}
                  </div>
                )}
                {/* Rating section */}
                {canRate && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => setShowRateModal(true)}
                      className="flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
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
                        <span className="text-[10px] text-gray-400">({totalRatings})</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onInviteSub?.(trade.id, trade.trade)}
                className="flex items-center gap-2 w-full px-3 py-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-brand-600 font-medium hover:border-brand-300 hover:bg-brand-50/50 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Invite Sub
              </button>
            )}
          </div>

          {/* Budget & Labor (Inline Editable) */}
          <TradeBudgetEditor trade={trade} projectId={projectId} />

          {/* Schedule */}
          {(trade.startDate || trade.endDate) && (
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Schedule</label>
              <p className="text-sm font-medium text-gray-700 mt-0.5">
                {formatDate(trade.startDate)}{trade.startDate && trade.endDate ? ' - ' : ''}{formatDate(trade.endDate)}
              </p>
            </div>
          )}

          {/* Tasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Tasks ({doneTasks}/{tasks.length})
              </label>
            </div>

            {tasks.length > 0 && (
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
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
                  className="flex items-start gap-2.5 py-2 px-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group"
                >
                  <button
                    onClick={() => toggleTask.mutate({ taskId: task.id, done: !task.done })}
                    className="flex-shrink-0 mt-0.5"
                  >
                    {task.done ? (
                      <CheckSquare className="w-[18px] h-[18px] text-brand-500" />
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
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
              <button
                onClick={() => newTask.trim() && addTask.mutate(newTask.trim())}
                disabled={!newTask.trim() || addTask.isPending}
                className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors disabled:opacity-40"
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
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                Messages ({tradeMessages.length})
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {tradeMessages.map((m: any) => (
                  <div key={m.id} className="bg-gray-50 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-medium text-gray-700">{m.sender?.businessName || 'Unknown'}</span>
                      <span className="text-[10px] text-gray-400">{formatTime(m.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-600">{m.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Notes</label>
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-400 italic min-h-[48px]">
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

/* ═══════════════════════════════════════════════════════════════════════════
   Trade Budget Editor (Inline)
   ═══════════════════════════════════════════════════════════════════════════ */

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
      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
        Budget & Labor
      </label>
      <div className="bg-gray-50 rounded-lg p-3 space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-400 font-medium">Labor Hours</label>
            <input
              type="number"
              value={laborHours}
              onChange={(e) => setLaborHours(e.target.value)}
              onBlur={handleBlur}
              placeholder="0"
              className="w-full mt-0.5 px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 font-medium">Rate $/hr</label>
            <input
              type="number"
              value={laborRate}
              onChange={(e) => setLaborRate(e.target.value)}
              onBlur={handleBlur}
              placeholder="0"
              className="w-full mt-0.5 px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Labor Cost</span>
          <span className="font-medium text-gray-700">{formatCurrency(laborCost)}</span>
        </div>
        <div>
          <label className="text-[10px] text-gray-400 font-medium">Materials Budget</label>
          <input
            type="number"
            value={materialsBudget}
            onChange={(e) => setMaterialsBudget(e.target.value)}
            onBlur={handleBlur}
            placeholder="0"
            className="w-full mt-0.5 px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
          />
        </div>
        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-gray-200">
          <span className="font-semibold text-gray-600">Trade Total</span>
          <span className="font-bold text-gray-900">{formatCurrency(tradeTotal)}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Trade Materials Section
   ═══════════════════════════════════════════════════════════════════════════ */

function TradeMaterialsSection({ tradeId, projectId }: { tradeId: string; projectId: string }) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newUnit, setNewUnit] = useState('ea');
  const [newCost, setNewCost] = useState('');

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
        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
          <Package className="w-3 h-3" />
          Materials
        </label>
        {materialsTotal > 0 && (
          <span className="text-xs font-semibold text-gray-700">{formatCurrency(materialsTotal)}</span>
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
      <div className="bg-gray-50 rounded-lg p-2.5 space-y-2">
        <input
          type="text"
          placeholder="Material name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
        />
        <div className="flex gap-1.5">
          <input
            type="number"
            placeholder="Qty"
            value={newQty}
            onChange={(e) => setNewQty(e.target.value)}
            className="w-16 px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
          />
          <select
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            className="px-1.5 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
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
            className="w-20 px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
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
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 group text-xs">
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
      <span className="text-gray-400 flex-shrink-0">
        {material.quantity} {material.unit}
      </span>
      <span className="text-gray-400 flex-shrink-0">@${material.unit_cost}</span>
      <span className="font-semibold text-gray-700 flex-shrink-0">{formatCurrency(total)}</span>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all flex-shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Edit GC Project Modal
   ═══════════════════════════════════════════════════════════════════════════ */

function EditGCProjectModal({ project, projectId, onClose }: { project: any; projectId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: project.name || '',
    customerName: project.customerName || project.customer_name || '',
    address: project.address || '',
    city: project.city || '',
    state: project.state || '',
    zip: project.zip || '',
    startDate: project.startDate || project.start_date || '',
    targetEndDate: project.targetEndDate || project.target_end_date || '',
    status: project.status || 'planning',
    budget: project.budget || '',
    overheadPercent: project.overheadPercent || project.overhead_percent || '',
    profitPercent: project.profitPercent || project.profit_percent || '',
  });

  const updateProject = useMutation({
    mutationFn: (updates: any) => api.updateGCProject(projectId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['gc-projects'] });
      addToast('Project updated', 'success');
      onClose();
    },
    onError: (err: any) => addToast(err.message || 'Failed to update project', 'error'),
  });

  const handleSave = () => {
    updateProject.mutate({
      name: form.name,
      customerName: form.customerName,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      startDate: form.startDate || null,
      targetEndDate: form.targetEndDate || null,
      status: form.status,
      budget: form.budget ? parseFloat(String(form.budget)) : null,
      overheadPercent: form.overheadPercent ? parseFloat(String(form.overheadPercent)) : null,
      profitPercent: form.profitPercent ? parseFloat(String(form.profitPercent)) : null,
    });
  };

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Edit Project</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Project Name */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Project Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>

            {/* Customer */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Customer Name</label>
              <input
                type="text"
                value={form.customerName}
                onChange={(e) => set('customerName', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>

            {/* Address */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>

            {/* City / State / Zip */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => set('state', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Zip</label>
                <input
                  type="text"
                  value={form.zip}
                  onChange={(e) => set('zip', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={form.startDate ? form.startDate.slice(0, 10) : ''}
                  onChange={(e) => set('startDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Target End Date</label>
                <input
                  type="date"
                  value={form.targetEndDate ? form.targetEndDate.slice(0, 10) : ''}
                  onChange={(e) => set('targetEndDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
                ))}
              </select>
            </div>

            {/* Budget / Overhead / Profit */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Budget ($)</label>
                <input
                  type="number"
                  value={form.budget}
                  onChange={(e) => set('budget', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Overhead %</label>
                <input
                  type="number"
                  value={form.overheadPercent}
                  onChange={(e) => set('overheadPercent', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Profit %</label>
                <input
                  type="number"
                  value={form.profitPercent}
                  onChange={(e) => set('profitPercent', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 p-5 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!form.name.trim() || updateProject.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-60"
            >
              {updateProject.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Project Status Dropdown (shared)
   ═══════════════════════════════════════════════════════════════════════════ */

function ProjectStatusDropdown({ projectId, currentStatus }: { projectId: string; currentStatus: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const updateStatus = useMutation({
    mutationFn: (status: string) => api.updateGCProject(projectId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['gc-projects'] });
      setOpen(false);
    },
    onError: (err: any) => addToast(err.message || 'Failed to update status', 'error'),
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

/* ═══════════════════════════════════════════════════════════════════════════
   Trade Column (Board View - preserved from original)
   ═══════════════════════════════════════════════════════════════════════════ */

function TradeColumn({ trade, projectId, onInviteSub }: { trade: any; projectId: string; onInviteSub?: (tradeId: string, tradeName: string) => void }) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
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
    <div className={`w-72 flex-shrink-0 bg-white rounded-xl border border-gray-200 border-t-4 ${topColor} shadow-sm flex flex-col`}>
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

        <div className="text-xs text-gray-500 mb-2">
          {trade.assignedUserId || trade.assignedOrgId ? (
            <span className="text-gray-700 font-medium">Assigned</span>
          ) : (
            <button
              onClick={() => onInviteSub?.(trade.id, trade.trade)}
              className="flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium"
            >
              <UserPlus className="w-3 h-3" />
              Invite Sub
            </button>
          )}
        </div>

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

      <div className="flex-1 px-4 pb-2 space-y-1 min-h-[60px]">
        {tasks.map((task: any) => (
          <label key={task.id} className="flex items-start gap-2 py-1 cursor-pointer group">
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

      <div className="px-4 pb-3">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            placeholder="Add task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newTask.trim()) addTask.mutate(newTask.trim());
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

      {/* Materials summary */}
      <BoardMaterialsSummary tradeId={trade.id} />

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

/* ─── Board View Materials Summary ─── */
function BoardMaterialsSummary({ tradeId }: { tradeId: string }) {
  const [expanded, setExpanded] = useState(false);

  const { data: materialsRes } = useQuery({
    queryKey: ['gc-trade-materials', tradeId],
    queryFn: () => api.getGCTradeMaterials(tradeId),
    enabled: !!tradeId,
  });

  const materials: any[] = materialsRes?.data || [];
  if (materials.length === 0) return null;

  const total = materials.reduce((s: number, m: any) => s + (m.total_cost || (m.quantity * m.unit_cost) || 0), 0);

  return (
    <div className="px-4 py-2 border-t border-gray-100">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        <span className="flex items-center gap-1">
          <Package className="w-3 h-3" />
          Materials: {formatCurrency(total)} ({materials.length} item{materials.length !== 1 ? 's' : ''})
        </span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {expanded && (
        <div className="mt-1.5 space-y-0.5">
          {materials.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between text-[11px] text-gray-500 py-0.5">
              <span className={`truncate flex-1 ${m.purchased ? 'line-through text-gray-400' : ''}`}>
                {m.purchased ? '\u2713 ' : ''}{m.name}
              </span>
              <span className="ml-2 flex-shrink-0 font-medium text-gray-600">
                {formatCurrency((m.quantity || 0) * (m.unit_cost || 0))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Add Trade Column (Board View) ─── */
function AddTradeColumn({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
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
    onError: (err: any) => addToast(err.message || 'Failed to add trade', 'error'),
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

/* ═══════════════════════════════════════════════════════════════════════════
   Message Section (shared)
   ═══════════════════════════════════════════════════════════════════════════ */

function MessageSection({ projectId, messages }: { projectId: string; messages: any[] }) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
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
    onError: (err: any) => addToast(err.message || 'Failed to send message', 'error'),
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-900">Project Messages</h2>
        {messages.length > 0 && (
          <span className="text-xs text-gray-400">({messages.length})</span>
        )}
      </div>

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

      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a message..."
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
            className="p-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
