import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import {
  User,
  Building2,
  Phone,
  Mail,
  Wrench,
  Save,
  CreditCard,
  CheckCircle,
  ExternalLink,
  LogOut,
  Trash2,
  Loader2,
  BookOpen,
  Link2,
  Unplug,
  Users,
  Bell,
  Shield,
  Clock,
  Calendar,
  Star,
  MapPin,
  DollarSign,
} from 'lucide-react';
import { PricebookManager } from '../../components/settings/PricebookManager';
import { TeamManager } from '../../components/settings/TeamManager';
import { useToast } from '../../components/ui/Toast';

const TRADE_OPTIONS = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'general_contractor', label: 'General Contractor' },
];

const TABS = [
  { key: 'profile', label: 'Profile', icon: Building2 },
  { key: 'pricebook', label: 'Pricebook', icon: BookOpen },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'integrations', label: 'Integrations', icon: Link2 },
  { key: 'team', label: 'Team', icon: Users },
] as const;

type TabKey = (typeof TABS)[number]['key'];

function SkeletonField() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-3 bg-neutral-200 rounded w-24" />
      <div className="h-10 bg-neutral-100 rounded-lg w-full dark:bg-white/10" />
    </div>
  );
}

const SUB_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  trialing: { label: 'Free Trial', color: 'bg-blue-100 text-blue-700' },
  past_due: { label: 'Past Due', color: 'bg-red-100 text-red-700' },
  canceled: { label: 'Canceled', color: 'bg-gray-100 text-gray-600' },
  none: { label: 'No Subscription', color: 'bg-gray-100 text-gray-600' },
};

function SubscriptionCard() {
  const { session } = useAuth();
  const { addToast } = useToast();
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: () => api.getSettings() });
  const [portalUrl, setPortalUrl] = useState('');
  const [loadingPortal, setLoadingPortal] = useState(false);

  const subStatus = settings?.data?.subscription_status || 'none';
  const subPlan = settings?.data?.subscription_plan;
  const periodEnd = settings?.data?.subscription_current_period_end;
  const trialEnd = settings?.data?.trial_end;
  const statusCfg = SUB_STATUS_LABELS[subStatus] || SUB_STATUS_LABELS.none;

  const handleManageBilling = async () => {
    if (!session) return;
    setLoadingPortal(true);
    try {
      const resp = await fetch(
        'https://besbtasjpqmfqjkudmgu.supabase.co/functions/v1/create-billing-portal',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const body = await resp.json().catch(() => ({}));
      if (resp.ok && body.url) {
        // Open the Stripe portal in a new tab directly instead of going
        // through the intermediate "Open Billing Portal" button — one less
        // click for the user, matches how most SaaS do it.
        window.open(body.url, '_blank', 'noopener,noreferrer');
        setPortalUrl(body.url); // also keep the button around as a fallback
      } else {
        // Surface the real error instead of silently failing — previously
        // a bad response here just disabled the button with no feedback.
        addToast(body.error || 'Could not open billing portal. Try again?', 'error');
      }
    } catch (err: any) {
      addToast(err?.message || 'Network error opening billing portal', 'error');
    }
    setLoadingPortal(false);
  };

  if (subStatus === 'none') {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-5 h-5 text-brand-500 dark:text-blue-300" />
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Subscription</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-4 dark:text-gray-400">
          You're using FlowBoss via your mobile subscription. Web billing is available for new subscribers.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-brand-500 dark:text-blue-300" />
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Subscription</h2>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
          {statusCfg.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        {subPlan && (
          <div>
            <p className="text-neutral-400 text-xs dark:text-gray-500">Plan</p>
            <p className="font-medium text-neutral-900 capitalize dark:text-white">{subPlan}</p>
          </div>
        )}
        {periodEnd && (
          <div>
            <p className="text-neutral-400 text-xs dark:text-gray-500">Next billing</p>
            <p className="font-medium text-neutral-900 dark:text-white">{new Date(periodEnd).toLocaleDateString()}</p>
          </div>
        )}
        {trialEnd && subStatus === 'trialing' && (
          <div>
            <p className="text-neutral-400 text-xs dark:text-gray-500">Trial ends</p>
            <p className="font-medium text-neutral-900 dark:text-white">{new Date(trialEnd).toLocaleDateString()}</p>
          </div>
        )}
      </div>

      {portalUrl ? (
        <div className="space-y-2">
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open Billing Portal
          </a>
          <p className="text-xs text-neutral-400 dark:text-gray-500">Manage payment method, change plan, or cancel</p>
        </div>
      ) : (
        <button
          onClick={handleManageBilling}
          disabled={loadingPortal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 dark:bg-white/10 dark:text-gray-200"
        >
          {loadingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          Manage Billing
        </button>
      )}
    </div>
  );
}

function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const pct = (score / 5) * 100;
  const color = score >= 4.0 ? '#22c55e' : score >= 3.0 ? '#f59e0b' : '#ef4444';
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-neutral-900 dark:text-white">{score.toFixed(1)}</span>
        <span className="text-[10px] text-neutral-400 -mt-0.5 dark:text-gray-500">/ 5.0</span>
      </div>
    </div>
  );
}

function DimensionBar({ label, value, weight }: { label: string; value: number; weight: string }) {
  const pct = (value / 5) * 100;
  const barColor = value >= 4.0 ? 'bg-brand-500' : value >= 3.0 ? 'bg-amber-400' : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-neutral-700 dark:text-gray-200">{label}</span>
        <span className="text-neutral-400 text-xs dark:text-gray-500">{weight}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2.5 bg-neutral-100 rounded-full overflow-hidden dark:bg-white/10">
          <div
            className={`h-full rounded-full ${barColor} transition-all duration-700`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-neutral-900 w-8 text-right dark:text-white">
          {value.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

function FlowBossScoreCard() {
  const { user } = useAuth();

  const { data: perfData, isLoading } = useQuery({
    queryKey: ['sub-performance', user?.id],
    queryFn: () => api.getSubPerformance(user!.id),
    enabled: !!user?.id,
  });

  const score = perfData?.data?.score ?? null;
  const breakdown = perfData?.data?.breakdown;
  const totalRatings = perfData?.data?.totalRatings ?? 0;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-5 h-5 text-brand-500 dark:text-blue-300" />
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Your FlowBoss Score</h2>
        </div>
        <div className="animate-pulse flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-neutral-100 dark:bg-white/10" />
          <div className="flex-1 space-y-3">
            <div className="h-3 bg-neutral-100 rounded w-3/4 dark:bg-white/10" />
            <div className="h-3 bg-neutral-100 rounded w-1/2 dark:bg-white/10" />
            <div className="h-3 bg-neutral-100 rounded w-2/3 dark:bg-white/10" />
            <div className="h-3 bg-neutral-100 rounded w-1/2 dark:bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  // Empty state: no ratings yet
  if (score === null || totalRatings === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-brand-500 dark:text-blue-300" />
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Your FlowBoss Score</h2>
        </div>
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mb-4 dark:bg-blue-500/10">
            <Shield className="w-8 h-8 text-brand-300" />
          </div>
          <p className="text-sm text-neutral-500 max-w-sm dark:text-gray-400">
            Your FlowBoss Score builds as GCs rate your work on projects. Complete trades to start building your reputation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
      <div className="flex items-center gap-2 mb-5">
        <Shield className="w-5 h-5 text-brand-500 dark:text-blue-300" />
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Your FlowBoss Score</h2>
      </div>

      <div className="flex items-start gap-8">
        {/* Score ring */}
        <div className="flex-shrink-0">
          <ScoreRing score={score} />
        </div>

        {/* Dimension bars */}
        <div className="flex-1 space-y-3">
          {breakdown && (
            <>
              <DimensionBar label="Quality" value={breakdown.quality} weight="35%" />
              <DimensionBar label="Timeliness" value={breakdown.timeliness} weight="25%" />
              <DimensionBar label="Budget Adherence" value={breakdown.budgetAdherence} weight="25%" />
              <DimensionBar label="Communication" value={breakdown.communication} weight="15%" />
            </>
          )}
        </div>
      </div>

      <p className="text-xs text-neutral-400 mt-4 dark:text-gray-500">
        Based on {totalRatings} rating{totalRatings !== 1 ? 's' : ''} from GC projects
      </p>
    </div>
  );
}

const TRADE_COLORS: Record<string, string> = {
  Plumbing: 'bg-blue-100 text-blue-700',
  Electrical: 'bg-yellow-100 text-yellow-700',
  HVAC: 'bg-cyan-100 text-cyan-700',
  Framing: 'bg-orange-100 text-orange-700',
  Drywall: 'bg-stone-100 text-stone-700',
  Painting: 'bg-purple-100 text-purple-700',
  Roofing: 'bg-red-100 text-red-700',
  Concrete: 'bg-gray-200 text-gray-700',
  Flooring: 'bg-amber-100 text-amber-700',
  Landscaping: 'bg-green-100 text-green-700',
  Tiling: 'bg-teal-100 text-teal-700',
  Insulation: 'bg-pink-100 text-pink-700',
};

const STATUS_DOT: Record<string, string> = {
  not_started: 'bg-gray-400',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  blocked: 'bg-red-500',
};

const STATUS_LABEL: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  blocked: 'Blocked',
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

function ProjectHistoryCard() {
  const { user } = useAuth();

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['invited-projects'],
    queryFn: () => api.getInvitedProjects(),
    enabled: !!user?.id,
  });

  const projects: any[] = projectsData?.data || [];

  // Build history entries: for each project, find trades assigned to current user
  const history = useMemo(() => {
    if (!user?.id) return [];

    return projects
      .map((project) => {
        const myTrades = (project.trades || []).filter(
          (t: any) => t.assignedUserId === user.id
        );
        if (myTrades.length === 0) return null;

        return { project, trades: myTrades };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        const dateA = a.project.createdAt || '';
        const dateB = b.project.createdAt || '';
        return dateB.localeCompare(dateA);
      }) as { project: any; trades: any[] }[];
  }, [projects, user?.id]);

  // Stats
  const stats = useMemo(() => {
    let totalEarnings = 0;
    let completedTrades = 0;

    for (const entry of history) {
      for (const trade of entry.trades) {
        const hours = trade.laborHours || 0;
        const rate = trade.laborRate || 0;
        totalEarnings += hours * rate;
        if (trade.status === 'completed') completedTrades++;
      }
    }

    return { totalEarnings, completedTrades, projectCount: history.length };
  }, [history]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
        <div className="flex items-center gap-2 mb-5">
          <Clock className="w-5 h-5 text-brand-500 dark:text-blue-300" />
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Your Project History</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-3 bg-neutral-100 rounded w-3/4 dark:bg-white/10" />
          <div className="h-3 bg-neutral-100 rounded w-1/2 dark:bg-white/10" />
          <div className="h-3 bg-neutral-100 rounded w-2/3 dark:bg-white/10" />
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-brand-500 dark:text-blue-300" />
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Your Project History</h2>
        </div>
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mb-4 dark:bg-blue-500/10">
            <Clock className="w-8 h-8 text-brand-300" />
          </div>
          <p className="text-sm text-neutral-500 max-w-sm dark:text-gray-400">
            Your project history will appear here as GCs assign you trades on their projects.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-5 h-5 text-brand-500 dark:text-blue-300" />
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Your Project History</h2>
      </div>

      {/* Summary stats */}
      <div className="flex items-center gap-5 text-xs text-neutral-400 mb-5 dark:text-gray-500">
        <span>{stats.projectCount} project{stats.projectCount !== 1 ? 's' : ''}</span>
        <span>{stats.completedTrades} trade{stats.completedTrades !== 1 ? 's' : ''} completed</span>
        {stats.totalEarnings > 0 && (
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {formatCurrency(stats.totalEarnings)} earned
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-neutral-200" />

        <div className="space-y-0">
          {history.map((entry) => {
            const { project, trades: myTrades } = entry;
            const createdAt = project.createdAt || project.created_at;
            const startDate = createdAt
              ? new Date(createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : '';
            const allCompleted = myTrades.every((t: any) => t.status === 'completed');
            const anyInProgress = myTrades.some((t: any) => t.status === 'in_progress');

            return (
              <div key={project.id} className="relative pl-10 pb-5 last:pb-0">
                {/* Timeline dot */}
                <div className={`absolute left-[10px] top-1.5 w-[11px] h-[11px] rounded-full border-2 ${
                  allCompleted
                    ? 'bg-green-500 border-green-500'
                    : anyInProgress
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white border-neutral-300'
                }`} />

                <Link
                  to={`/dashboard/projects/assigned/${project.id}`}
                  className="block p-3 rounded-xl border border-neutral-100 hover:border-neutral-300 hover:shadow-sm transition-all group dark:border-white/10"
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <p className="text-sm font-semibold text-neutral-900 group-hover:text-brand-600 transition-colors truncate dark:text-white">
                      {project.name}
                    </p>
                    {startDate && (
                      <span className="text-[11px] text-neutral-400 whitespace-nowrap flex items-center gap-1 dark:text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {startDate}
                      </span>
                    )}
                  </div>

                  {project.gcCompanyName && (
                    <p className="text-xs text-neutral-400 mb-1.5 dark:text-gray-500">{project.gcCompanyName}</p>
                  )}

                  {/* Trades */}
                  <div className="flex flex-wrap gap-2">
                    {myTrades.map((trade: any) => (
                      <div key={trade.id} className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${TRADE_COLORS[trade.trade] || 'bg-neutral-100 text-neutral-600'}`}>
                          {trade.trade}
                        </span>
                        <span className="flex items-center gap-0.5 text-[11px] text-neutral-400 dark:text-gray-500">
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[trade.status] || 'bg-neutral-400'}`} />
                          {STATUS_LABEL[trade.status] || 'Not Started'}
                        </span>
                      </div>
                    ))}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  // Settings query
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
  });

  // Stripe status query
  const { data: stripeData, isLoading: stripeLoading } = useQuery({
    queryKey: ['stripe-status'],
    queryFn: () => api.checkStripeConnectStatus(),
  });

  const profile = settingsData?.data;

  // Form state
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [trade, setTrade] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState('');

  // Derive displayed values: local state overrides server data
  const displayName = businessName ?? profile?.business_name ?? profile?.company_name ?? '';
  const displayPhone = phone ?? profile?.phone ?? '';
  const displayEmail = email ?? profile?.email ?? user?.email ?? '';
  const displayTrade = trade ?? profile?.trade ?? '';

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (updates: any) => api.updateSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      addToast('Settings saved', 'success');
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to save settings', 'error');
      setSaveMessage('Failed to save. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      business_name: displayName,
      phone: displayPhone,
      email: displayEmail,
      trade: displayTrade,
    });
  };

  // Stripe connect
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [stripeConnectUrl, setStripeConnectUrl] = useState('');
  const [stripeConnectError, setStripeConnectError] = useState('');

  const handleConnectStripe = async () => {
    setConnectingStripe(true);
    setStripeConnectError('');
    try {
      const result = await api.getStripeConnectUrl();
      if (result.url) {
        setStripeConnectUrl(result.url);
      } else {
        setStripeConnectError('Could not generate Stripe connect URL');
      }
    } catch {
      setStripeConnectError('Failed to get Stripe connect URL. Please try again.');
    } finally {
      setConnectingStripe(false);
    }
  };

  const stripeConnected = stripeData?.connected ?? false;
  const stripeAccountId = stripeData?.accountId ?? null;
  const maskedAccountId = stripeAccountId
    ? `${stripeAccountId.slice(0, 8)}${'*'.repeat(Math.max(0, stripeAccountId.length - 12))}${stripeAccountId.slice(-4)}`
    : null;

  // QuickBooks
  const { data: qbData, isLoading: qbLoading } = useQuery({
    queryKey: ['qb-status'],
    queryFn: () => api.quickbooks.getStatus(),
  });

  const qbConnected = qbData?.connected ?? false;

  const [connectingQB, setConnectingQB] = useState(false);
  const [qbAuthUrl, setQbAuthUrl] = useState('');
  const [qbError, setQbError] = useState('');

  // Digest preferences
  const [digestFrequency, setDigestFrequency] = useState<string | null>(null);
  const [digestEmail, setDigestEmail] = useState<string | null>(null);
  const [digestSaveMsg, setDigestSaveMsg] = useState('');

  const displayDigestFrequency = digestFrequency ?? profile?.digest_frequency ?? profile?.digestFrequency ?? 'none';
  const displayDigestEmail = digestEmail ?? profile?.digest_email ?? profile?.digestEmail ?? user?.email ?? '';

  const digestMutation = useMutation({
    mutationFn: () => api.updateDigestPreferences(displayDigestFrequency, displayDigestEmail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setDigestSaveMsg('Preferences saved!');
      setTimeout(() => setDigestSaveMsg(''), 3000);
    },
    onError: () => {
      setDigestSaveMsg('Failed to save. Please try again.');
      setTimeout(() => setDigestSaveMsg(''), 3000);
    },
  });

  const [syncInvoices, setSyncInvoices] = useState<boolean | null>(null);
  const [syncCustomers, setSyncCustomers] = useState<boolean | null>(null);
  const [syncExpenses, setSyncExpenses] = useState<boolean | null>(null);
  const [invoicingProvider, setInvoicingProvider] = useState<'stripe' | 'quickbooks' | null>(null);
  const [qbSaveMessage, setQbSaveMessage] = useState('');
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  // Derive QB prefs from server data or local overrides
  const displaySyncInvoices = syncInvoices ?? qbData?.preferences?.syncInvoices ?? true;
  const displaySyncCustomers = syncCustomers ?? qbData?.preferences?.syncCustomers ?? true;
  const displaySyncExpenses = syncExpenses ?? qbData?.preferences?.syncExpenses ?? true;
  const displayInvoicingProvider = invoicingProvider ?? qbData?.preferences?.invoicingProvider ?? 'stripe';

  const handleConnectQB = async () => {
    setConnectingQB(true);
    setQbError('');
    try {
      const url = await api.quickbooks.getAuthUrl();
      if (url) {
        setQbAuthUrl(url);
      } else {
        setQbError('Could not generate QuickBooks connect URL');
      }
    } catch {
      setQbError('Failed to get QuickBooks connect URL. Please try again.');
    } finally {
      setConnectingQB(false);
    }
  };

  const qbPrefsMutation = useMutation({
    mutationFn: (prefs: Parameters<typeof api.quickbooks.setPreferences>[0]) =>
      api.quickbooks.setPreferences(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qb-status'] });
      setQbSaveMessage('Preferences saved!');
      setTimeout(() => setQbSaveMessage(''), 3000);
    },
    onError: () => {
      setQbSaveMessage('Failed to save. Please try again.');
      setTimeout(() => setQbSaveMessage(''), 3000);
    },
  });

  const qbDisconnectMutation = useMutation({
    mutationFn: () => api.quickbooks.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qb-status'] });
      setConfirmDisconnect(false);
      setQbAuthUrl('');
    },
  });

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6 dark:text-white">Settings</h1>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 mb-6 dark:border-white/10">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${
                isActive
                  ? 'border-brand-500 text-brand-600 font-semibold dark:border-blue-400 dark:text-blue-300'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 font-medium dark:text-gray-500 dark:hover:text-gray-200 dark:hover:border-white/20'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <>
          {/* Business Profile */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
            <div className="flex items-center gap-2 mb-5">
              <Building2 className="w-5 h-5 text-brand-500 dark:text-blue-300" />
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Business Profile</h2>
            </div>

            {settingsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <SkeletonField />
                <SkeletonField />
                <SkeletonField />
                <SkeletonField />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Business Name */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-600 mb-1.5 dark:text-gray-300">
                      Business Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-gray-500" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Your business name"
                        className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-600 mb-1.5 dark:text-gray-300">
                      Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-gray-500" />
                      <input
                        type="tel"
                        value={displayPhone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-600 mb-1.5 dark:text-gray-300">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-gray-500" />
                      <input
                        type="email"
                        value={displayEmail}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                      />
                    </div>
                  </div>

                  {/* Trade */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-600 mb-1.5 dark:text-gray-300">
                      Trade
                    </label>
                    <div className="relative">
                      <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-gray-500" />
                      <select
                        value={displayTrade}
                        onChange={(e) => setTrade(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition appearance-none bg-white dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:bg-white/5 dark:backdrop-blur-sm"
                      >
                        <option value="">Select trade</option>
                        {TRADE_OPTIONS.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Save */}
                <div className="mt-5 flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50 transition text-sm"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Changes
                  </button>
                  {saveMessage && (
                    <span
                      className={`text-sm font-medium ${
                        saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {saveMessage}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* FlowBoss Score */}
          <FlowBossScoreCard />

          {/* Project History */}
          <ProjectHistoryCard />

          {/* Account */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-brand-500 dark:text-blue-300" />
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Account</h2>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {(user?.email?.[0] ?? '?').toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">{user?.email ?? 'Not signed in'}</p>
                <p className="text-xs text-neutral-400 dark:text-gray-500">Signed in</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={signOut}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition text-sm dark:text-red-300"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
              <a
                href="/delete-account"
                className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-600 font-semibold rounded-lg hover:bg-neutral-50 transition text-sm dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </a>
            </div>
          </div>

          {/* Notifications / Email Digests */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-brand-500 dark:text-blue-300" />
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Email Digests</h2>
            </div>
            <p className="text-sm text-neutral-500 mb-5 dark:text-gray-400">
              Get a summary of your projects, jobs, and financials delivered to your inbox.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-neutral-600 mb-1.5 dark:text-gray-300">Frequency</label>
                <select
                  value={displayDigestFrequency}
                  onChange={(e) => setDigestFrequency(e.target.value)}
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white appearance-none dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:bg-white/5 dark:backdrop-blur-sm"
                >
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-600 mb-1.5 dark:text-gray-300">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-gray-500" />
                  <input
                    type="email"
                    value={displayDigestEmail}
                    onChange={(e) => setDigestEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={() => digestMutation.mutate()}
                disabled={digestMutation.isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50 transition text-sm"
              >
                {digestMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Preferences
              </button>
              {digestSaveMsg && (
                <span
                  className={`text-sm font-medium ${
                    digestSaveMsg.includes('saved') ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {digestSaveMsg}
                </span>
              )}
            </div>
          </div>
        </>
      )}

      {/* Pricebook Tab */}
      {activeTab === 'pricebook' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
          <div className="flex items-center gap-2 mb-5">
            <BookOpen className="w-5 h-5 text-brand-500 dark:text-blue-300" />
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Pricebook</h2>
          </div>
          <PricebookManager />
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <>
        {/* Subscription Management */}
        <SubscriptionCard />

        <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-brand-500 dark:text-blue-300" />
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Payment Processing</h2>
          </div>
          <p className="text-sm text-neutral-500 mb-4 dark:text-gray-400">
            Connect your Stripe account to accept payments via payment links.
          </p>

          {stripeLoading ? (
            <div className="animate-pulse">
              <div className="h-10 bg-neutral-100 rounded-lg w-48 dark:bg-white/10" />
            </div>
          ) : stripeConnected ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold dark:bg-green-500/20 dark:text-green-300">
                <CheckCircle className="w-4 h-4" />
                Connected
              </span>
              {maskedAccountId && (
                <span className="text-sm text-neutral-400 font-mono dark:text-gray-500">{maskedAccountId}</span>
              )}
            </div>
          ) : stripeConnectUrl ? (
            <div className="space-y-3">
              <p className="text-sm text-neutral-600 dark:text-gray-300">
                You'll be redirected to Stripe to complete setup.
              </p>
              <a
                href={stripeConnectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 transition text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Continue to Stripe
              </a>
              <p className="text-xs text-neutral-400 truncate max-w-md dark:text-gray-500" title={stripeConnectUrl}>
                {stripeConnectUrl}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleConnectStripe}
                disabled={connectingStripe}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50 transition text-sm"
              >
                {connectingStripe ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                Connect Stripe
              </button>
              {stripeConnectError && (
                <p className="text-sm text-red-600 dark:text-red-300">{stripeConnectError}</p>
              )}
            </div>
          )}
        </div>
        </>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-5 h-5 text-brand-500 dark:text-blue-300" />
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">QuickBooks Online</h2>
          </div>
          <p className="text-sm text-neutral-500 mb-5 dark:text-gray-400">
            Sync your invoices, customers, and expenses with QuickBooks Online.
          </p>

          {qbLoading ? (
            <div className="animate-pulse">
              <div className="h-10 bg-neutral-100 rounded-lg w-48 dark:bg-white/10" />
            </div>
          ) : qbConnected ? (
            <div className="space-y-6">
              {/* Connected badge */}
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold dark:bg-green-500/20 dark:text-green-300">
                  <CheckCircle className="w-4 h-4" />
                  Connected
                </span>
              </div>

              {/* Sync preferences */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-gray-200">Sync Preferences</h3>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={displaySyncInvoices}
                    onChange={(e) => setSyncInvoices(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-500 dark:border-white/10 dark:text-blue-300 dark:focus:ring-blue-400"
                  />
                  <span className="text-sm text-neutral-700 dark:text-gray-200">Sync Invoices</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={displaySyncCustomers}
                    onChange={(e) => setSyncCustomers(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-500 dark:border-white/10 dark:text-blue-300 dark:focus:ring-blue-400"
                  />
                  <span className="text-sm text-neutral-700 dark:text-gray-200">Sync Customers</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={displaySyncExpenses}
                    onChange={(e) => setSyncExpenses(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-500 dark:border-white/10 dark:text-blue-300 dark:focus:ring-blue-400"
                  />
                  <span className="text-sm text-neutral-700 dark:text-gray-200">Sync Expenses</span>
                </label>

                {/* Invoicing provider */}
                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-neutral-700 mb-2 dark:text-gray-200">Invoicing Provider</h3>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="invoicingProvider"
                        value="stripe"
                        checked={displayInvoicingProvider === 'stripe'}
                        onChange={() => setInvoicingProvider('stripe')}
                        className="w-4 h-4 border-neutral-300 text-brand-500 focus:ring-brand-500 dark:border-white/10 dark:text-blue-300 dark:focus:ring-blue-400"
                      />
                      <span className="text-sm text-neutral-700 dark:text-gray-200">Stripe</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="invoicingProvider"
                        value="quickbooks"
                        checked={displayInvoicingProvider === 'quickbooks'}
                        onChange={() => setInvoicingProvider('quickbooks')}
                        className="w-4 h-4 border-neutral-300 text-brand-500 focus:ring-brand-500 dark:border-white/10 dark:text-blue-300 dark:focus:ring-blue-400"
                      />
                      <span className="text-sm text-neutral-700 dark:text-gray-200">QuickBooks</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Save / Disconnect */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() =>
                    qbPrefsMutation.mutate({
                      syncInvoices: displaySyncInvoices,
                      syncCustomers: displaySyncCustomers,
                      syncExpenses: displaySyncExpenses,
                      invoicingProvider: displayInvoicingProvider,
                    })
                  }
                  disabled={qbPrefsMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50 transition text-sm"
                >
                  {qbPrefsMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Preferences
                </button>

                {!confirmDisconnect ? (
                  <button
                    onClick={() => setConfirmDisconnect(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition text-sm dark:text-red-300"
                  >
                    <Unplug className="w-4 h-4" />
                    Disconnect
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-600 dark:text-red-300">Are you sure?</span>
                    <button
                      onClick={() => qbDisconnectMutation.mutate()}
                      disabled={qbDisconnectMutation.isPending}
                      className="px-3 py-1.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition text-sm"
                    >
                      {qbDisconnectMutation.isPending ? 'Disconnecting...' : 'Yes, Disconnect'}
                    </button>
                    <button
                      onClick={() => setConfirmDisconnect(false)}
                      className="px-3 py-1.5 border border-neutral-300 text-neutral-600 font-semibold rounded-lg hover:bg-neutral-50 transition text-sm dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {qbSaveMessage && (
                  <span
                    className={`text-sm font-medium ${
                      qbSaveMessage.includes('saved') ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {qbSaveMessage}
                  </span>
                )}
              </div>
            </div>
          ) : qbAuthUrl ? (
            <div className="space-y-3">
              <p className="text-sm text-neutral-600 dark:text-gray-300">
                You'll be redirected to QuickBooks to authorize FlowBoss.
              </p>
              <a
                href={qbAuthUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 transition text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Continue to QuickBooks
              </a>
              <p className="text-xs text-neutral-400 truncate max-w-md dark:text-gray-500" title={qbAuthUrl}>
                {qbAuthUrl}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleConnectQB}
                disabled={connectingQB}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50 transition text-sm"
              >
                {connectingQB ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                Connect QuickBooks
              </button>
              <p className="text-xs text-neutral-400 dark:text-gray-500">
                You'll be redirected to QuickBooks to authorize.
              </p>
              {qbError && <p className="text-sm text-red-600 dark:text-red-300">{qbError}</p>}
            </div>
          )}
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
          <TeamManager />
        </div>
      )}
    </div>
  );
}
