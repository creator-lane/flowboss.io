import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wrench, ArrowRight, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthShell, AuthCard } from '../components/ui/AuthShell';

/**
 * Reset Password — step 2 of 2.
 *
 * User arrives here by clicking the reset link from the email sent in
 * ForgotPassword. Supabase's onAuthStateChange fires a `PASSWORD_RECOVERY`
 * event, which establishes a short-lived session we can use to call
 * updateUser({ password }). Once updated, redirect to dashboard.
 *
 * If the user loads this page WITHOUT a valid recovery session (e.g.
 * deep-linked, expired token, already used link) we show a recoverable
 * error with a link back to Forgot Password.
 */
export function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);

  // On mount, check whether we're in a recovery session. Supabase puts
  // the access_token in the URL hash when the user clicks the reset email
  // link; auto-parsed by the client and surfaced via onAuthStateChange.
  useEffect(() => {
    let alive = true;

    // Check existing session first (covers refresh after initial load)
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      if (data.session) {
        setHasRecoverySession(true);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setHasRecoverySession(true);
      }
    });

    // Settle the "no session" state after a short delay if nothing fired
    const timer = setTimeout(() => {
      if (alive && hasRecoverySession === null) {
        setHasRecoverySession(false);
      }
    }, 1500);

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }
    setDone(true);
    setSubmitting(false);
    // Brief pause so the user sees the success state, then route onwards
    setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
  };

  const inputClass =
    'w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-blue-400 dark:focus:border-blue-400';

  // Loading — still determining if the recovery session is valid
  if (hasRecoverySession === null) {
    return (
      <AuthShell>
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AuthShell>
    );
  }

  // No valid recovery session — link was expired, used, or the user typed
  // /reset-password by hand.
  if (!hasRecoverySession) {
    return (
      <AuthShell>
        <div className="w-full max-w-sm mx-auto">
          <AuthCard>
            <div className="flex flex-col items-center mb-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-3 shadow-lg shadow-red-500/30">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Reset link expired
              </h1>
              <p className="text-sm text-gray-500 mt-1.5 dark:text-gray-400 text-center">
                Reset links are valid for 1 hour and can only be used once.
              </p>
            </div>
            <Link
              to="/forgot-password"
              className="group w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
            >
              Request a new link
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </AuthCard>
          <div className="flex items-center justify-center gap-4 mt-6">
            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700 transition-colors dark:text-gray-500 dark:hover:text-blue-300">
              &larr; Back to sign in
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  // Success state
  if (done) {
    return (
      <AuthShell>
        <div className="w-full max-w-sm mx-auto">
          <AuthCard>
            <div className="text-center py-4">
              <div className="relative inline-block mb-3">
                <div className="absolute inset-0 rounded-full bg-green-500/30 blur-xl" />
                <div className="relative w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-base font-semibold text-gray-900 mb-1 dark:text-white">
                Password updated
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Signing you in...
              </p>
            </div>
          </AuthCard>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="w-full max-w-sm mx-auto">
        <AuthCard>
          <div className="flex flex-col items-center mb-7">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Set a new password
            </h1>
            <p className="text-sm text-gray-500 mt-1.5 dark:text-gray-400 text-center">
              Pick something you'll remember — at least 8 characters.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-gray-300">
                New password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass + ' pr-10'}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-gray-300">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                placeholder="Type it again"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="group w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                'Updating...'
              ) : (
                <>
                  Update password
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </AuthCard>
      </div>
    </AuthShell>
  );
}
