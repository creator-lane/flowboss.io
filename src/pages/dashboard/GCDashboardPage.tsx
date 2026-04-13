import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  Plus,
  MapPin,
  DollarSign,
  Users,
  FolderKanban,
  Activity,
  Search,
  Inbox,
} from 'lucide-react';
import { CreateGCProjectModal } from '../../components/gc/CreateGCProjectModal';

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  planning: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', label: 'Planning' },
  active: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Active' },
  on_hold: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'On Hold' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', label: 'Completed' },
};

const TRADE_COLORS: Record<string, string> = {
  Plumbing: 'bg-blue-100 text-blue-700',
  Electrical: 'bg-yellow-100 text-yellow-700',
  HVAC: 'bg-cyan-100 text-cyan-700',
  Framing: 'bg-orange-100 text-orange-700',
  Drywall: 'bg-stone-100 text-stone-700',
  Painting: 'bg-purple-100 text-purple-700',
  Roofing: 'bg-red-100 text-red-700',
  Concrete: 'bg-gray-200 text-gray-700',
  Flooring: 'bg-amber-100 text-amber-700',
  Landscaping: 'bg-green-100 text-green-700',
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.planning;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function ProjectCard({ project, onClick }: { project: any; onClick: () => void }) {
  const trades: any[] = project.trades || [];
  const totalTasks = trades.reduce((s: number, t: any) => s + (t.tasks?.length || 0), 0);
  const doneTasks = trades.reduce(
    (s: number, t: any) => s + (t.tasks?.filter((tk: any) => tk.done).length || 0),
    0
  );
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const assigned = trades.filter((t: any) => t.assignedUserId || t.assignedOrgId).length;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-1">{project.name}</h3>
        <StatusBadge status={project.status} />
      </div>

      {(project.city || project.state) && (
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          {[project.city, project.state].filter(Boolean).join(', ')}
        </div>
      )}

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>{doneTasks} of {totalTasks} tasks</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Trade pills */}
      {trades.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {trades.slice(0, 5).map((t: any) => (
            <span
              key={t.id}
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                TRADE_COLORS[t.trade] || 'bg-gray-100 text-gray-600'
              }`}
            >
              {t.trade}
            </span>
          ))}
          {trades.length > 5 && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
              +{trades.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
        <span>{assigned} of {trades.length} trades assigned</span>
        {project.budget && (
          <span className="font-medium text-gray-700">{formatCurrency(project.budget)}</span>
        )}
      </div>
    </div>
  );
}

/** Auto-creates the org silently if it doesn't exist, returns true when ready */
function useAutoOrg() {
  const queryClient = useQueryClient();
  const orgQuery = useQuery({
    queryKey: ['gc-org'],
    queryFn: () => api.getOrganization(),
  });

  const createOrg = useMutation({
    mutationFn: () => api.createOrganization({ name: 'My Company', type: 'gc' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-org'] });
      queryClient.invalidateQueries({ queryKey: ['gc-projects'] });
    },
  });

  const org = orgQuery.data?.data;
  const isLoading = orgQuery.isLoading;
  const needsOrg = !isLoading && !org;

  // Auto-create org silently when needed
  useEffect(() => {
    if (needsOrg && !createOrg.isPending && !createOrg.isSuccess) {
      createOrg.mutate();
    }
  }, [needsOrg, createOrg.isPending, createOrg.isSuccess]);

  const ready = !isLoading && (!!org || createOrg.isSuccess);
  return { ready, isLoading: isLoading || createOrg.isPending };
}

export function GCDashboardPage() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
  });
  const trade = settingsData?.data?.trade;
  const isGC = trade === 'general_contractor';

  const { ready: orgReady, isLoading: orgLoading } = useAutoOrg();

  const projectsQuery = useQuery({
    queryKey: ['gc-projects'],
    queryFn: () => api.getGCProjects(),
    enabled: orgReady,
  });

  const projects: any[] = projectsQuery.data?.data || [];

  const filtered = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter(
      (p: any) =>
        p.name?.toLowerCase().includes(q) ||
        p.customerName?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q)
    );
  }, [projects, search]);

  // Stats
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p: any) => p.status === 'active').length;
  const totalBudget = projects.reduce((s: number, p: any) => s + (p.budget || 0), 0);
  const totalTrades = projects.reduce((s: number, p: any) => s + (p.trades?.length || 0), 0);
  const assignedTrades = projects.reduce(
    (s: number, p: any) => s + (p.trades?.filter((t: any) => t.assignedUserId || t.assignedOrgId).length || 0),
    0
  );

  if (orgLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Sub-contractor view ──────────────────────────────────────────────
  if (!isGC) {
    // TODO: Replace with real invited-projects query when backend supports it
    const invitedProjects: any[] = [];
    const ownProjects = projects;
    const hasNothing = invitedProjects.length === 0 && ownProjects.length === 0;

    if (hasNothing) {
      return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="text-sm text-gray-400 mb-4">
            <span>GC Projects</span>
          </div>

          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Inbox className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No GC projects yet</h2>
            <p className="text-sm text-gray-500 mb-2 max-w-md mx-auto">
              When a general contractor adds you to a project, it will appear here.
            </p>
            <p className="text-sm text-gray-500 mb-6">Or start managing your own projects:</p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </button>
          </div>

          <CreateGCProjectModal open={showCreate} onClose={() => setShowCreate(false)} />
        </div>
      );
    }

    // Split view for subs with some data
    return (
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-400 mb-4">
          <span>GC Projects</span>
        </div>

        {/* Invited projects section */}
        {invitedProjects.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Projects You're Invited To</h2>
            <p className="text-sm text-gray-500 mb-4">Projects where a GC has assigned you as a sub-contractor.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {invitedProjects.map((project: any) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => navigate(`/dashboard/gc/${project.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Own projects section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                {invitedProjects.length > 0 ? 'Your Own Projects' : 'My Projects'}
              </h2>
              <p className="text-sm text-gray-500">Manage your own construction projects and trade assignments.</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>

          {ownProjects.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 border-dashed p-10 text-center">
              <FolderKanban className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-medium text-gray-900 mb-1">Start managing your own projects</h3>
              <p className="text-sm text-gray-500 mb-4">Create a project to coordinate trades and subs.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {ownProjects.map((project: any) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => navigate(`/dashboard/gc/${project.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        <CreateGCProjectModal open={showCreate} onClose={() => setShowCreate(false)} />
      </div>
    );
  }

  // ── GC view ──────────────────────────────────────────────────────────
  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-4">
        <span>My Projects</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your construction projects and trade assignments</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
            <FolderKanban className="w-3.5 h-3.5" />
            Total Projects
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalProjects}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
            <Activity className="w-3.5 h-3.5" />
            Active
          </div>
          <p className="text-2xl font-bold text-blue-600">{activeProjects}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
            <DollarSign className="w-3.5 h-3.5" />
            Total Budget
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBudget)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
            <Users className="w-3.5 h-3.5" />
            Trades Assigned
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {assignedTrades} <span className="text-sm font-normal text-gray-400">/ {totalTrades}</span>
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
        />
      </div>

      {/* Project Grid */}
      {projectsQuery.isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No projects yet</h3>
          <p className="text-sm text-gray-500 mb-6">Create your first project to get started.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project: any) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => navigate(`/dashboard/gc/${project.id}`)}
            />
          ))}
        </div>
      )}

      <CreateGCProjectModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
