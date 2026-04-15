import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, ArrowLeft, ArrowRight, Check, Users, User, Building2, HardHat, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
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
  { id: 'Plumbing', label: 'Plumbing', emoji: '\uD83D\uDD27' },
  { id: 'Electrical', label: 'Electrical', emoji: '\u26A1' },
  { id: 'HVAC', label: 'HVAC', emoji: '\u2744\uFE0F' },
  { id: 'General Contractor', label: 'General Contractor', emoji: '\uD83C\uDFD7\uFE0F' },
  { id: 'Roofing', label: 'Roofing', emoji: '\uD83C\uDFE0' },
  { id: 'Painting', label: 'Painting', emoji: '\uD83C\uDFA8' },
  { id: 'Landscaping', label: 'Landscaping', emoji: '\uD83C\uDF3F' },
  { id: 'Flooring', label: 'Flooring', emoji: '\uD83E\uDEB5' },
  { id: 'Concrete', label: 'Concrete', emoji: '\uD83E\uDDF1' },
  { id: 'Other', label: 'Other', emoji: '\uD83D\uDEE0\uFE0F' },
];

const TEAM_SIZES = [
  { id: 'solo', label: 'Just me', icon: User },
  { id: '2-5', label: '2-5 people', icon: Users },
  { id: '6-15', label: '6-15 people', icon: Building2 },
  { id: '15+', label: '15+ people', icon: HardHat },
];

const BUSINESS_ROLES = [
  {
    id: 'gc',
    label: 'I AM a GC',
    desc: 'I manage projects with multiple subs',
  },
  {
    id: 'sub',
    label: 'I work FOR GCs',
    desc: 'I get hired as a sub on GC projects',
  },
  {
    id: 'both',
    label: 'Both',
    desc: 'I do my own jobs AND work on GC projects',
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
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">What's your trade?</h2>
      <p className="text-gray-500 text-center mb-8">Select the trade that best describes your business.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {TRADES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange({ trade: t.id, customTrade: t.id === 'Other' ? data.customTrade : '' })}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              data.trade === t.id
                ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <span className="text-2xl">{t.emoji}</span>
            <span className="text-sm font-medium text-gray-900">{t.label}</span>
          </button>
        ))}
      </div>
      {data.trade === 'Other' && (
        <input
          type="text"
          placeholder="Enter your trade..."
          value={data.customTrade}
          onChange={(e) => onChange({ customTrade: e.target.value })}
          className="mt-4 w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
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
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">How big is your team?</h2>
      <p className="text-gray-500 text-center mb-8">This helps us tailor the experience for you.</p>
      <div className="grid grid-cols-2 gap-4">
        {TEAM_SIZES.map((ts) => {
          const Icon = ts.icon;
          return (
            <button
              key={ts.id}
              type="button"
              onClick={() => onChange({ teamSize: ts.id })}
              className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                data.teamSize === ts.id
                  ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <Icon className={`w-8 h-8 ${data.teamSize === ts.id ? 'text-brand-500' : 'text-gray-400'}`} />
              <span className="text-sm font-medium text-gray-900">{ts.label}</span>
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
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Tell us about your business</h2>
      <p className="text-gray-500 text-center mb-8">We'll use this to set up your account.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={data.businessName}
            onChange={(e) => onChange({ businessName: e.target.value })}
            placeholder="Acme Plumbing LLC"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="(555) 123-4567"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Zip Code <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={data.zip}
            onChange={(e) => onChange({ zip: e.target.value })}
            placeholder="90210"
            maxLength={10}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
      </div>
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
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">How do you work with GCs?</h2>
      <p className="text-gray-500 text-center mb-8">This helps us show you the right tools.</p>
      <div className="space-y-3">
        {BUSINESS_ROLES.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => onChange({ businessRole: role.id })}
            className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
              data.businessRole === role.id
                ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="font-semibold text-gray-900">{role.label}</div>
            <div className="text-sm text-gray-500 mt-1">{role.desc}</div>
          </button>
        ))}
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
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">What matters most to you?</h2>
      <p className="text-gray-500 text-center mb-8">Pick up to 3. This helps us personalize your experience.</p>
      <div className="space-y-3">
        {PRIORITIES.map((p) => {
          const selected = data.priorities.includes(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => toggle(p)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                selected
                  ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div
                className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                  selected ? 'bg-brand-500' : 'border-2 border-gray-300'
                }`}
              >
                {selected && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <span className="text-sm font-medium text-gray-900">{p}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepComplete({ data }: { data: OnboardingData }) {
  const tradeName = data.trade === 'Other' ? data.customTrade || 'Other' : data.trade;
  const teamLabel = TEAM_SIZES.find((t) => t.id === data.teamSize)?.label || data.teamSize;
  const roleLabel = BUSINESS_ROLES.find((r) => r.id === data.businessRole)?.label || data.businessRole;

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h2>
      <p className="text-gray-500 mb-8">Here's a summary of your setup.</p>

      <div className="bg-gray-50 rounded-xl p-6 text-left space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Trade</span>
          <span className="font-medium text-gray-900">{tradeName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Team Size</span>
          <span className="font-medium text-gray-900">{teamLabel}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Business</span>
          <span className="font-medium text-gray-900">{data.businessName}</span>
        </div>
        {data.phone && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Phone</span>
            <span className="font-medium text-gray-900">{data.phone}</span>
          </div>
        )}
        {data.zip && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Zip</span>
            <span className="font-medium text-gray-900">{data.zip}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">GC Role</span>
          <span className="font-medium text-gray-900">{roleLabel}</span>
        </div>
        {data.priorities.length > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 flex-shrink-0">Priorities</span>
            <span className="font-medium text-gray-900 text-right">{data.priorities.join(', ')}</span>
          </div>
        )}
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

  // Auto-skip for existing users who already onboarded
  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    (async () => {
      try {
        const { data: profile } = await api.getSettings();
        if (!cancelled && profile?.business_name) {
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch {
        // Profile fetch failed — let them onboard
      }
      if (!cancelled) setCheckingProfile(false);
    })();

    return () => {
      cancelled = true;
    };
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

      // Save fields the profiles table supports for sure
      const profileUpdate: Record<string, any> = {
        business_name: data.businessName.trim(),
        trade: tradeValue,
      };

      if (data.phone.trim()) profileUpdate.phone = data.phone.trim();

      // Attempt to save additional fields — these may or may not exist on the table yet.
      // Supabase will ignore unknown columns in a PATCH-style update.
      if (data.zip.trim()) profileUpdate.zip = data.zip.trim();
      if (data.teamSize) profileUpdate.team_size = data.teamSize;
      if (data.businessRole) profileUpdate.business_role = data.businessRole;
      if (data.priorities.length > 0) profileUpdate.priorities = data.priorities;

      await api.updateSettings(profileUpdate);

      navigate('/dashboard/home', { replace: true });
    } catch (err: any) {
      // If the full payload fails (unknown columns), retry with just the safe fields
      try {
        await api.updateSettings({
          business_name: data.businessName.trim(),
          trade: data.trade === 'Other' ? data.customTrade.trim() : data.trade,
          phone: data.phone.trim() || undefined,
        });
        navigate('/dashboard/home', { replace: true });
      } catch {
        addToast('Failed to save — you can update this in Settings later.', 'error');
        navigate('/dashboard/home', { replace: true });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  // Loading states
  if (authLoading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="pt-8 pb-4 flex justify-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">FlowBoss</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="max-w-2xl mx-auto w-full px-4 mb-6">
        <div className="flex items-center gap-1">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-brand-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        <div className="text-xs text-gray-400 text-center mt-2">
          Step {step + 1} of {TOTAL_STEPS}
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-start justify-center px-4 pb-12">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-lg p-8">{stepContent[step]}</div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={handleBack}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                step === 0
                  ? 'invisible'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!canAdvance() || saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white text-sm font-medium rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : step === TOTAL_STEPS - 1 ? (
                <>
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
