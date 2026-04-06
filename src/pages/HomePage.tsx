import { ArrowRight, CheckCircle2, Star } from 'lucide-react';

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
    desc: 'See every job, project, and earning at a glance. Route-optimized automatically.',
    alt: 'FlowBoss schedule screen showing daily jobs, projects, and route optimization',
  },
  {
    img: screenshots.route,
    title: 'Save Drive Time',
    desc: 'One tap to reorder your day. Save 20+ minutes of driving, every day.',
    alt: 'Route optimization showing 22 minutes saved with optimized schedule',
  },
  {
    img: screenshots.invoice,
    title: 'Get Paid Faster',
    desc: 'Create invoices on-site. Stripe payment links. Get paid before you leave.',
    alt: 'Invoice screen with line items and Stripe payment link',
  },
  {
    img: screenshots.project,
    title: 'Track Every Phase',
    desc: 'Big jobs broken into phases, tasks, and materials. Complete a whole phase with one tap.',
    alt: 'Project detail showing phases, tasks, materials, and Complete All button',
  },
  {
    img: screenshots.addJob,
    title: 'GC Jobs, One Tap',
    desc: 'Track which contractors send you work. See revenue per GC. The only app that gets how subs work.',
    alt: 'Add Job screen with GC toggle and AI job suggestions',
  },
  {
    img: screenshots.insights,
    title: 'Know Your Numbers',
    desc: 'Which jobs earn the most per hour? Insights breaks it down so you can scale smart.',
    alt: 'Insights dashboard showing revenue per hour, profit margin, and top earners',
  },
  {
    img: screenshots.history,
    title: 'Every Job, Tracked',
    desc: 'Filter by customer, date, type. See direct vs GC revenue at a glance.',
    alt: 'Work History with filters, GC badges, and revenue split',
  },
];

const pricingFeatures = [
  'Unlimited jobs & invoices',
  'Route optimization',
  'Stripe payment links',
  'Project & phase tracking',
  'GC / subcontractor tracking',
  'Revenue insights & analytics',
  'Work history & filters',
  'AI job suggestions',
  'Priority support',
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
  return (
    <>
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
                  href="https://play.google.com/store/apps/details?id=com.creatorlane.flowboss"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25 text-lg"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </a>
                <a
                  href="https://youtube.com/shorts/PBBHT10QigI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-lg"
                >
                  ▶ Watch Demo
                </a>
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
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{f.title}</h3>
                    <p className="text-lg text-gray-600 leading-relaxed max-w-md">{f.desc}</p>
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
            One plan. Everything included. No hidden fees.
          </p>
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
              <div className="p-8 md:p-10">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium mb-4">
                    14-day free trial
                  </div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-extrabold text-gray-900">$29.99</span>
                    <span className="text-gray-500 text-lg">/mo</span>
                  </div>
                  <div className="mt-3 text-gray-500">
                    or <span className="font-semibold text-gray-900">$199.99/yr</span>{' '}
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                      Save 44%
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">No credit card required to start</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {pricingFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      <span className="text-gray-700">{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="https://play.google.com/store/apps/details?id=com.creatorlane.flowboss"
                  className="block w-full text-center px-6 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25 text-lg"
                >
                  Start Free Trial
                </a>
              </div>
            </div>
          </div>
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
          <a
            href="https://play.google.com/store/apps/details?id=com.creatorlane.flowboss"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 text-lg"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </a>
          <p className="mt-4 text-sm text-gray-500">14-day free trial. No credit card required.</p>
        </div>
      </section>
    </>
  );
}
