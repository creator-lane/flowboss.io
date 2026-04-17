import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Wrench, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { AuthShell, AuthCard } from '../components/ui/AuthShell';

type AuthMode = 'password' | 'magic-link';

export function Login() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');

  // Support both ?redirect= query param AND location.state.from (from RequireAuth)
  const getPostLoginPath = () => {
    if (redirectTo) return redirectTo;
    const fromState = (location.state as any)?.from?.pathname;
    if (fromState && fromState !== '/login') return fromState;
    // Check for pending invite (sub arrived via invite link, then chose to log in)
    try {
      const pending = localStorage.getItem('pendingInvite');
      if (pending) {
        const { projectId, tradeId } = JSON.parse(pending);
        if (projectId && tradeId) return `/invite/${projectId}/${tradeId}`;
      }
    } catch { /* ignore */ }
    return '/dashboard';
  };

  const [mode, setMode] = useState<AuthMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      navigate(getPostLoginPath(), { replace: true });
    }
  }, [session, loading, navigate]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setSubmitting(false);
    } else {
      navigate(getPostLoginPath(), { replace: true });
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    // Explicit redirect target — without this, Supabase falls back to the
    // "Site URL" configured in the dashboard. If that's ever set to localhost
    // (default during initial setup), every magic link in production lands on
    // localhost and the user is dead in the water. Anchoring to the current
    // origin guarantees dev → dev, prod → prod.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });

    if (error) {
      setError(error.message);
    } else {
      setMagicLinkSent(true);
    }

    setSubmitting(false);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setMagicLinkSent(false);
  };

  if (loading) {
    return (
      <AuthShell>
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AuthShell>
    );
  }

  const inputClass =
    'w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-blue-400 dark:focus:border-blue-400';

  return (
    <AuthShell>
      <div className="w-full max-w-sm mx-auto">
        <AuthCard>
          {/* Logo */}
          <div className="flex flex-col items-center mb-7">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-gray-500 mt-1.5 dark:text-gray-400">Sign in to your FlowBoss account.</p>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-5 dark:bg-white/5 dark:border dark:border-white/10">
            <button
              type="button"
              onClick={() => switchMode('password')}
              className={`flex-1 text-sm font-medium py-2 rounded-lg transition-all ${
                mode === 'password'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-white/10 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => switchMode('magic-link')}
              className={`flex-1 text-sm font-medium py-2 rounded-lg transition-all ${
                mode === 'magic-link'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-white/10 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Magic link
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Email & Password form */}
          {mode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-gray-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <Link
                    to={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Enter your password"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="group w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:from-blue-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {submitting ? (
                  'Signing in...'
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Magic Link form */}
          {mode === 'magic-link' && !magicLinkSent && (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label htmlFor="magic-email" className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-gray-300">
                  Email
                </label>
                <input
                  id="magic-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@company.com"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="group w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:from-blue-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {submitting ? (
                  'Sending...'
                ) : (
                  <>
                    Send magic link
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Magic link success */}
          {mode === 'magic-link' && magicLinkSent && (
            <div className="text-center py-4">
              <div className="relative inline-block mb-3">
                <div className="absolute inset-0 rounded-full bg-green-500/30 blur-xl" />
                <div className="relative w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <p className="text-base font-semibold text-gray-900 mb-1 dark:text-white">Check your email</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                We sent a magic link to{' '}
                <span className="font-medium text-gray-700 dark:text-gray-200">{email}</span>
              </p>
            </div>
          )}
        </AuthCard>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors dark:text-gray-500 dark:hover:text-blue-300">
            &larr; Back to homepage
          </Link>
          <span className="text-gray-300 dark:text-gray-700">·</span>
          <Link to="/signup" className="text-sm text-gray-500 hover:text-gray-700 transition-colors dark:text-gray-500 dark:hover:text-blue-300">
            Create an account
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
