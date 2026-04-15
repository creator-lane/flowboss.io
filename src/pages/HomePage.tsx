import {
  ArrowRight,
  CheckCircle2,
  Mail,
  Star,
  X,
  Wrench,
  Zap,
  Snowflake,
  Hammer,
  Send,
  UserPlus,
  Building2,
  DollarSign,
  TrendingUp,
  Clock,
  MapPin,
  FileText,
  BarChart3,
  Users,
  Briefcase,
  Link2,
  ShieldCheck,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const screenshots = {
  schedule: '/screenshots/Screenshot_20260327-151517.png',
  route: '/screenshots/Screenshot_20260327-151703.png',
  project: '/screenshots/Screenshot_20260327-151838.png',
  addJob: '/screenshots/Screenshot_20260327-152010.png',
  invoice: '/screenshots/Screenshot_20260327-152047.png',
  insights: '/screenshots/Screenshot_20260327-152240.png',
  history: '/screenshots/Screenshot_20260327-152308.png',
};

const pricingFeatures = [
  'Unlimited jobs & invoices',
  'Route optimization',
  'Stripe payment links & on-site collection',
  'QuickBooks invoice sync',
  'Multi-phase project tracking',
  'GC command center & sub invites',
  'Zone-based project visualizer',
  'Sub marketplace (coming soon)',
  'Auto-learning pricebook',
  'Financial insights & revenue per hour',
  'Customer CRM & work history',
  'AI job suggestions',
  'Photo documentation',
  'Trade-specific templates',
];

const testimonials = [
  {
    quote: 'The GC dashboard replaced three spreadsheets and a group text.',
    name: 'Mike R.',
    role: 'GC, Tampa, FL',
  },
  {
    quote: 'Finally an app that treats subs like a first-class citizen.',
    name: 'Carlos D.',
    role: 'Plumbing Sub, Austin, TX',
  },
  {
    quote: 'Revenue per hour alone changed how I bid jobs. Up 22%.',
    name: 'James T.',
    role: 'Electrician, Denver, CO',
  },
];

function PhoneFrame({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="rounded-[2rem] overflow-hidden shadow-2xl border-[6px] border-gray-900 bg-gray-900">
        <img src={src} alt={alt} className="w-full h-auto block" loading="lazy" />
      </div>
    </div>
  );
}

async function submitEmail(email: string, trade: string): Promise<boolean> {
  try {
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, trade }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function EmailCaptureForm({ variant = 'inline' }: { variant?: 'inline' | 'popup' }) {
  const [email, setEmail] = useState('');
  const [trade, setTrade] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    const ok = await submitEmail(email, trade);
    setStatus(ok ? 'success' : 'error');
    if (ok) localStorage.setItem('fb_subscribed', '1');
  };

  if (status === 'success') {
    return (
      <div className="text-center py-4">
        <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <p className={`font-semibold text-lg ${variant === 'popup' ? 'text-gray-900' : 'text-white'}`}>
          You're in! We'll be in touch.
        </p>
      </div>
    );
  }

  const inputBg = variant === 'popup' ? 'bg-gray-50 border-gray-200' : 'bg-white/10 border-white/20 text-white placeholder:text-gray-300';
  const selectBg = variant === 'popup' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-white/10 border-white/20 text-white';
  const btnBg = variant === 'popup' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white text-gray-900 hover:bg-gray-100';
  const isPopup = variant === 'popup';

  return (
    <form onSubmit={handleSubmit} className={`w-full ${isPopup ? 'space-y-2.5' : 'flex flex-col sm:flex-row gap-3 max-w-lg mx-auto'}`}>
      <div className={isPopup ? 'flex gap-2.5' : 'contents'}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          className={`flex-1 px-4 py-3 rounded-xl border ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm`}
        />
        <select
          value={trade}
          onChange={(e) => setTrade(e.target.value)}
          className={`px-4 py-3 rounded-xl border ${selectBg} text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400`}
        >
          <option value="">Your role</option>
          <option value="gc">General Contractor</option>
          <option value="plumbing">Plumbing Sub</option>
          <option value="hvac">HVAC Sub</option>
          <option value="electrical">Electrical Sub</option>
          <option value="solo">Solo Contractor</option>
          <option value="other">Other</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={status === 'loading'}
        className={`${isPopup ? 'w-full' : ''} px-6 py-3 rounded-xl font-semibold text-sm transition-all ${btnBg} disabled:opacity-60`}
      >
        {status === 'loading' ? 'Sending...' : 'Get Updates'}
      </button>
      {status === 'error' && <p className="text-red-400 text-xs mt-1">Something went wrong. Try again.</p>}
    </form>
  );
}

function EmailPopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 animate-slide-up">
      <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">Stay in the Loop</h3>
          <p className="text-gray-500 text-xs leading-relaxed mt-0.5">Contractor tips, feature updates, and exclusive offers.</p>
        </div>
      </div>
      <EmailCaptureForm variant="popup" />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   MOCK UI COMPONENTS — render actual-looking FlowBoss web UI inline so the
   homepage showcases the product itself, not just screenshots.
   ────────────────────────────────────────────────────────────────────────── */

function MockBrowserChrome({ children, url = 'app.flowboss.io/dashboard/projects' }: { children: React.ReactNode; url?: string }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white">
      <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-100 border-b border-gray-200">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-yellow-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
        <div className="flex-1 mx-4 px-3 py-1 bg-white rounded-md text-xs text-gray-500 font-mono flex items-center gap-2">
          <span className="flex-1 truncate">{url}</span>
          <span className="flex items-center gap-1 text-green-600">
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-[10px] font-semibold">LIVE</span>
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}

/* Animated count-up number — runs when element scrolls into view */
function useAnimatedCount(target: number, duration = 1200, startWhen: boolean = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!startWhen) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, startWhen]);
  return value;
}

/* Trigger a callback when element enters viewport (once) */
function useInView<T extends HTMLElement>() {
  const [ref, setRef] = useState<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref || inView) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(ref);
    return () => obs.disconnect();
  }, [ref, inView]);
  return [setRef, inView] as const;
}

/* Live activity feed — ticks new entries every few seconds */
function LiveActivityFeed() {
  const events = [
    { who: 'Carlos (Plumbing)', action: 'checked off "Kitchen rough-in"', time: 'just now', icon: CheckCircle2, color: 'green' },
    { who: 'Tony (Electric)', action: 'uploaded 3 photos to Bath 1', time: '2m ago', icon: FileText, color: 'blue' },
    { who: 'Maria (Tile)', action: 'logged 4.5 hrs on Master Suite', time: '7m ago', icon: Clock, color: 'purple' },
    { who: 'Apex GC', action: 'invoice #2041 paid — $1,945', time: '12m ago', icon: DollarSign, color: 'green' },
    { who: 'Dave (HVAC)', action: 'accepted invite to Johnson Build', time: '18m ago', icon: UserPlus, color: 'amber' },
    { who: 'Carlos (Plumbing)', action: 'requested $840 draw on Bath 2', time: '24m ago', icon: DollarSign, color: 'indigo' },
  ];
  const [visibleCount, setVisibleCount] = useState(3);
  useEffect(() => {
    const iv = setInterval(() => {
      setVisibleCount((c) => (c >= events.length ? 3 : c + 1));
    }, 2200);
    return () => clearInterval(iv);
  }, [events.length]);
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-gray-900">Live activity</div>
        <div className="flex items-center gap-1 text-[10px] text-green-600 font-semibold">
          <span className="relative flex w-1.5 h-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </span>
          LIVE
        </div>
      </div>
      <div className="space-y-2">
        {events.slice(0, visibleCount).map((e, i) => (
          <div
            key={`${e.who}-${e.time}-${i}`}
            className={`flex items-start gap-2 p-2 rounded-lg ${i === 0 ? 'bg-blue-50 border border-blue-100 animate-[slideIn_0.4s_ease-out]' : 'bg-gray-50'}`}
          >
            <div className={`w-6 h-6 rounded-full bg-${e.color}-100 text-${e.color}-600 flex items-center justify-center shrink-0`}>
              <e.icon className="w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900 truncate">{e.who}</div>
              <div className="text-[11px] text-gray-600 truncate">{e.action}</div>
            </div>
            <div className="text-[10px] text-gray-400 whitespace-nowrap">{e.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ZoneClusterMock() {
  const [selected, setSelected] = useState<number | null>(null);
  const [ref, inView] = useInView<HTMLDivElement>();
  const [tickPct, setTickPct] = useState(0);
  // slowly creep progress up over time to feel "alive"
  useEffect(() => {
    if (!inView) return;
    const iv = setInterval(() => setTickPct((p) => (p + 1) % 100), 3500);
    return () => clearInterval(iv);
  }, [inView]);
  const zonesBase = [
    { name: 'Kitchen', trades: ['Plumbing', 'Electrical', 'Cabinets'], pct: 75, color: 'blue' },
    { name: 'Bathroom 1', trades: ['Plumbing', 'Tiling', 'Electric'], pct: 40, color: 'purple' },
    { name: 'Bathroom 2', trades: ['Plumbing', 'Tiling'], pct: 100, color: 'green' },
    { name: 'Exterior', trades: ['Siding', 'Landscape'], pct: 15, color: 'amber' },
  ];
  // nudge live-ticker zones 1% every cycle
  const zones = zonesBase.map((z, i) =>
    i === 1 ? { ...z, pct: Math.min(99, z.pct + (tickPct % 5)) } : i === 3 ? { ...z, pct: Math.min(35, z.pct + (tickPct % 4)) } : z
  );
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
  };
  const barMap: Record<string, string> = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    amber: 'bg-amber-500',
  };
  const renderZone = (z: typeof zones[number], idx: number) => {
    const isSel = selected === idx;
    return (
      <button
        key={z.name}
        type="button"
        onClick={() => setSelected(isSel ? null : idx)}
        className={`text-left rounded-xl border-2 p-4 transition-all cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ${colorMap[z.color]} ${
          isSel ? 'ring-2 ring-offset-2 ring-blue-500 scale-[1.02]' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-sm">{z.name}</span>
          <span className="text-xs font-bold tabular-nums">{z.pct}%</span>
        </div>
        <div className="space-y-1 mb-3">
          {z.trades.map((t) => (
            <div key={t} className="text-xs flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-current opacity-60" />
              {t}
            </div>
          ))}
        </div>
        <div className="h-1.5 rounded-full bg-white/60 overflow-hidden">
          <div className={`h-full ${barMap[z.color]} transition-all duration-1000 ease-out`} style={{ width: inView ? `${z.pct}%` : '0%' }} />
        </div>
        {isSel && (
          <div className="mt-3 pt-3 border-t border-current/20 space-y-1.5 animate-[fadeIn_0.25s_ease-out]">
            <div className="text-[10px] font-semibold opacity-70 uppercase">Recent activity</div>
            <div className="text-[11px]">✓ Rough-in passed inspection</div>
            <div className="text-[11px]">⏱ 4.5 hrs logged today</div>
            <div className="text-[11px]">📸 3 photos uploaded</div>
          </div>
        )}
      </button>
    );
  };
  return (
    <div ref={ref} className="relative p-8 bg-gradient-to-br from-gray-50 to-white">
      <div className="grid grid-cols-2 gap-4 mb-6">
        {zones.slice(0, 2).map((z, i) => renderZone(z, i))}
      </div>

      <div className="mx-auto max-w-sm bg-gray-900 rounded-2xl p-5 shadow-xl text-white mb-6 relative">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-600 text-[10px] font-bold rounded-full">HUB</div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm">Smith Residence</div>
            <div className="text-xs text-gray-400">2,400 sq ft · 3 bed · Active</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/10 rounded-lg py-1.5">
            <div className="text-[10px] text-gray-400">Overall</div>
            <div className="text-sm font-bold">62%</div>
          </div>
          <div className="bg-white/10 rounded-lg py-1.5">
            <div className="text-[10px] text-gray-400">Subs</div>
            <div className="text-sm font-bold">8</div>
          </div>
          <div className="bg-white/10 rounded-lg py-1.5">
            <div className="text-[10px] text-gray-400">Budget</div>
            <div className="text-sm font-bold">71%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">{zones.slice(2).map((z, i) => renderZone(z, i + 2))}</div>
      <div className="mt-5">
        <LiveActivityFeed />
      </div>
      <p className="text-center text-[11px] text-gray-400 mt-3">↑ Click any zone to drill in · numbers update live</p>
    </div>
  );
}

function InsightsMock() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const rev = useAnimatedCount(187, 1400, inView);
  const margin = useAnimatedCount(41, 1400, inView);
  const jobs = useAnimatedCount(24, 1200, inView);
  const avg = useAnimatedCount(842, 1600, inView);
  const monthly = useAnimatedCount(47280, 1800, inView);
  const kpis = [
    { label: 'Revenue / hr', value: `$${Math.round(rev)}`, trend: '+22%', icon: DollarSign, color: 'green' },
    { label: 'Margin', value: `${Math.round(margin)}%`, trend: '+3.2%', icon: TrendingUp, color: 'blue' },
    { label: 'Jobs / wk', value: `${Math.round(jobs)}`, trend: '+4', icon: Briefcase, color: 'purple' },
    { label: 'Avg ticket', value: `$${Math.round(avg)}`, trend: '+$91', icon: FileText, color: 'amber' },
  ];
  const barsBase = [38, 54, 42, 61, 72, 68, 84, 91, 76, 88, 95, 112];
  const [wobble, setWobble] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const iv = setInterval(() => setWobble((w) => w + 1), 2800);
    return () => clearInterval(iv);
  }, [inView]);
  const bars = barsBase.map((b, i) => b + ((wobble + i) % 3) * 2);
  return (
    <div ref={ref} className="p-6 bg-gradient-to-br from-gray-50 to-white">
      <div className="grid grid-cols-4 gap-3 mb-5">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <k.icon className={`w-3.5 h-3.5 text-${k.color}-500`} />
              <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">{k.label}</span>
            </div>
            <div className="text-lg font-bold text-gray-900">{k.value}</div>
            <div className="text-[10px] text-green-600 font-semibold">▲ {k.trend}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-gray-500">Monthly revenue</div>
            <div className="text-xl font-bold text-gray-900 tabular-nums">${Math.round(monthly).toLocaleString()}</div>
          </div>
          <div className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-full">+18% MoM</div>
        </div>
        <div className="flex items-end gap-1.5 h-20">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-sm transition-all duration-700 ease-out" style={{ height: inView ? `${h}%` : '0%' }} />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="text-xs font-semibold text-gray-900 mb-3">Top earners by job type</div>
        {[
          { name: 'Water heater install', revenue: '$8,420', pct: 95 },
          { name: 'Panel upgrade', revenue: '$6,180', pct: 72 },
          { name: 'Repipe (partial)', revenue: '$4,950', pct: 58 },
          { name: 'Drain cleaning', revenue: '$2,310', pct: 28 },
        ].map((r) => (
          <div key={r.name} className="mb-2 last:mb-0">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-700">{r.name}</span>
              <span className="font-bold text-gray-900">{r.revenue}</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: `${r.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubWorkspaceMock() {
  return (
    <div className="p-6 bg-gradient-to-br from-green-50/40 to-white">
      <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-green-100 border border-green-200 rounded-lg">
        <Sparkles className="w-4 h-4 text-green-700" />
        <div className="text-xs font-semibold text-green-800">You've been invited to Smith Residence by Apex Construction</div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Your trade on this project</div>
            <div className="font-bold text-gray-900">Plumbing — Kitchen + 2 Bathrooms</div>
          </div>
          <div className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-full">ACTIVE</div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-50 rounded-lg py-2">
            <div className="text-[10px] text-gray-500">Your tasks</div>
            <div className="text-sm font-bold text-gray-900">14 / 23</div>
          </div>
          <div className="bg-gray-50 rounded-lg py-2">
            <div className="text-[10px] text-gray-500">Hours logged</div>
            <div className="text-sm font-bold text-gray-900">62</div>
          </div>
          <div className="bg-green-50 rounded-lg py-2">
            <div className="text-[10px] text-green-700">Your revenue</div>
            <div className="text-sm font-bold text-green-700">$18,400</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-gray-900">Next up</div>
          <div className="text-[10px] text-gray-500">This week</div>
        </div>
        {[
          { task: 'Rough-in bathroom 2 supply lines', due: 'Tomorrow' },
          { task: 'Kitchen pre-slab inspection prep', due: 'Thu' },
          { task: 'Fixture punch-list — bath 1', due: 'Fri' },
        ].map((t) => (
          <div key={t.task} className="flex items-center justify-between py-2 border-t border-gray-100 first:border-0">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-gray-300" />
              <span className="text-xs text-gray-700">{t.task}</span>
            </div>
            <span className="text-[10px] text-blue-600 font-semibold">{t.due}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 text-white">
          <DollarSign className="w-4 h-4 mb-1" />
          <div className="text-[10px] opacity-80">GC-referred revenue YTD</div>
          <div className="text-lg font-bold">$142k</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 text-white">
          <Building2 className="w-4 h-4 mb-1" />
          <div className="text-[10px] opacity-80">Active GC relationships</div>
          <div className="text-lg font-bold">5</div>
        </div>
      </div>
    </div>
  );
}

function InvoiceFlowMock() {
  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-gray-500">Invoice #2041</div>
            <div className="font-bold text-gray-900">Johnson — Water Heater Install</div>
          </div>
          <div className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full">UNPAID</div>
        </div>
        <div className="space-y-1.5 text-xs border-t border-gray-100 pt-3">
          <div className="flex justify-between"><span className="text-gray-600">50 gal gas water heater</span><span className="font-medium">$1,240</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Labor (4 hrs)</span><span className="font-medium">$620</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Haul-away</span><span className="font-medium">$85</span></div>
          <div className="flex justify-between pt-1.5 border-t border-gray-100 text-sm"><span className="font-bold">Total</span><span className="font-bold">$1,945</span></div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Link2 className="w-4 h-4" />
          <div className="text-xs font-semibold">Stripe payment link copied</div>
        </div>
        <div className="text-[10px] font-mono bg-white/10 px-2 py-1.5 rounded truncate">buy.stripe.com/9AQfYn3...</div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button className="px-3 py-2 bg-white/20 rounded-lg text-xs font-semibold">Text</button>
          <button className="px-3 py-2 bg-white rounded-lg text-xs font-semibold text-blue-600">Email</button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle2 className="w-4 h-4 text-green-600" />
        <div className="text-xs text-green-800 font-medium">Auto-synced to QuickBooks</div>
      </div>
    </div>
  );
}

/* Auto-playing invite flow — advances steps on a timer, user can click to jump */
function AutoPlayingInviteFlow() {
  const steps = [
    {
      step: '01',
      icon: Building2,
      title: 'GC builds the project',
      desc: 'Smith Residence — 2,400 sq ft, 3 bed, 2 bath. Zones auto-generate.',
      demo: (
        <div className="space-y-2">
          {['Kitchen', 'Bathroom 1', 'Bathroom 2', 'Master Suite', 'Exterior'].map((z, i) => (
            <div
              key={z}
              className="flex items-center gap-2 p-2 bg-white/10 rounded-lg animate-[slideIn_0.4s_ease-out]"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center">
                <Layers className="w-3 h-3 text-blue-300" />
              </div>
              <span className="text-xs text-white">{z}</span>
              <span className="ml-auto text-[10px] text-green-400">+ created</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      step: '02',
      icon: UserPlus,
      title: 'GC invites subs per trade',
      desc: 'One click per trade. Each sub gets a magic link via text + email.',
      demo: (
        <div className="space-y-2">
          {[
            { t: 'Plumbing', n: 'Carlos Diaz', s: 'Invited' },
            { t: 'Electrical', n: 'Tony Reyes', s: 'Invited' },
            { t: 'Tiling', n: 'Maria Soto', s: 'Sending…' },
          ].map((s, i) => (
            <div
              key={s.t}
              className="flex items-center gap-2 p-2 bg-white/10 rounded-lg animate-[slideIn_0.4s_ease-out]"
              style={{ animationDelay: `${i * 200}ms` }}
            >
              <div className="w-6 h-6 rounded-full bg-green-500/30 flex items-center justify-center">
                <Send className="w-3 h-3 text-green-300" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-white font-semibold">{s.t}</div>
                <div className="text-[10px] text-gray-400">{s.n}</div>
              </div>
              <span className={`text-[10px] ${s.s === 'Invited' ? 'text-green-400' : 'text-amber-300 animate-pulse'}`}>{s.s}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      step: '03',
      icon: Wrench,
      title: 'Sub accepts, starts work',
      desc: 'Lands on their own workspace with tasks, zones, budget, hours.',
      demo: (
        <div className="space-y-2">
          <div className="p-2 bg-green-500/10 border border-green-500/30 rounded-lg animate-[slideIn_0.4s_ease-out]">
            <div className="text-[10px] text-green-300 font-semibold">✓ Carlos accepted the invite</div>
          </div>
          {[
            'Rough-in Kitchen supply',
            'Bath 1 drain stack',
            'Water heater install',
          ].map((task, i) => (
            <div
              key={task}
              className="flex items-center gap-2 p-2 bg-white/10 rounded-lg animate-[slideIn_0.4s_ease-out]"
              style={{ animationDelay: `${(i + 1) * 180}ms` }}
            >
              <div className="w-3 h-3 rounded border border-white/40" />
              <span className="text-xs text-white">{task}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      step: '04',
      icon: BarChart3,
      title: 'GC sees everything live',
      desc: 'Every check-off, hour, photo, invoice flows to the GC dashboard in real time.',
      demo: <LiveActivityFeedDark />,
    },
  ];
  const [active, setActive] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setActive((a) => (a + 1) % steps.length), 5000);
    return () => clearInterval(iv);
  }, [steps.length]);
  return (
    <div className="grid md:grid-cols-2 gap-8 items-stretch">
      {/* Step list */}
      <div className="space-y-3">
        {steps.map((s, i) => {
          const isActive = i === active;
          return (
            <button
              key={s.step}
              type="button"
              onClick={() => setActive(i)}
              className={`w-full text-left rounded-2xl p-5 border transition-all ${
                isActive
                  ? 'bg-blue-500/20 border-blue-400/50 shadow-lg shadow-blue-500/10'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`text-xl font-bold ${isActive ? 'text-blue-300' : 'text-blue-400/60'}`}>{s.step}</div>
                <s.icon className={`w-5 h-5 ${isActive ? 'text-blue-300' : 'text-blue-400/60'}`} />
                <h3 className={`text-base font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>{s.title}</h3>
              </div>
              <p className={`text-sm leading-relaxed ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>{s.desc}</p>
              {isActive && (
                <div className="mt-2 h-0.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 animate-[progress_5s_linear]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      {/* Active demo panel */}
      <div className="bg-gray-800/60 border border-white/10 rounded-2xl p-5 backdrop-blur-sm min-h-[320px]">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Step {steps[active].step} preview</div>
        <div key={active}>{steps[active].demo}</div>
      </div>
    </div>
  );
}

function LiveActivityFeedDark() {
  const events = [
    { who: 'Carlos', action: 'checked off "Kitchen rough-in"', color: 'green' },
    { who: 'Tony', action: 'uploaded 3 photos to Bath 1', color: 'blue' },
    { who: 'Maria', action: 'logged 4.5 hrs on Master Suite', color: 'purple' },
    { who: 'Carlos', action: 'invoice #2041 sent — $1,945', color: 'amber' },
  ];
  const [count, setCount] = useState(1);
  useEffect(() => {
    const iv = setInterval(() => setCount((c) => (c >= events.length ? 1 : c + 1)), 1400);
    return () => clearInterval(iv);
  }, [events.length]);
  return (
    <div className="space-y-2">
      {events.slice(0, count).map((e, i) => (
        <div
          key={i}
          className="flex items-center gap-2 p-2 bg-white/10 rounded-lg animate-[slideIn_0.4s_ease-out]"
        >
          <div className={`w-6 h-6 rounded-full bg-${e.color}-500/30 flex items-center justify-center shrink-0`}>
            <CheckCircle2 className={`w-3 h-3 text-${e.color}-300`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white font-semibold">{e.who}</div>
            <div className="text-[10px] text-gray-400 truncate">{e.action}</div>
          </div>
          <div className="text-[10px] text-gray-500">now</div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   PAGE
   ────────────────────────────────────────────────────────────────────────── */

type TourTab = 'gc' | 'sub' | 'insights' | 'invoice';

export function HomePage() {
  const [showDemo, setShowDemo] = useState(false);
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [tab, setTab] = useState<TourTab>('gc');

  useEffect(() => {
    const subscribed = localStorage.getItem('fb_subscribed');
    const dismissed = localStorage.getItem('fb_popup_dismissed');
    if (subscribed || dismissed) return;
    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrollPercent > 0.4) {
        setShowEmailPopup(true);
        window.removeEventListener('scroll', handleScroll);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {showDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowDemo(false)}>
          <div className="relative w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowDemo(false)} className="absolute -top-10 right-0 text-white hover:text-gray-300">
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

      {showEmailPopup && (
        <EmailPopup
          onClose={() => {
            setShowEmailPopup(false);
            localStorage.setItem('fb_popup_dismissed', Date.now().toString());
          }}
        />
      )}

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 md:pt-28 pb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)]" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-6 border border-blue-100">
              <Sparkles className="w-3.5 h-3.5" />
              One platform for GCs, subs, and solo trades
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.05] tracking-tight">
              The command center{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                for the trades.
              </span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              FlowBoss is the first platform that unites <strong>general contractors</strong> and <strong>subcontractors</strong> in one
              living dashboard. Build a project visually, invite your subs in one click, watch every trade, task, and dollar move in real time.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/signup"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 text-lg"
              >
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </a>
              <button
                onClick={() => setShowDemo(true)}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-lg"
              >
                ▶ Watch 2-min Demo
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-500">14-day free trial · Credit card required · Cancel anytime</p>
          </div>

          {/* Hero product preview — real UI mock, not just a screenshot */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 blur-3xl rounded-3xl" />
            <MockBrowserChrome>
              <ZoneClusterMock />
            </MockBrowserChrome>
            {/* Floating mobile companion */}
            <div className="hidden md:block absolute -right-8 -bottom-12 w-[180px] transform rotate-6">
              <PhoneFrame src={screenshots.schedule} alt="FlowBoss mobile companion" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHAT MAKES FLOWBOSS DIFFERENT ─────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Everyone else built for office managers.
              <br />
              <span className="text-blue-600">We built for the people swinging hammers.</span>
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Jobber, ServiceTitan, and HouseCall Pro treat subs like second-class citizens. FlowBoss is the first field app where GCs and subs
              share a living project, a shared P&amp;L, and a shared reputation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Layers,
                title: 'Zone-based projects',
                desc: 'Break every build into Kitchen, Bath 1, Master Suite, Exterior. Assign trades per zone. See weighted completion per zone in real time.',
                color: 'blue',
              },
              {
                icon: Users,
                title: 'GC ↔ Sub, one graph',
                desc: 'Invite a sub by link or phone. They get a workspace showing their tasks, hours, and revenue on your project. You see everything they do.',
                color: 'green',
              },
              {
                icon: BarChart3,
                title: 'Revenue-per-hour clarity',
                desc: 'Every job type ranked by actual $/hr, profit margin, and time to close. Stop guessing which work is worth it.',
                color: 'purple',
              },
              {
                icon: Link2,
                title: 'Stripe links on-site',
                desc: 'Finish the job, text a payment link, get paid before you leave the driveway. Auto-syncs to QuickBooks.',
                color: 'indigo',
              },
              {
                icon: ShieldCheck,
                title: 'FlowBoss Score',
                desc: 'Quality 35% · Timeliness 25% · Budget 25% · Communication 15%. Subs earn reputation. GCs pick with confidence.',
                color: 'amber',
              },
              {
                icon: Sparkles,
                title: 'Sub marketplace (soon)',
                desc: 'When you need a plumber you haven\'t worked with, FlowBoss matches you with ranked subs in your area. No cold-calling.',
                color: 'rose',
              },
            ].map((f) => (
              <div key={f.title} className="group bg-white rounded-2xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-xl transition-all">
                <div className={`w-12 h-12 rounded-xl bg-${f.color}-50 text-${f.color}-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE PRODUCT TOUR ──────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">See it in action.</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Click through the real FlowBoss experience. GC command center, sub workspace, insights engine, on-site invoicing — all live in the browser.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {[
              { id: 'gc' as TourTab, label: 'GC Command Center', icon: Building2 },
              { id: 'sub' as TourTab, label: 'Sub Workspace', icon: Wrench },
              { id: 'insights' as TourTab, label: 'Insights Engine', icon: BarChart3 },
              { id: 'invoice' as TourTab, label: 'Invoice & Pay', icon: DollarSign },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  tab === t.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-5 gap-8 items-center">
            <div className="lg:col-span-3">
              <MockBrowserChrome
                url={
                  tab === 'gc'
                    ? 'app.flowboss.io/dashboard/projects/smith-residence'
                    : tab === 'sub'
                    ? 'app.flowboss.io/dashboard/projects/assigned/smith-residence'
                    : tab === 'insights'
                    ? 'app.flowboss.io/dashboard/insights'
                    : 'app.flowboss.io/dashboard/invoices/2041'
                }
              >
                {tab === 'gc' && <ZoneClusterMock />}
                {tab === 'sub' && <SubWorkspaceMock />}
                {tab === 'insights' && <InsightsMock />}
                {tab === 'invoice' && <InvoiceFlowMock />}
              </MockBrowserChrome>
            </div>
            <div className="lg:col-span-2">
              {tab === 'gc' && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">GC Command Center</h3>
                  <p className="text-gray-600 mb-5 leading-relaxed">
                    Projects are organized by the <strong>physical structure</strong> — kitchen, bathrooms, exterior. Each zone has its own trades,
                    tasks, budget, and completion. Click any zone to drill into sub activity.
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      'Zone-based visualizer replaces flat trade lists',
                      'Weighted completion by labor hours per trade',
                      'Per-zone budget allocation and burn tracking',
                      'Click any trade → see the sub, their tasks, their hours',
                      'Timeline view, Gantt view, and cashflow view',
                    ].map((b) => (
                      <li key={b} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-1" />
                        <span className="text-sm text-gray-700">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {tab === 'sub' && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Sub Workspace</h3>
                  <p className="text-gray-600 mb-5 leading-relaxed">
                    Subs are never second-class. When a GC invites you, you get your own workspace showing <strong>your</strong> tasks,
                    <strong> your</strong> hours, and <strong>your</strong> revenue on that project — independent of the GC's view but synced with it.
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      'Free for invited subs — no seat fees, no per-project fees',
                      'Track GC-referred vs direct revenue split',
                      'Your own pricebook, your own invoices, your own insights',
                      'Work on multiple GC projects simultaneously',
                      'Your FlowBoss Score follows you — build reputation',
                    ].map((b) => (
                      <li key={b} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-1" />
                        <span className="text-sm text-gray-700">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {tab === 'insights' && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Insights Engine</h3>
                  <p className="text-gray-600 mb-5 leading-relaxed">
                    Stop guessing which jobs make money. FlowBoss computes <strong>revenue per hour</strong>, margin, top earners, and expense
                    breakdowns automatically. The numbers that actually run your business — without a spreadsheet.
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      'Revenue-per-hour ranks every job type by $/hr',
                      'Margin by customer, trade, and time period',
                      'Monthly + weekly trend charts with YoY comparison',
                      'GC-referred revenue split from direct revenue',
                      'Expense tracking → real take-home, not gross',
                    ].map((b) => (
                      <li key={b} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0 mt-1" />
                        <span className="text-sm text-gray-700">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {tab === 'invoice' && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Invoice &amp; Get Paid On-Site</h3>
                  <p className="text-gray-600 mb-5 leading-relaxed">
                    Build an invoice from your auto-learning pricebook, generate a Stripe payment link, text it to the customer — collect before
                    you pack up the truck. Auto-reconciles in QuickBooks.
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      'Auto-learning pricebook remembers every line item',
                      'Stripe links sent via text or email — no app required for customer',
                      'QuickBooks sync: invoices push, payments auto-reconcile',
                      'Photo attachments for documentation and proof of work',
                      'Paid / Unpaid / Overdue at a glance on Financials tab',
                    ].map((b) => (
                      <li key={b} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-1" />
                        <span className="text-sm text-gray-700">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW GC + SUB WORK TOGETHER ────────────────────────────────────── */}
      <section className="py-20 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.15),transparent_50%)]" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 text-sm font-medium mb-4 border border-blue-500/20">
              <Send className="w-3.5 h-3.5" />
              The invite flow that no one else has
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              From invite to first task
              <br />
              <span className="text-blue-400">in under 60 seconds.</span>
            </h2>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              Building a house. You need a plumber, electrician, and tiler. Here's how FlowBoss gets them plugged in and visible on your dashboard —
              end to end.
            </p>
          </div>

          <AutoPlayingInviteFlow />
          <div className="mt-8 text-center">
            <span className="text-xs text-gray-500">▶ Auto-playing · click any step to jump</span>
          </div>

          <div className="mt-12 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-2xl p-8 text-center backdrop-blur-sm">
            <div className="text-white text-xl font-semibold mb-2">No more "Did you get my text?"</div>
            <p className="text-blue-200 max-w-2xl mx-auto">
              Every update flows through one pipe. GCs stop chasing. Subs stop re-explaining. The whole project becomes self-documenting.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FOR SUBS: WE MAKE YOU MORE MONEY ──────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-green-50 via-white to-emerald-50/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-4 border border-green-200">
                <DollarSign className="w-3.5 h-3.5" />
                For the subs
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
                FlowBoss makes subs{' '}
                <span className="text-green-600">more money.</span>
              </h2>
              <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                Every other field service app forces subs into clunky guest portals or leaves them out entirely. We built FlowBoss so the sub gets
                <strong> everything the GC gets</strong> — their own project view, their own invoicing, their own insights. Plus the network effect
                of GCs looking for you.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { stat: '22%', label: 'Average revenue-per-hour increase after 90 days', color: 'green' },
                  { stat: '$0', label: 'Cost when invited by a GC to their project', color: 'blue' },
                  { stat: '3.4×', label: 'More repeat work from GCs using shared project tracking', color: 'purple' },
                  { stat: '18 min', label: 'Saved per invoice vs paper + QuickBooks entry', color: 'amber' },
                ].map((r) => (
                  <div key={r.label} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className={`text-3xl font-extrabold text-${r.color}-600 min-w-[80px]`}>{r.stat}</div>
                    <div className="text-sm text-gray-700 font-medium">{r.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <a
                  href="/signup?plan=monthly"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/25"
                >
                  Start as a Sub — Free Trial <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="lg:pl-8">
              <MockBrowserChrome url="app.flowboss.io/dashboard/projects/assigned/smith-residence">
                <SubWorkspaceMock />
              </MockBrowserChrome>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRADES ────────────────────────────────────────────────────────── */}
      <section id="trades" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Pre-loaded for your trade</h2>
            <p className="text-gray-600 max-w-xl mx-auto text-lg">
              Material lists, project templates, and pricing benchmarks built from thousands of real jobs.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Wrench, name: 'Plumbing', desc: 'Water heaters, repipes, drain cleaning, gas lines.', color: 'blue' },
              { icon: Snowflake, name: 'HVAC', desc: 'AC installs, furnaces, ductwork, heat pumps.', color: 'cyan' },
              { icon: Zap, name: 'Electrical', desc: 'Panel upgrades, rewires, EV chargers, generators.', color: 'amber' },
              { icon: Hammer, name: 'General Contracting', desc: 'Multi-phase builds, zone-based project tracking.', color: 'purple' },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
                <div className={`w-12 h-12 rounded-xl bg-${t.color}-50 text-${t.color}-600 flex items-center justify-center mb-4`}>
                  <t.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t.name}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MOBILE COMPANION ──────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-4 border border-purple-200">
                <MapPin className="w-3.5 h-3.5" />
                In the truck. In the field. In your pocket.
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight mb-5">
                Web for command. <span className="text-purple-600">Mobile for the field.</span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                The web dashboard is your command center. The iOS + Android app is your field kit. Log hours, snap photos, check off tasks, send
                invoices, optimize your route — everything syncs instantly back to the dashboard.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Clock, label: 'Live job timer' },
                  { icon: MapPin, label: 'Route optimizer' },
                  { icon: FileText, label: 'Photo docs' },
                  { icon: DollarSign, label: 'On-site invoicing' },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                    <f.icon className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">{f.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex gap-3">
                <a
                  href="https://apps.apple.com/app/id6761025816"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 text-sm"
                >
                  App Store
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=io.flowboss.app"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 text-sm"
                >
                  Google Play
                </a>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <div className="w-[200px] transform -rotate-3">
                <PhoneFrame src={screenshots.schedule} alt="Schedule" />
              </div>
              <div className="w-[200px] transform rotate-3 mt-10">
                <PhoneFrame src={screenshots.invoice} alt="Invoice" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COMPARISON ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-center text-gray-900 mb-4 tracking-tight">How FlowBoss compares</h2>
          <p className="text-center text-gray-600 mb-12 max-w-xl mx-auto text-lg">
            Built for contractors who actually work in the field — not enterprise sales teams.
          </p>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-4 px-4 font-medium text-gray-500 bg-transparent sticky left-0 z-10 min-w-[200px]"></th>
                  <th className="py-4 px-4 text-center bg-blue-600 text-white font-bold rounded-t-xl text-base min-w-[120px]">FlowBoss</th>
                  <th className="py-4 px-4 text-center text-gray-700 font-semibold bg-gray-100 min-w-[120px]">ServiceTitan</th>
                  <th className="py-4 px-4 text-center text-gray-700 font-semibold bg-gray-100 min-w-[120px]">Jobber</th>
                  <th className="py-4 px-4 text-center text-gray-700 font-semibold bg-gray-100 min-w-[120px]">HouseCall Pro</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Starting price', fb: '$29.99/mo', st: '$398/mo', jb: '$39/mo', hc: '$49/mo' },
                  { feature: 'No per-user fees', fb: true, st: false, jb: false, hc: false },
                  { feature: 'GC command center', fb: true, st: false, jb: false, hc: false },
                  { feature: 'Zone-based project visualizer', fb: true, st: false, jb: false, hc: false },
                  { feature: 'Sub workspace (free for invited subs)', fb: true, st: false, jb: false, hc: false },
                  { feature: 'Shared GC ↔ Sub graph', fb: true, st: false, jb: false, hc: false },
                  { feature: 'FlowBoss Score (quality + timeliness)', fb: true, st: false, jb: false, hc: false },
                  { feature: 'Sub marketplace', fb: 'Coming', st: false, jb: false, hc: false },
                  { feature: 'Stripe payment links', fb: true, st: false, jb: false, hc: false },
                  { feature: 'QuickBooks sync', fb: true, st: true, jb: true, hc: true },
                  { feature: 'Route optimization', fb: true, st: true, jb: true, hc: true },
                  { feature: 'Multi-phase projects', fb: true, st: true, jb: false, hc: false },
                  { feature: 'Trade-specific templates', fb: true, st: true, jb: false, hc: false },
                  { feature: 'Revenue-per-hour analytics', fb: true, st: false, jb: false, hc: false },
                  { feature: 'AI job suggestions', fb: true, st: false, jb: false, hc: false },
                  { feature: 'Built for solo + small crews', fb: true, st: false, jb: true, hc: true },
                  { feature: 'Free trial', fb: '14 days', st: false, jb: '14 days', hc: '14 days' },
                ].map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="py-3.5 px-4 font-medium text-gray-900 sticky left-0 z-10 bg-inherit">{row.feature}</td>
                    {[row.fb, row.st, row.jb, row.hc].map((val, j) => (
                      <td key={j} className={`py-3.5 px-4 text-center ${j === 0 ? 'bg-blue-50/50 font-semibold' : ''}`}>
                        {val === true ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                        ) : val === false ? (
                          <span className="text-gray-300 text-lg">—</span>
                        ) : (
                          <span className={j === 0 ? 'text-blue-600 font-bold' : 'text-gray-600'}>{val}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── PRICING ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-center text-gray-900 mb-4 tracking-tight">Simple, transparent pricing</h2>
          <p className="text-center text-gray-600 mb-14 max-w-xl mx-auto text-lg">
            Everything included. No per-user fees. No hidden costs. Invited subs always free.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden flex flex-col">
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Monthly</h3>
                <p className="text-sm text-gray-500 mb-6">Pay as you go, cancel anytime</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">$29.99</span>
                  <span className="text-gray-500">/mo</span>
                </div>
                <p className="text-sm text-gray-500 mt-1 mb-6">&nbsp;</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {pricingFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="text-gray-700 text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <a href="/signup?plan=monthly" className="block w-full text-center px-6 py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800">
                  Start Free Trial
                </a>
              </div>
            </div>

            <div className="bg-white rounded-3xl border-2 border-blue-500 shadow-xl overflow-hidden flex flex-col relative">
              <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-center text-sm font-semibold py-1.5">
                Best Value — Save $160/yr
              </div>
              <div className="p-8 pt-12 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Annual</h3>
                <p className="text-sm text-gray-500 mb-6">Lock in the lowest price</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">$16.67</span>
                  <span className="text-gray-500">/mo</span>
                </div>
                <p className="text-sm text-gray-500 mt-1 mb-6">Billed annually at $199.99/yr</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {pricingFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="text-gray-700 text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <a href="/signup?plan=annual" className="block w-full text-center px-6 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/25">
                  Start Free Trial
                </a>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">14-day free trial. Credit card required. Subs invited by a GC are always free.</p>
        </div>
      </section>

      {/* ─── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-center text-gray-900 mb-14 tracking-tight">Trusted by contractors</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-900 text-lg font-medium mb-6 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── EMAIL CAPTURE ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Mail className="w-8 h-8 text-blue-200 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Contractor tips &amp; feature updates</h2>
          <p className="text-blue-100 mb-8 max-w-md mx-auto">
            Join the FlowBoss list for trade tips, product updates, and exclusive offers. No spam — we keep it useful.
          </p>
          <EmailCaptureForm variant="inline" />
          <p className="text-blue-200/60 text-xs mt-4">Unsubscribe anytime. We respect your inbox.</p>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.15),transparent_50%)]" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Ready to run a better business?
          </h2>
          <p className="text-gray-400 mb-10 max-w-xl mx-auto text-lg">
            Whether you're a GC running 5 projects or a solo plumber doing 4 jobs a day — FlowBoss is the command center you've been missing.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/30 text-lg"
            >
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 border border-white/20 text-lg"
            >
              View Pricing
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-500">14-day free trial. Invited subs are always free.</p>
        </div>
      </section>
    </>
  );
}
