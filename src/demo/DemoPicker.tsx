import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Building2,
  HardHat,
  CheckCircle2,
  Shield,
  Zap,
} from 'lucide-react';

// Picker landing for /demo/full. Two cards — GC and Sub — each routes into
// the sandboxed dashboard for that persona. The static one-screen demo at
// /demo is preserved as a fallback ("video") and linked here in case visitors
// prefer the bite-sized version.

export function DemoPicker() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Hero */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-500/10 ring-1 ring-brand-500/20 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-300" />
            <span className="text-[11px] font-bold tracking-wider uppercase text-brand-600 dark:text-brand-300">
              Live demo · no signup
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-3">
            What do you do?
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Pick the one that fits. We'll drop you straight into the dashboard so you can see how it'd work for your shop.
          </p>
        </div>

        {/* Two cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mb-10">
          <PersonaCard
            to="/demo/full/gc/dashboard/home"
            icon={Building2}
            tag="General Contractor"
            title="I run jobs with my own crew + subs"
            description="Whole-house builds, remodels, multi-trade projects. Schedule the crew, send the subs, track every dollar, invoice the customer."
            highlights={[
              'Schedule jobs and dispatch your crew',
              'Hire subs, track them by trade and budget',
              'Invoice customers, take card payments',
            ]}
            tint="from-blue-500 to-indigo-600"
            accent="blue"
          />
          <PersonaCard
            to="/demo/full/sub/dashboard/home"
            icon={HardHat}
            tag="Subcontractor / Tradesman"
            title="I do the work — direct jobs or GC calls"
            description="Electrician, plumber, HVAC, framer, painter. Run your own customers and accept work from the GCs hiring you."
            highlights={[
              'Today\'s jobs, invoicing, get paid by card',
              'Accept GC project invites without phone tag',
              'Build a rep score that wins more bids',
            ]}
            tint="from-orange-500 to-amber-600"
            accent="orange"
          />
        </div>

        {/* Trust strip */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-xs text-gray-500 dark:text-gray-400 mb-8">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>No account required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Nothing you click sends real emails or charges cards</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
            <span>Switch views any time</span>
          </div>
        </div>

        {/* Fallback: short version */}
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Just want a quick look?{' '}
            <Link to="/demo" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
              See the 30-second tour
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

interface CardProps {
  to: string;
  icon: React.ElementType;
  tag: string;
  title: string;
  description: string;
  highlights: string[];
  tint: string;
  accent: 'blue' | 'orange';
}

function PersonaCard({ to, icon: Icon, tag, title, description, highlights, tint, accent }: CardProps) {
  const ringHover = accent === 'blue' ? 'hover:ring-blue-400/40' : 'hover:ring-orange-400/40';
  const accentText = accent === 'blue' ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400';
  const ctaLabel = accent === 'blue' ? "Show me the GC dashboard" : "Show me the trade dashboard";

  return (
    <Link
      to={to}
      className={`group relative bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-gray-200/80 dark:ring-gray-800 p-6 sm:p-7 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 ${ringHover}`}
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tint} flex items-center justify-center mb-4 shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className={`text-[10px] font-bold tracking-wider uppercase mb-1 ${accentText}`}>{tag}</p>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
        {title}
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
        {description}
      </p>
      <ul className="space-y-1.5 mb-5">
        {highlights.map((h) => (
          <li key={h} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{h}</span>
          </li>
        ))}
      </ul>
      <div className={`inline-flex items-center gap-1.5 text-sm font-bold ${accentText} group-hover:gap-2.5 transition-all`}>
        {ctaLabel}
        <ArrowRight className="w-4 h-4" />
      </div>
    </Link>
  );
}
