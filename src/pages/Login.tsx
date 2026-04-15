import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

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

    const { error } = await supabase.auth.signInWithOtp({ email });

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
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center mb-3">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sign in to FlowBoss</h1>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6 dark:bg-white/10">
            <button
              type="button"
              onClick={() => switchMode('password')}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
                mode === 'password'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-white/10 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Email &amp; Password
            </button>
            <button
              type="button"
              onClick={() => switchMode('magic-link')}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
                mode === 'magic-link'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-white/10 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Magic Link
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Email & Password form */}
          {mode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                  placeholder="Enter your password"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Magic Link form */}
          {mode === 'magic-link' && !magicLinkSent && (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label htmlFor="magic-email" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                  Email
                </label>
                <input
                  id="magic-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                  placeholder="you@company.com"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>
          )}

          {/* Magic link success */}
          {mode === 'magic-link' && magicLinkSent && (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1 dark:text-white">Check your email</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                We sent a magic link to <span className="font-medium dark:text-gray-200">{email}</span>
              </p>
            </div>
          )}
        </div>

        {/* Back to homepage */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-gray-500 hover:text-brand-500 transition-colors dark:text-gray-500 dark:hover:text-blue-300">
            &larr; Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
