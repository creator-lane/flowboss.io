import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { format } from 'date-fns';
import {
  Search,
  Plus,
  FolderKanban,
  ChevronRight,
  MapPin,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { CreateProjectModal } from '../../components/projects/CreateProjectModal';

const STATUS_BADGE: Record<string, { bg: string; text: string; ring: string; dot: string; label: string }> = {
  NOT_STARTED: { bg: 'bg-gray-50', text: 'text-gray-600', ring: 'ring-gray-500/20', dot: 'bg-gray-400', label: 'Not Started' },
  IN_PROGRESS: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-500/20', dot: 'bg-blue-500', label: 'In Progress' },
  COMPLETED: { bg: 'bg-green-50', text: 'text-green-600', ring: 'ring-green-500/20', dot: 'bg-green-500', label: 'Completed' },
};

type FilterTab = 'ALL' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'NOT_STARTED', label: 'Not Started' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' },
];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status] || STATUS_BADGE.NOT_STARTED;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text} ring-1 ring-inset ${cfg.ring}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);

function getPhaseProgress(phases: any[]): string {
  if (!phases || phases.length === 0) return 'No phases';
  const completed = phases.filter(
    (p: any) => p.status === 'COMPLETED'
  ).length;
  return `${completed} of ${phases.length} phases complete`;
}

function getPropertyAddress(property: any): string {
  if (!property) return '';
  const parts = [
    property.street || property.address,
    property.city,
    property.state,
  ].filter(Boolean);
  return parts.join(', ');
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-40 mb-3" />
      <div className="h-4 bg-gray-100 rounded w-32 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-48 mb-3" />
      <div className="flex gap-2">
        <div className="h-5 bg-gray-200 rounded-full w-20" />
        <div className="h-5 bg-gray-100 rounded w-28" />
      </div>
    </div>
  );
}

export function ProjectsPage() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const { data: raw, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getProjects(),
  });

  const allProjects: any[] = useMemo(() => {
    const projects = raw?.data || raw || [];
    return Array.isArray(projects) ? projects : [];
  }, [raw]);

  const filteredProjects = useMemo(() => {
    let result = allProjects;

    if (activeTab !== 'ALL') {
      result = result.filter((p: any) => p.status === activeTab);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p: any) => {
        const name = (p.name || '').toLowerCase();
        const customerName = `${p.customer?.firstName || p.customer?.first_name || ''} ${p.customer?.lastName || p.customer?.last_name || ''}`.toLowerCase();
        const addr = getPropertyAddress(p.property).toLowerCase();
        return name.includes(q) || customerName.includes(q) || addr.includes(q);
      });
    }

    return result;
  }, [allProjects, activeTab, search]);

  const getCustomerName = (project: any) => {
    const c = project.customer;
    if (!c) return 'No customer';
    return `${c.firstName || c.first_name || ''} ${c.lastName || c.last_name || ''}`.trim() || 'Unnamed';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Projects</h1>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-neutral-400"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {FILTER_TABS.map(({ key, label }) => {
          const count =
            key === 'ALL'
              ? allProjects.length
              : allProjects.filter((p: any) => p.status === key).length;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {label}
              <span className="ml-1.5 text-xs text-neutral-400">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Project cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderKanban className="w-12 h-12 text-neutral-300 mb-4" />
          <p className="text-lg font-medium text-neutral-500 mb-1">No projects found</p>
          <p className="text-sm text-neutral-400 mb-6">
            {allProjects.length === 0
              ? 'Create your first project to track multi-phase work.'
              : 'Try adjusting your filters or search.'}
          </p>
          {allProjects.length === 0 && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProjects.map((project: any) => {
            const phases = project.phases || [];
            const addr = getPropertyAddress(project.property);

            return (
              <button
                key={project.id}
                type="button"
                onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                className="w-full text-left bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-neutral-900 truncate">
                      {project.name}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {getCustomerName(project)}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-300 mt-0.5 flex-shrink-0 group-hover:text-neutral-500 transition-colors" />
                </div>

                {addr && (
                  <p className="text-xs text-neutral-400 flex items-center gap-1 mb-2">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{addr}</span>
                  </p>
                )}

                <div className="flex items-center gap-2 flex-wrap mt-3">
                  <StatusBadge status={project.status} />
                  <span className="text-xs text-neutral-400">
                    {getPhaseProgress(phases)}
                  </span>
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400">
                  {project.budget && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(Number(project.budget))}
                    </span>
                  )}
                  {(project.startDate || project.start_date) && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(project.startDate || project.start_date), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Result count */}
      {!isLoading && filteredProjects.length > 0 && (
        <p className="text-xs text-neutral-400 text-center mt-6">
          Showing {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
        </p>
      )}

      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </div>
  );
}
