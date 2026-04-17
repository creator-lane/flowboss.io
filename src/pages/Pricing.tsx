import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronDown, ChevronUp, Wrench, ArrowRight, Sparkles, HardHat, Users, Gift } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../lib/auth';

const GC_FEATURES = [
  'Unlimited jobs & invoices',
  'GC command center',
  'Zone-based project visualizer',
  'Invite unlimited subs (free for them)',
  'Route optimization',
  'Stripe payment links',
  'QuickBooks sync',
  'Auto-learning pricebook',
  'Financial insights',
  'Customer CRM',
];

const SUB_FREE_FEATURES = [
  'Every GC project you\'re invited to',
  'Your assigned tasks & schedule',
  'Read-only earnings view',
  'Message the GC & co-subs',
  'FlowBoss Score & public profile',
  'Photo documentation',
  'Mobile + web access',
];

const SUB_PRO_FEATURES = [
  'Everything in Sub Free, plus:',
  'Your own direct jobs & customers',
  'Send direct Stripe invoices',
  'Auto-learning pricebook',
  'QuickBooks sync',
  'Revenue-per-hour analytics',
  'Route optimization',
  'Marketplace listing priority',
];

const FAQS = [
  {
    q: 'Who pays when a GC invites me as a sub?',
    a: 'Nobody. When a general contractor invites you to their project on FlowBoss, you get full access to that project — your tasks, schedule, messages, earnings view — completely free, forever. The GC covers their own subscription. There\'s no seat fee, no per-project fee, no trial timer. Invited subs are always free.',
  },
  {
    q: 'When would a sub pay for Sub Pro?',
    a: 'Sub Pro is for subs who want to run their own shop alongside GC work — bringing in their own customers, sending direct invoices, syncing QuickBooks, and tracking revenue-per-hour across both direct and GC-referred work. If you only work through GCs, you never need to pay. When you accept your first GC invite, you automatically get a 14-day Pro trial so you can test-drive the full product.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel your subscription at any time from your account settings. No long-term contracts, no cancellation fees. Free tiers never expire.',
  },
  {
    q: 'What happens after the trial?',
    a: 'After your 14-day free trial ends, your card is charged automatically for the plan you selected. You can cancel before the trial ends to avoid being charged.',
  },
  {
    q: 'Do I need a separate web account?',
    a: 'No, the same account works on mobile and web. Sign up once and access FlowBoss from any device.',
  },
  {
    q: 'Is my data synced between mobile and web?',
    a: 'Yes, everything is stored in the same database. Changes you make on one device appear instantly on the other.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 last:border-0 dark:border-white/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-base font-medium text-gray-900 dark:text-white pr-4">{q}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 dark:text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 dark:text-gray-500" />
        )}
      </button>
      {open && (
        <p className="pb-4 text-sm text-gray-600 leading-relaxed dark:text-gray-400">{a}</p>
      )}
    </div>
  );
}

export function Pricing() {
  const { session } = useAuth();
  const gcMonthlyHref = session ? '/checkout?plan=monthly' : '/signup?plan=monthly';
  const gcAnnualHref = session ? '/checkout?plan=annual' : '/signup?plan=annual';
  const subProHref = session ? '/checkout?plan=sub_pro_monthly' : '/signup?plan=sub_pro_monthly';
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');

  // Transparent pricing: the big number is always what you're actually charged
  // at the selected billing interval. The subtext shows the other option + honest
  // savings. No per-month-equivalent math tricks in the headline.
  const gcPrice = billing === 'annual' ? '$199.99' : '$29.99';
  const gcInterval = billing === 'annual' ? '/yr' : '/mo';
  const gcSubtext = billing === 'annual'
    ? 'Works out to $16.67/mo · save $160 vs monthly'
    : 'or $199.99/yr (save $160) · cancel anytime';
  const gcHref = billing === 'annual' ? gcAnnualHref : gcMonthlyHref;

  const subProPrice = billing === 'annual' ? '$99' : '$14.99';
  const subProInterval = billing === 'annual' ? '/yr' : '/mo';
  const subProSubtext = billing === 'annual'
    ? 'Works out to $8.25/mo · save $80 vs monthly'
    : 'or $99/yr (save $80) · cancel anytime';
  const subProAnnualHref = session ? '/checkout?plan=sub_pro_annual' : '/signup?plan=sub_pro_annual';
  const subProBtnHref = billing === 'annual' ? subProAnnualHref : subProHref;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white dark:bg-gray-950">
      {/* Dark-mode atmospheric glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden hidden dark:block">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-gray-200/60 bg-white/80 backdrop-blur-lg dark:border-white/10 dark:bg-gray-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Wrench className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">FlowBoss</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-300 dark:hover:text-white px-2 py-1.5"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-blue-500 hover:to-blue-500 transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/40"
            >
              <span>Start trial</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 sm:pt-20 pb-4 text-center px-4 sm:px-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-semibold tracking-wide text-blue-600 dark:text-blue-300 uppercase mb-4">
          <Sparkles className="w-3 h-3" />
          Built for GCs and Subs
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight dark:text-white">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-base sm:text-lg text-gray-500 max-w-2xl mx-auto dark:text-gray-400">
          Invited subs are always free. GCs get the full command center. Self-employed subs get their own shop for less.
        </p>

        {/* Billing toggle — bumped contrast so it reads as an actual interactive
            control. The selected option now sits on FlowBoss blue with white
            text; the off option stays readable but obviously inactive. */}
        <div className="mt-4 mb-1 text-[11px] font-semibold tracking-wider uppercase text-gray-500 dark:text-gray-500">
          Choose billing period
        </div>
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 shadow-sm">
          <button
            type="button"
            onClick={() => setBilling('monthly')}
            aria-pressed={billing === 'monthly'}
            className={`px-5 py-2 text-sm font-semibold rounded-full transition-all ${
              billing === 'monthly'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBilling('annual')}
            aria-pressed={billing === 'annual'}
            className={`px-5 py-2 text-sm font-semibold rounded-full transition-all flex items-center gap-1.5 ${
              billing === 'annual'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Annual
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              billing === 'annual'
                ? 'bg-white/20 text-white'
                : 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400'
            }`}>
              SAVE ~45%
            </span>
          </button>
        </div>
      </section>

      {/* Three tier cards */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid md:grid-cols-3 gap-5 sm:gap-6">

          {/* ── Sub Free ─────────────────────────────────── */}
          <div className="relative rounded-3xl border border-gray-200 p-6 sm:p-7 flex flex-col bg-white dark:border-white/10 dark:bg-white/[0.03] dark:backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <Gift className="w-4.5 h-4.5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-green-600 dark:text-green-400">Invited Subs</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sub Free</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">For subs invited by a GC</p>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">$0</span>
              <span className="text-gray-500 text-sm dark:text-gray-400">/forever</span>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">No credit card · No trial timer</p>

            <ul className="mt-6 space-y-2.5 flex-1">
              {SUB_FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="w-4.5 h-4.5 text-green-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-6 p-3 rounded-xl bg-green-50 border border-green-200 dark:bg-green-500/5 dark:border-green-500/20">
              <p className="text-xs text-green-800 dark:text-green-300 leading-relaxed">
                <strong>How it works:</strong> A GC sends you an invite link. You sign up free. You get your own
                workspace for their project. Full stop — nothing to pay, ever.
              </p>
            </div>
          </div>

          {/* ── GC / Contractor (primary) ────────────────── */}
          <div className="relative rounded-3xl border-2 border-blue-600 p-6 sm:p-7 flex flex-col bg-gradient-to-br from-blue-50/50 via-white to-white shadow-xl shadow-blue-500/10 dark:border-blue-500/60 dark:from-blue-500/10 dark:via-transparent dark:to-transparent dark:bg-white/[0.03] dark:backdrop-blur-sm md:scale-105">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-blue-500/40">
              Most popular
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <HardHat className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400">GCs &amp; Contractors</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contractor</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Run projects, crew, and your whole shop</p>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">{gcPrice}</span>
              <span className="text-gray-500 text-sm dark:text-gray-400">{gcInterval}</span>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{gcSubtext}</p>

            <ul className="mt-6 space-y-2.5 flex-1">
              {GC_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="w-4.5 h-4.5 text-green-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              to={gcHref}
              className="group mt-6 inline-flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:from-blue-500 hover:to-blue-500 transition-all"
            >
              Start 14-day free trial
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* ── Sub Pro ──────────────────────────────────── */}
          <div className="relative rounded-3xl border border-gray-200 p-6 sm:p-7 flex flex-col bg-white dark:border-white/10 dark:bg-white/[0.03] dark:backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Users className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400">Self-employed Subs</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sub Pro</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">For subs who also run their own shop</p>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">{subProPrice}</span>
              <span className="text-gray-500 text-sm dark:text-gray-400">{subProInterval}</span>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{subProSubtext}</p>

            <ul className="mt-6 space-y-2.5 flex-1">
              {SUB_PRO_FEATURES.map((f, i) => (
                <li key={f} className={`flex items-start gap-2.5 text-sm ${i === 0 ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  {i === 0 ? (
                    <Sparkles className="w-4.5 h-4.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4.5 h-4.5 text-green-500 flex-shrink-0 mt-0.5" />
                  )}
                  {f}
                </li>
              ))}
            </ul>

            <Link
              to={subProBtnHref}
              className="group mt-6 inline-flex items-center justify-center gap-2 py-3 px-6 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors dark:bg-white/10 dark:hover:bg-white/20"
            >
              Start 14-day Pro trial
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <p className="text-[11px] text-gray-400 mt-2 text-center dark:text-gray-500">
              Free trial auto-starts when a GC invites you
            </p>
          </div>
        </div>

        {/* How it works strip */}
        <div className="mt-10 sm:mt-14 rounded-2xl border border-gray-200 bg-gray-50 dark:bg-white/[0.03] dark:border-white/10 p-5 sm:p-7">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
            How the pricing works
          </h3>
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 text-sm">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-md bg-green-500/15 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-green-700 dark:text-green-400">1</span>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">You're an invited sub</p>
              </div>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed pl-8">
                A GC invites you to their project. You sign up. You work the job. You never pay. Simple.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-md bg-blue-500/15 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400">2</span>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">You run a GC business</p>
              </div>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed pl-8">
                You manage projects, crew, subs, and customers. $29.99/mo or $199.99/yr.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-md bg-indigo-500/15 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400">3</span>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">You also want direct customers</p>
              </div>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed pl-8">
                Sub Pro unlocks your own shop — direct jobs, invoicing, QBO, analytics. $14.99/mo or $99/yr.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8 dark:text-gray-400">
          14-day free trial on Contractor and Sub Pro. Credit card required for trial. Cancel anytime.
        </p>
      </section>

      {/* FAQ */}
      <section className="relative max-w-2xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-6 sm:mb-8 dark:text-white tracking-tight">
          Frequently asked
        </h2>
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-200 px-5 sm:px-6 dark:bg-white/[0.03] dark:backdrop-blur-sm dark:border-white/10 dark:divide-white/10">
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>
    </div>
  );
}
