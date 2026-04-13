import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import {
  User,
  Building2,
  Phone,
  Mail,
  Wrench,
  Save,
  CreditCard,
  CheckCircle,
  ExternalLink,
  LogOut,
  Trash2,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { PricebookManager } from '../../components/settings/PricebookManager';

const TRADE_OPTIONS = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'general_contractor', label: 'General Contractor' },
];

const TABS = [
  { key: 'profile', label: 'Profile', icon: Building2 },
  { key: 'pricebook', label: 'Pricebook', icon: BookOpen },
  { key: 'payments', label: 'Payments', icon: CreditCard },
] as const;

type TabKey = (typeof TABS)[number]['key'];

function SkeletonField() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-3 bg-neutral-200 rounded w-24" />
      <div className="h-10 bg-neutral-100 rounded-lg w-full" />
    </div>
  );
}

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  // Settings query
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
  });

  // Stripe status query
  const { data: stripeData, isLoading: stripeLoading } = useQuery({
    queryKey: ['stripe-status'],
    queryFn: () => api.checkStripeConnectStatus(),
  });

  const profile = settingsData?.data;

  // Form state
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [trade, setTrade] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState('');

  // Derive displayed values: local state overrides server data
  const displayName = businessName ?? profile?.business_name ?? profile?.company_name ?? '';
  const displayPhone = phone ?? profile?.phone ?? '';
  const displayEmail = email ?? profile?.email ?? user?.email ?? '';
  const displayTrade = trade ?? profile?.trade ?? '';

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (updates: any) => api.updateSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    },
    onError: () => {
      setSaveMessage('Failed to save. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      business_name: displayName,
      phone: displayPhone,
      email: displayEmail,
      trade: displayTrade,
    });
  };

  // Stripe connect
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [stripeConnectUrl, setStripeConnectUrl] = useState('');
  const [stripeConnectError, setStripeConnectError] = useState('');

  const handleConnectStripe = async () => {
    setConnectingStripe(true);
    setStripeConnectError('');
    try {
      const result = await api.getStripeConnectUrl();
      if (result.url) {
        setStripeConnectUrl(result.url);
      } else {
        setStripeConnectError('Could not generate Stripe connect URL');
      }
    } catch {
      setStripeConnectError('Failed to get Stripe connect URL. Please try again.');
    } finally {
      setConnectingStripe(false);
    }
  };

  const stripeConnected = stripeData?.connected ?? false;
  const stripeAccountId = stripeData?.accountId ?? null;
  const maskedAccountId = stripeAccountId
    ? `${stripeAccountId.slice(0, 8)}${'*'.repeat(Math.max(0, stripeAccountId.length - 12))}${stripeAccountId.slice(-4)}`
    : null;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Settings</h1>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 mb-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <>
          {/* Business Profile */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <Building2 className="w-5 h-5 text-brand-500" />
              <h2 className="text-lg font-bold text-neutral-900">Business Profile</h2>
            </div>

            {settingsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <SkeletonField />
                <SkeletonField />
                <SkeletonField />
                <SkeletonField />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Business Name */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-600 mb-1.5">
                      Business Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Your business name"
                        className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-600 mb-1.5">
                      Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="tel"
                        value={displayPhone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-600 mb-1.5">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="email"
                        value={displayEmail}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Trade */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-600 mb-1.5">
                      Trade
                    </label>
                    <div className="relative">
                      <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <select
                        value={displayTrade}
                        onChange={(e) => setTrade(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition appearance-none bg-white"
                      >
                        <option value="">Select trade</option>
                        {TRADE_OPTIONS.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Save */}
                <div className="mt-5 flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50 transition text-sm"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Changes
                  </button>
                  {saveMessage && (
                    <span
                      className={`text-sm font-medium ${
                        saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {saveMessage}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Account */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-brand-500" />
              <h2 className="text-lg font-bold text-neutral-900">Account</h2>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {(user?.email?.[0] ?? '?').toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">{user?.email ?? 'Not signed in'}</p>
                <p className="text-xs text-neutral-400">Signed in</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={signOut}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition text-sm"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
              <a
                href="/delete-account"
                className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-600 font-semibold rounded-lg hover:bg-neutral-50 transition text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </a>
            </div>
          </div>
        </>
      )}

      {/* Pricebook Tab */}
      {activeTab === 'pricebook' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <BookOpen className="w-5 h-5 text-brand-500" />
            <h2 className="text-lg font-bold text-neutral-900">Pricebook</h2>
          </div>
          <PricebookManager />
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-brand-500" />
            <h2 className="text-lg font-bold text-neutral-900">Payment Processing</h2>
          </div>
          <p className="text-sm text-neutral-500 mb-4">
            Connect your Stripe account to accept payments via payment links.
          </p>

          {stripeLoading ? (
            <div className="animate-pulse">
              <div className="h-10 bg-neutral-100 rounded-lg w-48" />
            </div>
          ) : stripeConnected ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                <CheckCircle className="w-4 h-4" />
                Connected
              </span>
              {maskedAccountId && (
                <span className="text-sm text-neutral-400 font-mono">{maskedAccountId}</span>
              )}
            </div>
          ) : stripeConnectUrl ? (
            <div className="space-y-3">
              <p className="text-sm text-neutral-600">
                You'll be redirected to Stripe to complete setup.
              </p>
              <a
                href={stripeConnectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 transition text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Continue to Stripe
              </a>
              <p className="text-xs text-neutral-400 truncate max-w-md" title={stripeConnectUrl}>
                {stripeConnectUrl}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleConnectStripe}
                disabled={connectingStripe}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50 transition text-sm"
              >
                {connectingStripe ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                Connect Stripe
              </button>
              {stripeConnectError && (
                <p className="text-sm text-red-600">{stripeConnectError}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
