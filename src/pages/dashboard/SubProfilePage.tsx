import { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  ArrowLeft,
  Star,
  Phone,
  Mail,
  Briefcase,
  MapPin,
  ChevronRight,
  Building2,
  Calendar,
  Clock,
  TrendingUp,
} from 'lucide-react';

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

const STATUS_DOT: Record<string, string> = {
  not_started: 'bg-gray-400',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  blocked: 'bg-red-500',
};

const STATUS_LABEL: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  blocked: 'Blocked',
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

/** Sub profile page — works for both real subs (userId) and placeholder subs (name-based) */
export function SubProfilePage() {
  const { subId } = useParams<{ subId: string }>();
  const navigate = useNavigate();

  // subId could be a UUID (real sub) or a URL-encoded placeholder name
  const isPlaceholder = subId ? !subId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) : true;
  const placeholderName = isPlaceholder ? decodeURIComponent(subId || '') : null;

  // Fetch all GC projects to build the sub's profile
  const projectsQuery = useQuery({
    queryKey: ['gc-projects'],
    queryFn: () => api.getGCProjects(),
  });

  // For real subs, fetch their performance rating
  const ratingQuery = useQuery({
    queryKey: ['trade-rating', subId],
    queryFn: () => api.getSubPerformance(subId!),
    enabled: !isPlaceholder && !!subId,
  });

  const projects: any[] = projectsQuery.data?.data || [];

  // Build the sub profile from project data
  const subProfile = useMemo(() => {
    const trades: { trade: any; project: any }[] = [];
    const tradeNames = new Set<string>();
    const projectSet = new Map<string, any>();

    let businessName = placeholderName || 'Unknown';
    let phone = '';
    let email = '';
    let contactInfo = '';

    for (const project of projects) {
      for (const trade of (project.trades || [])) {
        let match = false;

        if (!isPlaceholder && trade.assignedUserId === subId) {
          match = true;
          if (trade.assignedBusinessName) businessName = trade.assignedBusinessName;
          if (trade.assignedPhone) phone = trade.assignedPhone;
          if (trade.assignedEmail) email = trade.assignedEmail;
        } else if (isPlaceholder && trade.notes) {
          const placeholderMatch = trade.notes.match(/^Placeholder:\s*(.+?)(?:\s*\((.+?)\)|$)/);
          if (placeholderMatch) {
            const name = placeholderMatch[1].trim();
            if (name === placeholderName) {
              match = true;
              if (placeholderMatch[2]) contactInfo = placeholderMatch[2].trim();
            }
          }
          const invitedMatch = trade.notes.match(/^Invited:\s*(.+?)(?:\s*\((.+?)\)|$)/);
          if (invitedMatch) {
            const invEmail = invitedMatch[1].trim();
            const invCompany = invitedMatch[2]?.trim();
            if (invCompany === placeholderName || invEmail === placeholderName) {
              match = true;
              email = invEmail;
              if (invCompany) businessName = invCompany;
            }
          }
        }

        if (match) {
          trades.push({ trade, project });
          tradeNames.add(trade.trade);
          if (!projectSet.has(project.id)) {
            projectSet.set(project.id, project);
          }
        }
      }
    }

    // Parse phone from contactInfo if not set
    if (!phone && contactInfo) {
      phone = contactInfo;
    }

    // Calculate aggregate stats
    let totalTasks = 0;
    let doneTasks = 0;
    let totalBudget = 0;

    for (const { trade } of trades) {
      const tasks = trade.tasks || [];
      totalTasks += tasks.length;
      doneTasks += tasks.filter((t: any) => t.done).length;
      const hours = trade.laborHours || trade.labor_hours || 0;
      const rate = trade.laborRate || trade.labor_rate || 0;
      const mat = trade.materialsBudget || trade.materials_budget || 0;
      totalBudget += (hours * rate) + mat || trade.budget || 0;
    }

    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    return {
      businessName,
      phone,
      email,
      contactInfo,
      trades,
      tradeNames: Array.from(tradeNames),
      projects: Array.from(projectSet.values()),
      totalTasks,
      doneTasks,
      completionRate,
      totalBudget,
    };
  }, [projects, subId, isPlaceholder, placeholderName]);

  // Fetch individual trade ratings for this sub
  const ratingsQuery = useQuery({
    queryKey: ['trade-ratings-list', subId],
    queryFn: () => api.getSubPerformance(subId!),
    enabled: !isPlaceholder && !!subId,
  });

  const tradeRatings: any[] = ratingsQuery.data?.data?.ratings || [];
  // Map from trade_id to rating for quick lookup
  const ratingByTradeId = useMemo(() => {
    const map: Record<string, any> = {};
    for (const r of tradeRatings) {
      if (r.trade_id) map[r.trade_id] = r;
    }
    return map;
  }, [tradeRatings]);

  // Build project history: group trades by project, sorted by most recent
  const projectHistory = useMemo(() => {
    const projectMap = new Map<string, { project: any; trades: { trade: any; rating: any }[] }>();

    for (const { trade, project } of subProfile.trades) {
      if (!projectMap.has(project.id)) {
        projectMap.set(project.id, { project, trades: [] });
      }
      const rating = ratingByTradeId[trade.id] || null;
      projectMap.get(project.id)!.trades.push({ trade, rating });
    }

    // Sort by project created_at descending (most recent first)
    return Array.from(projectMap.values()).sort((a, b) => {
      const dateA = a.project.createdAt || a.project.created_at || '';
      const dateB = b.project.createdAt || b.project.created_at || '';
      return dateB.localeCompare(dateA);
    });
  }, [subProfile.trades, ratingByTradeId]);

  // Aggregate history stats
  const historyStats = useMemo(() => {
    let completedTrades = 0;
    let totalRatedScore = 0;
    let ratedCount = 0;

    for (const entry of projectHistory) {
      for (const { trade, rating } of entry.trades) {
        if (trade.status === 'completed') completedTrades++;
        if (rating && rating.overall) {
          totalRatedScore += rating.overall;
          ratedCount++;
        }
      }
    }

    return {
      projectCount: projectHistory.length,
      completedTrades,
      averageRating: ratedCount > 0 ? Math.round((totalRatedScore / ratedCount) * 10) / 10 : null,
      ratedCount,
    };
  }, [projectHistory]);

  const score = ratingQuery.data?.data?.score;
  const totalRatings = ratingQuery.data?.data?.totalRatings || 0;
  const breakdown = ratingQuery.data?.data?.breakdown;

  if (projectsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm mb-4">
        <Link to="/dashboard/projects" className="text-gray-500 hover:text-gray-700 transition-colors">
          Projects
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-gray-900 font-medium truncate">{subProfile.businessName}</span>
      </div>

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-8 h-8 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{subProfile.businessName}</h1>
              {isPlaceholder && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-500/20">
                  Placeholder
                </span>
              )}
            </div>

            {/* Contact info */}
            <div className="flex flex-wrap items-center gap-4 mt-2">
              {subProfile.phone && (
                <a href={`tel:${subProfile.phone}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors">
                  <Phone className="w-3.5 h-3.5" />
                  {subProfile.phone}
                </a>
              )}
              {subProfile.email && (
                <a href={`mailto:${subProfile.email}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                  {subProfile.email}
                </a>
              )}
            </div>

            {/* Trade pills */}
            {subProfile.tradeNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {subProfile.tradeNames.map((t) => (
                  <span
                    key={t}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${TRADE_COLORS[t] || 'bg-gray-100 text-gray-600'}`}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Rating */}
          {!isPlaceholder && score !== null && score !== undefined && totalRatings > 0 && (
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="text-3xl font-bold text-gray-900">{score.toFixed(1)}</div>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s <= Math.round(score) ? 'fill-current text-amber-400' : 'text-gray-200'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-400">{totalRatings} rating{totalRatings !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Projects</p>
          <p className="text-2xl font-bold text-gray-900">{subProfile.projects.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Active Trades</p>
          <p className="text-2xl font-bold text-gray-900">{subProfile.trades.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Completion</p>
          <p className="text-2xl font-bold text-gray-900">{subProfile.completionRate}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Total Budget</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(subProfile.totalBudget)}</p>
        </div>
      </div>

      {/* Rating Breakdown (real subs only) */}
      {!isPlaceholder && breakdown && totalRatings > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">FlowBoss Score Breakdown</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Quality', value: breakdown.quality, weight: '35%' },
              { label: 'Timeliness', value: breakdown.timeliness, weight: '25%' },
              { label: 'Budget', value: breakdown.budgetAdherence, weight: '25%' },
              { label: 'Communication', value: breakdown.communication, weight: '15%' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-2">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke={item.value >= 4 ? '#22c55e' : item.value >= 3 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="3"
                      strokeDasharray={`${(item.value / 5) * 100} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
                    {item.value?.toFixed(1)}
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-700">{item.label}</p>
                <p className="text-[10px] text-gray-400">{item.weight} weight</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects & Trades */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Assigned Trades</h2>
        <div className="space-y-3">
          {subProfile.trades.map(({ trade, project }) => {
            const tasks = trade.tasks || [];
            const done = tasks.filter((t: any) => t.done).length;
            const progress = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
            const hours = trade.laborHours || trade.labor_hours || 0;
            const rate = trade.laborRate || trade.labor_rate || 0;
            const laborCost = hours * rate;

            return (
              <Link
                key={trade.id}
                to={`/dashboard/projects/${project.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${TRADE_COLORS[trade.trade] || 'bg-gray-100 text-gray-600'}`}>
                      {trade.trade}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[trade.status] || 'bg-gray-400'}`} />
                      {STATUS_LABEL[trade.status] || 'Not Started'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-700 truncate">{project.name}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    <span>{done}/{tasks.length} tasks</span>
                    {laborCost > 0 && <span>{formatCurrency(laborCost)} labor</span>}
                  </div>
                </div>

                {/* Progress ring */}
                <div className="relative w-12 h-12 flex-shrink-0">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="2.5" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke={progress >= 75 ? '#22c55e' : progress >= 25 ? '#3b82f6' : '#d1d5db'}
                      strokeWidth="2.5"
                      strokeDasharray={`${progress} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                    {progress}%
                  </span>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
              </Link>
            );
          })}

          {subProfile.trades.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No trades assigned to this sub yet.
            </div>
          )}
        </div>
      </div>

      {/* Project History */}
      {projectHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mt-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-500" />
              <h2 className="text-sm font-bold text-gray-900">Project History</h2>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>{historyStats.projectCount} project{historyStats.projectCount !== 1 ? 's' : ''}</span>
              <span>{historyStats.completedTrades} trade{historyStats.completedTrades !== 1 ? 's' : ''} completed</span>
              {historyStats.averageRating !== null && (
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current text-amber-400" />
                  {historyStats.averageRating.toFixed(1)} avg
                </span>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-200" />

            <div className="space-y-0">
              {projectHistory.map((entry, idx) => {
                const { project, trades: entryTrades } = entry;
                const createdAt = project.createdAt || project.created_at;
                const startDate = createdAt ? new Date(createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
                const allCompleted = entryTrades.every(({ trade }) => trade.status === 'completed');

                return (
                  <div key={project.id} className="relative pl-10 pb-6 last:pb-0">
                    {/* Timeline dot */}
                    <div className={`absolute left-[10px] top-1.5 w-[11px] h-[11px] rounded-full border-2 ${
                      allCompleted
                        ? 'bg-green-500 border-green-500'
                        : entryTrades.some(({ trade }) => trade.status === 'in_progress')
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-white border-gray-300'
                    }`} />

                    <Link
                      to={`/dashboard/projects/${project.id}`}
                      className="block p-4 rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 transition-colors truncate">
                            {project.name}
                          </p>
                          {(project.address || project.city) && (
                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {[project.address, project.city, project.state].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                        {startDate && (
                          <span className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {startDate}
                          </span>
                        )}
                      </div>

                      {/* Trades for this project */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {entryTrades.map(({ trade, rating }) => (
                          <div key={trade.id} className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${TRADE_COLORS[trade.trade] || 'bg-gray-100 text-gray-600'}`}>
                              {trade.trade}
                            </span>
                            <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[trade.status] || 'bg-gray-400'}`} />
                              {STATUS_LABEL[trade.status] || 'Not Started'}
                            </span>
                            {rating && rating.overall && (
                              <span className="flex items-center gap-0.5 text-[11px]">
                                <Star className="w-3 h-3 fill-current text-amber-400" />
                                <span className="text-gray-600 font-medium">{rating.overall.toFixed(1)}</span>
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
