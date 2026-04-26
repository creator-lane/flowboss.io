import { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  MapPin,
  Navigation,
  Sparkles,
  Truck,
} from 'lucide-react';

import { PERSONAS } from './data/personas';
import type { DemoPersona } from './data/personas';

// ──────────────────────────────────────────────────────────────────────
// /demo/full/:persona/dashboard/route-preview — replaces the old
// "routeOptimization" hard paywall. SchedulePage's "Optimize today's
// route" CTA now navigates here in demo mode instead of bouncing to
// Google Maps with seeded fixture addresses (which read as a real-Maps
// tangent and confused visitors).
//
// Shows the day's stops in optimized order with mock ETAs + a short
// "what this does in production" note + a soft signup CTA.
// ──────────────────────────────────────────────────────────────────────

function isValidPersona(p: string | undefined): p is DemoPersona {
  return p === 'gc' || p === 'sub';
}

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function DemoRoutePreviewPage() {
  const { persona } = useParams<{ persona: string }>();
  if (!isValidPersona(persona)) return <Navigate to="/demo/full" replace />;

  const seed = PERSONAS[persona];

  // Pull jobs that have addresses so the preview reads like a real route.
  // Sort by scheduled start so the order matches what the contractor sees.
  const stops = useMemo(() => {
    const withAddress = (seed.jobs || []).filter((j: any) => {
      const street = j.property?.street || j.property?.address;
      return !!street;
    });
    return withAddress
      .slice()
      .sort((a: any, b: any) => {
        const ta = a.scheduledStart || a.scheduled_start || '';
        const tb = b.scheduledStart || b.scheduled_start || '';
        return ta.localeCompare(tb);
      })
      .slice(0, 10);
  }, [seed.jobs]);

  // Fake mileage/ETA between stops — close enough to feel real.
  const legs = stops.map((_, i) => ({
    miles: 4 + ((i * 7) % 11),
    minutes: 9 + ((i * 5) % 13),
  }));
  const totalMiles = legs.slice(1).reduce((s, l) => s + l.miles, 0);
  const totalMinutes = legs.slice(1).reduce((s, l) => s + l.minutes, 0);
  const savedMinutes = Math.max(8, Math.round(stops.length * 4.5));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <Link
        to={`/demo/full/${persona}/dashboard/schedule`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to schedule
      </Link>

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 sm:p-6 shadow-lg shadow-blue-500/20 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Navigation className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold tracking-wider uppercase text-white/80">
              Optimized route · today
            </p>
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">
              {stops.length} stops in the order that saves the most drive time
            </h1>
            <p className="text-sm text-white/85 mt-1.5 leading-relaxed">
              In production, this opens Google Maps with the day's stops as a multi-stop trip — sorted by start time and shortest drive. Saves an estimated <strong>{savedMinutes} min/day</strong> versus the order you'd plan by hand.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Stat icon={MapPin} label="Stops" value={String(stops.length)} accent="blue" />
        <Stat icon={Truck} label="Total drive" value={`${totalMiles} mi`} accent="indigo" />
        <Stat icon={Clock} label="Est. drive time" value={`${totalMinutes} min`} accent="violet" />
      </div>

      {/* Stop list */}
      <div className="bg-white dark:bg-white/5 rounded-2xl ring-1 ring-gray-200 dark:ring-white/10 p-2 sm:p-3 shadow-sm mb-5">
        {stops.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-500">
            No jobs with addresses today.
          </div>
        ) : (
          <ol>
            {stops.map((j: any, i: number) => {
              const street = j.property?.street || j.property?.address;
              const cityState = [j.property?.city, j.property?.state].filter(Boolean).join(', ');
              const customer = [j.customer?.firstName, j.customer?.lastName].filter(Boolean).join(' ') || 'Customer';
              const start = j.scheduledStart || j.scheduled_start;
              const leg = legs[i];
              return (
                <li key={j.id || i} className="relative">
                  {i > 0 && (
                    <div className="ml-4 sm:ml-5 pl-7 sm:pl-9 -mt-1 mb-1 flex items-center gap-2 text-[11px] text-gray-400">
                      <div className="w-px h-4 bg-gray-200 dark:bg-white/10" />
                      <Truck className="w-3 h-3" />
                      <span>{leg.miles} mi · {leg.minutes} min drive</span>
                    </div>
                  )}
                  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {customer}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {street}{cityState ? ` · ${cityState}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {start && (
                        <p className="text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                          {fmtTime(start)}
                        </p>
                      )}
                      {j.serviceType && (
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5 whitespace-nowrap">
                          {j.serviceType}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Soft conversion footer */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 p-5 text-white shadow-lg shadow-brand-500/20">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">Launch this in real Google Maps with one tap</p>
            <p className="text-xs text-white/85 mt-0.5 leading-relaxed">
              Sign up free and your day's stops open straight in Maps as a multi-stop trip — ready to drive, with live traffic.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white text-brand-700 text-xs font-bold hover:bg-gray-100 transition-colors"
              >
                Sign up free
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to={`/demo/full/${persona}/dashboard/schedule`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
              >
                Back to schedule
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent: 'blue' | 'indigo' | 'violet';
}) {
  const tint =
    accent === 'blue'
      ? 'from-blue-500 to-blue-600'
      : accent === 'indigo'
        ? 'from-indigo-500 to-indigo-600'
        : 'from-violet-500 to-violet-600';
  return (
    <div className="rounded-xl bg-white dark:bg-white/5 ring-1 ring-gray-200 dark:ring-white/10 p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${tint} flex items-center justify-center`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{label}</p>
      </div>
      <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
