import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Calendar,
  ArrowRight,
  Clock,
  AlertCircle,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';

// ──────────────────────────────────────────────────────────────────────
// /demo — the "show, don't tell" public preview of FlowBoss.
//
// No auth, no signup, no data from Supabase. Everything rendered here
// is computed from the in-memory fixture below so marketing can link
// straight to this page from the landing, from emails, from Google Ads.
//
// Path A (shipped today): read-only preview of Command Center with
// realistic contractor data. Buttons prompt signup. Future: Path B
// interactive sandbox with writes that reset on refresh.
// ──────────────────────────────────────────────────────────────────────

const TODAY = new Date();
const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

// Realistic plumbing contractor week
const DEMO = {
  businessName: "Rivera Plumbing",
  firstName: "Marcos",
  todaysJobs: [
    {
      id: 'd1',
      customer: 'Sarah Mitchell',
      description: 'Water heater replacement — 50 gal gas',
      time: '9:00 AM',
      status: 'IN_PROGRESS',
      address: '142 Oak Lane',
      estimate: 1735,
    },
    {
      id: 'd2',
      customer: 'Tom Rodriguez',
      description: 'Kitchen faucet install',
      time: '1:30 PM',
      status: 'SCHEDULED',
      address: '2281 Maple Dr',
      estimate: 285,
    },
    {
      id: 'd3',
      customer: 'Karen & Dave Chen',
      description: 'Sewer line camera inspection',
      time: '4:00 PM',
      status: 'SCHEDULED',
      address: '509 Birch Ct',
      estimate: 364,
    },
  ],
  weekMetrics: {
    jobsCompleted: 12,
    jobsLastWeek: 9,
    cashCollected: 8420,
    cashLastWeek: 6150,
    newCustomers: 4,
    newCustomersLastWeek: 2,
  },
  overdueInvoices: [
    { id: 'o1', customer: 'James Taylor', amount: 1250, daysOverdue: 17 },
    { id: 'o2', customer: 'Priya Patel', amount: 495, daysOverdue: 6 },
  ],
  outstanding: 4782,
  streak: 9,
};

export function Demo() {
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  const weekDelta = useMemo(() => {
    const { jobsCompleted, jobsLastWeek, cashCollected, cashLastWeek } = DEMO.weekMetrics;
    return {
      jobsPct: Math.round(((jobsCompleted - jobsLastWeek) / Math.max(jobsLastWeek, 1)) * 100),
      cashPct: Math.round(((cashCollected - cashLastWeek) / Math.max(cashLastWeek, 1)) * 100),
    };
  }, []);

  const handleInteraction = () => setShowSignupPrompt(true);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top demo bar */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-violet-600 to-brand-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>You're viewing a live demo of FlowBoss — no signup needed</span>
          </div>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-brand-700 text-xs sm:text-sm font-bold hover:bg-gray-100 transition-colors shadow-sm"
          >
            Try it free
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Welcome header */}
        <div className="bg-gradient-to-r from-brand-500/5 to-transparent dark:from-brand-500/10 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Good morning, {DEMO.businessName}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {format(TODAY, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600 ring-1 ring-inset ring-green-500/20 dark:bg-green-500/10 dark:text-green-300">
                <Calendar className="w-3.5 h-3.5" />
                {DEMO.todaysJobs.length} jobs today
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 ring-1 ring-inset ring-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                <AlertCircle className="w-3.5 h-3.5" />
                {DEMO.overdueInvoices.length} overdue
              </span>
            </div>
          </div>
        </div>

        {/* Daily briefing */}
        <section className="rounded-2xl ring-1 ring-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/[0.04] to-transparent p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-9 h-9 rounded-xl bg-white/60 ring-1 ring-amber-500/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider uppercase text-amber-600">
                  Today's briefing
                </p>
                <p className="text-sm sm:text-base font-semibold text-amber-800 dark:text-amber-200">
                  {DEMO.overdueInvoices.length} overdue invoices to chase — 3 jobs on the schedule too.
                </p>
              </div>
            </div>
            <button
              onClick={handleInteraction}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 transition-colors"
            >
              Chase invoices
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Momentum + streak */}
        <div className="flex flex-col lg:flex-row gap-4">
          <section className="flex-1 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">This week vs last</h3>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Metric
                label="Jobs done"
                value={String(DEMO.weekMetrics.jobsCompleted)}
                delta={`${weekDelta.jobsPct > 0 ? '+' : ''}${weekDelta.jobsPct}%`}
                positive={weekDelta.jobsPct >= 0}
              />
              <Metric
                label="Collected"
                value={fmtCurrency(DEMO.weekMetrics.cashCollected)}
                delta={`${weekDelta.cashPct > 0 ? '+' : ''}${weekDelta.cashPct}%`}
                positive={weekDelta.cashPct >= 0}
              />
              <Metric
                label="New customers"
                value={String(DEMO.weekMetrics.newCustomers)}
                delta={`+${DEMO.weekMetrics.newCustomers - DEMO.weekMetrics.newCustomersLastWeek}`}
                positive
              />
            </div>
          </section>

          <section className="lg:w-64 shrink-0 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 ring-1 ring-orange-200/60 flex items-center justify-center">
              <span className="text-xl">🔥</span>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider uppercase text-gray-500">Login streak</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{DEMO.streak}-day streak</p>
              <p className="text-xs text-gray-500">Keep it going</p>
            </div>
          </section>
        </div>

        {/* Today's schedule + outstanding */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <section className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Today's Schedule</h2>
              <button onClick={handleInteraction} className="text-xs text-brand-600 font-medium hover:underline">
                View full schedule
              </button>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {DEMO.todaysJobs.map((job) => (
                <button
                  key={job.id}
                  onClick={handleInteraction}
                  className="w-full flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-gray-50 dark:hover:bg-gray-800 -mx-2 px-2 rounded-lg transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-gray-900 dark:text-white block truncate">{job.customer}</span>
                      <span className="text-xs text-gray-500 truncate block">{job.description}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{job.time}</span>
                    <StatusPill status={job.status} />
                  </div>
                </button>
              ))}
            </div>
          </section>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Outstanding</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmtCurrency(DEMO.outstanding)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {DEMO.overdueInvoices.length} overdue · 4 total unpaid
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">This Month</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmtCurrency(24150)}</p>
              <p className="text-xs text-gray-500 mt-1">18 paid invoices</p>
            </div>
          </div>
        </div>

        {/* Sign up CTA card */}
        <section className="rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 text-white p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Your dashboard could look like this in 3 minutes</h2>
              <p className="text-sm sm:text-base text-white/80 mb-4 sm:mb-0">
                14-day free trial. No credit card to start exploring. Cancel anytime before billing.
              </p>
            </div>
            <Link
              to="/signup"
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-brand-700 font-bold hover:bg-gray-100 transition-colors shadow-lg"
            >
              Get started free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <p className="text-center text-xs text-gray-400 pb-4">
          This page shows sample data for a plumbing contractor. Everything you'd do here works exactly the same in the real app.
        </p>
      </div>

      {/* Signup prompt modal */}
      {showSignupPrompt && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowSignupPrompt(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Sign up to dig in
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  You're on the demo page. Create an account to open jobs, text customers, send real invoices, and start building your book.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignupPrompt(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Keep browsing
              </button>
              <Link
                to="/signup"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold transition-colors"
              >
                Create account
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, delta, positive }: { label: string; value: string; delta: string; positive: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold tracking-wider uppercase text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      <p className={`text-xs font-semibold mt-0.5 ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
        {delta} vs last week
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    SCHEDULED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Scheduled' },
    IN_PROGRESS: { bg: 'bg-cyan-50', text: 'text-cyan-700', label: 'In progress' },
    COMPLETED: { bg: 'bg-green-50', text: 'text-green-700', label: 'Complete' },
  };
  const cfg = map[status] || map.SCHEDULED;
  return (
    <span className={`inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}
