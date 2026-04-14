import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Phone,
  Briefcase,
  UserPlus,
  X,
  Star,
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
  const [attempted, setAttempted] = useState(false);
  const [creating, setCreating] = useState(false);

  const orgQuery = useQuery({
    queryKey: ['gc-org'],
    queryFn: () => api.getOrganization(),
  });

  const org = orgQuery.data?.data;
  const isLoading = orgQuery.isLoading;

  // Auto-create org silently when needed (only try once)
  useEffect(() => {
    if (!isLoading && !org && !attempted && !creating) {
      setAttempted(true);
      setCreating(true);
      api.createOrganization({ name: 'My Company', type: 'gc' })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['gc-org'] });
          queryClient.invalidateQueries({ queryKey: ['gc-projects'] });
        })
        .catch(() => {})
        .finally(() => setCreating(false));
    }
  }, [isLoading, org, attempted, creating, queryClient]);

  const ready = !isLoading && (!!org || attempted);
  return { ready, isLoading: isLoading || creating };
}

type GCTab = 'projects' | 'subs';

function InviteToProjectModal({
  open,
  onClose,
  sub,
  projects,
}: {
  open: boolean;
  onClose: () => void;
  sub: any;
  projects: any[];
}) {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTradeId, setSelectedTradeId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');

  const selectedProject = projects.find((p: any) => p.id === selectedProjectId);
  // Only show unassigned trades for the selected project
  const availableTrades = (selectedProject?.trades || []).filter(
    (t: any) => !t.assignedUserId && !t.assignedOrgId
  );

  const handleAssign = async () => {
    if (!selectedTradeId) return;
    setAssigning(true);
    setError('');
    try {
      await api.assignSubToTrade(selectedTradeId, sub.userId);
      queryClient.invalidateQueries({ queryKey: ['gc-projects'] });
      queryClient.invalidateQueries({ queryKey: ['gc-sub-directory'] });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign sub');
    } finally {
      setAssigning(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Invite to Project</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Assign <span className="font-medium text-gray-700">{sub.businessName}</span> to a trade on one of your projects.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedTradeId('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
            >
              <option value="">Select a project</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {selectedProjectId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trade (unassigned only)</label>
              {availableTrades.length === 0 ? (
                <p className="text-sm text-gray-400 italic">All trades on this project are already assigned.</p>
              ) : (
                <select
                  value={selectedTradeId}
                  onChange={(e) => setSelectedTradeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
                >
                  <option value="">Select a trade</option>
                  {availableTrades.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.trade}</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedTradeId || assigning}
            className="flex-1 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
          >
            {assigning ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SubCard({
  sub,
  onInvite,
}: {
  sub: any;
  onInvite: (sub: any) => void;
}) {
  const perfQuery = useQuery({
    queryKey: ['trade-rating', sub.userId],
    queryFn: () => api.getSubPerformance(sub.userId),
    enabled: !!sub.userId,
  });
  const score = perfQuery.data?.data?.score;
  const totalRatings = perfQuery.data?.data?.totalRatings || 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">{sub.businessName}</h3>
            {score !== null && score !== undefined && totalRatings > 0 ? (
              <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${score >= 4 ? 'text-green-600' : score >= 3 ? 'text-amber-500' : 'text-red-500'}`}>
                <Star className="w-3 h-3 fill-current" />
                {score.toFixed(1)}
              </span>
            ) : (
              <span className="text-[10px] text-gray-400">No ratings</span>
            )}
          </div>
          <p className="text-sm text-gray-500">{sub.tradePrimary}</p>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
          <Briefcase className="w-3 h-3" />
          {sub.projectCount} project{sub.projectCount !== 1 ? 's' : ''}
        </span>
      </div>

      {sub.phone && (
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
          {sub.phone}
        </div>
      )}

      {/* Trade pills */}
      {sub.trades.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {sub.trades.map((t: string) => (
            <span
              key={t}
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                TRADE_COLORS[t] || 'bg-gray-100 text-gray-600'
              }`}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Projects list */}
      <div className="mb-3">
        <p className="text-xs text-gray-400 mb-1">Projects</p>
        <div className="flex flex-wrap gap-1">
          {sub.projects.slice(0, 3).map((p: any) => (
            <span key={p.id} className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded">
              {p.name}
            </span>
          ))}
          {sub.projects.length > 3 && (
            <span className="text-xs text-gray-400 px-1">+{sub.projects.length - 3} more</span>
          )}
        </div>
      </div>

      <button
        onClick={() => onInvite(sub)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
      >
        <UserPlus className="w-4 h-4" />
        Invite to Project
      </button>
    </div>
  );
}

export function GCDashboardPage() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<GCTab>('projects');
  const [inviteModalSub, setInviteModalSub] = useState<any>(null);

  const { ready: orgReady, isLoading: orgLoading } = useAutoOrg();

  const projectsQuery = useQuery({
    queryKey: ['gc-projects'],
    queryFn: () => api.getGCProjects(),
    enabled: orgReady,
  });

  const subsQuery = useQuery({
    queryKey: ['gc-sub-directory'],
    queryFn: () => api.getGCSubDirectory(),
    enabled: orgReady && activeTab === 'subs',
  });

  const invitedQuery = useQuery({
    queryKey: ['invited-projects'],
    queryFn: () => api.getInvitedProjects(),
  });
  const invitedProjects: any[] = invitedQuery.data?.data || [];

  const projects: any[] = projectsQuery.data?.data || [];
  const subs: any[] = subsQuery.data?.data || [];

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

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Filter subs by search
  const filteredSubs = useMemo(() => {
    if (!search.trim() || activeTab !== 'subs') return subs;
    const q = search.toLowerCase();
    return subs.filter(
      (s: any) =>
        s.businessName?.toLowerCase().includes(q) ||
        s.tradePrimary?.toLowerCase().includes(q) ||
        s.trades?.some((t: string) => t.toLowerCase().includes(q)) ||
        s.phone?.includes(q)
    );
  }, [subs, search, activeTab]);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-4">
        <span>{activeTab === 'projects' ? 'Projects' : 'My Subs'}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {activeTab === 'projects' ? 'Projects' : 'My Subs'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeTab === 'projects'
              ? 'Manage your construction projects and trade assignments'
              : 'Your sub-contractor directory across all projects'}
          </p>
        </div>
        {activeTab === 'projects' && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        )}
      </div>

      {/* Tab Toggle */}
      <div className="flex rounded-lg bg-gray-100 p-1 mb-6 max-w-xs">
        <button
          type="button"
          onClick={() => { setActiveTab('projects'); setSearch(''); }}
          className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-md transition-colors ${
            activeTab === 'projects'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          Projects
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('subs'); setSearch(''); }}
          className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-md transition-colors ${
            activeTab === 'subs'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          My Subs
        </button>
      </div>

      {/* ── Projects Tab ── */}
      {activeTab === 'projects' && (
        <>
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

          {/* Invited Projects */}
          {invitedProjects.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Projects You're Invited To</h2>
              <p className="text-sm text-gray-500 mb-4">Projects where you've been assigned as a sub-contractor.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {invitedProjects.map((project: any) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                  />
                ))}
              </div>
            </div>
          )}

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
                  onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── My Subs Tab ── */}
      {activeTab === 'subs' && (
        <>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search subs by name, trade, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          {subsQuery.isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredSubs.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No subs yet</h3>
              <p className="text-sm text-gray-500 mb-2 max-w-md mx-auto">
                When you assign sub-contractors to trades on your projects, they'll appear here as your rolodex.
              </p>
              <p className="text-sm text-gray-400">
                Go to a project and invite a sub to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredSubs.map((sub: any) => (
                <SubCard
                  key={sub.userId}
                  sub={sub}
                  onInvite={(s) => setInviteModalSub(s)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <CreateGCProjectModal open={showCreate} onClose={() => setShowCreate(false)} />

      {inviteModalSub && (
        <InviteToProjectModal
          open={!!inviteModalSub}
          onClose={() => setInviteModalSub(null)}
          sub={inviteModalSub}
          projects={projects}
        />
      )}
    </div>
  );
}
