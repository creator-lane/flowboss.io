import { ArrowRight, CheckCircle2, Star, X } from 'lucide-react';
import { useState } from 'react';

const screenshots = {
  schedule: '/screenshots/Screenshot_20260327-151517.png',
  route: '/screenshots/Screenshot_20260327-151703.png',
  project: '/screenshots/Screenshot_20260327-151838.png',
  addJob: '/screenshots/Screenshot_20260327-152010.png',
  invoice: '/screenshots/Screenshot_20260327-152047.png',
  insights: '/screenshots/Screenshot_20260327-152240.png',
  history: '/screenshots/Screenshot_20260327-152308.png',
};

const features = [
  {
    img: screenshots.schedule,
    title: 'Your Day, Organized',
    desc: 'Your entire day on one screen. Jobs, projects, earnings, and drive time — all at a glance.',
    bullets: [
      'Calendar view with Today, Tomorrow, and Week tabs',
      'Live job count, completed count, and earnings total',
      'See each job\'s customer, address, time window, and progress',
      'One-tap route optimization saves 20+ minutes of driving daily',
      'Real-time job timer with persistence across app restarts',
    ],
    alt: 'FlowBoss schedule screen showing daily jobs, projects, and route optimization',
  },
  {
    img: screenshots.route,
    title: 'Route Optimization',
    desc: 'Stop zigzagging across town. FlowBoss reorders your day to cut drive time and fit more jobs in.',
    bullets: [
      'One tap to optimize your entire day\'s route',
      'See total miles, drive time, and time saved before you leave',
      'Drag to manually reorder if you need to prioritize a job',
      'Works with your existing schedule — no extra setup',
      'Saves 20+ minutes per day for most contractors',
    ],
    alt: 'Route optimization showing 22 minutes saved with optimized schedule',
  },
  {
    img: screenshots.invoice,
    title: 'Invoice On-Site, Get Paid On-Site',
    desc: 'Create professional invoices the moment you finish. Send a Stripe payment link and get paid before you leave the driveway.',
    bullets: [
      'Build invoices with line items from your auto-learning pricebook',
      'Send Stripe payment links via text or email — instant collection',
      'QuickBooks sync pushes invoices and auto-reconciles payments',
      'Track paid, unpaid, and overdue at a glance on Financials tab',
      'Photo attachments for documentation and proof of work',
    ],
    alt: 'Invoice screen with line items and Stripe payment link',
  },
  {
    img: screenshots.project,
    title: 'Multi-Phase Project Tracking',
    desc: 'Big jobs like repipes, panel upgrades, and HVAC installs broken into phases with tasks and materials. Complete an entire phase with one tap.',
    bullets: [
      'Templates pre-loaded for your trade — plumbing, HVAC, electrical',
      'Break projects into phases, each with its own tasks and materials',
      'Track material quantities, costs, and markup per phase',
      'One-tap "Complete All" to finish an entire phase at once',
      'See project progress percentage and remaining work at a glance',
    ],
    alt: 'Project detail showing phases, tasks, materials, and Complete All button',
  },
  {
    img: screenshots.addJob,
    title: 'Built for Subs & GC Relationships',
    desc: 'The only field service app that understands how subcontractors actually work. Track which GCs send you jobs, see revenue per contractor, and know where your money comes from.',
    bullets: [
      'Toggle any job as GC-referred and tag the general contractor',
      'See total revenue, job count, and average ticket per GC',
      'AI job suggestions based on your work history and trade',
      'Track direct vs GC revenue split across your entire business',
      'Customer auto-links so you know who referred every client',
    ],
    alt: 'Add Job screen with GC toggle and AI job suggestions',
  },
  {
    img: screenshots.insights,
    title: 'Know Your Numbers Cold',
    desc: 'Revenue per hour, profit margins, top-earning job types, expense breakdown — the financial clarity you need to stop guessing and start scaling.',
    bullets: [
      'Revenue per hour tells you which jobs are actually worth your time',
      'Profit margin breakdown by job type, customer, and time period',
      'See your top earners and underperformers side by side',
      'Monthly and weekly revenue trends with visual charts',
      'Expense tracking so you know your real take-home, not just gross',
    ],
    alt: 'Insights dashboard showing revenue per hour, profit margin, and top earners',
  },
  {
    img: screenshots.history,
    title: 'Complete Work History',
    desc: 'Every job and project you\'ve ever done, searchable and filterable. See patterns in your business you\'d never spot on paper.',
    bullets: [
      'Filter by customer, date range, job type, or GC source',
      'See direct vs GC-referred revenue split at a glance',
      'Job intelligence detects patterns — repeat customers, seasonal trends',
      'Commingled view of jobs and multi-phase projects in one timeline',
      'Export-ready data for tax season or business planning',
    ],
    alt: 'Work History with filters, GC badges, and revenue split',
  },
];

const pricingFeatures = [
  'Unlimited jobs & invoices',
  'Route optimization',
  'Stripe payment links & on-site collection',
  'QuickBooks invoice sync',
  'Multi-phase project tracking',
  'GC & subcontractor revenue tracking',
  'Auto-learning pricebook',
  'Financial insights & revenue per hour',
  'Customer CRM & work history',
  'AI job suggestions',
  'Photo documentation',
  'Trade-specific templates',
];

const testimonials = [
  {
    quote: 'Pays for itself 100x over.',
    name: 'Mike R.',
    location: 'Tampa, FL',
  },
  {
    quote: 'Finally an app that gets how subs actually work.',
    name: 'Carlos D.',
    location: 'Austin, TX',
  },
  {
    quote: 'The GC tracking alone is worth the price.',
    name: 'James T.',
    location: 'Denver, CO',
  },
];

function PhoneFrame({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="rounded-[2rem] overflow-hidden shadow-2xl border-[6px] border-gray-900 bg-gray-900">
        <img
          src={src}
          alt={alt}
          className="w-full h-auto block"
          loading="lazy"
        />
      </div>
    </div>
  );
}

export function HomePage() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <>
      {/* Demo Video Modal */}
      {showDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowDemo(false)}>
          <div className="relative w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowDemo(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: '9/16' }}>
              <iframe
                src="https://www.youtube.com/embed/PBBHT10QigI?autoplay=1"
                title="FlowBoss Demo"
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-white" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-6 border border-blue-100">
                <Star className="w-3.5 h-3.5 fill-current" />
                Built for contractors, by contractors
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight">
                Run Your Trade.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-500">
                  Not Your Paperwork.
                </span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-gray-600 leading-relaxed max-w-lg">
                The field service app built for plumbers, HVAC techs, and electricians. Schedule jobs, invoice on-site, and know which jobs make you the most per hour.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <a
                  href="https://apps.apple.com/app/id6761025816"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all shadow-lg text-lg"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  App Store
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.flowboss.app"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all shadow-lg text-lg"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.67c-.41-.2-.68-.6-.68-1.06V1.39c0-.46.27-.86.68-1.06l11.4 11.67L3.18 23.67zm1.72.28L16.22 13.2l2.76 2.83-12.24 7.1c-.26.15-.55.18-.84.12zm0-23.9c.29-.06.58-.03.84.12l12.24 7.1-2.76 2.83L4.9.05zM20.54 13.85L17.2 12l3.34-1.85c.66.38 1.06 1.08 1.06 1.85s-.4 1.47-1.06 1.85z"/></svg>
                  Google Play
                </a>
                <button
                  onClick={() => setShowDemo(true)}
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-lg"
                >
                  ▶ Watch Demo
                </button>
              </div>
              <p className="mt-4 text-sm text-gray-500">14-day free trial. No credit card required.</p>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="w-[280px] sm:w-[320px] transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <PhoneFrame
                  src={screenshots.schedule}
                  alt="FlowBoss schedule screen showing daily jobs and route optimization"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trades */}
      <section id="trades" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            Built for Your Trade
          </h2>
          <p className="text-center text-gray-600 mb-14 max-w-xl mx-auto text-lg">
            Pre-loaded with materials, project templates, and pricing specific to your industry.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { emoji: '\uD83D\uDD27', name: 'Plumbing', desc: 'Water heaters, repipes, drain cleaning, gas lines, and more. Templates built for how plumbers actually work.' },
              { emoji: '\u2744\uFE0F', name: 'HVAC', desc: 'AC installs, furnaces, ductwork, heat pumps. Track equipment, refrigerant, and maintenance contracts.' },
              { emoji: '\u26A1', name: 'Electrical', desc: 'Panel upgrades, rewires, EV chargers, generators. Material lists and pricing pre-loaded for you.' },
            ].map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="text-4xl mb-4">{t.emoji}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t.name}</h3>
                <p className="text-gray-600 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features — alternating screenshot + text */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            Everything You Need in the Field
          </h2>
          <p className="text-center text-gray-600 mb-20 max-w-2xl mx-auto text-lg">
            Stop juggling spreadsheets, paper invoices, and separate apps. FlowBoss handles it all.
          </p>
          <div className="space-y-24 md:space-y-32">
            {features.map((f, i) => {
              const isReversed = i % 2 === 1;
              return (
                <div
                  key={f.title}
                  className={`flex flex-col ${isReversed ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 md:gap-16`}
                >
                  <div className="w-full md:w-1/2 flex justify-center">
                    <div className={`w-[240px] sm:w-[280px] transform ${isReversed ? '-rotate-2' : 'rotate-2'} hover:rotate-0 transition-transform duration-500`}>
                      <PhoneFrame src={f.img} alt={f.alt} />
                    </div>
                  </div>
                  <div className="w-full md:w-1/2">
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{f.title}</h3>
                    <p className="text-lg text-gray-600 leading-relaxed max-w-md mb-5">{f.desc}</p>
                    {f.bullets && (
                      <ul className="space-y-2.5 max-w-md">
                        {f.bullets.map((b) => (
                          <li key={b} className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4.5 h-4.5 text-blue-500 shrink-0 mt-0.5" />
                            <span className="text-gray-600 text-[15px] leading-relaxed">{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-center text-gray-600 mb-14 max-w-xl mx-auto text-lg">
            Everything included. No per-user fees. No hidden costs. Start free for 14 days.
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Monthly */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden flex flex-col">
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Monthly</h3>
                <p className="text-sm text-gray-500 mb-6">Pay as you go, cancel anytime</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">$29.99</span>
                  <span className="text-gray-500">/mo</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {pricingFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4.5 h-4.5 text-green-500 shrink-0" />
                      <span className="text-gray-700 text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="https://apps.apple.com/app/id6761025816"
                  className="block w-full text-center px-6 py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all"
                >
                  Start Free Trial
                </a>
              </div>
            </div>

            {/* Annual */}
            <div className="bg-white rounded-3xl border-2 border-blue-500 shadow-xl overflow-hidden flex flex-col relative">
              <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-center text-sm font-semibold py-1.5">
                Best Value — Save $160/yr
              </div>
              <div className="p-8 pt-12 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Annual</h3>
                <p className="text-sm text-gray-500 mb-6">Lock in the lowest price</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-extrabold text-gray-900">$16.67</span>
                  <span className="text-gray-500">/mo</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">Billed annually at $199.99/yr</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {pricingFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4.5 h-4.5 text-green-500 shrink-0" />
                      <span className="text-gray-700 text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="https://apps.apple.com/app/id6761025816"
                  className="block w-full text-center px-6 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25"
                >
                  Start Free Trial
                </a>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">14-day free trial on both plans. No credit card required.</p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-14">
            Trusted by Contractors
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-900 text-lg font-medium mb-6 leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-500">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to take control of your business?
          </h2>
          <p className="text-gray-400 mb-10 max-w-md mx-auto text-lg">
            Join contractors already using FlowBoss to schedule smarter, invoice faster, and earn more.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://apps.apple.com/app/id6761025816"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 text-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              App Store
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.flowboss.app"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 text-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.67c-.41-.2-.68-.6-.68-1.06V1.39c0-.46.27-.86.68-1.06l11.4 11.67L3.18 23.67zm1.72.28L16.22 13.2l2.76 2.83-12.24 7.1c-.26.15-.55.18-.84.12zm0-23.9c.29-.06.58-.03.84.12l12.24 7.1-2.76 2.83L4.9.05zM20.54 13.85L17.2 12l3.34-1.85c.66.38 1.06 1.08 1.06 1.85s-.4 1.47-1.06 1.85z"/></svg>
              Google Play
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-500">14-day free trial. No credit card required.</p>
        </div>
      </section>
    </>
  );
}
