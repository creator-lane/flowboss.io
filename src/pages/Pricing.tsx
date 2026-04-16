import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronDown, ChevronUp, Wrench, ArrowRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../lib/auth';

const FEATURES = [
  'Unlimited jobs & invoices',
  'Route optimization',
  'Stripe payment links',
  'QuickBooks sync',
  'Multi-phase projects',
  'GC & sub tracking',
  'Auto-learning pricebook',
  'Financial insights',
  'Customer CRM',
];

const FAQS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. You can cancel your subscription at any time from your account settings. No long-term contracts or cancellation fees.',
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
        <span className="text-base font-medium text-gray-900 dark:text-white">{q}</span>
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
  const monthlyHref = session ? '/checkout?plan=monthly' : '/signup?plan=monthly';
  const annualHref = session ? '/checkout?plan=annual' : '/signup?plan=annual';
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
          14-day free trial · No credit card risk
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight dark:text-white">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-base sm:text-lg text-gray-500 max-w-xl mx-auto dark:text-gray-400">
          Everything you need to run your trade business. No hidden fees, no per-user charges, no nickel-and-diming.
        </p>
      </section>

      {/* Plan cards */}
      <section className="relative max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="grid md:grid-cols-2 gap-5 sm:gap-8">
          {/* Monthly */}
          <div className="relative rounded-3xl border border-gray-200 p-6 sm:p-8 flex flex-col bg-white dark:border-white/10 dark:bg-white/[0.03] dark:backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly</h2>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">$29.99</span>
              <span className="text-gray-500 text-sm dark:text-gray-400">/mo</span>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Billed monthly. Cancel anytime.</p>

            <ul className="mt-6 sm:mt-8 space-y-2.5 flex-1">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="w-4.5 h-4.5 text-green-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              to={monthlyHref}
              className="group mt-7 inline-flex items-center justify-center gap-2 py-3 px-6 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors dark:bg-white/10 dark:hover:bg-white/20"
            >
              Start free trial
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Annual */}
          <div className="relative rounded-3xl border-2 border-blue-600 p-6 sm:p-8 flex flex-col bg-gradient-to-br from-blue-50/50 via-white to-white shadow-xl shadow-blue-500/10 dark:border-blue-500/60 dark:from-blue-500/10 dark:via-transparent dark:to-transparent dark:bg-white/[0.03] dark:backdrop-blur-sm">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-blue-500/40">
              Best value · Save $160
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Annual</h2>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">$199.99</span>
              <span className="text-gray-500 text-sm dark:text-gray-400">/yr</span>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              $16.67/mo &mdash; save $160 vs monthly
            </p>

            <ul className="mt-6 sm:mt-8 space-y-2.5 flex-1">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="w-4.5 h-4.5 text-green-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              to={annualHref}
              className="group mt-7 inline-flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:from-blue-500 hover:to-blue-500 transition-all"
            >
              Start free trial
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6 sm:mt-8 dark:text-gray-400">
          14-day free trial on both plans. Credit card required.
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
