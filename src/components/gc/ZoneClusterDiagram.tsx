import { useState, useRef, useEffect, useMemo } from 'react';

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
  'Kitchen': '#f59e0b',
  'Bathroom': '#06b6d4', 'Bathroom 1': '#06b6d4', 'Bathroom 2': '#0891b2', 'Master Bathroom': '#0e7490',
  'Master Suite': '#8b5cf6', 'Master Bedroom': '#8b5cf6',
  'Living Room': '#22c55e', 'Family Room': '#22c55e',
  'Garage': '#64748b',
  'Exterior': '#16a34a',
  'Basement': '#6b7280',
  'General': '#2563eb', 'Site-Wide': '#2563eb',
};

const DEFAULT_ZONE_COLOR = '#6b7280';

/* ─── Trade status dot helper ─── */
function statusDot(status: string) {
  switch (status) {
    case 'completed': return 'bg-green-500';
    case 'in_progress': return 'bg-blue-500';
    case 'blocked': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
}

/* ─── Component ─── */

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
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Build full zone list including virtual "General" for ungrouped
  const zoneList = useMemo(() => {
    const list = zones.map((z: any) => ({
      id: z.id,
      name: z.name,
      trades: zoneTradesMap[z.id] || [],
    }));
    if (ungroupedTrades.length > 0) {
      list.push({
        id: 'general',
        name: 'General',
        trades: ungroupedTrades,
      });
    }
    return list;
  }, [zones, zoneTradesMap, ungroupedTrades]);

  // Sizing
  const zoneCount = zoneList.length;
  const minHeight = zoneCount <= 3 ? 520 : zoneCount <= 5 ? 620 : zoneCount <= 7 ? 720 : 820;
  const [dimensions, setDimensions] = useState({ width: 900, height: minHeight });

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const h = zoneCount <= 3 ? 520 : zoneCount <= 5 ? 620 : zoneCount <= 7 ? 720 : 820;
        setDimensions({
          width: Math.max(rect.width, 600),
          height: Math.max(h, Math.min(900, rect.width * 0.7)),
        });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [zoneCount]);

  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;

  const baseRadius = Math.min(dimensions.width, dimensions.height) * 0.38;
  const radius = zoneCount <= 2 ? baseRadius * 0.65
    : zoneCount <= 4 ? baseRadius * 0.8
    : zoneCount <= 6 ? baseRadius * 0.95
    : baseRadius * 1.05;

  // Position zones in a circle
  const zonePositions = useMemo(() => {
    if (zoneList.length === 0) return [];
    const angleStep = (2 * Math.PI) / zoneList.length;
    return zoneList.map((zone, i) => {
      const angle = angleStep * i - Math.PI / 2;
      return {
        zone,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        angle,
      };
    });
  }, [zoneList, centerX, centerY, radius]);

  // Compute zone progress for each
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

  // Line color based on progress
  function lineColor(progress: number) {
    if (progress >= 75) return '#22c55e';
    if (progress >= 25) return '#3b82f6';
    return '#d1d5db';
  }

  return (
    <div
      ref={containerRef}
      className="relative bg-gradient-to-br from-slate-50 via-white to-gray-50 rounded-2xl border border-gray-200 overflow-hidden"
      style={{ height: dimensions.height }}
    >
      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* SVG connecting lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        <defs>
          {zonePositions.map(({ zone }) => {
            const { progress } = getZoneStats(zone.trades);
            const color = lineColor(progress);
            return (
              <linearGradient
                key={`grad-${zone.id}`}
                id={`zone-line-grad-${zone.id}`}
                x1="0%" y1="0%" x2="100%" y2="0%"
              >
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
                <stop offset="100%" stopColor={color} stopOpacity="0.5" />
              </linearGradient>
            );
          })}
        </defs>
        {zonePositions.map(({ zone, x, y }) => {
          const { progress } = getZoneStats(zone.trades);
          const isSelected = zone.id === selectedZoneId;
          const color = lineColor(progress);
          return (
            <line
              key={`line-${zone.id}`}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke={isSelected ? color : `url(#zone-line-grad-${zone.id})`}
              strokeWidth={isSelected ? 3 : 2}
              strokeDasharray={progress === 0 ? '6 4' : undefined}
              className="transition-all duration-300"
            />
          );
        })}
      </svg>

      {/* Center Hub */}
      <div
        className="absolute z-20"
        style={{ left: centerX, top: centerY, transform: 'translate(-50%, -50%)' }}
      >
        <div className="relative w-40 h-40">
          {/* Outer glow */}
          <div className="absolute -inset-3 rounded-full bg-brand-500/5 blur-lg" />
          {/* Progress ring */}
          <div
            className="absolute inset-0 rounded-full shadow-xl shadow-brand-500/15"
            style={{
              background: `conic-gradient(#2563eb ${overallProgress * 3.6}deg, #f1f5f9 ${overallProgress * 3.6}deg)`,
              padding: '4px',
            }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-white to-slate-50" />
          </div>
          {/* Content */}
          <div className="absolute inset-[5px] rounded-full bg-white flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-gray-900 truncate max-w-[100px]">{project.name}</span>
            {project.sqFootage && (
              <span className="text-[9px] text-gray-400">{project.sqFootage.toLocaleString()} sq ft</span>
            )}
            {(project.bedrooms || project.bathrooms) && (
              <span className="text-[9px] text-gray-400">
                {project.bedrooms && `${project.bedrooms} bed`}
                {project.bedrooms && project.bathrooms && ' \u00B7 '}
                {project.bathrooms && `${project.bathrooms} bath`}
              </span>
            )}
            <span className="text-lg font-extrabold text-brand-600 mt-0.5" data-tour="progress-ring">{overallProgress}%</span>
          </div>
        </div>
      </div>

      {/* Zone Cards */}
      {zonePositions.map(({ zone, x, y }) => {
        const zoneTrades = zone.trades;
        const { totalTasks, doneTasks, progress } = getZoneStats(zoneTrades);
        const zoneAccent = ZONE_COLORS[zone.name] || DEFAULT_ZONE_COLOR;
        const isSelected = zone.id === selectedZoneId;

        return (
          <button
            key={zone.id}
            onClick={() => onSelectZone(zone.id)}
            data-tour="zone-card"
            className={`absolute z-10 text-left transition-all duration-300 group focus:outline-none ${
              isSelected ? 'scale-110' : 'hover:scale-105'
            }`}
            style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
          >
            <div
              className={`w-[180px] bg-gradient-to-b from-white to-gray-50 rounded-2xl overflow-hidden transition-all duration-300 ${
                isSelected
                  ? 'shadow-xl shadow-brand-500/20 ring-2 ring-brand-400'
                  : 'shadow-md shadow-gray-200/60 group-hover:shadow-lg group-hover:shadow-gray-300/50'
              }`}
              style={{ borderTop: `3px solid ${zoneAccent}` }}
            >
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{ZONE_EMOJI[zone.name] || '\u{1F4CD}'}</span>
                  <span className="text-sm font-bold text-gray-900 truncate">{zone.name}</span>
                </div>

                {/* Trades in this zone (compact) */}
                <div className="space-y-1 mb-2">
                  {zoneTrades.slice(0, 5).map((t: any) => (
                    <div key={t.id} className="flex items-center gap-1.5 text-[11px]">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot(t.status)}`} />
                      <span className="text-gray-600 truncate">{t.trade}</span>
                    </div>
                  ))}
                  {zoneTrades.length > 5 && (
                    <span className="text-[10px] text-gray-400">+{zoneTrades.length - 5} more</span>
                  )}
                </div>

                {/* Zone completion */}
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-gray-400">{doneTasks}/{totalTasks} tasks</span>
                  <span className="font-bold" style={{ color: zoneAccent }}>{progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: zoneAccent }} />
                </div>
              </div>
            </div>
          </button>
        );
      })}

      {/* Empty state */}
      {zoneList.length === 0 && (
        <div className="absolute left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3" style={{ top: centerY + 100 }}>
          <p className="text-gray-400 text-sm">No zones or trades yet</p>
        </div>
      )}
    </div>
  );
}
