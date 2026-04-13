import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

const TRADES = [
  'Plumbing',
  'HVAC',
  'Electrical',
  'General Contractor',
] as const;

export function Signup() {
  const { session, loading } = useAuth();
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
  const [trade, setTrade] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    if (!loading && session) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Create the auth user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setSubmitting(false);
        return;
      }

      // 2. Update their profile with business name and trade
      if (signUpData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ business_name: businessName, trade })
          .eq('id', signUpData.user.id);

        if (profileError) {
          console.error('Profile update failed:', profileError.message);
          // Non-blocking — they can update later in settings
        }
      }

      // 3. If this is an invite signup, link the sub to the GC project
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
          }

          // Redirect to the GC project view (skip checkout for invited subs)
          navigate(`/dashboard/gc-projects/${inviteProjectId}`, { replace: true });
        } catch (inviteErr) {
          console.error('Invite linking failed:', inviteErr);
          // Still redirect to the project even if linking partially failed
          navigate(`/dashboard/gc-projects/${inviteProjectId}`, { replace: true });
        }
        return;
      }

      // 4. Normal signup: redirect to checkout
      navigate(`/checkout?plan=${plan}`, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center mb-3">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            {isInvite ? (
              <>
                <h1 className="text-xl font-bold text-gray-900">Join Project on FlowBoss</h1>
                <p className="text-sm text-gray-500 mt-1 text-center">
                  You've been invited to join
                  {inviteProjectName ? (
                    <span className="font-semibold text-gray-700"> {inviteProjectName}</span>
                  ) : (
                    ' a project'
                  )}
                </p>
                <p className="text-xs text-green-600 mt-1 font-medium">Free for invited subs</p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold text-gray-900">Start Your 14-Day Free Trial</h1>
                <p className="text-sm text-gray-500 mt-1">14-day free trial. Credit card required.</p>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Signup form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                Business Name
              </label>
              <input
                id="businessName"
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                placeholder="Acme Plumbing LLC"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                placeholder="Min 8 characters"
              />
            </div>

            <div>
              <label htmlFor="trade" className="block text-sm font-medium text-gray-700 mb-1">
                Trade
              </label>
              <select
                id="trade"
                required
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
              >
                <option value="" disabled>Select your trade</option>
                {TRADES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
            >
              {submitting
                ? 'Creating account...'
                : isInvite
                  ? 'Join Project'
                  : 'Start Free Trial'}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link
              to={isInvite ? `/login?redirect=/dashboard/gc-projects/${inviteProjectId}` : '/login'}
              className="text-brand-500 hover:text-brand-600 font-medium"
            >
              Log in
            </Link>
          </p>
        </div>

        {/* Back to homepage */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">
            &larr; Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
