import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Wrench, ArrowRight, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthShell, AuthCard } from '../components/ui/AuthShell';

/**
 * Forgot Password — step 1 of 2.
 *
 * User types their email. We call supabase.auth.resetPasswordForEmail,
 * which emails a link that lands on /reset-password with a session
 * token. Step 2 (setting the new password) happens in ResetPassword.tsx.
 *
 * The redirectTo value anchors to the current origin, same pattern as
 * the magic-link flow in Login.tsx, so dev → dev and prod → prod
 * regardless of what Supabase's dashboard Site URL is set to.
 */
export function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setSubmitting(false);
    } else {
      setSent(true);
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-blue-400 dark:focus:border-blue-400';

  return (
    <AuthShell>
      <div className="w-full max-w-sm mx-auto">
        <AuthCard>
          <div className="flex flex-col items-center mb-7">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Reset your password
            </h1>
            <p className="text-sm text-gray-500 mt-1.5 dark:text-gray-400 text-center">
              We'll email you a link to pick a new one.
            </p>
          </div>

          {sent ? (
            <div className="text-center py-4">
              <div className="relative inline-block mb-3">
                <div className="absolute inset-0 rounded-full bg-green-500/30 blur-xl" />
                <div className="relative w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                  <Mail className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-base font-semibold text-gray-900 mb-1 dark:text-white">
                Check your email
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                We sent a reset link to{' '}
                <span className="font-medium text-gray-700 dark:text-gray-200">{email}</span>
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 leading-relaxed">
                Didn't get it? Check spam, or wait 60 seconds and try again.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="you@company.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="group w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    'Sending...'
                  ) : (
                    <>
                      Send reset link
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
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
