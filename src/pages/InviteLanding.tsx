import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import {
  ClipboardCheck,
  MessageSquare,
  BarChart3,
  Gift,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Calendar,
  ListChecks,
  Building2,
  Loader2,
  AlertCircle,
  Smartphone,
  UserCog,
  LogOut,
} from 'lucide-react';

const FEATURES = [
  {
    icon: <ClipboardCheck className="w-5 h-5 text-brand-600" />,
    title: 'See your assigned tasks',
    desc: 'Know exactly what needs to be done and when.',
  },
  {
    icon: <MessageSquare className="w-5 h-5 text-blue-600" />,
    title: 'Message the GC directly',
    desc: 'Communicate without phone tag or lost texts.',
  },
  {
    icon: <BarChart3 className="w-5 h-5 text-green-600" />,
    title: 'Track your progress',
    desc: 'Check off tasks and keep everyone in sync.',
  },
  {
    icon: <Gift className="w-5 h-5 text-purple-600" />,
    title: 'Free forever — no credit card',
    desc: 'No cost for GC-invited work. No trial timer. Ever.',
  },
];

const PENDING_INVITE_KEY = 'pendingInvite';

export function InviteLanding() {
  const { projectId, tradeId } = useParams<{ projectId: string; tradeId: string }>();
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const isLoggedIn = !!user;

  const autoAcceptTried = useRef(false);
  const acceptButtonRef = useRef<HTMLButtonElement | null>(null);
  const [autoFocus, setAutoFocus] = useState(false);

  // Store pending invite in localStorage so it survives login/signup redirect
  useEffect(() => {
    if (projectId && tradeId) {
      localStorage.setItem(PENDING_INVITE_KEY, JSON.stringify({ projectId, tradeId }));
    }
  }, [projectId, tradeId]);

  // Clear pending invite after successful accept
  useEffect(() => {
    if (accepted) {
      localStorage.removeItem(PENDING_INVITE_KEY);
    }
  }, [accepted]);

  // ...also clear it when the logged-in user turns out to be the GC who
  // created this project. Otherwise Login.tsx will keep bouncing them back
  // here every time they sign in, trapping them in a redirect loop. The
  // pending-invite mechanism is only meant for the invited sub.
  // (isProjectCreator is computed below; this hook depends on it via
  // project + user, so it stays in sync.)

  // Fetch project info (only works if user is authenticated due to RLS)
  const projectQuery = useQuery({
    queryKey: ['gc-project-invite', projectId],
    queryFn: () => api.getGCProject(projectId!),
    enabled: !!projectId && isLoggedIn,
    retry: false,
  });

  const project = projectQuery.data?.data;
  const trade = project?.trades?.find((t: any) => t.id === tradeId);
  const projectName = project?.name;
  // Intentionally not exposing `trade.trade` (plumbing/HVAC/etc) to the sub:
  // subs are professionals and already know what they do. We also surface only
  // project-level info (name, address, schedule, task count) so the sub never
  // sees the GC's internal trade label for their slot.
  const projectAddress = project?.address;
  const taskCount = trade?.tasks?.length || 0;
  const alreadyAssigned = trade?.assignedUserId === user?.id;
  // The current user created this project — they're the GC, not a sub. If
  // they followed the invite link from their own email or pasted it into
  // their browser, hand them a clear off-ramp instead of letting them hit
  // the cryptic RLS-blocked error path.
  const isProjectCreator = !!project && !!user && (project as any).createdBy === user.id;

  // Companion to the comment above: actually clear the pending-invite
  // marker once we know this user is the GC of this project.
  useEffect(() => {
    if (isProjectCreator) {
      localStorage.removeItem(PENDING_INVITE_KEY);
    }
  }, [isProjectCreator]);

  // Format date range for trade
  const tradeDateRange = (() => {
    if (!trade?.tasks?.length) return null;
    const dates = trade.tasks
      .filter((t: any) => t.startDate || t.endDate)
      .flatMap((t: any) => [t.startDate, t.endDate].filter(Boolean));
    if (!dates.length) return null;
    const sorted = dates.sort();
    const start = new Date(sorted[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = new Date(sorted[sorted.length - 1]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} - ${end}`;
  })();

  // Assign sub to trade mutation
  const assignMutation = useMutation({
    mutationFn: () => api.assignSubToTrade(tradeId!, user!.id),
    onSuccess: () => {
      setAccepted(true);
      setTimeout(() => {
        navigate(`/dashboard/projects/assigned/${projectId}`, { replace: true });
      }, 2000);
    },
    onError: (err: any) => {
      setAssignError(err.message || 'Failed to accept invite. Please try again.');
    },
  });

  function handleAccept() {
    setAssignError(null);
    assignMutation.mutate();
  }

  // Used by the GC-self-detection branch: clear the pending-invite redirect
  // marker (otherwise Login.tsx will bounce them right back here on next
  // login), sign out, and land them on the invite URL as a logged-out
  // visitor so they can sign up / log in with the trade's email.
  async function handleSignOutAndRetry() {
    try {
      localStorage.removeItem(PENDING_INVITE_KEY);
      await signOut();
    } finally {
      navigate(inviteUrl, { replace: true });
    }
  }

  // Pre-focus the Accept button when the sub returns from signup/login with a
  // matching pending invite. Previously we silently auto-mutated — which
  // worked most of the time but risked auto-assigning a stale invite or one
  // the sub didn't mean to click. One explicit Enter/click is worth the
  // clarity; the accept button is big and already centered.
  useEffect(() => {
    if (autoAcceptTried.current) return;
    if (!isLoggedIn || !projectId || !tradeId) return;
    if (accepted || alreadyAssigned || assignMutation.isPending) return;
    try {
      const pending = localStorage.getItem(PENDING_INVITE_KEY);
      if (!pending) return;
      const p = JSON.parse(pending);
      if (p.projectId === projectId && p.tradeId === tradeId) {
        autoAcceptTried.current = true;
        setAutoFocus(true);
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, projectId, tradeId, alreadyAssigned, accepted]);

  // Pre-focus Accept button so returning users can hit Enter to confirm.
  useEffect(() => {
    if (autoFocus && acceptButtonRef.current) {
      acceptButtonRef.current.focus();
    }
  }, [autoFocus]);

  const inviteUrl = `/invite/${projectId}/${tradeId}`;
  const signupUrl = `/signup?invite=${projectId}&trade=${tradeId}`;
  const loginUrl = `/login?redirect=${encodeURIComponent(inviteUrl)}`;

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  // --- SUCCESS STATE ---
  if (accepted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <Header loginUrl={loginUrl} isLoggedIn={isLoggedIn} />
        <main className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">You're In!</h1>
            <p className="text-gray-500 mb-2">
              {projectName ? (
                <>You've joined <span className="font-semibold text-gray-700">{projectName}</span>.</>
              ) : (
                <>You've joined the project.</>
              )}
            </p>
            <p className="text-sm text-gray-400 mb-6">Redirecting to your project...</p>
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin mx-auto" />
          </div>
        </main>
      </div>
    );
  }

  // --- ALREADY ASSIGNED STATE ---
  if (isLoggedIn && alreadyAssigned) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <Header loginUrl={loginUrl} isLoggedIn={isLoggedIn} />
        <main className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Already on This Project</h1>
            <p className="text-gray-500 mb-6">
              {projectName ? (
                <>You're already on <span className="font-semibold text-gray-700">{projectName}</span>.</>
              ) : (
                <>You're already on this project.</>
              )}
            </p>
            <Link
              to={`/dashboard/projects/assigned/${projectId}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              Go to Project
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // --- LOGGED IN AS THE GC WHO CREATED THIS PROJECT ---
  // RLS would silently block their assignment update and they'd hit a vague
  // "this invite isn't for you" error after clicking Accept. Catch it
  // up-front and show them the right next step.
  if (isLoggedIn && isProjectCreator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <Header loginUrl={loginUrl} isLoggedIn={isLoggedIn} />
        <main className="max-w-lg mx-auto px-4 py-20">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
              <UserCog className="w-7 h-7 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              This invite is for the trade you invited
            </h1>
            <p className="text-gray-500 mb-6 text-center leading-relaxed">
              You're signed in as the GC of{' '}
              {projectName ? (
                <span className="font-semibold text-gray-700">{projectName}</span>
              ) : (
                <>this project</>
              )}
              . The link you opened is meant for the tradesperson you invited — not your GC account.
            </p>
            <div className="space-y-2.5 mb-6">
              <div className="flex items-start gap-3 px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-700">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center mt-0.5">
                  1
                </span>
                <span>Sign out of your GC account.</span>
              </div>
              <div className="flex items-start gap-3 px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-700">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center mt-0.5">
                  2
                </span>
                <span>Sign up (or log in) with the email address you invited the trade at.</span>
              </div>
              <div className="flex items-start gap-3 px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-700">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center mt-0.5">
                  3
                </span>
                <span>You'll land back on this invite, ready to accept.</span>
              </div>
            </div>
            <button
              onClick={handleSignOutAndRetry}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 text-white rounded-xl text-base font-semibold hover:bg-gray-800 shadow-lg shadow-gray-900/20 transition-all hover:shadow-xl"
            >
              <LogOut className="w-5 h-5" />
              Sign out and accept as the trade
            </button>
            <Link
              to={`/dashboard/projects/${projectId}`}
              className="block text-center text-sm text-gray-500 hover:text-gray-700 mt-4"
            >
              Or stay signed in and go to this project as the GC
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // --- LOGGED IN: ACCEPT INVITE ---
  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <Header loginUrl={loginUrl} isLoggedIn={isLoggedIn} />
        <main className="max-w-lg mx-auto px-4 py-12 lg:py-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-full text-sm font-medium mb-6">
              <ClipboardCheck className="w-4 h-4" />
              Project Invitation
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {projectName ? `Join ${projectName}` : "You've been invited to a project"}
            </h1>
            <p className="text-gray-500 text-lg">
              A general contractor is ready to bring you on.
            </p>
          </div>

          {/* Project details card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            {projectQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            ) : project ? (
              <div className="space-y-4">
                {projectName && (
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Project</p>
                      <p className="text-sm font-semibold text-gray-900">{projectName}</p>
                    </div>
                  </div>
                )}
                {projectAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Location</p>
                      <p className="text-sm text-gray-700">{projectAddress}</p>
                    </div>
                  </div>
                )}
                {tradeDateRange && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Schedule</p>
                      <p className="text-sm text-gray-700">{tradeDateRange}</p>
                    </div>
                  </div>
                )}
                {taskCount > 0 && (
                  <div className="flex items-start gap-3">
                    <ListChecks className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Tasks</p>
                      <p className="text-sm text-gray-700">{taskCount} task{taskCount !== 1 ? 's' : ''} assigned</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Project details will be available once you accept.
              </p>
            )}
          </div>

          {/* Error message */}
          {assignError && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {assignError}
            </div>
          )}

          {/* Free-forever reassurance */}
          <div className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm">
            <Gift className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 leading-relaxed">
              <strong>This is completely free for you.</strong> GC-invited work — tasks, messages, earnings view — stays free forever. No credit card, no trial timer.
            </p>
          </div>

          {/* Accept button — pre-focused when returning from signup so the
              user can hit Enter once to confirm instead of us silently
              auto-accepting. */}
          <button
            ref={acceptButtonRef}
            onClick={handleAccept}
            disabled={assignMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 text-white rounded-xl text-base font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-900/20 transition-all hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-900/30 focus:ring-offset-2"
          >
            {assignMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Accept & Join Project
              </>
            )}
          </button>

          {/* Optional Pro upsell — tiny, not distracting */}
          <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
            Run your own customers too? <Link to="/pricing" className="text-indigo-600 hover:text-indigo-700 font-medium underline decoration-dotted">Trade Pro</Link> adds direct jobs + invoicing for $14.99/mo. You'll get a 14-day free trial.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  // --- NOT LOGGED IN: SIGN UP / LOG IN ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header loginUrl={loginUrl} isLoggedIn={false} />

      <main className="max-w-4xl mx-auto px-4 py-12 lg:py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-full text-sm font-medium mb-6">
            <ClipboardCheck className="w-4 h-4" />
            Project Invitation
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            You've been invited to a project
          </h1>

          <p className="text-gray-500 max-w-lg mx-auto text-base leading-relaxed">
            A general contractor has invited you to join their project on FlowBoss.
            Sign up or log in to see your tasks and get started.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            to={signupUrl}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gray-900 text-white rounded-xl text-base font-semibold hover:bg-gray-800 shadow-lg shadow-gray-900/20 transition-all hover:shadow-xl"
          >
            Sign Up to Accept
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to={loginUrl}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-gray-900 border border-gray-300 rounded-xl text-base font-semibold hover:bg-gray-50 shadow-sm transition-all"
          >
            Already have an account? Log In
          </Link>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 gap-4 mb-16">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-xl shadow-sm"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                {f.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm mb-0.5">{f.title}</h3>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* App download section */}
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-4">Or get the FlowBoss app</p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="https://apps.apple.com/app/flowboss"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              App Store
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.flowboss.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.808 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
              </svg>
              Google Play
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// --- Shared sub-components ---

function Header({ loginUrl, isLoggedIn }: { loginUrl: string; isLoggedIn: boolean }) {
  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">FB</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">FlowBoss</span>
        </div>
        {!isLoggedIn && (
          <Link
            to={loginUrl}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Already have an account? Log in
          </Link>
        )}
        {isLoggedIn && (
          <Link
            to="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Go to Dashboard
          </Link>
        )}
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-12">
      <div className="max-w-4xl mx-auto px-4 py-6 text-center text-xs text-gray-400">
        FlowBoss - Project management for construction professionals
      </div>
    </footer>
  );
}
