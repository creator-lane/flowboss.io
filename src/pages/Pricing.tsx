import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronDown, ChevronUp, Wrench } from 'lucide-react';
import { useState } from 'react';

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
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-base font-medium text-gray-900">{q}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <p className="pb-4 text-sm text-gray-600 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export function Pricing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-200/60 bg-white/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Wrench className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FlowBoss</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="hidden sm:inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-4 text-center px-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
          Simple, Transparent Pricing
        </h1>
        <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
          Everything you need to run your trade business. No hidden fees, no per-user charges.
        </p>
      </section>

      {/* Plan cards */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Monthly */}
          <div className="rounded-2xl border border-gray-200 p-8 flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900">Monthly</h2>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-gray-900">$29.99</span>
              <span className="text-gray-500 text-sm">/mo</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">Billed monthly. Cancel anytime.</p>

            <ul className="mt-8 space-y-3 flex-1">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <CheckCircle2 className="w-4.5 h-4.5 text-green-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              to="/signup?plan=monthly"
              className="mt-8 block text-center py-3 px-6 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Annual */}
          <div className="rounded-2xl border-2 border-blue-600 p-8 flex flex-col relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              Best Value
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Annual</h2>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-gray-900">$199.99</span>
              <span className="text-gray-500 text-sm">/yr</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              $16.67/mo &mdash; save $160 vs monthly
            </p>

            <ul className="mt-8 space-y-3 flex-1">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <CheckCircle2 className="w-4.5 h-4.5 text-green-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              to="/signup?plan=annual"
              className="mt-8 block text-center py-3 px-6 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          14-day free trial on both plans. Credit card required.
        </p>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-200 px-6">
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>
    </div>
  );
}
