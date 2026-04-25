import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { CreateExpenseModal } from '../../components/expenses/CreateExpenseModal';
import {
  format,
  startOfWeek,
  startOfMonth,
  endOfWeek,
  endOfMonth,
  startOfYear,
  endOfYear,
  subWeeks,
  subMonths,
  subYears,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  isWithinInterval,
  isSameDay,
  isSameWeek,
  isSameMonth,
  parseISO,
} from 'date-fns';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Briefcase,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Users,
  BarChart3,
  Clock,
  Layers,
  HardHat,
} from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';

// ── Types ─────────────────────────────────────────────────────────────
type Period = 'week' | 'month' | 'year';

const PERIOD_LABELS: Record<Period, string> = {
  week: 'This Week',
  month: 'This Month',
  year: 'This Year',
};

// ── Currency formatter ────────────────────────────────────────────────
const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const currencyFmtCents = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
function fmtCurrency(n: number) { return currencyFmt.format(n); }
function fmtCurrencyFull(n: number) { return currencyFmtCents.format(n); }

// ── Date range helpers ────────────────────────────────────────────────
function getPeriodRange(period: Period) {
  const now = new Date();
  if (period === 'week') {
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    return { start, end };
  }
  if (period === 'month') {
    return { start: startOfMonth(now), end: endOfMonth(now) };
  }
  return { start: startOfYear(now), end: endOfYear(now) };
}

function getPreviousPeriodRange(period: Period) {
  const now = new Date();
  if (period === 'week') {
    const prevStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const prevEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    return { start: prevStart, end: prevEnd };
  }
  if (period === 'month') {
    const prev = subMonths(now, 1);
    return { start: startOfMonth(prev), end: endOfMonth(prev) };
  }
  const prev = subYears(now, 1);
  return { start: startOfYear(prev), end: endOfYear(prev) };
}

function safeDate(d: string | Date | null | undefined): Date | null {
  if (!d) return null;
  try {
    const parsed = typeof d === 'string' ? parseISO(d) : d;
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch { return null; }
}

function isInRange(dateStr: string | null | undefined, start: Date, end: Date): boolean {
  const d = safeDate(dateStr);
  if (!d) return false;
  return isWithinInterval(d, { start, end });
}

// ── Skeleton components ───────────────────────────────────────────────
function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-neutral-200 p-5 animate-pulse dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10 ${className}`}>
      <div className="h-3 bg-neutral-200 rounded w-20 mb-3" />
      <div className="h-7 bg-neutral-200 rounded w-28" />
    </div>
  );
}

function SkeletonSection({ className = '', height = 'h-48' }: { className?: string; height?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-neutral-200 p-5 animate-pulse dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10 ${className}`}>
      <div className="h-3 bg-neutral-200 rounded w-32 mb-4" />
      <div className={`bg-neutral-100 rounded dark:bg-white/10 ${height}`} />
    </div>
  );
}

// ── Trend Arrow ───────────────────────────────────────────────────────
function TrendArrow({ current, previous, invert = false }: { current: number; previous: number; invert?: boolean }) {
  if (previous === 0 && current === 0) return null;
  const pctChange = previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;
  const isUp = pctChange > 0;
  const isGood = invert ? !isUp : isUp;

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ml-2 ${isGood ? 'text-green-600' : 'text-red-500'}`}>
      {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(pctChange).toFixed(0)}%
    </span>
  );
}

// ── CSS Bar Chart ─────────────────────────────────────────────────────
function BarChart({
  data,
  maxVal,
}: {
  data: { label: string; revenue: number; expenses: number }[];
  maxVal: number;
}) {
  const safeMax = maxVal || 1;

  // Visual floor for non-zero buckets. When one bar dominates (e.g. a single
  // $22k week against three $200–$2k weeks), a strict % mapping crushes the
  // smaller bars to ~1px and the chart reads as "empty." Bump the minimum
  // visible height to 7% — small but unmistakably present — and only when
  // the value is actually > 0 so true zeros stay zero.
  const MIN_VISIBLE_PCT = 7;

  return (
    <div className="relative flex items-end gap-1 sm:gap-2 h-48 mt-2">
      {/* Subtle baseline so small bars read as intentional, not missing data. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-7 h-px bg-neutral-200 dark:bg-white/10" />
      {data.map((d, i) => {
        const revH = (d.revenue / safeMax) * 100;
        const expH = (d.expenses / safeMax) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0 group">
            <div className="flex items-end gap-px w-full h-40 justify-center">
              {/* Revenue bar */}
              <div className="relative flex-1 max-w-5 flex flex-col justify-end">
                <div
                  className="bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600 cursor-default min-h-[2px]"
                  style={{ height: `${Math.max(revH, d.revenue > 0 ? MIN_VISIBLE_PCT : 0)}%` }}
                  title={`Revenue: ${fmtCurrency(d.revenue)}`}
                />
              </div>
              {/* Expense bar */}
              <div className="relative flex-1 max-w-5 flex flex-col justify-end">
                <div
                  className="bg-red-400 rounded-t transition-all duration-300 hover:bg-red-500 cursor-default min-h-[2px]"
                  style={{ height: `${Math.max(expH, d.expenses > 0 ? MIN_VISIBLE_PCT : 0)}%` }}
                  title={`Expenses: ${fmtCurrency(d.expenses)}`}
                />
              </div>
            </div>
            {/* Tooltip on hover */}
            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-neutral-800 text-white text-[10px] px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10 transition-opacity">
              {fmtCurrency(d.revenue)} / {fmtCurrency(d.expenses)}
            </div>
            <span className="text-[10px] text-neutral-400 truncate w-full text-center leading-tight dark:text-gray-500">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── CSS Donut (conic-gradient) ────────────────────────────────────────
function DonutChart({
  segments,
}: {
  segments: { label: string; value: number; color: string; amount: number; path?: string }[];
}) {
  const navigate = useNavigate();
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <p className="text-neutral-400 text-center py-6 dark:text-gray-500">No invoice data</p>;

  let cumPct = 0;
  const gradientParts: string[] = [];
  segments.forEach((seg) => {
    const pct = (seg.value / total) * 100;
    if (pct > 0) {
      gradientParts.push(`${seg.color} ${cumPct}% ${cumPct + pct}%`);
      cumPct += pct;
    }
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Ring */}
      <div className="relative shrink-0">
        <div
          className="w-36 h-36 rounded-full"
          style={{
            background: `conic-gradient(${gradientParts.join(', ')})`,
          }}
        />
        {/* Inner circle for donut hole */}
        <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center dark:bg-white/5 dark:backdrop-blur-sm">
          <div className="text-center">
            <p className="text-lg font-extrabold text-neutral-900 dark:text-white">{total}</p>
            <p className="text-[10px] text-neutral-400 uppercase font-semibold dark:text-gray-500">Invoices</p>
          </div>
        </div>
      </div>
      {/* Legend */}
      <div className="flex-1 space-y-2 w-full">
        {segments.map((seg) => {
          const pct = total > 0 ? ((seg.value / total) * 100).toFixed(0) : '0';
          return (
            <button
              key={seg.label}
              onClick={() => seg.path && navigate(seg.path)}
              className="flex items-center gap-3 w-full text-left hover:bg-neutral-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors dark:hover:bg-white/10"
            >
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="flex-1 text-sm text-neutral-700 font-medium dark:text-gray-200">{seg.label}</span>
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">{seg.value}</span>
              <span className="text-xs text-neutral-400 w-14 text-right dark:text-gray-500">{fmtCurrency(seg.amount)}</span>
              <span className="text-xs text-neutral-400 w-10 text-right dark:text-gray-500">{pct}%</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Horizontal Bar (for revenue by type) ──────────────────────────────
function HorizontalBarChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d, i) => {
        const pct = (d.value / maxVal) * 100;
        return (
          <div key={i}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-neutral-700 font-medium truncate mr-2 dark:text-gray-200">{d.label}</span>
              <span className="text-neutral-900 font-semibold shrink-0 dark:text-white">{fmtCurrency(d.value)}</span>
            </div>
            <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden dark:bg-white/10">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════
export function FinancialsPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('month');
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // ── Data fetches ────────────────────────────────────────────────────
  const { data: financialsRes, isLoading: finLoading } = useQuery({
    queryKey: ['financials', period],
    queryFn: () => api.getFinancials(period),
  });

  const { data: insightsRes, isLoading: insightsLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: () => api.getInsightsData(),
    staleTime: 5 * 60_000,
  });

  const { data: contractorsRes } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => api.getContractors(),
    staleTime: 5 * 60_000,
  });

  const { data: invitedProjectsRes } = useQuery({
    queryKey: ['invitedProjects'],
    queryFn: () => api.getInvitedProjects(),
    staleTime: 5 * 60_000,
  });

  const fin = financialsRes?.data;
  const insights = insightsRes?.data;
  const contractors = contractorsRes?.data || [];

  const revenue = fin?.revenue ?? 0;
  const expenses = fin?.expenses ?? 0;
  const profit = revenue - expenses;
  const outstanding = fin?.outstanding ?? 0;
  const jobsCompleted = fin?.jobsCompleted ?? 0;
  const avgJobValue = jobsCompleted > 0 ? revenue / jobsCompleted : 0;
  const recentPayments = fin?.recentPayments || [];
  const recentExpenses = fin?.recentExpenses || [];

  const isLoading = finLoading;
  const chartsLoading = insightsLoading;

  // ── Period ranges for bucketing ─────────────────────────────────────
  const { start: periodStart, end: periodEnd } = getPeriodRange(period);
  const prevRange = getPreviousPeriodRange(period);

  // ── Compute previous-period financials for trend arrows ─────────────
  const prevPeriodStats = useMemo(() => {
    if (!insights) return null;
    const invoices = insights.invoices || [];
    const expensesList = insights.expenses || [];

    const prevRevenue = invoices
      .filter((i: any) => i.status?.toLowerCase() === 'paid' && isInRange(i.paid_at || i.created_at, prevRange.start, prevRange.end))
      .reduce((sum: number, i: any) => sum + Number(i.total || 0), 0);

    const prevExpenses = expensesList
      .filter((e: any) => isInRange(e.date, prevRange.start, prevRange.end))
      .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

    const prevJobs = (insights.jobs || [])
      .filter((j: any) => j.status === 'COMPLETED' && isInRange(j.scheduled_start || j.created_at, prevRange.start, prevRange.end))
      .length;

    return { revenue: prevRevenue, expenses: prevExpenses, jobsCompleted: prevJobs };
  }, [insights, prevRange.start.getTime(), prevRange.end.getTime()]);

  // ── Time-segmented revenue vs expenses (bar chart) ──────────────────
  const barData = useMemo(() => {
    if (!insights) return [];
    const invoices = (insights.invoices || []).filter((i: any) => i.status?.toLowerCase() === 'paid');
    const expensesList = insights.expenses || [];

    if (period === 'week') {
      const days = eachDayOfInterval({ start: periodStart, end: periodEnd });
      return days.map((day) => {
        const dayRev = invoices
          .filter((i: any) => { const d = safeDate(i.paid_at || i.created_at); return d && isSameDay(d, day); })
          .reduce((s: number, i: any) => s + Number(i.total || 0), 0);
        const dayExp = expensesList
          .filter((e: any) => { const d = safeDate(e.date); return d && isSameDay(d, day); })
          .reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
        return { label: format(day, 'EEE'), revenue: dayRev, expenses: dayExp };
      });
    }

    if (period === 'month') {
      const weeks = eachWeekOfInterval({ start: periodStart, end: periodEnd }, { weekStartsOn: 1 });
      return weeks.map((weekStart, idx) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const wkRev = invoices
          .filter((i: any) => { const d = safeDate(i.paid_at || i.created_at); return d && isSameWeek(d, weekStart, { weekStartsOn: 1 }) && isInRange(i.paid_at || i.created_at, periodStart, periodEnd); })
          .reduce((s: number, i: any) => s + Number(i.total || 0), 0);
        const wkExp = expensesList
          .filter((e: any) => { const d = safeDate(e.date); return d && isSameWeek(d, weekStart, { weekStartsOn: 1 }) && isInRange(e.date, periodStart, periodEnd); })
          .reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
        return { label: `Wk ${idx + 1}`, revenue: wkRev, expenses: wkExp };
      });
    }

    // Year - each month
    const months = eachMonthOfInterval({ start: periodStart, end: periodEnd });
    return months.map((monthStart) => {
      const mRev = invoices
        .filter((i: any) => { const d = safeDate(i.paid_at || i.created_at); return d && isSameMonth(d, monthStart); })
        .reduce((s: number, i: any) => s + Number(i.total || 0), 0);
      const mExp = expensesList
        .filter((e: any) => { const d = safeDate(e.date); return d && isSameMonth(d, monthStart); })
        .reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
      return { label: format(monthStart, 'MMM'), revenue: mRev, expenses: mExp };
    });
  }, [insights, period, periodStart.getTime(), periodEnd.getTime()]);

  const barChartMax = useMemo(() => {
    return Math.max(...barData.flatMap((d) => [d.revenue, d.expenses]), 1);
  }, [barData]);

  // ── Invoice status breakdown ────────────────────────────────────────
  const invoiceBreakdown = useMemo(() => {
    if (!insights) return { paid: { count: 0, amount: 0 }, sent: { count: 0, amount: 0 }, overdue: { count: 0, amount: 0 }, draft: { count: 0, amount: 0 } };
    const invoices = insights.invoices || [];
    const now = new Date();

    const buckets = { paid: { count: 0, amount: 0 }, sent: { count: 0, amount: 0 }, overdue: { count: 0, amount: 0 }, draft: { count: 0, amount: 0 } };

    invoices.forEach((inv: any) => {
      const status = (inv.status || 'draft').toLowerCase();
      const amount = Number(inv.total || 0);

      if (status === 'paid') {
        buckets.paid.count++;
        buckets.paid.amount += amount;
      } else if (status === 'overdue') {
        buckets.overdue.count++;
        buckets.overdue.amount += Number(inv.balance_due || amount);
      } else if (status === 'sent' || status === 'viewed') {
        // Check if overdue by due_date
        const dueDate = safeDate(inv.due_date);
        if (dueDate && dueDate < now) {
          buckets.overdue.count++;
          buckets.overdue.amount += Number(inv.balance_due || amount);
        } else {
          buckets.sent.count++;
          buckets.sent.amount += Number(inv.balance_due || amount);
        }
      } else {
        buckets.draft.count++;
        buckets.draft.amount += amount;
      }
    });

    return buckets;
  }, [insights]);

  // ── Top customers by revenue ────────────────────────────────────────
  const topCustomers = useMemo(() => {
    if (!insights) return [];
    const paidInvoices = (insights.invoices || []).filter((i: any) => i.status?.toLowerCase() === 'paid');

    const customerMap: Record<string, { name: string; revenue: number; jobs: Set<string> }> = {};
    paidInvoices.forEach((inv: any) => {
      const custId = inv.customer?.id || inv.customer_id || 'unknown';
      const custName = inv.customer
        ? [inv.customer.first_name, inv.customer.last_name].filter(Boolean).join(' ')
        : 'Unknown';
      if (!customerMap[custId]) {
        customerMap[custId] = { name: custName, revenue: 0, jobs: new Set() };
      }
      customerMap[custId].revenue += Number(inv.total || 0);
      if (inv.job_id) customerMap[custId].jobs.add(inv.job_id);
    });

    return Object.values(customerMap)
      .map((c) => ({
        name: c.name,
        revenue: c.revenue,
        jobCount: c.jobs.size || 1,
        avgTicket: c.revenue / (c.jobs.size || 1),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [insights]);

  // ── Revenue by job type / description ───────────────────────────────
  const revenueByType = useMemo(() => {
    if (!insights) return [];
    const paidInvoices = (insights.invoices || []).filter((i: any) => i.status?.toLowerCase() === 'paid');

    const typeMap: Record<string, number> = {};
    paidInvoices.forEach((inv: any) => {
      const lineItems = inv.lineItems || [];
      if (lineItems.length > 0) {
        lineItems.forEach((li: any) => {
          const desc = li.description || li.name || 'Other';
          typeMap[desc] = (typeMap[desc] || 0) + Number(li.total || li.amount || 0);
        });
      } else {
        const desc = inv.description || 'General';
        typeMap[desc] = (typeMap[desc] || 0) + Number(inv.total || 0);
      }
    });

    return Object.entries(typeMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [insights]);

  // ── GC vs Direct revenue split ──────────────────────────────────────
  const gcSplit = useMemo(() => {
    if (!insights) return null;
    const jobs = (insights.jobs || []).filter((j: any) => j.status === 'COMPLETED');
    const paidInvoices = (insights.invoices || []).filter((i: any) => i.status?.toLowerCase() === 'paid');

    // Build invoice lookup by job_id
    const invoiceByJobId: Record<string, any> = {};
    paidInvoices.forEach((inv: any) => {
      const jid = inv.job_id || inv.jobId;
      if (jid) invoiceByJobId[jid] = inv;
    });

    let directRevenue = 0, gcRevenue = 0, directJobs = 0, gcJobs = 0;

    jobs.forEach((job: any) => {
      const inv = invoiceByJobId[job.id];
      const rev = inv ? Number(inv.total || 0) : 0;
      const hasGC = !!(job.contractor_id || job.contractorId);
      if (hasGC) {
        gcRevenue += rev;
        gcJobs++;
      } else {
        directRevenue += rev;
        directJobs++;
      }
    });

    if (directJobs === 0 && gcJobs === 0) return null;
    return { directRevenue, gcRevenue, directJobs, gcJobs };
  }, [insights]);

  // ── Recent activity (combined payments + expenses) ──────────────────
  const recentActivity = useMemo(() => {
    const items: { type: 'payment' | 'expense'; description: string; amount: number; date: string }[] = [];

    recentPayments.forEach((p: any) => {
      items.push({
        type: 'payment',
        description: p.customerName || 'Payment received',
        amount: Number(p.amount || 0),
        date: p.date,
      });
    });

    recentExpenses.forEach((e: any) => {
      items.push({
        type: 'expense',
        description: e.description || e.category || 'Expense',
        amount: Number(e.amount || 0),
        date: e.date,
      });
    });

    items.sort((a, b) => {
      const da = safeDate(a.date);
      const db = safeDate(b.date);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return db.getTime() - da.getTime();
    });

    return items.slice(0, 10);
  }, [recentPayments, recentExpenses]);

  // ── GC Project Revenue (from invited/assigned trades) ────────────────
  const gcProjectRevenue = useMemo(() => {
    const projects = invitedProjectsRes?.data || [];
    if (projects.length === 0) return null;

    let totalGcRevenue = 0;
    const byProject: { projectName: string; gcCompany: string | null; trades: { trade: string; hours: number; rate: number; amount: number }[]; total: number }[] = [];

    projects.forEach((project: any) => {
      const trades = project.trades || [];
      if (trades.length === 0) return;

      const projectTrades: { trade: string; hours: number; rate: number; amount: number }[] = [];
      let projectTotal = 0;

      trades.forEach((t: any) => {
        const hours = Number(t.laborHours || t.labor_hours || 0);
        const rate = Number(t.laborRate || t.labor_rate || 0);
        const amount = hours * rate;
        if (amount > 0) {
          projectTrades.push({ trade: t.trade || 'Unnamed Trade', hours, rate, amount });
          projectTotal += amount;
        }
      });

      if (projectTotal > 0) {
        totalGcRevenue += projectTotal;
        byProject.push({
          projectName: project.name || project.projectName || 'Unnamed Project',
          gcCompany: project.gcCompanyName || null,
          trades: projectTrades,
          total: projectTotal,
        });
      }
    });

    if (totalGcRevenue === 0) return null;

    // Percentage of total (invoiced revenue + GC contract value)
    const combinedTotal = revenue + totalGcRevenue;
    const gcPct = combinedTotal > 0 ? (totalGcRevenue / combinedTotal) * 100 : 0;

    return { totalGcRevenue, byProject, gcPct };
  }, [invitedProjectsRes, revenue]);

  // ══════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Header + Period selector ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Financials</h1>
          <p className="text-sm text-neutral-500 mt-0.5 dark:text-gray-400">Track revenue, expenses, and business health</p>
        </div>
        <div className="flex items-center gap-3">
        <button
          onClick={() => setShowExpenseModal(true)}
          className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors whitespace-nowrap"
        >
          + Add Expense
        </button>
        <div className="flex bg-neutral-100 rounded-lg p-1 dark:bg-white/10">
          {(['week', 'month', 'year'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                period === p
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        </div>
      </div>

      <CreateExpenseModal open={showExpenseModal} onClose={() => setShowExpenseModal(false)} />

      {/* ── Section 1: Summary Cards ───────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Revenue */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4 border-l-4 border-l-green-500 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide dark:text-gray-400">Revenue</span>
            </div>
            <div className="flex items-baseline">
              <p className="text-xl font-extrabold text-green-600 dark:text-green-300">{fmtCurrency(revenue)}</p>
              {prevPeriodStats && <TrendArrow current={revenue} previous={prevPeriodStats.revenue} />}
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4 border-l-4 border-l-red-400 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide dark:text-gray-400">Expenses</span>
            </div>
            <div className="flex items-baseline">
              <p className="text-xl font-extrabold text-red-500">{fmtCurrency(expenses)}</p>
              {prevPeriodStats && <TrendArrow current={expenses} previous={prevPeriodStats.expenses} invert />}
            </div>
          </div>

          {/* Net Profit */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4 border-l-4 border-l-blue-500 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide dark:text-gray-400">Net Profit</span>
            </div>
            <p className={`text-xl font-extrabold ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {fmtCurrency(profit)}
            </p>
          </div>

          {/* Jobs Completed */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4 border-l-4 border-l-neutral-400 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
            <div className="flex items-center gap-1.5 mb-1">
              <Briefcase className="w-3.5 h-3.5 text-neutral-500 dark:text-gray-400" />
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide dark:text-gray-400">Jobs Done</span>
            </div>
            <div className="flex items-baseline">
              <p className="text-xl font-extrabold text-neutral-900 dark:text-white">{jobsCompleted}</p>
              {prevPeriodStats && <TrendArrow current={jobsCompleted} previous={prevPeriodStats.jobsCompleted} />}
            </div>
          </div>

          {/* Outstanding Balance */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4 border-l-4 border-l-amber-400 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide dark:text-gray-400">Outstanding</span>
            </div>
            <p className="text-xl font-extrabold text-amber-600 dark:text-amber-300">{fmtCurrency(outstanding)}</p>
          </div>

          {/* Avg Job Value */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4 border-l-4 border-l-purple-400 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
            <div className="flex items-center gap-1.5 mb-1">
              <Receipt className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide dark:text-gray-400">Avg Job</span>
            </div>
            <p className="text-xl font-extrabold text-purple-600 dark:text-purple-300">{fmtCurrency(avgJobValue)}</p>
          </div>

          {/* GC Contract Value (only shown when user has invited projects) */}
          {gcProjectRevenue && (
            <div className="bg-white rounded-xl border border-neutral-200 p-4 border-l-4 border-l-violet-500 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
              <div className="flex items-center gap-1.5 mb-1">
                <HardHat className="w-3.5 h-3.5 text-violet-500" />
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide dark:text-gray-400">GC Contract Value</span>
              </div>
              <p className="text-xl font-extrabold text-violet-600 dark:text-violet-300">{fmtCurrency(gcProjectRevenue.totalGcRevenue)}</p>
              {revenue > 0 && (
                <p className="text-[10px] text-neutral-400 mt-0.5 dark:text-gray-500">
                  {gcProjectRevenue.gcPct.toFixed(0)}% of combined revenue
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Main grid: charts & tables ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Section 2: Revenue vs Expenses Chart ─────────────────────── */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wide flex items-center gap-1.5 dark:text-gray-400">
              <BarChart3 className="w-3.5 h-3.5" />
              Revenue vs Expenses
            </h2>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500" /> Revenue</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400" /> Expenses</span>
            </div>
          </div>
          {chartsLoading ? (
            <div className="h-48 bg-neutral-50 rounded animate-pulse mt-4 dark:bg-white/[0.02]" />
          ) : barData.length > 0 ? (
            <BarChart data={barData} maxVal={barChartMax} />
          ) : (
            <EmptyState
              icon={BarChart3}
              title="No financial data yet"
              description="Your revenue, expenses, and profit charts will appear here once you start creating invoices and tracking job costs."
              actionLabel="Create an Invoice"
              actionHref="/dashboard/invoices"
              accentColor="amber"
            />
          )}
        </div>

        {/* ── Section 3: Invoice Status Breakdown ──────────────────────── */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wide flex items-center gap-1.5 mb-4 dark:text-gray-400">
            <Layers className="w-3.5 h-3.5" />
            Invoice Breakdown
          </h2>
          {chartsLoading ? (
            <div className="h-48 bg-neutral-50 rounded animate-pulse dark:bg-white/[0.02]" />
          ) : (
            <DonutChart
              segments={[
                { label: 'Paid', value: invoiceBreakdown.paid.count, color: '#22c55e', amount: invoiceBreakdown.paid.amount, path: '/dashboard/invoices?status=paid' },
                { label: 'Sent / Outstanding', value: invoiceBreakdown.sent.count, color: '#3b82f6', amount: invoiceBreakdown.sent.amount, path: '/dashboard/invoices?status=sent' },
                { label: 'Overdue', value: invoiceBreakdown.overdue.count, color: '#ef4444', amount: invoiceBreakdown.overdue.amount, path: '/dashboard/invoices?status=overdue' },
                { label: 'Draft', value: invoiceBreakdown.draft.count, color: '#9ca3af', amount: invoiceBreakdown.draft.amount, path: '/dashboard/invoices?status=draft' },
              ]}
            />
          )}
        </div>

        {/* ── Section 4: Top Customers by Revenue ──────────────────────── */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wide flex items-center gap-1.5 mb-4 dark:text-gray-400">
            <Users className="w-3.5 h-3.5" />
            Top Customers by Revenue
          </h2>
          {chartsLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-4 bg-neutral-200 rounded flex-1" />
                  <div className="h-4 bg-neutral-100 rounded w-16 dark:bg-white/10" />
                </div>
              ))}
            </div>
          ) : topCustomers.length > 0 ? (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="text-left text-neutral-400 text-xs uppercase tracking-wide dark:text-gray-500">
                    <th className="pb-2 pl-2 font-semibold">#</th>
                    <th className="pb-2 font-semibold">Customer</th>
                    <th className="pb-2 text-right font-semibold">Jobs</th>
                    <th className="pb-2 text-right font-semibold">Revenue</th>
                    <th className="pb-2 text-right pr-2 font-semibold">Avg Ticket</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((c, i) => (
                    <tr key={i} className="border-t border-neutral-100 dark:border-white/10">
                      <td className="py-2.5 pl-2">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                          i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-500'
                        }`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-2.5 font-medium text-neutral-900 dark:text-white">{c.name}</td>
                      <td className="py-2.5 text-right text-neutral-600 dark:text-gray-300">{c.jobCount}</td>
                      <td className="py-2.5 text-right font-semibold text-green-600 dark:text-green-300">{fmtCurrency(c.revenue)}</td>
                      <td className="py-2.5 text-right pr-2 text-neutral-600 dark:text-gray-300">{fmtCurrency(c.avgTicket)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-neutral-400 text-center py-6 text-sm dark:text-gray-500">No customer data yet</p>
          )}
        </div>

        {/* ── Section 5: Revenue by Job Type ───────────────────────────── */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wide flex items-center gap-1.5 mb-4 dark:text-gray-400">
            <BarChart3 className="w-3.5 h-3.5" />
            Revenue by Service Type
          </h2>
          {chartsLoading ? (
            <div className="h-48 bg-neutral-50 rounded animate-pulse dark:bg-white/[0.02]" />
          ) : revenueByType.length > 0 ? (
            <HorizontalBarChart data={revenueByType} />
          ) : (
            <p className="text-neutral-400 text-center py-6 text-sm dark:text-gray-500">No line item data yet</p>
          )}
        </div>
      </div>

      {/* ── Section 6: GC vs Direct Revenue Split ──────────────────────── */}
      {gcSplit && (
        <div className="bg-white rounded-xl border border-neutral-200 p-5 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-4 dark:text-gray-400">
            GC vs Direct Revenue
          </h2>
          <div className="space-y-3">
            {/* Two-tone bar */}
            <div className="relative">
              {(() => {
                const total = gcSplit.directRevenue + gcSplit.gcRevenue;
                const directPct = total > 0 ? (gcSplit.directRevenue / total) * 100 : 50;
                const gcPct = total > 0 ? (gcSplit.gcRevenue / total) * 100 : 50;
                return (
                  <>
                    <div className="flex h-8 rounded-lg overflow-hidden">
                      {gcSplit.directRevenue > 0 && (
                        <div
                          className="bg-green-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-500"
                          style={{ width: `${Math.max(directPct, 8)}%` }}
                        >
                          {directPct >= 15 ? `${directPct.toFixed(0)}%` : ''}
                        </div>
                      )}
                      {gcSplit.gcRevenue > 0 && (
                        <div
                          className="bg-blue-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-500"
                          style={{ width: `${Math.max(gcPct, 8)}%` }}
                        >
                          {gcPct >= 15 ? `${gcPct.toFixed(0)}%` : ''}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
            {/* Legend row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-green-50 rounded-lg p-3 border border-green-100 dark:bg-green-500/10">
                <span className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-neutral-500 dark:text-gray-400">Direct Work</p>
                  <p className="text-lg font-extrabold text-green-600 dark:text-green-300">{fmtCurrency(gcSplit.directRevenue)}</p>
                  <p className="text-xs text-neutral-400 dark:text-gray-500">{gcSplit.directJobs} job{gcSplit.directJobs !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3 border border-blue-100 dark:bg-blue-500/10">
                <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-neutral-500 dark:text-gray-400">GC Referred</p>
                  <p className="text-lg font-extrabold text-blue-600 dark:text-blue-300">{fmtCurrency(gcSplit.gcRevenue)}</p>
                  <p className="text-xs text-neutral-400 dark:text-gray-500">{gcSplit.gcJobs} job{gcSplit.gcJobs !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Section 6b: GC Project Revenue Breakdown ─────────────────── */}
      {gcProjectRevenue && (
        <div className="bg-white rounded-xl border border-neutral-200 p-5 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wide flex items-center gap-1.5 mb-4 dark:text-gray-400">
            <HardHat className="w-3.5 h-3.5 text-violet-500" />
            GC Project Revenue
            <span className="text-[10px] font-normal text-neutral-400 normal-case tracking-normal ml-1 dark:text-gray-500">
              (Budgeted contract value from assigned trades)
            </span>
          </h2>
          <div className="space-y-4">
            {gcProjectRevenue.byProject.map((proj, pi) => (
              <div key={pi} className="border border-neutral-100 rounded-lg overflow-hidden dark:border-white/10">
                {/* Project header */}
                <div className="flex items-center justify-between bg-neutral-50 px-4 py-2.5 dark:bg-white/[0.02]">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate dark:text-white">{proj.projectName}</p>
                    {proj.gcCompany && (
                      <p className="text-xs text-neutral-400 dark:text-gray-500">{proj.gcCompany}</p>
                    )}
                  </div>
                  <p className="text-sm font-extrabold text-violet-600 shrink-0 ml-4 dark:text-violet-300">{fmtCurrency(proj.total)}</p>
                </div>
                {/* Trade rows */}
                <div className="divide-y divide-neutral-100">
                  {proj.trades.map((trade, ti) => (
                    <div key={ti} className="flex items-center justify-between px-4 py-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                        <span className="text-neutral-700 font-medium truncate dark:text-gray-200">{trade.trade}</span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 ml-4">
                        <span className="text-xs text-neutral-400 dark:text-gray-500">
                          {trade.hours} hrs &times; {fmtCurrency(trade.rate)}/hr
                        </span>
                        <span className="font-semibold text-neutral-900 w-24 text-right dark:text-white">{fmtCurrency(trade.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Section 7: Recent Activity ─────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
        <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wide flex items-center gap-1.5 mb-4 dark:text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          Recent Activity
        </h2>
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 py-2">
                <div className="w-8 h-8 bg-neutral-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-3 bg-neutral-200 rounded w-40 mb-2" />
                  <div className="h-3 bg-neutral-100 rounded w-24 dark:bg-white/10" />
                </div>
                <div className="h-4 bg-neutral-200 rounded w-20" />
              </div>
            ))}
          </div>
        ) : recentActivity.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {recentActivity.map((item, i) => {
              const d = safeDate(item.date);
              const isPayment = item.type === 'payment';
              return (
                <div key={i} className="flex items-center gap-3 py-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isPayment ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    {isPayment ? (
                      <ArrowDownRight className="w-4 h-4 text-green-500" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate dark:text-white">{item.description}</p>
                    <p className="text-xs text-neutral-400 dark:text-gray-500">
                      {isPayment ? 'Payment' : 'Expense'}
                      {d ? ` \u00b7 ${format(d, 'MMM d, yyyy')}` : ''}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold shrink-0 ${isPayment ? 'text-green-600' : 'text-red-500'}`}>
                    {isPayment ? '+' : '-'}{fmtCurrencyFull(item.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-neutral-400 text-center py-6 text-sm dark:text-gray-500">No recent activity</p>
        )}
      </div>
    </div>
  );
}
