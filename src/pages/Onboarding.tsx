import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Wrench,
  ArrowLeft,
  ArrowRight,
  Check,
  Users,
  User,
  Building2,
  HardHat,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
// Lazy-load seed data generator — only pulled in when onboarding completes
const loadSeedData = () => import('../lib/seedData');
import { useToast } from '../components/ui/Toast';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OnboardingData {
  trade: string;
  customTrade: string;
  teamSize: string;
  businessName: string;
  phone: string;
  zip: string;
  businessRole: string;
  priorities: string[];
}

const INITIAL_DATA: OnboardingData = {
  trade: '',
  customTrade: '',
  teamSize: '',
  businessName: '',
  phone: '',
  zip: '',
  businessRole: '',
  priorities: [],
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRADES = [
  { id: 'Plumbing', label: 'Plumbing', emoji: '\uD83D\uDD27', accent: 'from-cyan-500/20 to-blue-500/10' },
  { id: 'Electrical', label: 'Electrical', emoji: '\u26A1', accent: 'from-amber-500/20 to-yellow-500/10' },
  { id: 'HVAC', label: 'HVAC', emoji: '\u2744\uFE0F', accent: 'from-sky-500/20 to-indigo-500/10' },
  { id: 'General Contractor', label: 'General Contractor', emoji: '\uD83C\uDFD7\uFE0F', accent: 'from-blue-500/20 to-indigo-500/10' },
  { id: 'Roofing', label: 'Roofing', emoji: '\uD83C\uDFE0', accent: 'from-rose-500/20 to-orange-500/10' },
  { id: 'Painting', label: 'Painting', emoji: '\uD83C\uDFA8', accent: 'from-violet-500/20 to-fuchsia-500/10' },
  { id: 'Landscaping', label: 'Landscaping', emoji: '\uD83C\uDF3F', accent: 'from-emerald-500/20 to-green-500/10' },
  { id: 'Flooring', label: 'Flooring', emoji: '\uD83E\uDEB5', accent: 'from-orange-500/20 to-amber-500/10' },
  { id: 'Concrete', label: 'Concrete', emoji: '\uD83E\uDDF1', accent: 'from-slate-500/20 to-gray-500/10' },
  { id: 'Other', label: 'Other', emoji: '\uD83D\uDEE0\uFE0F', accent: 'from-blue-500/20 to-indigo-500/10' },
];

const TEAM_SIZES = [
  { id: 'solo', label: 'Just me', sub: 'Solo operator', icon: User },
  { id: '2-5', label: '2–5 people', sub: 'Small crew', icon: Users },
  { id: '6-15', label: '6–15 people', sub: 'Growing shop', icon: Building2 },
  { id: '15+', label: '15+ people', sub: 'Full operation', icon: HardHat },
];

const BUSINESS_ROLES = [
  {
    id: 'gc',
    label: 'I AM a GC',
    desc: 'I manage projects with multiple subs.',
    tag: 'Command center',
  },
  {
    id: 'sub',
    label: 'I work FOR GCs',
    desc: 'I get hired as a sub on GC projects.',
    tag: 'Sub workspace',
  },
  {
    id: 'both',
    label: 'Both',
    desc: 'I run my own jobs AND work on GC projects.',
    tag: 'Hybrid',
  },
];

const PRIORITIES = [
  'Scheduling & dispatch',
  'Invoicing & payments',
  'Project management',
  'Finding reliable subs',
  'Tracking job costs',
  'Building my reputation',
];

const TOTAL_STEPS = 6;

// ---------------------------------------------------------------------------
// Shared step chrome
// ---------------------------------------------------------------------------

function StepHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-semibold tracking-wide text-blue-600 dark:text-blue-300 uppercase mb-3">
        <Sparkles className="w-3 h-3" />
        {eyebrow}
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
        {title}
      </h2>
      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">{subtitle}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step Components
// ---------------------------------------------------------------------------

function StepTrade({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
}) {
  return (
    <div>
      <StepHeader
        eyebrow="Your trade"
        title="What do you build?"
        subtitle="Pick the trade that best fits your business — we'll tailor templates and pricebook to match."
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {TRADES.map((t) => {
          const selected = data.trade === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange({ trade: t.id, customTrade: t.id === 'Other' ? data.customTrade : '' })}
              className={`group relative flex flex-col items-center justify-center gap-2 p-4 sm:p-5 rounded-2xl border transition-all overflow-hidden
                ${selected
                  ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10 dark:bg-blue-500/10 dark:border-blue-400'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] dark:hover:border-white/20'}`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${t.accent} transition-opacity
                  ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}
              />
              <span className="relative text-3xl">{t.emoji}</span>
              <span className="relative text-sm font-semibold text-gray-900 dark:text-white text-center">
                {t.label}
              </span>
              {selected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/40">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      {data.trade === 'Other' && (
        <input
          type="text"
          placeholder="Tell us your trade..."
          value={data.customTrade}
          onChange={(e) => onChange({ customTrade: e.target.value })}
          className="mt-4 w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
          autoFocus
        />
      )}
    </div>
  );
}

function StepTeamSize({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
}) {
  return (
    <div>
      <StepHeader
        eyebrow="Crew size"
        title="How big is your team?"
        subtitle="Small crew or full operation — we'll scale the layout and shortcuts to match."
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {TEAM_SIZES.map((ts) => {
          const Icon = ts.icon;
          const selected = data.teamSize === ts.id;
          return (
            <button
              key={ts.id}
              type="button"
              onClick={() => onChange({ teamSize: ts.id })}
              className={`relative flex flex-col items-center gap-3 p-5 sm:p-6 rounded-2xl border transition-all overflow-hidden
                ${selected
                  ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10 dark:bg-blue-500/10 dark:border-blue-400'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] dark:hover:border-white/20'}`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors
                  ${selected
                    ? 'bg-blue-600 shadow-lg shadow-blue-600/30'
                    : 'bg-gray-100 dark:bg-white/10'}`}
              >
                <Icon className={`w-6 h-6 ${selected ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
              </div>
              <div className="text-center">
                <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                  {ts.label}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{ts.sub}</div>
              </div>
              {selected && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/40">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepBusinessInfo({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
}) {
  return (
    <div>
      <StepHeader
        eyebrow="Business"
        title="Tell us about your business"
        subtitle="We'll stamp this on invoices, estimates, and your sub-facing project pages."
      />
      <div className="space-y-4">
        <Field
          label="Business Name"
          required
          value={data.businessName}
          onChange={(v) => onChange({ businessName: v })}
          placeholder="Acme Plumbing LLC"
        />
        <Field
          label="Phone Number"
          optional
          type="tel"
          value={data.phone}
          onChange={(v) => onChange({ phone: v })}
          placeholder="(555) 123-4567"
        />
        <Field
          label="Zip Code"
          optional
          value={data.zip}
          onChange={(v) => onChange({ zip: v })}
          placeholder="90210"
          maxLength={10}
          inputMode="numeric"
          pattern="\d{5}(-\d{4})?"
        />
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  optional,
  value,
  onChange,
  placeholder,
  type = 'text',
  maxLength,
  inputMode,
  pattern,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  /** Mobile keyboard hint. "numeric" pops the number pad. */
  inputMode?: 'text' | 'numeric' | 'tel' | 'email' | 'url' | 'decimal' | 'search';
  /** HTML5 pattern for browser-side validation. */
  pattern?: string;
}) {
  return (
    <div>
      <label className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </span>
        {optional && (
          <span className="text-[11px] text-gray-400 dark:text-gray-500">Optional</span>
        )}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        pattern={pattern}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
      />
    </div>
  );
}

function StepGCRole({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
}) {
  return (
    <div>
      <StepHeader
        eyebrow="Your role"
        title="How do you work with GCs?"
        subtitle="FlowBoss is one platform for GCs, subs, and solo trades. We'll show you the right tools."
      />
      <div className="space-y-3">
        {BUSINESS_ROLES.map((role) => {
          const selected = data.businessRole === role.id;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onChange({ businessRole: role.id })}
              className={`w-full text-left p-5 rounded-2xl border transition-all
                ${selected
                  ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10 dark:bg-blue-500/10 dark:border-blue-400'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] dark:hover:border-white/20'}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-colors mt-0.5
                    ${selected
                      ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-600/30'
                      : 'border-gray-300 dark:border-white/20'}`}
                >
                  {selected && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white">{role.label}</span>
                    <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                      {role.tag}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{role.desc}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepPriorities({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
}) {
  const toggle = (p: string) => {
    const current = data.priorities;
    if (current.includes(p)) {
      onChange({ priorities: current.filter((x) => x !== p) });
    } else if (current.length < 3) {
      onChange({ priorities: [...current, p] });
    }
  };

  return (
    <div>
      <StepHeader
        eyebrow="Priorities"
        title="What matters most to you?"
        subtitle="Pick up to 3. We'll pin these to the top of your dashboard."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRIORITIES.map((p) => {
          const selected = data.priorities.includes(p);
          const disabled = !selected && data.priorities.length >= 3;
          return (
            <button
              key={p}
              type="button"
              onClick={() => toggle(p)}
              disabled={disabled}
              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3
                ${selected
                  ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10 dark:bg-blue-500/10 dark:border-blue-400'
                  : disabled
                    ? 'border-gray-200 bg-gray-50 opacity-50 dark:border-white/5 dark:bg-white/[0.02]'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] dark:hover:border-white/20'}`}
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border-2 transition-colors
                  ${selected
                    ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-600/30'
                    : 'border-gray-300 dark:border-white/20'}`}
              >
                {selected && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{p}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
        {data.priorities.length}/3 selected
      </div>
    </div>
  );
}

function StepComplete({ data }: { data: OnboardingData }) {
  const tradeName = data.trade === 'Other' ? data.customTrade || 'Other' : data.trade;
  const teamLabel = TEAM_SIZES.find((t) => t.id === data.teamSize)?.label || data.teamSize;
  const roleLabel = BUSINESS_ROLES.find((r) => r.id === data.businessRole)?.label || data.businessRole;

  const rows: Array<[string, string | null]> = [
    ['Trade', tradeName],
    ['Team size', teamLabel],
    ['Business', data.businessName],
    ['Phone', data.phone || null],
    ['Zip', data.zip || null],
    ['Role', roleLabel],
    ['Priorities', data.priorities.length > 0 ? data.priorities.join(', ') : null],
  ];

  return (
    <div className="text-center">
      <div className="relative inline-block mb-6">
        <div className="absolute inset-0 rounded-full bg-blue-500/30 blur-2xl animate-pulse" />
        <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/40">
          <Check className="w-10 h-10 text-white" strokeWidth={3} />
        </div>
      </div>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-semibold tracking-wide text-blue-600 dark:text-blue-300 uppercase mb-3">
        <Sparkles className="w-3 h-3" />
        Almost there
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
        You're all set.
      </h2>
      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-8">
        We're about to pre-load your dashboard with a realistic {tradeName.toLowerCase() || 'starter'} project so it looks lived-in from day one.
      </p>

      <div className="text-left rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white overflow-hidden dark:border-white/10 dark:from-white/[0.03] dark:to-white/[0.01]">
        {rows
          .filter(([, v]) => v)
          .map(([label, value], idx, arr) => (
            <div
              key={label}
              className={`flex items-start justify-between gap-4 px-5 py-3 text-sm ${
                idx < arr.length - 1 ? 'border-b border-gray-100 dark:border-white/5' : ''
              }`}
            >
              <span className="text-gray-500 dark:text-gray-400">{label}</span>
              <span className="font-semibold text-gray-900 dark:text-white text-right">{value}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function Onboarding() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();

  // Preserve the plan the user picked on /pricing so we can drop them
  // straight into /checkout after onboarding — no second pricing stop.
  const planFromUrl = searchParams.get('plan');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(planFromUrl);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [saving, setSaving] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, session, navigate]);

  // Auto-skip for existing users who already completed onboarding.
  // We check business_role (only set by onboarding), NOT business_name
  // (which Signup used to write, causing an instant skip).
  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    (async () => {
      try {
        const { data: profile } = await api.getSettings();
        // Track subscription status so post-onboarding we can skip checkout
        // for users who already have access (e.g. invited subs, grandfathered
        // mobile users, or someone resuming onboarding after paying).
        const sub = profile?.subscription_status;
        if (!cancelled && (sub === 'active' || sub === 'trialing')) {
          setHasActiveSubscription(true);
        }
        if (!cancelled && profile?.business_role) {
          navigate('/dashboard', { replace: true });
          return;
        }
        if (!cancelled) {
          try {
            const stashed = localStorage.getItem('flowboss-signup');
            if (stashed) {
              const { businessName, trade, plan: stashedPlan } = JSON.parse(stashed);
              setData((prev) => ({
                ...prev,
                businessName: businessName || prev.businessName,
                trade: trade || prev.trade,
              }));
              // If we don't have a plan from the URL, fall back to localStorage
              if (!planFromUrl && stashedPlan) {
                setSelectedPlan(stashedPlan);
              }
              localStorage.removeItem('flowboss-signup');
            }
          } catch {
            /* ignore bad parse */
          }
        }
      } catch {
        /* profile fetch failed — let them onboard */
      }
      if (!cancelled) setCheckingProfile(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, navigate]);

  const update = (partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  // Validation per step
  const canAdvance = (): boolean => {
    switch (step) {
      case 0:
        return data.trade !== '' && (data.trade !== 'Other' || data.customTrade.trim() !== '');
      case 1:
        return data.teamSize !== '';
      case 2:
        return data.businessName.trim() !== '';
      case 3:
        return data.businessRole !== '';
      case 4:
        return data.priorities.length >= 1;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
      return;
    }

    // Final step — save and navigate
    setSaving(true);
    try {
      const tradeValue = data.trade === 'Other' ? data.customTrade.trim() : data.trade;

      const profileUpdate: Record<string, any> = {
        business_name: data.businessName.trim(),
        trade: tradeValue,
      };

      if (data.phone.trim()) profileUpdate.phone = data.phone.trim();
      if (data.zip.trim()) profileUpdate.zip = data.zip.trim();
      if (data.teamSize) profileUpdate.team_size = data.teamSize;
      if (data.businessRole) profileUpdate.business_role = data.businessRole;
      if (data.priorities.length > 0) profileUpdate.priorities = data.priorities;

      await api.updateSettings(profileUpdate);

      try {
        const { generateSeedData } = await loadSeedData();
        await generateSeedData(tradeValue);
      } catch {
        /* seed data non-blocking */
      }

      navigate(postOnboardingPath(), { replace: true });
    } catch {
      try {
        await api.updateSettings({
          business_name: data.businessName.trim(),
          trade: data.trade === 'Other' ? data.customTrade.trim() : data.trade,
          phone: data.phone.trim() || undefined,
        });
        navigate(postOnboardingPath(), { replace: true });
      } catch {
        addToast('Failed to save — you can update this in Settings later.', 'error');
        navigate(postOnboardingPath(), { replace: true });
      }
    } finally {
      setSaving(false);
    }
  };

  /**
   * Where to send the user when onboarding completes.
   * - If they already have an active/trialing subscription (e.g. invited sub,
   *   or someone who completed checkout earlier) → dashboard.
   * - Otherwise → checkout, preserving the plan they picked on /pricing so
   *   they don't bounce back through the pricing page.
   */
  function postOnboardingPath(): string {
    if (hasActiveSubscription) return '/dashboard/home';
    const plan = selectedPlan || 'monthly';
    return `/checkout?plan=${encodeURIComponent(plan)}`;
  }

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  // Loading state
  if (authLoading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stepContent = [
    <StepTrade key="trade" data={data} onChange={update} />,
    <StepTeamSize key="team" data={data} onChange={update} />,
    <StepBusinessInfo key="biz" data={data} onChange={update} />,
    <StepGCRole key="gc" data={data} onChange={update} />,
    <StepPriorities key="priorities" data={data} onChange={update} />,
    <StepComplete key="complete" data={data} />,
  ];

  const progressPct = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden bg-gray-100 dark:bg-gray-950">
      {/* Dark-mode atmospheric background (matches homepage aesthetic) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden hidden dark:block">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Header */}
      <div className="relative pt-8 sm:pt-10 pb-4 flex justify-center">
        <div className="flex items-center gap-2.5">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">FlowBoss</span>
        </div>
      </div>

      {/* Progress */}
      <div className="relative max-w-2xl mx-auto w-full px-4 sm:px-6 mb-6 sm:mb-8">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wide font-semibold mb-2">
          <span className="text-blue-600 dark:text-blue-300">
            Step {step + 1} of {TOTAL_STEPS}
          </span>
          <span className="text-gray-400 dark:text-gray-500">{Math.round(progressPct)}% complete</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 shadow-lg shadow-blue-500/30"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="relative flex-1 flex items-start justify-center px-4 sm:px-6 pb-12">
        <div className="w-full max-w-2xl">
          <div className="relative rounded-3xl border border-gray-200 bg-white shadow-xl p-6 sm:p-10 overflow-hidden dark:border-white/10 dark:bg-white/[0.04] dark:backdrop-blur-xl dark:shadow-2xl dark:shadow-blue-500/5">
            {/* Subtle top-edge gradient glow in dark mode */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent dark:via-blue-400/30" />
            {stepContent[step]}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-5 sm:mt-6">
            <button
              type="button"
              onClick={handleBack}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors
                ${step === 0
                  ? 'invisible'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'}`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!canAdvance() || saving}
              className="group flex items-center gap-2 px-5 sm:px-6 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:from-blue-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Setting up your workspace...
                </>
              ) : step === TOTAL_STEPS - 1 ? (
                <>
                  Launch dashboard
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
