import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  ClipboardCheck,
  MessageSquare,
  BarChart3,
  Gift,
  ArrowRight,
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
    title: 'Free for invited subs',
    desc: 'No cost to you. Your GC handles the account.',
  },
];

export function InviteLanding() {
  const { projectId, tradeId } = useParams<{ projectId: string; tradeId: string }>();

  // Try to fetch project info (may fail if not authed - that's fine)
  const projectQuery = useQuery({
    queryKey: ['gc-project-public', projectId],
    queryFn: () => api.getGCProject(projectId!),
    enabled: !!projectId,
    retry: false,
  });

  const project = projectQuery.data?.data;
  const trade = project?.trades?.find((t: any) => t.id === tradeId);
  const projectName = project?.name;
  const tradeName = trade?.trade;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FB</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">FlowBoss</span>
          </div>
          <Link
            to={`/login?redirect=/dashboard/projects/assigned/${projectId}`}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Already have an account? Log in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-4 py-12 lg:py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-full text-sm font-medium mb-6">
            <ClipboardCheck className="w-4 h-4" />
            Project Invitation
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            You've been invited to a project
          </h1>

          {(projectName || tradeName) && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
              {projectName && (
                <span className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 shadow-sm">
                  {projectName}
                </span>
              )}
              {tradeName && (
                <span className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-semibold text-blue-700 shadow-sm">
                  {tradeName}
                </span>
              )}
            </div>
          )}

          <p className="text-gray-500 max-w-lg mx-auto text-base leading-relaxed">
            Join this project on FlowBoss to see your tasks, communicate with the GC, and manage your work.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            to={`/signup?invite=${projectId}&trade=${tradeId}`}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gray-900 text-white rounded-xl text-base font-semibold hover:bg-gray-800 shadow-lg shadow-gray-900/20 transition-all hover:shadow-xl"
          >
            Sign Up
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to={`/login?redirect=/dashboard/projects/assigned/${projectId}`}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-gray-900 border border-gray-300 rounded-xl text-base font-semibold hover:bg-gray-50 shadow-sm transition-all"
          >
            Log In
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
              href="https://play.google.com/store/apps/details?id=io.flowboss"
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

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-xs text-gray-400">
          FlowBoss - Project management for construction professionals
        </div>
      </footer>
    </div>
  );
}
