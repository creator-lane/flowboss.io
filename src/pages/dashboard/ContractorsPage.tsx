import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  Search,
  Plus,
  HardHat,
  ChevronRight,
  Phone,
  Mail,
  Briefcase,
  DollarSign,
  Star,
  FolderKanban,
} from 'lucide-react';
import { CreateContractorModal } from '../../components/contractors/CreateContractorModal';

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
  Tiling: 'bg-teal-100 text-teal-700',
  Insulation: 'bg-pink-100 text-pink-700',
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
      <div className="h-5 bg-gray-200 rounded w-40 mb-3 dark:bg-white/10" />
      <div className="h-4 bg-gray-100 rounded w-32 mb-2 dark:bg-white/10" />
      <div className="h-4 bg-gray-100 rounded w-48 mb-3 dark:bg-white/10" />
      <div className="flex gap-2">
        <div className="h-5 bg-gray-200 rounded-full w-20 dark:bg-white/10" />
        <div className="h-5 bg-gray-100 rounded w-24 dark:bg-white/10" />
      </div>
    </div>
  );
}

type ContractorTab = 'all' | 'manual' | 'project-subs';

export function ContractorsPage() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<ContractorTab>('all');

  // Traditional contractors from the contractors table
  const { data: raw, isLoading: contractorsLoading } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => api.getContractorsWithStats(),
  });

  // Project subs from GC trades
  const { data: subsRaw, isLoading: subsLoading } = useQuery({
    queryKey: ['gc-sub-directory'],
    queryFn: () => api.getGCSubDirectory(),
  });

  const isLoading = contractorsLoading || subsLoading;

  const manualContractors: any[] = useMemo(() => {
    const list = raw?.data || raw || [];
    return (Array.isArray(list) ? list : []).map((c: any) => ({
      ...c,
      _source: 'manual' as const,
      _displayName: c.companyName || c.company_name || c.name || 'Unnamed Company',
    }));
  }, [raw]);

  const projectSubs: any[] = useMemo(() => {
    const list = subsRaw?.data || [];
    return list.map((s: any) => ({
      ...s,
      _source: 'project' as const,
      _displayName: s.businessName || 'Unknown',
    }));
  }, [subsRaw]);

  // Merge and deduplicate — if a manual contractor name matches a project sub name, merge them
  const allContractors = useMemo(() => {
    const merged: any[] = [];
    const usedProjectSubNames = new Set<string>();

    for (const mc of manualContractors) {
      const name = mc._displayName.toLowerCase().trim();
      // Check if there's a matching project sub
      const matchingSub = projectSubs.find(
        (s) => s._displayName.toLowerCase().trim() === name
      );
      if (matchingSub) {
        usedProjectSubNames.add(matchingSub._displayName.toLowerCase().trim());
        merged.push({
          ...mc,
          _projectSub: matchingSub,
          _source: 'both',
        });
      } else {
        merged.push(mc);
      }
    }

    // Add remaining project subs that didn't match
    for (const ps of projectSubs) {
      if (!usedProjectSubNames.has(ps._displayName.toLowerCase().trim())) {
        merged.push(ps);
      }
    }

    return merged;
  }, [manualContractors, projectSubs]);

  const filteredContractors = useMemo(() => {
    let list = allContractors;

    // Tab filter
    if (activeTab === 'manual') list = list.filter((c) => c._source === 'manual' || c._source === 'both');
    if (activeTab === 'project-subs') list = list.filter((c) => c._source === 'project' || c._source === 'both');

    // Search filter
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((c: any) => {
      const companyName = (c._displayName || '').toLowerCase();
      const contactName = (c.name || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const trades = (c.trades || []).join(' ').toLowerCase();
      return companyName.includes(q) || contactName.includes(q) || email.includes(q) || phone.includes(q) || trades.includes(q);
    });
  }, [allContractors, search, activeTab]);

  const manualCount = allContractors.filter((c) => c._source === 'manual' || c._source === 'both').length;
  const projectCount = allContractors.filter((c) => c._source === 'project' || c._source === 'both').length;

  function handleCardClick(contractor: any) {
    if (contractor._source === 'manual' || contractor._source === 'both') {
      navigate(`/dashboard/contractors/${contractor.id}`);
    } else {
      // Project sub — go to sub profile
      const profileId = contractor.isPlaceholder
        ? encodeURIComponent(contractor.businessName || contractor._displayName)
        : contractor.userId;
      navigate(`/dashboard/subs/${profileId}`);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Contractors</h1>
          <p className="text-sm text-gray-500 mt-0.5 dark:text-gray-400">
            {allContractors.length} total — {manualCount} manual, {projectCount} from projects
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Contractor
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mb-5 max-w-md dark:bg-white/10">
        {([
          { key: 'all' as const, label: 'All', count: allContractors.length },
          { key: 'manual' as const, label: 'Rolodex', count: manualCount },
          { key: 'project-subs' as const, label: 'Project Subs', count: projectCount },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            } dark:text-white`}
          >
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? 'bg-brand-50 text-brand-600' : 'bg-gray-200 text-gray-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="Search by name, trade, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-neutral-400 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10 dark:focus:ring-blue-400"
        />
      </div>

      {/* Contractor cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredContractors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <HardHat className="w-12 h-12 text-neutral-300 mb-4" />
          <p className="text-lg font-medium text-neutral-500 mb-1 dark:text-gray-400">No contractors found</p>
          <p className="text-sm text-neutral-400 mb-6 dark:text-gray-500">
            {allContractors.length === 0
              ? 'Add a contractor or assign subs on your projects to see them here.'
              : 'Try adjusting your search or switching tabs.'}
          </p>
          {allContractors.length === 0 && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Contractor
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredContractors.map((contractor: any) => {
            const isProjectSub = contractor._source === 'project' || contractor._source === 'both';
            const isManual = contractor._source === 'manual' || contractor._source === 'both';
            const trades: string[] = contractor.trades || contractor._projectSub?.trades || [];
            const projectsList = contractor.projects || contractor._projectSub?.projects || [];

            return (
              <button
                key={contractor.id || contractor.userId || contractor._displayName}
                type="button"
                onClick={() => handleCardClick(contractor)}
                className="w-full text-left bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-semibold text-neutral-900 truncate group-hover:text-brand-600 transition-colors dark:text-white">
                        {contractor._displayName}
                      </h3>
                      {contractor.isPlaceholder && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-500/20 flex-shrink-0 dark:bg-amber-500/10 dark:text-amber-300">
                          Placeholder
                        </span>
                      )}
                    </div>
                    {contractor.name && contractor.name !== contractor._displayName && (
                      <p className="text-xs text-neutral-500 dark:text-gray-400">{contractor.name}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-300 mt-0.5 flex-shrink-0 group-hover:text-neutral-500 transition-colors" />
                </div>

                {/* Source badges */}
                <div className="flex items-center gap-1.5 mb-2.5">
                  {isManual && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300">
                      <HardHat className="w-2.5 h-2.5" />
                      Rolodex
                    </span>
                  )}
                  {isProjectSub && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-50 text-brand-600 dark:bg-blue-500/10 dark:text-blue-300">
                      <FolderKanban className="w-2.5 h-2.5" />
                      {(contractor.projectCount || projectsList.length || 0)} project{(contractor.projectCount || projectsList.length || 0) !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Contact info */}
                <div className="space-y-1 mb-3">
                  {(contractor.phone) && (
                    <p className="text-xs text-neutral-400 flex items-center gap-1.5 dark:text-gray-500">
                      <Phone className="w-3 h-3" />
                      {contractor.phone}
                    </p>
                  )}
                  {(contractor.email) && (
                    <p className="text-xs text-neutral-400 flex items-center gap-1.5 dark:text-gray-500">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{contractor.email}</span>
                    </p>
                  )}
                </div>

                {/* Trade pills (for project subs) */}
                {trades.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {trades.slice(0, 4).map((t: string) => (
                      <span
                        key={t}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${TRADE_COLORS[t] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {t}
                      </span>
                    ))}
                    {trades.length > 4 && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400">
                        +{trades.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-3 flex-wrap">
                  {isManual && (contractor.jobCount || 0) > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-medium dark:bg-blue-500/10 dark:text-blue-300">
                      <Briefcase className="w-3 h-3" />
                      {contractor.jobCount} jobs
                    </span>
                  )}
                  {isManual && (contractor.totalRevenue || 0) > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs font-medium dark:bg-green-500/10 dark:text-green-300">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(contractor.totalRevenue)}
                    </span>
                  )}
                  {/* Project names for subs */}
                  {isProjectSub && projectsList.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {projectsList.slice(0, 2).map((p: any) => (
                        <span key={p.id} className="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded dark:bg-white/[0.02] dark:text-gray-400">
                          {p.name?.length > 25 ? p.name.slice(0, 25) + '...' : p.name}
                        </span>
                      ))}
                      {projectsList.length > 2 && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">+{projectsList.length - 2} more</span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Result count */}
      {!isLoading && filteredContractors.length > 0 && (
        <p className="text-xs text-neutral-400 text-center mt-6 dark:text-gray-500">
          Showing {filteredContractors.length} contractor{filteredContractors.length !== 1 ? 's' : ''}
        </p>
      )}

      <CreateContractorModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </div>
  );
}
