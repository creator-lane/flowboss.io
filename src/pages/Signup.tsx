import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Wrench, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/ui/Toast';
import { AuthShell, AuthCard } from '../components/ui/AuthShell';

export function Signup() {
  const { session, loading } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') || 'monthly';

  // Invite params from the GC invite link
  const inviteProjectId = searchParams.get('invite');
  const inviteTradeId = searchParams.get('trade');
  const isInvite = !!(inviteProjectId && inviteTradeId);

  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const justSignedUp = useRef(false);

  // Fetch project name for invite context
  const [inviteProjectName, setInviteProjectName] = useState<string | null>(null);
  useEffect(() => {
    if (!inviteProjectId) return;
    supabase
      .from('gc_projects')
      .select('name')
      .eq('id', inviteProjectId)
      .single()
      .then(({ data }) => {
        if (data?.name) setInviteProjectName(data.name);
      });
  }, [inviteProjectId]);

  useEffect(() => {
    // Only redirect if user arrived at /signup already authenticated.
    // Don't redirect after a fresh signup — handleSubmit controls navigation.
    if (!loading && session && !justSignedUp.current) {
      navigate('/onboarding', { replace: true });
    }
  }, [loading, session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    justSignedUp.current = true;

    try {
      // Persist pending invite BEFORE sign-up so it survives email confirmation redirect
      if (isInvite) {
        try {
          localStorage.setItem('pendingInvite', JSON.stringify({
            projectId: inviteProjectId,
            tradeId: inviteTradeId,
            businessName,
          }));
        } catch { /* ignore */ }
      }

      // After email confirmation, Supabase redirects here. For invited subs, land
      // them back on /invite/:projectId/:tradeId so InviteLanding completes the link.
      const postConfirmUrl = isInvite
        ? `${window.location.origin}/invite/${inviteProjectId}/${inviteTradeId}`
        : `${window.location.origin}/onboarding?plan=${encodeURIComponent(plan)}`;

      // 1. Create the auth user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: postConfirmUrl },
      });

      if (signUpError) {
        setError(signUpError.message);
        setSubmitting(false);
        return;
      }

      // 2. Check if email confirmation is required (session will be null if so)
      if (!signUpData.session) {
        // Email confirmation is on — tell the user
        setSubmitting(false);
        setError('');
        if (isInvite) {
          addToast(
            `Check your email to confirm, then you'll join ${inviteProjectName || 'the project'} automatically.`,
            'success'
          );
        } else {
          addToast('Check your email to confirm your account, then log in.', 'success');
        }
        // Stash signup data (incl. selected plan) for after confirmation
        try {
          localStorage.setItem('flowboss-signup', JSON.stringify({ businessName, plan }));
        } catch { /* ignore */ }
        return;
      }

      // 3. Stash signup fields so onboarding can pre-fill them (don't write to profile yet —
      //    Onboarding handles the full save so it doesn't auto-skip on business_name check).
      //    Also stash the plan as a resilient fallback; primary path is the ?plan= query param.
      try {
        localStorage.setItem('flowboss-signup', JSON.stringify({
          businessName,
          plan,
        }));
      } catch {
        // localStorage write failed — onboarding will just start blank
      }

      // 4. If this is an invite signup, link the sub to the GC project (session exists here)
      if (isInvite && signUpData.user) {
        try {
          const newUserId = signUpData.user.id;

          // Get the project to find the org_id
          const { data: project } = await supabase
            .from('gc_projects')
            .select('id, org_id, name')
            .eq('id', inviteProjectId)
            .single();

          if (project) {
            // Assign the sub to the trade
            await supabase
              .from('gc_project_trades')
              .update({ assigned_user_id: newUserId })
              .eq('id', inviteTradeId);

            // Add as org member
            await supabase
              .from('org_members')
              .insert({
                org_id: project.org_id,
                user_id: newUserId,
                role: 'sub_contractor',
                status: 'active',
                invited_by: null,
                joined_at: new Date().toISOString(),
              });

            // Log activity: sub accepted
            try {
              await supabase.from('project_activity').insert({
                gc_project_id: inviteProjectId,
                actor_user_id: newUserId,
                actor_name: businessName || email,
                event_type: 'sub_accepted',
                summary: `${businessName || email} accepted the invite`,
                trade_id: inviteTradeId,
              });
            } catch { /* ignore */ }
          }

          // Redirect to the GC project view (skip checkout for invited subs)
          navigate(`/dashboard/projects/assigned/${inviteProjectId}`, { replace: true });
        } catch (inviteErr) {
          addToast('Invite linking had an issue — you may need to be re-invited', 'error');
          // Still redirect to the project even if linking partially failed
          navigate(`/dashboard/projects/assigned/${inviteProjectId}`, { replace: true });
        }
        return;
      }

      // 5. Normal signup: redirect to onboarding wizard, preserving the
      //    selected plan so onboarding can send the user directly to checkout
      //    (instead of hitting /dashboard → RequireSubscription → /pricing again).
      navigate(`/onboarding?plan=${encodeURIComponent(plan)}`, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            {isInvite ? (
              <>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-semibold tracking-wide text-green-600 dark:text-green-300 uppercase mb-2">
                  <Sparkles className="w-2.5 h-2.5" />
                  Free for invited subs
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight text-center">
                  Join project on FlowBoss
                </h1>
                <p className="text-sm text-gray-500 mt-1.5 text-center dark:text-gray-400">
                  You've been invited to join
                  {inviteProjectName ? (
                    <span className="font-semibold text-gray-700 dark:text-gray-200"> {inviteProjectName}</span>
                  ) : (
                    ' a project'
                  )}
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-semibold tracking-wide text-blue-600 dark:text-blue-300 uppercase mb-2">
                  <Sparkles className="w-2.5 h-2.5" />
                  14-day free trial
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight text-center">
                  Start your free trial
                </h1>
                <p className="text-sm text-gray-500 mt-1.5 text-center dark:text-gray-400">
                  No charge for 14 days. Cancel anytime.
                </p>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Signup form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-gray-300">
                Business name
              </label>
              <input
                id="businessName"
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className={inputClass}
                placeholder="Acme Plumbing LLC"
              />
            </div>

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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Min 8 characters"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="group w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:from-blue-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {submitting ? (
                'Creating account...'
              ) : (
                <>
                  {isInvite ? 'Join project' : 'Start free trial'}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-gray-500 mt-5 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              to={isInvite ? `/login?redirect=/dashboard/projects/assigned/${inviteProjectId}` : '/login'}
              className="text-blue-600 hover:text-blue-700 font-medium dark:text-blue-400 dark:hover:text-blue-300"
            >
              Log in
            </Link>
          </p>
        </AuthCard>

        {/* Back to homepage */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors dark:text-gray-500 dark:hover:text-blue-300">
            &larr; Back to homepage
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
