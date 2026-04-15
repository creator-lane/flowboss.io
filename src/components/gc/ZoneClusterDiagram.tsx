import { useMemo } from 'react';
import { Building2 } from 'lucide-react';

/* ─── Zone color / emoji maps ─── */

const ZONE_EMOJI: Record<string, string> = {
  'Kitchen': '\u{1F373}',
  'Bathroom': '\u{1F6BF}', 'Bathroom 1': '\u{1F6BF}', 'Bathroom 2': '\u{1F6BF}', 'Master Bathroom': '\u{1F6BF}',
  'Master Suite': '\u{1F6CF}\u{FE0F}', 'Master Bedroom': '\u{1F6CF}\u{FE0F}',
  'Bedroom': '\u{1F6CF}\u{FE0F}', 'Bedroom 1': '\u{1F6CF}\u{FE0F}', 'Bedroom 2': '\u{1F6CF}\u{FE0F}', 'Bedroom 3': '\u{1F6CF}\u{FE0F}',
  'Living Room': '\u{1F6CB}\u{FE0F}', 'Family Room': '\u{1F6CB}\u{FE0F}',
  'Garage': '\u{1F697}',
  'Exterior': '\u{1F3E1}',
  'Basement': '\u{1F3E0}',
  'Laundry': '\u{1F9FA}',
  'Office': '\u{1F4BC}',
  'Dining Room': '\u{1F37D}\u{FE0F}',
  'General': '\u{1F527}', 'Site-Wide': '\u{1F527}',
};

const ZONE_COLORS: Record<string, string> = {
  'Kitchen': '#d97706',
  'Bathroom': '#0891b2', 'Bathroom 1': '#0891b2', 'Bathroom 2': '#0e7490', 'Bathroom 3': '#155e75', 'Master Bathroom': '#06b6d4',
  'Master Suite': '#7c3aed', 'Master Bedroom': '#7c3aed',
  'Living Room': '#059669', 'Family Room': '#059669',
  'Garage': '#475569',
  'Exterior': '#15803d',
  'Basement': '#525252',
  'General': '#1d4ed8', 'General / Structural': '#1d4ed8', 'Site-Wide': '#1d4ed8',
};

const DEFAULT_ZONE_COLOR = '#475569';

function statusDot(status: string) {
  switch (status) {
    case 'completed': return 'bg-green-500';
    case 'in_progress': return 'bg-blue-500';
    case 'blocked': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
}

interface ZoneClusterDiagramProps {
  project: any;
  trades: any[];
  zones: any[];
  overallProgress: number;
  selectedZoneId: string | null;
  onSelectZone: (id: string) => void;
}

export function ZoneClusterDiagram({
  project,
  trades,
  zones,
  overallProgress,
  selectedZoneId,
  onSelectZone,
}: ZoneClusterDiagramProps) {
  // Build a zone-to-trades map
  const zoneTradesMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const z of zones) {
      map[z.id] = trades.filter((t: any) => t.zoneId === z.id || t.zone_id === z.id);
    }
    return map;
  }, [zones, trades]);

  // Trades not belonging to any zone
  const ungroupedTrades = useMemo(() => {
    const zoneIds = new Set(zones.map((z: any) => z.id));
    return trades.filter((t: any) => !t.zoneId && !t.zone_id || (t.zoneId && !zoneIds.has(t.zoneId)) || (t.zone_id && !zoneIds.has(t.zone_id)));
  }, [zones, trades]);

  const zoneList = useMemo(() => {
    const list = zones.map((z: any) => ({
      id: z.id,
      name: z.name,
      trades: zoneTradesMap[z.id] || [],
    }));
    if (ungroupedTrades.length > 0) {
      list.push({ id: 'general', name: 'General', trades: ungroupedTrades });
    }
    return list;
  }, [zones, zoneTradesMap, ungroupedTrades]);

  // Hub stats
  const subCount = useMemo(() => {
    const ids = new Set<string>();
    for (const t of trades) {
      const uid = t.assignedUserId || t.assigned_user_id;
      if (uid) ids.add(uid);
    }
    return ids.size;
  }, [trades]);

  const budgetAllocated = useMemo(() => {
    return trades.reduce((s: number, t: any) => s + (Number(t.budget) || 0), 0);
  }, [trades]);

  const projectBudget = Number(project?.budget) || 0;
  const budgetPct = projectBudget > 0
    ? Math.min(999, Math.round((budgetAllocated / projectBudget) * 100))
    : null;

  const structureMeta = useMemo(() => {
    const parts: string[] = [];
    if (project?.sqFootage || project?.sq_footage) {
      const sq = project.sqFootage || project.sq_footage;
      parts.push(`${Number(sq).toLocaleString()} sq ft`);
    }
    if (project?.bedrooms) parts.push(`${project.bedrooms} bed`);
    if (project?.bathrooms) parts.push(`${project.bathrooms} bath`);
    if (project?.structureType || project?.structure_type) {
      parts.push(project.structureType || project.structure_type);
    }
    if (project?.status) {
      const label = String(project.status).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      parts.push(label);
    }
    return parts.join(' \u00B7 ');
  }, [project]);

  function getZoneStats(zoneTrades: any[]) {
    let totalTasks = 0;
    let doneTasks = 0;
    for (const t of zoneTrades) {
      const tasks = t.tasks || [];
      totalTasks += tasks.length;
      doneTasks += tasks.filter((tk: any) => tk.done).length;
    }
    const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    return { totalTasks, doneTasks, progress };
  }

  const zoneCount = zoneList.length;
  // Split zones into left + right columns around the hub on large screens
  const midpoint = Math.ceil(zoneCount / 2);
  const leftZones = zoneList.slice(0, midpoint);
  const rightZones = zoneList.slice(midpoint);

  const renderZoneCard = (zone: typeof zoneList[number]) => {
    const zoneTrades = zone.trades;
    const { totalTasks, doneTasks, progress } = getZoneStats(zoneTrades);
    const zoneAccent = ZONE_COLORS[zone.name] || DEFAULT_ZONE_COLOR;
    const isSelected = zone.id === selectedZoneId;

    return (
      <button
        key={zone.id}
        onClick={() => onSelectZone(zone.id)}
        data-tour="zone-card"
        className={`relative text-left rounded-2xl border-2 p-4 transition-all cursor-pointer hover:shadow-lg hover:-translate-y-0.5 focus:outline-none ${
          isSelected ? 'ring-2 ring-offset-2 ring-blue-500 shadow-xl dark:ring-offset-gray-900' : 'shadow-sm'
        } bg-white border-gray-200 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10 ${
          selectedZoneId && !isSelected ? 'opacity-60' : ''
        }`}
        style={{ borderTop: `4px solid ${zoneAccent}` }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg">{ZONE_EMOJI[zone.name] || '\u{1F4CD}'}</span>
            <span className="font-bold text-sm text-gray-900 truncate dark:text-white">{zone.name}</span>
          </div>
          <span className="text-xs font-bold tabular-nums" style={{ color: zoneAccent }}>{progress}%</span>
        </div>

        <div className="space-y-1.5 mb-3">
          {zoneTrades.slice(0, 5).map((t: any) => (
            <div key={t.id} className="flex items-center gap-2 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot(t.status)}`} />
              <span className="text-gray-700 truncate dark:text-gray-300">{t.trade}</span>
              {(t.assignedUserId || t.assigned_user_id) && (
                <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-500">assigned</span>
              )}
            </div>
          ))}
          {zoneTrades.length > 5 && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500">+{zoneTrades.length - 5} more</span>
          )}
          {zoneTrades.length === 0 && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500">No trades yet</span>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-gray-500 dark:text-gray-500">{doneTasks}/{totalTasks} tasks</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(progress, 2)}%`, backgroundColor: zoneAccent }}
          />
        </div>
      </button>
    );
  };

  const Hub = (
    <div
      className="relative mx-auto w-full max-w-md bg-gray-900 rounded-2xl p-6 shadow-2xl text-white"
      data-tour="progress-ring"
    >
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-blue-600 text-[10px] font-bold rounded-full tracking-wide">
        HUB
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
          <Building2 className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-base truncate">{project?.name || 'Project'}</div>
          {structureMeta && (
            <div className="text-xs text-gray-400 truncate">{structureMeta}</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white/10 rounded-lg py-2">
          <div className="text-[10px] text-gray-400 uppercase tracking-wide">Overall</div>
          <div className="text-lg font-bold">{overallProgress}%</div>
        </div>
        <div className="bg-white/10 rounded-lg py-2">
          <div className="text-[10px] text-gray-400 uppercase tracking-wide">Subs</div>
          <div className="text-lg font-bold">{subCount}</div>
        </div>
        <div className="bg-white/10 rounded-lg py-2">
          <div className="text-[10px] text-gray-400 uppercase tracking-wide">Budget</div>
          <div className="text-lg font-bold">
            {budgetPct !== null ? `${budgetPct}%` : projectBudget > 0 ? '—' : 'N/A'}
          </div>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-700"
          style={{ width: `${overallProgress}%` }}
        />
      </div>
    </div>
  );

  return (
    <div
      className="relative rounded-2xl border border-gray-200 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-gray-50 dark:border-white/10 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-950 dark:to-gray-900"
    >
      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.08]"
        style={{
          backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative p-6 lg:p-8">
        {zoneCount === 0 ? (
          <div className="max-w-md mx-auto">
            {Hub}
            <p className="text-center text-sm text-gray-400 mt-8 dark:text-gray-500">
              No zones or trades yet
            </p>
          </div>
        ) : (
          <>
            {/* Desktop: 3-column layout, hub in the middle */}
            <div className="hidden lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6 lg:items-start">
              <div className="flex flex-col gap-4">
                {leftZones.map(renderZoneCard)}
              </div>
              <div className="w-[420px] max-w-full sticky top-6">
                {Hub}
              </div>
              <div className="flex flex-col gap-4">
                {rightZones.map(renderZoneCard)}
              </div>
            </div>

            {/* Mobile / tablet: hub on top, zones in a 1 or 2-col grid below */}
            <div className="lg:hidden">
              {Hub}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {zoneList.map(renderZoneCard)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
