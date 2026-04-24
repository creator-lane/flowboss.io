import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, CheckCircle2, DollarSign, Zap } from 'lucide-react';
import {
  startOfWeek,
  endOfWeek,
  subWeeks,
  isBefore,
  isAfter,
  parseISO,
} from 'date-fns';

// ──────────────────────────────────────────────────────────────────────
// MomentumStrip — the "why did I open this app today" strip that sits
// right below the welcome header on the Command Center.
//
// Shows week-over-week momentum on the three metrics that matter most
// to a trade business: jobs completed, cash collected, new customers.
// Each tile also shows a trend arrow (WoW delta) so a daily visitor
// gets a tiny dopamine hit for moving numbers in the right direction.
//
// Rotating insight line underneath pulls from the same data and
// surfaces something specific and actionable — not a generic motivational
// quote. The line changes based on week number + data so the user sees
// something different most logins.
//
// All props are optional-sized arrays; the component handles empty state
// by showing a "First week of tracking" message instead of hiding.
// ──────────────────────────────────────────────────────────────────────

interface JobLike {
  status?: string;
  completedAt?: string;
  completed_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

interface InvoiceLike {
  status?: string;
  total?: number;
  amount?: number;
  paidAt?: string;
  paid_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

interface CustomerLike {
  createdAt?: string;
  created_at?: string;
}

interface MomentumStripProps {
  jobs: JobLike[];
  invoices: InvoiceLike[];
  customers: CustomerLike[];
}

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

function parseDate(val?: string): Date | null {
  if (!val) return null;
  try {
    return parseISO(val);
  } catch {
    return null;
  }
}

function inRange(d: Date | null, start: Date, end: Date): boolean {
  if (!d) return false;
  return !isBefore(d, start) && !isAfter(d, end);
}

function trendArrow(delta: number) {
  if (delta > 0) return <TrendingUp className="w-3.5 h-3.5" />;
  if (delta < 0) return <TrendingDown className="w-3.5 h-3.5" />;
  return <Minus className="w-3.5 h-3.5" />;
}

function trendColor(delta: number, invert = false): string {
  const up = invert ? delta < 0 : delta > 0;
  const down = invert ? delta > 0 : delta < 0;
  if (up) return 'text-emerald-600 dark:text-emerald-300';
  if (down) return 'text-red-600 dark:text-red-300';
  return 'text-gray-500 dark:text-gray-400';
}

function formatDelta(delta: number, isCurrency = false): string {
  const prefix = delta > 0 ? '+' : '';
  if (isCurrency) return `${prefix}${fmtCurrency(delta)}`;
  return `${prefix}${delta}`;
}

export function MomentumStrip({ jobs, invoices, customers }: MomentumStripProps) {
  const metrics = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    // Jobs completed
    const completedJobs = jobs.filter((j) => j.status === 'COMPLETED');
    const jobsThisWeek = completedJobs.filter((j) =>
      inRange(
        parseDate(j.completedAt || j.completed_at || j.updatedAt || j.updated_at),
        thisWeekStart,
        thisWeekEnd
      )
    ).length;
    const jobsLastWeek = completedJobs.filter((j) =>
      inRange(
        parseDate(j.completedAt || j.completed_at || j.updatedAt || j.updated_at),
        lastWeekStart,
        lastWeekEnd
      )
    ).length;

    // Cash collected (paid invoices)
    const paidInvoices = invoices.filter((i) => i.status === 'paid');
    const cashThisWeek = paidInvoices
      .filter((i) =>
        inRange(
          parseDate(i.paidAt || i.paid_at || i.updatedAt || i.updated_at),
          thisWeekStart,
          thisWeekEnd
        )
      )
      .reduce((sum, i) => sum + (i.total || i.amount || 0), 0);
    const cashLastWeek = paidInvoices
      .filter((i) =>
        inRange(
          parseDate(i.paidAt || i.paid_at || i.updatedAt || i.updated_at),
          lastWeekStart,
          lastWeekEnd
        )
      )
      .reduce((sum, i) => sum + (i.total || i.amount || 0), 0);

    // New customers
    const newCustomersThisWeek = customers.filter((c) =>
      inRange(parseDate(c.createdAt || c.created_at), thisWeekStart, thisWeekEnd)
    ).length;
    const newCustomersLastWeek = customers.filter((c) =>
      inRange(parseDate(c.createdAt || c.created_at), lastWeekStart, lastWeekEnd)
    ).length;

    return {
      jobsThisWeek,
      jobsDelta: jobsThisWeek - jobsLastWeek,
      cashThisWeek,
      cashLastWeek,
      cashDelta: cashThisWeek - cashLastWeek,
      newCustomersThisWeek,
      newCustomersDelta: newCustomersThisWeek - newCustomersLastWeek,
      hasHistory:
        jobsLastWeek + cashLastWeek + newCustomersLastWeek > 0 ||
        jobsThisWeek + cashThisWeek + newCustomersThisWeek > 0,
    };
  }, [jobs, invoices, customers]);

  // Rotating insight — deterministic based on (week-of-year + data signal)
  // so the user sees the same insight all week but something new next week.
  const insight = useMemo(() => {
    const candidates: string[] = [];

    if (metrics.cashDelta > 0 && metrics.cashThisWeek > 0) {
      candidates.push(
        `You're up ${formatDelta(metrics.cashDelta, true)} in collections this week. Keep the momentum — check overdue invoices next.`
      );
    }
    if (metrics.jobsDelta >= 2) {
      candidates.push(
        `${metrics.jobsThisWeek} jobs done this week — that's ${metrics.jobsDelta} more than last week. You're pacing ahead.`
      );
    }
    if (metrics.cashThisWeek === 0 && metrics.jobsThisWeek > 0) {
      candidates.push(
        `${metrics.jobsThisWeek} job${
          metrics.jobsThisWeek > 1 ? 's' : ''
        } wrapped this week but nothing collected yet. Send invoices while the work's fresh.`
      );
    }
    if (metrics.newCustomersThisWeek > 0) {
      candidates.push(
        `${metrics.newCustomersThisWeek} new customer${
          metrics.newCustomersThisWeek > 1 ? 's' : ''
        } this week. Ask for a referral after the next job.`
      );
    }
    if (metrics.cashDelta < 0 && metrics.cashLastWeek > 0) {
      candidates.push(
        `Collections dipped ${formatDelta(metrics.cashDelta, true)} vs last week. A 5-minute invoice sweep usually fixes this.`
      );
    }
    if (candidates.length === 0) {
      candidates.push(
        `First week of tracking — finish a job, send an invoice, and you'll see your momentum take shape here.`
      );
    }

    // Pick deterministically: same user sees same insight all week
    const weekSeed = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    return candidates[weekSeed % candidates.length];
  }, [metrics]);

  return (
    <section
      aria-label="This week's momentum"
      className="rounded-2xl border border-neutral-200 bg-white/80 backdrop-blur-sm p-4 shadow-sm dark:bg-white/[0.03] dark:border-white/10"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500/15 to-brand-500/5 flex items-center justify-center ring-1 ring-brand-500/20">
            <Zap className="w-3.5 h-3.5 text-brand-600 dark:text-brand-300" />
          </div>
          <h2 className="text-xs font-bold tracking-wide uppercase text-gray-600 dark:text-gray-300">
            This Week's Momentum
          </h2>
        </div>
        <span className="text-[10px] font-semibold tracking-wider uppercase text-gray-400 dark:text-gray-500">
          vs last week
        </span>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Jobs completed */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-50/30 border border-emerald-100 p-3 dark:from-emerald-500/10 dark:to-transparent dark:border-emerald-500/20">
          <div className="flex items-center justify-between mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${trendColor(
                metrics.jobsDelta
              )}`}
            >
              {trendArrow(metrics.jobsDelta)}
              {formatDelta(metrics.jobsDelta)}
            </span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white leading-none">
            {metrics.jobsThisWeek}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Jobs completed
          </div>
        </div>

        {/* Cash collected */}
        <div className="rounded-xl bg-gradient-to-br from-brand-50 to-brand-50/30 border border-brand-100 p-3 dark:from-brand-500/10 dark:to-transparent dark:border-brand-500/20">
          <div className="flex items-center justify-between mb-1">
            <DollarSign className="w-3.5 h-3.5 text-brand-600 dark:text-brand-300" />
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${trendColor(
                metrics.cashDelta
              )}`}
            >
              {trendArrow(metrics.cashDelta)}
              {formatDelta(metrics.cashDelta, true)}
            </span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white leading-none">
            {fmtCurrency(metrics.cashThisWeek)}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Cash collected
          </div>
        </div>

        {/* New customers */}
        <div className="rounded-xl bg-gradient-to-br from-violet-50 to-violet-50/30 border border-violet-100 p-3 dark:from-violet-500/10 dark:to-transparent dark:border-violet-500/20">
          <div className="flex items-center justify-between mb-1">
            <Zap className="w-3.5 h-3.5 text-violet-600 dark:text-violet-300" />
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${trendColor(
                metrics.newCustomersDelta
              )}`}
            >
              {trendArrow(metrics.newCustomersDelta)}
              {formatDelta(metrics.newCustomersDelta)}
            </span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white leading-none">
            {metrics.newCustomersThisWeek}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            New customers
          </div>
        </div>
      </div>

      {/* Rotating insight line */}
      <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-white/5">
        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-500 mr-2 align-middle" />
          {insight}
        </p>
      </div>
    </section>
  );
}
