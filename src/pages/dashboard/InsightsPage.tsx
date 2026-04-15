import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  format,
  parseISO,
  differenceInCalendarDays,
  differenceInHours,
  subMonths,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  getDay,
} from 'date-fns';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Briefcase,
  BarChart3,
  Users,
  MapPin,
  Receipt,
  Clock,
  Zap,
  Lightbulb,
} from 'lucide-react';
import { EmptyState as EmptyStateBanner } from '../../components/ui/EmptyState';

// ── Currency / number formatting ────────────────────────────────────
const fmtCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const fmtCurrencyFull = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
const fmtNum = (n: number) =>
  new Intl.NumberFormat('en-US').format(Math.round(n));

// ── Skeleton primitives ─────────────────────────────────────────────
function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-200 rounded animate-pulse dark:bg-white/10${className} dark:bg-white/10`} />;
}

function SectionSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
      <SkeletonBlock className="h-5 w-48" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBlock key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

function KPISkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse space-y-3 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
      <SkeletonBlock className="h-4 w-24" />
      <SkeletonBlock className="h-8 w-32" />
      <SkeletonBlock className="h-3 w-20" />
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────
function safeParseDate(val: string | null | undefined): Date | null {
  if (!val) return null;
  try {
    return parseISO(val);
  } catch {
    return null;
  }
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── Component ───────────────────────────────────────────────────────
export function InsightsPage() {
  const { data: rawData, isLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: () => api.getInsightsData(),
  });

  const insights = rawData?.data;

  // ── Computed analytics ──────────────────────────────────────────
  const analytics = useMemo(() => {
    if (!insights) return null;

    const { jobs, invoices, expenses, customers } = insights;

    // Paid invoices
    const paidInvoices = invoices.filter(
      (inv: any) => inv.status === 'PAID' || inv.status === 'paid'
    );
    const totalRevenue = paidInvoices.reduce((sum: number, inv: any) => {
      const lineTotal = (inv.lineItems || inv.line_items || []).reduce(
        (s: number, li: any) => s + (Number(li.total) || Number(li.amount) || 0),
        0
      );
      return sum + (lineTotal || Number(inv.total) || Number(inv.amount) || 0);
    }, 0);

    const totalExpenses = expenses.reduce(
      (sum: number, exp: any) => sum + (Number(exp.amount) || 0),
      0
    );
    const profitMargin =
      totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
    const avgJobValue =
      paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0;
    const completedJobs = jobs.filter(
      (j: any) => j.status === 'COMPLETED' || j.status === 'completed'
    );

    // ── Money Makers: Revenue per Hour ────────────────────────────
    const jobTypeMap = new Map<
      string,
      { revenue: number; hours: number; count: number }
    >();
    for (const job of completedJobs) {
      const desc = job.description || 'Uncategorized';
      const entry = jobTypeMap.get(desc) || { revenue: 0, hours: 0, count: 0 };
      // Find matching paid invoice
      const matchingInv = paidInvoices.find(
        (inv: any) =>
          inv.job_id === job.id || inv.jobId === job.id
      );
      if (matchingInv) {
        const lineTotal = (matchingInv.lineItems || matchingInv.line_items || []).reduce(
          (s: number, li: any) => s + (Number(li.total) || Number(li.amount) || 0),
          0
        );
        entry.revenue += lineTotal || Number(matchingInv.total) || Number(matchingInv.amount) || 0;
      }
      // Hours
      const start = safeParseDate(job.started_at || job.startedAt);
      const end = safeParseDate(job.completed_at || job.completedAt);
      if (start && end) {
        const hrs = Math.max(differenceInHours(end, start), 1);
        entry.hours += hrs;
      } else if (job.estimated_duration || job.estimatedDuration) {
        entry.hours += Number(job.estimated_duration || job.estimatedDuration) / 60;
      } else {
        entry.hours += 1;
      }
      entry.count += 1;
      jobTypeMap.set(desc, entry);
    }
    const moneyMakers = [...jobTypeMap.entries()]
      .map(([desc, d]) => ({
        description: desc,
        revenue: d.revenue,
        hours: d.hours,
        revenuePerHour: d.hours > 0 ? d.revenue / d.hours : 0,
        count: d.count,
      }))
      .sort((a, b) => b.revenuePerHour - a.revenuePerHour)
      .slice(0, 10);
    const maxRPH = Math.max(...moneyMakers.map((m) => m.revenuePerHour), 1);

    // ── Customer Leaderboard ──────────────────────────────────────
    const custMap = new Map<
      string,
      {
        name: string;
        revenue: number;
        jobCount: number;
        lastJobDate: string | null;
      }
    >();
    for (const inv of paidInvoices) {
      const cust = inv.customer;
      if (!cust) continue;
      const custId = cust.id;
      const entry = custMap.get(custId) || {
        name:
          [cust.first_name || cust.firstName, cust.last_name || cust.lastName]
            .filter(Boolean)
            .join(' ') || 'Unknown',
        revenue: 0,
        jobCount: 0,
        lastJobDate: null,
      };
      const lineTotal = (inv.lineItems || inv.line_items || []).reduce(
        (s: number, li: any) => s + (Number(li.total) || Number(li.amount) || 0),
        0
      );
      entry.revenue += lineTotal || Number(inv.total) || Number(inv.amount) || 0;
      entry.jobCount += 1;
      const invDate = inv.paid_at || inv.paidAt || inv.created_at || inv.createdAt;
      if (invDate && (!entry.lastJobDate || invDate > entry.lastJobDate)) {
        entry.lastJobDate = invDate;
      }
      custMap.set(custId, entry);
    }
    const customerLeaderboard = [...custMap.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((c, i) => ({
        ...c,
        rank: i + 1,
        avgTicket: c.jobCount > 0 ? c.revenue / c.jobCount : 0,
      }));

    // ── Revenue by Month (last 12) ───────────────────────────────
    const now = new Date();
    const months: { label: string; revenue: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const mStart = startOfMonth(subMonths(now, i));
      const mEnd = endOfMonth(subMonths(now, i));
      const mRevenue = paidInvoices
        .filter((inv: any) => {
          const d = safeParseDate(inv.paid_at || inv.paidAt || inv.created_at || inv.createdAt);
          return d && isWithinInterval(d, { start: mStart, end: mEnd });
        })
        .reduce((sum: number, inv: any) => {
          const lineTotal = (inv.lineItems || inv.line_items || []).reduce(
            (s: number, li: any) => s + (Number(li.total) || Number(li.amount) || 0),
            0
          );
          return sum + (lineTotal || Number(inv.total) || Number(inv.amount) || 0);
        }, 0);
      months.push({ label: format(mStart, 'MMM yyyy'), revenue: mRevenue });
    }
    const maxMonthRev = Math.max(...months.map((m) => m.revenue), 1);

    // ── Busiest Days of the Week ─────────────────────────────────
    const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    for (const job of completedJobs) {
      const d = safeParseDate(
        job.scheduled_start || job.scheduledStart || job.completed_at || job.completedAt
      );
      if (d) dayCounts[getDay(d)] += 1;
    }
    const maxDayCount = Math.max(...dayCounts, 1);
    const busiestDay = dayCounts.indexOf(Math.max(...dayCounts));

    // ── Service Area Analysis ────────────────────────────────────
    const zipMap = new Map<
      string,
      { jobs: number; revenue: number; customerIds: Set<string> }
    >();
    for (const job of jobs) {
      const zip =
        job.property?.zip || job.property?.zipCode || job.property?.zip_code;
      if (!zip) continue;
      const entry = zipMap.get(zip) || {
        jobs: 0,
        revenue: 0,
        customerIds: new Set<string>(),
      };
      entry.jobs += 1;
      if (job.customer?.id) entry.customerIds.add(job.customer.id);
      // Revenue from matching invoice
      const matchingInv = paidInvoices.find(
        (inv: any) => inv.job_id === job.id || inv.jobId === job.id
      );
      if (matchingInv) {
        const lineTotal = (matchingInv.lineItems || matchingInv.line_items || []).reduce(
          (s: number, li: any) => s + (Number(li.total) || Number(li.amount) || 0),
          0
        );
        entry.revenue +=
          lineTotal || Number(matchingInv.total) || Number(matchingInv.amount) || 0;
      }
      zipMap.set(zip, entry);
    }
    const serviceAreas = [...zipMap.entries()]
      .map(([zip, d]) => ({
        zip,
        jobs: d.jobs,
        revenue: d.revenue,
        customers: d.customerIds.size,
      }))
      .sort((a, b) => b.jobs - a.jobs)
      .slice(0, 10);

    // ── Expense Breakdown ────────────────────────────────────────
    const catMap = new Map<string, number>();
    for (const exp of expenses) {
      const cat = exp.category || 'Uncategorized';
      catMap.set(cat, (catMap.get(cat) || 0) + (Number(exp.amount) || 0));
    }
    const expenseBreakdown = [...catMap.entries()]
      .map(([category, amount]) => ({
        category,
        amount,
        pct: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
    const maxExpenseAmt = Math.max(
      ...expenseBreakdown.map((e) => e.amount),
      1
    );

    // Build conic gradient for expenses
    let conicStops = '';
    let cumPct = 0;
    const expenseColors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
    ];
    for (let i = 0; i < expenseBreakdown.length; i++) {
      const color = expenseColors[i % expenseColors.length];
      const nextPct = cumPct + expenseBreakdown[i].pct;
      conicStops += `${color} ${cumPct}% ${nextPct}%${i < expenseBreakdown.length - 1 ? ', ' : ''}`;
      cumPct = nextPct;
    }

    // ── Payment Speed ────────────────────────────────────────────
    const paymentDays: number[] = [];
    for (const inv of paidInvoices) {
      const sent = safeParseDate(inv.sent_at || inv.sentAt || inv.created_at || inv.createdAt);
      const paid = safeParseDate(inv.paid_at || inv.paidAt);
      if (sent && paid) {
        paymentDays.push(Math.max(differenceInCalendarDays(paid, sent), 0));
      }
    }
    const avgPaymentDays =
      paymentDays.length > 0
        ? paymentDays.reduce((a, b) => a + b, 0) / paymentDays.length
        : 0;
    const under7 = paymentDays.filter((d) => d < 7).length;
    const d7to14 = paymentDays.filter((d) => d >= 7 && d < 14).length;
    const d14to30 = paymentDays.filter((d) => d >= 14 && d < 30).length;
    const over30 = paymentDays.filter((d) => d >= 30).length;
    const total = paymentDays.length || 1;
    const paymentSpeed = {
      avg: avgPaymentDays,
      under7Pct: (under7 / total) * 100,
      d7to14Pct: (d7to14 / total) * 100,
      d14to30Pct: (d14to30 / total) * 100,
      over30Pct: (over30 / total) * 100,
    };

    // ── Growth Snapshot ──────────────────────────────────────────
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const inRange = (dateStr: string | null | undefined, start: Date, end: Date) => {
      const d = safeParseDate(dateStr);
      return d ? isWithinInterval(d, { start, end }) : false;
    };

    const thisMonthRevenue = paidInvoices
      .filter((inv: any) =>
        inRange(inv.paid_at || inv.paidAt || inv.created_at || inv.createdAt, thisMonthStart, thisMonthEnd)
      )
      .reduce((sum: number, inv: any) => {
        const lineTotal = (inv.lineItems || inv.line_items || []).reduce(
          (s: number, li: any) => s + (Number(li.total) || Number(li.amount) || 0),
          0
        );
        return sum + (lineTotal || Number(inv.total) || Number(inv.amount) || 0);
      }, 0);
    const lastMonthRevenue = paidInvoices
      .filter((inv: any) =>
        inRange(inv.paid_at || inv.paidAt || inv.created_at || inv.createdAt, lastMonthStart, lastMonthEnd)
      )
      .reduce((sum: number, inv: any) => {
        const lineTotal = (inv.lineItems || inv.line_items || []).reduce(
          (s: number, li: any) => s + (Number(li.total) || Number(li.amount) || 0),
          0
        );
        return sum + (lineTotal || Number(inv.total) || Number(inv.amount) || 0);
      }, 0);

    const thisMonthJobs = completedJobs.filter((j: any) =>
      inRange(j.completed_at || j.completedAt || j.scheduled_start || j.scheduledStart, thisMonthStart, thisMonthEnd)
    ).length;
    const lastMonthJobs = completedJobs.filter((j: any) =>
      inRange(j.completed_at || j.completedAt || j.scheduled_start || j.scheduledStart, lastMonthStart, lastMonthEnd)
    ).length;

    const thisMonthNewCust = customers.filter((c: any) =>
      inRange(c.created_at || c.createdAt, thisMonthStart, thisMonthEnd)
    ).length;
    const lastMonthNewCust = customers.filter((c: any) =>
      inRange(c.created_at || c.createdAt, lastMonthStart, lastMonthEnd)
    ).length;

    const thisMonthExpenses = expenses
      .filter((e: any) =>
        inRange(e.date || e.created_at || e.createdAt, thisMonthStart, thisMonthEnd)
      )
      .reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);
    const lastMonthExpenses = expenses
      .filter((e: any) =>
        inRange(e.date || e.created_at || e.createdAt, lastMonthStart, lastMonthEnd)
      )
      .reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);

    const pctChange = (curr: number, prev: number) =>
      prev > 0 ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : 0;

    const growth = {
      revenue: { current: thisMonthRevenue, change: pctChange(thisMonthRevenue, lastMonthRevenue) },
      jobs: { current: thisMonthJobs, change: pctChange(thisMonthJobs, lastMonthJobs) },
      newCustomers: { current: thisMonthNewCust, change: pctChange(thisMonthNewCust, lastMonthNewCust) },
      expenses: { current: thisMonthExpenses, change: pctChange(thisMonthExpenses, lastMonthExpenses) },
    };

    return {
      totalRevenue,
      profitMargin,
      avgJobValue,
      completedJobsCount: completedJobs.length,
      moneyMakers,
      maxRPH,
      customerLeaderboard,
      months,
      maxMonthRev,
      dayCounts,
      maxDayCount,
      busiestDay,
      serviceAreas,
      expenseBreakdown,
      maxExpenseAmt,
      conicStops,
      expenseColors,
      totalExpenses,
      paymentSpeed,
      growth,
    };
  }, [insights]);

  // ── Loading state ─────────────────────────────────────────────
  if (isLoading || !analytics) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="mb-2">
          <SkeletonBlock className="h-8 w-56" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPISkeleton />
          <KPISkeleton />
          <KPISkeleton />
          <KPISkeleton />
        </div>
        <SectionSkeleton rows={6} />
        <SectionSkeleton rows={5} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionSkeleton rows={8} />
          <SectionSkeleton rows={4} />
        </div>
      </div>
    );
  }

  // ── Check if all sections are empty ───────────────────────────
  const allEmpty =
    analytics.totalRevenue === 0 &&
    analytics.completedJobsCount === 0 &&
    analytics.moneyMakers.length === 0 &&
    analytics.customerLeaderboard.length === 0 &&
    analytics.serviceAreas.length === 0 &&
    analytics.expenseBreakdown.length === 0;

  // ── Render ────────────────────────────────────────────────────
  if (allEmpty) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Insights</h1>
          <p className="text-sm text-neutral-500 mt-1 dark:text-gray-400">
            Your business analytics at a glance
          </p>
        </div>
        <EmptyStateBanner
          icon={Lightbulb}
          title="Insights are on their way"
          description="As you complete jobs and send invoices, FlowBoss will surface patterns — your most profitable services, busiest days, and top customers."
          actionLabel="Go to Jobs"
          actionHref="/dashboard/jobs"
          accentColor="violet"
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Insights</h1>
        <p className="text-sm text-neutral-500 mt-1 dark:text-gray-400">
          Your business analytics at a glance
        </p>
      </div>

      {/* ── 1. Hero KPIs ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={DollarSign}
          label="Total Revenue"
          value={fmtCurrency.format(analytics.totalRevenue)}
          accent="text-green-600"
          bgAccent="bg-green-50"
        />
        <KPICard
          icon={TrendingUp}
          label="Profit Margin"
          value={`${analytics.profitMargin.toFixed(1)}%`}
          accent={analytics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}
          bgAccent={analytics.profitMargin >= 0 ? 'bg-green-50' : 'bg-red-50'}
        />
        <KPICard
          icon={BarChart3}
          label="Avg Job Value"
          value={fmtCurrency.format(analytics.avgJobValue)}
          accent="text-blue-600"
          bgAccent="bg-blue-50"
        />
        <KPICard
          icon={Briefcase}
          label="Jobs Completed"
          value={fmtNum(analytics.completedJobsCount)}
          accent="text-purple-600"
          bgAccent="bg-purple-50"
        />
      </div>

      {/* ── 2. Money Makers ───────────────────────────────────── */}
      <Section title="Money Makers" subtitle="Revenue per hour by job type" icon={Zap}>
        {analytics.moneyMakers.length === 0 ? (
          <EmptyState msg="No completed jobs with revenue data yet." />
        ) : (
          <div className="space-y-3">
            {analytics.moneyMakers.map((m, i) => {
              const pct = (m.revenuePerHour / analytics.maxRPH) * 100;
              const hue = (pct / 100) * 120; // 0=red, 120=green
              return (
                <div key={m.description + i}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-neutral-700 font-medium truncate max-w-[60%] dark:text-gray-200">
                      {m.description}
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {fmtCurrencyFull.format(m.revenuePerHour)}/hr
                    </span>
                  </div>
                  <div className="h-5 bg-gray-100 rounded-full overflow-hidden dark:bg-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(pct, 4)}%`,
                        backgroundColor: `hsl(${hue}, 65%, 45%)`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5 dark:text-gray-500">
                    {m.count} jobs &middot; {fmtCurrency.format(m.revenue)} total &middot; {m.hours.toFixed(1)} hrs
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ── 3. Customer Leaderboard ───────────────────────────── */}
      <Section title="Customer Leaderboard" subtitle="Top customers by revenue" icon={Users}>
        {analytics.customerLeaderboard.length === 0 ? (
          <EmptyState msg="No paid invoices with customer data yet." />
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="text-xs text-neutral-500 uppercase tracking-wider border-b border-gray-100 dark:text-gray-400 dark:border-white/10">
                  <th className="text-left px-6 py-2 font-medium">#</th>
                  <th className="text-left px-3 py-2 font-medium">Customer</th>
                  <th className="text-right px-3 py-2 font-medium">Revenue</th>
                  <th className="text-right px-3 py-2 font-medium">Jobs</th>
                  <th className="text-right px-3 py-2 font-medium">Avg Ticket</th>
                  <th className="text-right px-6 py-2 font-medium">Last Job</th>
                </tr>
              </thead>
              <tbody>
                {analytics.customerLeaderboard.map((c) => (
                  <tr
                    key={c.rank}
                    className={`border-b border-gray-50 ${
                      c.rank === 1 ? 'bg-amber-50/50' : ''
                    }`}
                  >
                    <td className="px-6 py-3 text-sm">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          c.rank === 1
                            ? 'bg-amber-400 text-white'
                            : 'bg-gray-100 text-neutral-500'
                        }`}
                      >
                        {c.rank}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-neutral-900 dark:text-white">
                      {c.name}
                    </td>
                    <td className="px-3 py-3 text-sm text-right font-semibold text-green-700 dark:text-green-300">
                      {fmtCurrency.format(c.revenue)}
                    </td>
                    <td className="px-3 py-3 text-sm text-right text-neutral-600 dark:text-gray-300">
                      {c.jobCount}
                    </td>
                    <td className="px-3 py-3 text-sm text-right text-neutral-600 dark:text-gray-300">
                      {fmtCurrency.format(c.avgTicket)}
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-neutral-400 dark:text-gray-500">
                      {c.lastJobDate
                        ? format(parseISO(c.lastJobDate), 'MMM d, yyyy')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── 4. Revenue by Month ───────────────────────────────── */}
        <Section title="Revenue by Month" subtitle="Last 12 months" icon={BarChart3}>
          <div className="flex items-end gap-1.5 h-48">
            {analytics.months.map((m, i) => {
              const h = analytics.maxMonthRev > 0
                ? (m.revenue / analytics.maxMonthRev) * 100
                : 0;
              return (
                <div
                  key={m.label}
                  className="flex-1 flex flex-col items-center justify-end h-full gap-1"
                >
                  <span className="text-[10px] text-neutral-500 font-medium dark:text-gray-400">
                    {fmtCurrency.format(m.revenue)}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-brand-500 transition-all duration-500"
                    style={{ height: `${Math.max(h, 2)}%` }}
                  />
                  <span className="text-[9px] text-neutral-400 whitespace-nowrap dark:text-gray-500">
                    {m.label.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Trend direction */}
          {analytics.months.length >= 2 && (
            <div className="mt-3 text-xs text-neutral-500 flex items-center gap-1 dark:text-gray-400">
              {analytics.months[analytics.months.length - 1].revenue >=
              analytics.months[analytics.months.length - 2].revenue ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-green-600 dark:text-green-300">Trending up</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-red-600 dark:text-red-300">Trending down</span>
                </>
              )}
              <span> from previous month</span>
            </div>
          )}
        </Section>

        {/* ── 5. Busiest Days of the Week ──────────────────────── */}
        <Section title="Busiest Days" subtitle="Completed jobs by day of week" icon={Briefcase}>
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
              const count = analytics.dayCounts[dayIdx];
              const pct = (count / analytics.maxDayCount) * 100;
              const isBusiest = dayIdx === analytics.busiestDay && count > 0;
              return (
                <div key={dayIdx} className="flex items-center gap-3">
                  <span
                    className={`w-10 text-xs font-medium ${
                      isBusiest ? 'text-brand-600 font-bold' : 'text-neutral-500'
                    }`}
                  >
                    {DAY_NAMES[dayIdx].slice(0, 3)}
                  </span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden dark:bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isBusiest ? 'bg-brand-500' : 'bg-neutral-300'
                      }`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span
                    className={`text-sm w-8 text-right ${
                      isBusiest ? 'text-brand-600 font-bold' : 'text-neutral-500'
                    }`}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      </div>

      {/* ── 6. Service Area Analysis ──────────────────────────── */}
      <Section title="Service Area Analysis" subtitle="Top zip codes by job volume" icon={MapPin}>
        {analytics.serviceAreas.length === 0 ? (
          <EmptyState msg="No property zip code data available." />
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="text-xs text-neutral-500 uppercase tracking-wider border-b border-gray-100 dark:text-gray-400 dark:border-white/10">
                  <th className="text-left px-6 py-2 font-medium">Zip Code</th>
                  <th className="text-right px-3 py-2 font-medium">Jobs</th>
                  <th className="text-right px-3 py-2 font-medium">Revenue</th>
                  <th className="text-right px-6 py-2 font-medium">Customers</th>
                </tr>
              </thead>
              <tbody>
                {analytics.serviceAreas.map((area) => (
                  <tr key={area.zip} className="border-b border-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-neutral-900 dark:text-white">
                      {area.zip}
                    </td>
                    <td className="px-3 py-3 text-sm text-right text-neutral-600 dark:text-gray-300">
                      {area.jobs}
                    </td>
                    <td className="px-3 py-3 text-sm text-right font-semibold text-green-700 dark:text-green-300">
                      {fmtCurrency.format(area.revenue)}
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-neutral-600 dark:text-gray-300">
                      {area.customers}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── 7. Expense Breakdown ──────────────────────────────── */}
        <Section title="Expense Breakdown" subtitle="Spending by category" icon={Receipt}>
          {analytics.expenseBreakdown.length === 0 ? (
            <EmptyState msg="No expense data yet." />
          ) : (
            <div className="flex gap-6">
              {/* Pie chart */}
              <div className="flex-shrink-0">
                <div
                  className="w-32 h-32 rounded-full"
                  style={{
                    background: analytics.conicStops
                      ? `conic-gradient(${analytics.conicStops})`
                      : '#e5e7eb',
                  }}
                />
                <div className="text-center mt-2 text-sm font-semibold text-neutral-700 dark:text-gray-200">
                  {fmtCurrency.format(analytics.totalExpenses)}
                </div>
              </div>
              {/* Legend */}
              <div className="flex-1 space-y-2 min-w-0">
                {analytics.expenseBreakdown.map((e, i) => (
                  <div key={e.category} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{
                        backgroundColor:
                          analytics.expenseColors[i % analytics.expenseColors.length],
                      }}
                    />
                    <span className="text-sm text-neutral-700 truncate flex-1 dark:text-gray-200">
                      {e.category}
                    </span>
                    <span className="text-sm font-medium text-neutral-500 whitespace-nowrap dark:text-gray-400">
                      {fmtCurrency.format(e.amount)} ({e.pct.toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* ── 8. Payment Speed ─────────────────────────────────── */}
        <Section title="Payment Speed" subtitle="Invoice payment timeline" icon={Clock}>
          <div className="text-center mb-4">
            <span className="text-3xl font-bold text-neutral-900 dark:text-white">
              {analytics.paymentSpeed.avg.toFixed(1)}
            </span>
            <span className="text-sm text-neutral-500 ml-1 dark:text-gray-400">avg days to pay</span>
          </div>
          <div className="space-y-3">
            <PaymentBar
              label="Under 7 days"
              pct={analytics.paymentSpeed.under7Pct}
              color="bg-green-500"
            />
            <PaymentBar
              label="7 - 14 days"
              pct={analytics.paymentSpeed.d7to14Pct}
              color="bg-blue-500"
            />
            <PaymentBar
              label="14 - 30 days"
              pct={analytics.paymentSpeed.d14to30Pct}
              color="bg-amber-500"
            />
            <PaymentBar
              label="Over 30 days"
              pct={analytics.paymentSpeed.over30Pct}
              color="bg-red-500"
            />
          </div>
        </Section>
      </div>

      {/* ── 9. Growth Snapshot ────────────────────────────────── */}
      <Section title="Growth Snapshot" subtitle="This month vs last month" icon={TrendingUp}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GrowthCard
            label="Revenue"
            value={fmtCurrency.format(analytics.growth.revenue.current)}
            change={analytics.growth.revenue.change}
          />
          <GrowthCard
            label="Jobs"
            value={String(analytics.growth.jobs.current)}
            change={analytics.growth.jobs.change}
          />
          <GrowthCard
            label="New Customers"
            value={String(analytics.growth.newCustomers.current)}
            change={analytics.growth.newCustomers.change}
          />
          <GrowthCard
            label="Expenses"
            value={fmtCurrency.format(analytics.growth.expenses.current)}
            change={analytics.growth.expenses.change}
            invertColor
          />
        </div>
      </Section>
    </div>
  );
}

// ── Subcomponents ──────────────────────────────────────────────────

function KPICard({
  icon: Icon,
  label,
  value,
  accent,
  bgAccent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent: string;
  bgAccent: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${bgAccent} mb-3`}>
        <Icon className={`w-5 h-5 ${accent}`} />
      </div>
      <p className="text-sm text-neutral-500 font-medium dark:text-gray-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent}`}>{value}</p>
    </div>
  );
}

function Section({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-5 h-5 text-neutral-400 dark:text-gray-500" />
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h2>
      </div>
      <p className="text-sm text-neutral-400 mb-5 dark:text-gray-500">{subtitle}</p>
      {children}
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="py-8 text-center text-sm text-neutral-400 dark:text-gray-500">{msg}</div>
  );
}

function PaymentBar({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-neutral-600 dark:text-gray-300">{label}</span>
        <span className="font-medium text-neutral-800 dark:text-gray-100">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-4 bg-gray-100 rounded-full overflow-hidden dark:bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
      </div>
    </div>
  );
}

function GrowthCard({
  label,
  value,
  change,
  invertColor = false,
}: {
  label: string;
  value: string;
  change: number;
  invertColor?: boolean;
}) {
  const isPositive = change >= 0;
  // For expenses, up is bad (red), down is good (green)
  const isGood = invertColor ? !isPositive : isPositive;
  return (
    <div className="bg-gray-50 rounded-lg p-4 dark:bg-white/[0.02]">
      <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider dark:text-gray-400">
        {label}
      </p>
      <p className="text-lg font-bold text-neutral-900 mt-1 dark:text-white">{value}</p>
      <div className={`flex items-center gap-1 mt-1 text-sm font-medium ${isGood ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? (
          <TrendingUp className="w-3.5 h-3.5" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5" />
        )}
        <span>{fmtPct(change)}</span>
      </div>
    </div>
  );
}
