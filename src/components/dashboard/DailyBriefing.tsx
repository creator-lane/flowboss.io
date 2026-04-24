import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, isSameDay, isBefore, parseISO, differenceInMinutes } from 'date-fns';
import { ArrowRight, Calendar, DollarSign, Briefcase, Sparkles } from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────
// DailyBriefing — the "one sentence that tells me what today looks like"
// surface. Sits right below the welcome header, above MomentumStrip.
//
// Composed of:
//   1. A single-sentence briefing that reads off today's schedule +
//      outstanding money + next appointment. Deterministic per day.
//   2. One next-best-action CTA inline.
//
// Why it matters:
//   - Login-time engagement. Users open the app and instantly know what
//     matters today without parsing 5 sections.
//   - Pairs with MomentumStrip (weekly trend) to cover "today" + "this
//     week" at a glance.
//
// Zero new API calls — reads exclusively from props that CommandCenter
// already loads.
// ──────────────────────────────────────────────────────────────────────

interface JobLike {
  id?: string;
  status?: string;
  scheduledStart?: string;
  scheduled_start?: string;
  customer?: { firstName?: string; lastName?: string; first_name?: string; last_name?: string };
}

interface InvoiceLike {
  status?: string;
  total?: number;
  amount?: number;
  balanceDue?: number;
  balance_due?: number;
}

interface DailyBriefingProps {
  todaysJobs: JobLike[];
  invoices: InvoiceLike[];
  overdueCount: number;
  firstName?: string;
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

function customerName(job: JobLike): string {
  const c = job.customer || {};
  const first = c.firstName || c.first_name || '';
  const last = c.lastName || c.last_name || '';
  const full = `${first} ${last}`.trim();
  return full || 'a customer';
}

export function DailyBriefing({
  todaysJobs,
  invoices,
  overdueCount,
}: DailyBriefingProps) {
  const briefing = useMemo(() => {
    const now = new Date();

    // Next upcoming job today (scheduled, not yet complete)
    const upcoming = todaysJobs
      .filter((j) => j.status !== 'COMPLETED' && j.status !== 'CANCELED')
      .map((j) => ({
        job: j,
        start: parseDate(j.scheduledStart || j.scheduled_start),
      }))
      .filter((x) => x.start && isSameDay(x.start as Date, now))
      .sort((a, b) => (a.start as Date).getTime() - (b.start as Date).getTime());

    const nextJob = upcoming.find((x) => !isBefore(x.start as Date, now)) || upcoming[0];

    // Outstanding receivables (not paid, not draft)
    const outstanding = invoices
      .filter((i) => i.status !== 'paid' && i.status !== 'draft')
      .reduce(
        (sum, i) =>
          sum + Number(i.balanceDue || i.balance_due || i.total || i.amount || 0),
        0
      );

    const jobsToday = upcoming.length;

    // Build a single, specific sentence. Priority order:
    //   1. Overdue money — most actionable
    //   2. Next appointment timing
    //   3. Quiet-day pivot to a productive action
    // Each branch includes a CTA with a deep link.
    if (overdueCount > 0) {
      return {
        icon: DollarSign,
        color: 'amber',
        sentence: `${overdueCount} overdue invoice${overdueCount > 1 ? 's' : ''} to chase — ${
          jobsToday > 0 ? `${jobsToday} job${jobsToday > 1 ? 's' : ''} on the schedule too.` : 'no jobs today, perfect window to follow up.'
        }`,
        cta: { label: 'Chase invoices', href: '/dashboard/invoices?status=overdue' },
      };
    }

    if (nextJob && nextJob.start) {
      const mins = differenceInMinutes(nextJob.start, now);
      const absMin = Math.abs(mins);
      const who = customerName(nextJob.job);
      const when =
        mins > 0
          ? mins < 60
            ? `in ${mins} min`
            : `at ${format(nextJob.start, 'h:mm a')}`
          : mins > -30
          ? 'right now'
          : `${absMin} min overdue`;

      const tail =
        outstanding > 0
          ? ` · ${fmtCurrency(outstanding)} outstanding to collect.`
          : jobsToday > 1
          ? ` · ${jobsToday - 1} more after that.`
          : '';

      return {
        icon: Calendar,
        color: 'brand',
        sentence: `Next up: ${who} ${when}${tail}`,
        cta: {
          label: nextJob.job.id ? 'Open job' : 'View schedule',
          href: nextJob.job.id
            ? `/dashboard/jobs/${nextJob.job.id}`
            : '/dashboard/schedule',
        },
      };
    }

    if (jobsToday === 0 && outstanding > 0) {
      return {
        icon: DollarSign,
        color: 'emerald',
        sentence: `No jobs on the schedule today — ${fmtCurrency(
          outstanding
        )} outstanding is the best use of this window.`,
        cta: { label: 'Open invoices', href: '/dashboard/invoices' },
      };
    }

    if (jobsToday === 0 && outstanding === 0) {
      return {
        icon: Sparkles,
        color: 'violet',
        sentence: `Clean slate today. Add a job to your schedule or create an invoice for recent work.`,
        cta: { label: 'Add a job', href: '/dashboard/jobs' },
      };
    }

    // Has jobs today, no outstanding, no overdue — pure schedule day
    return {
      icon: Briefcase,
      color: 'brand',
      sentence: `${jobsToday} job${jobsToday > 1 ? 's' : ''} on the schedule today. Collections are caught up — good spot to be in.`,
      cta: { label: 'See today', href: '/dashboard/schedule' },
    };
  }, [todaysJobs, invoices, overdueCount]);

  const Icon = briefing.icon;
  const colorMap: Record<string, { bg: string; ring: string; text: string; iconText: string }> = {
    brand: {
      bg: 'bg-gradient-to-r from-brand-500/10 via-brand-500/[0.04] to-transparent dark:from-brand-500/15 dark:via-brand-500/5',
      ring: 'ring-brand-500/20 dark:ring-brand-400/30',
      text: 'text-brand-700 dark:text-brand-200',
      iconText: 'text-brand-600 dark:text-brand-300',
    },
    amber: {
      bg: 'bg-gradient-to-r from-amber-500/10 via-amber-500/[0.04] to-transparent dark:from-amber-500/15 dark:via-amber-500/5',
      ring: 'ring-amber-500/20 dark:ring-amber-400/30',
      text: 'text-amber-800 dark:text-amber-200',
      iconText: 'text-amber-600 dark:text-amber-300',
    },
    emerald: {
      bg: 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/[0.04] to-transparent dark:from-emerald-500/15 dark:via-emerald-500/5',
      ring: 'ring-emerald-500/20 dark:ring-emerald-400/30',
      text: 'text-emerald-800 dark:text-emerald-200',
      iconText: 'text-emerald-600 dark:text-emerald-300',
    },
    violet: {
      bg: 'bg-gradient-to-r from-violet-500/10 via-violet-500/[0.04] to-transparent dark:from-violet-500/15 dark:via-violet-500/5',
      ring: 'ring-violet-500/20 dark:ring-violet-400/30',
      text: 'text-violet-800 dark:text-violet-200',
      iconText: 'text-violet-600 dark:text-violet-300',
    },
  };
  const colors = colorMap[briefing.color] || colorMap.brand;

  return (
    <section
      aria-label="Today's briefing"
      className={`relative overflow-hidden rounded-2xl ring-1 ${colors.ring} ${colors.bg} p-4 sm:p-5`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`shrink-0 w-9 h-9 rounded-xl bg-white/60 dark:bg-white/10 backdrop-blur-sm ring-1 ${colors.ring} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${colors.iconText}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] font-bold tracking-wider uppercase ${colors.iconText} mb-0.5`}>
              Today's briefing
            </p>
            <p className={`text-sm sm:text-base font-semibold leading-snug ${colors.text}`}>
              {briefing.sentence}
            </p>
          </div>
        </div>
        <Link
          to={briefing.cta.href}
          className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white text-sm font-semibold text-gray-900 hover:bg-gray-50 shadow-sm ring-1 ring-gray-200 transition-colors dark:bg-white/10 dark:text-white dark:ring-white/10 dark:hover:bg-white/15"
        >
          {briefing.cta.label}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
