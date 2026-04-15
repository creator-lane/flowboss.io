import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { TimelineSuggestions } from './TimelineSuggestions';
import {
  ZoomIn,
  ZoomOut,
  Sparkles,
  CalendarDays,
  User,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  GripVertical,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════════════ */

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const MIN_DAY_WIDTH = 16;
const MAX_DAY_WIDTH = 80;
const DEFAULT_DAY_WIDTH = 32;
const ROW_HEIGHT = 72;
const HEADER_HEIGHT = 48;
const LABEL_WIDTH = 200;

const STATUS_COLORS: Record<string, { bar: string; barHover: string; text: string }> = {
  not_started: { bar: 'bg-gray-300', barHover: 'hover:bg-gray-400', text: 'text-gray-600' },
  in_progress: { bar: 'bg-blue-500', barHover: 'hover:bg-blue-600', text: 'text-blue-700' },
  completed: { bar: 'bg-green-500', barHover: 'hover:bg-green-600', text: 'text-green-700' },
  blocked: { bar: 'bg-red-500', barHover: 'hover:bg-red-600', text: 'text-red-700' },
};

const STATUS_ICONS: Record<string, typeof Circle> = {
  not_started: Clock,
  in_progress: Circle,
  completed: CheckCircle2,
  blocked: AlertCircle,
};

const TRADE_ACCENT: Record<string, string> = {
  Plumbing: 'bg-blue-500',
  Electrical: 'bg-yellow-500',
  HVAC: 'bg-cyan-500',
  Framing: 'bg-orange-500',
  Drywall: 'bg-stone-400',
  Painting: 'bg-purple-500',
  Roofing: 'bg-red-500',
  Concrete: 'bg-gray-500',
  Flooring: 'bg-amber-500',
  Landscaping: 'bg-green-500',
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

function formatShortDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function startOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

/* ═══════════════════════════════════════════════════════════════════════════
   TimelineBoard Component
   ═══════════════════════════════════════════════════════════════════════════ */

interface TimelineBoardProps {
  project: any;
  trades: any[];
  projectId: string;
}

export function TimelineBoard({ project, trades, projectId }: TimelineBoardProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [dayWidth, setDayWidth] = useState(DEFAULT_DAY_WIDTH);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dragState, setDragState] = useState<{
    tradeId: string;
    edge: 'left' | 'right' | 'move';
    startX: number;
    origStartDate: Date;
    origEndDate: Date;
  } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [hoveredTrade, setHoveredTrade] = useState<string | null>(null);

  const hasProjectDates = !!(project.startDate && project.targetEndDate);

  const tradesWithDates = trades.filter((t: any) => t.startDate && t.endDate);
  const noDatesSet = tradesWithDates.length === 0;

  // Auto-show suggestions if no trade dates are set
  const [autoShowedSuggestions, setAutoShowedSuggestions] = useState(false);
  useEffect(() => {
    if (noDatesSet && !autoShowedSuggestions) {
      setShowSuggestions(true);
      setAutoShowedSuggestions(true);
    }
  }, [noDatesSet, autoShowedSuggestions]);

  // Calculate timeline bounds
  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    if (!hasProjectDates && noDatesSet) {
      const today = startOfDay(new Date());
      return {
        timelineStart: today,
        timelineEnd: new Date(today.getTime() + 90 * DAY_MS),
        totalDays: 90,
      };
    }

    let earliest = hasProjectDates ? startOfDay(new Date(project.startDate)) : startOfDay(new Date());
    let latest = hasProjectDates
      ? startOfDay(new Date(project.targetEndDate))
      : new Date(earliest.getTime() + 90 * DAY_MS);

    // Extend bounds to include all trade dates
    for (const t of trades) {
      if (t.startDate) {
        const s = startOfDay(new Date(t.startDate));
        if (s < earliest) earliest = s;
      }
      if (t.endDate) {
        const e = startOfDay(new Date(t.endDate));
        if (e > latest) latest = e;
      }
    }

    // Add 1-week padding
    const padded = new Date(latest.getTime() + WEEK_MS);
    const days = Math.max(Math.ceil((padded.getTime() - earliest.getTime()) / DAY_MS), 14);

    return { timelineStart: earliest, timelineEnd: padded, totalDays: days };
  }, [project, trades, hasProjectDates, noDatesSet]);

  // Build week markers
  const weekMarkers = useMemo(() => {
    const markers: { date: Date; offsetPx: number; label: string; isMonth: boolean }[] = [];
    const current = new Date(timelineStart);
    // Align to Monday
    const dayOfWeek = current.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
    current.setDate(current.getDate() + daysToMonday);

    while (current <= timelineEnd) {
      const offset = Math.round(((current.getTime() - timelineStart.getTime()) / DAY_MS) * dayWidth);
      const isMonth = current.getDate() <= 7;
      markers.push({
        date: new Date(current),
        offsetPx: offset,
        label: formatShortDate(current),
        isMonth,
      });
      current.setDate(current.getDate() + 7);
    }
    return markers;
  }, [timelineStart, timelineEnd, dayWidth]);

  // Today line
  const todayOffset = useMemo(() => {
    const today = startOfDay(new Date());
    if (today < timelineStart || today > timelineEnd) return null;
    return Math.round(((today.getTime() - timelineStart.getTime()) / DAY_MS) * dayWidth);
  }, [timelineStart, timelineEnd, dayWidth]);

  // Zoom controls
  const zoomIn = () => setDayWidth((w) => Math.min(w * 1.4, MAX_DAY_WIDTH));
  const zoomOut = () => setDayWidth((w) => Math.max(w / 1.4, MIN_DAY_WIDTH));

  // Update trade mutation
  const updateTradeMutation = useMutation({
    mutationFn: ({ tradeId, updates }: { tradeId: string; updates: any }) =>
      api.updateGCTrade(tradeId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] });
    },
    onError: (err: any) => addToast(err.message || 'Failed to update timeline', 'error'),
  });

  // Drag handlers
  const handleDragStart = useCallback(
    (e: React.MouseEvent, tradeId: string, edge: 'left' | 'right' | 'move', startDate: Date, endDate: Date) => {
      e.preventDefault();
      e.stopPropagation();
      setDragState({ tradeId, edge, startX: e.clientX, origStartDate: startDate, origEndDate: endDate });
      setDragOffset(0);
    },
    []
  );

  useEffect(() => {
    if (!dragState) return;

    const handleMove = (e: MouseEvent) => {
      setDragOffset(e.clientX - dragState.startX);
    };

    const handleUp = () => {
      if (dragState && dragOffset !== 0) {
        const daysDelta = Math.round(dragOffset / dayWidth);
        if (daysDelta !== 0) {
          let newStart = dragState.origStartDate;
          let newEnd = dragState.origEndDate;

          if (dragState.edge === 'move') {
            // Move both dates by the same delta
            newStart = new Date(dragState.origStartDate.getTime() + daysDelta * DAY_MS);
            newEnd = new Date(dragState.origEndDate.getTime() + daysDelta * DAY_MS);
          } else if (dragState.edge === 'left') {
            newStart = new Date(dragState.origStartDate.getTime() + daysDelta * DAY_MS);
            if (newStart >= newEnd) newStart = new Date(newEnd.getTime() - DAY_MS);
          } else {
            newEnd = new Date(dragState.origEndDate.getTime() + daysDelta * DAY_MS);
            if (newEnd <= newStart) newEnd = new Date(newStart.getTime() + DAY_MS);
          }

          updateTradeMutation.mutate({
            tradeId: dragState.tradeId,
            updates: {
              startDate: newStart.toISOString().split('T')[0],
              endDate: newEnd.toISOString().split('T')[0],
            },
          });
        }
      }
      setDragState(null);
      setDragOffset(0);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragState, dragOffset, dayWidth, updateTradeMutation]);

  // Calculate bar positions for each trade
  const tradeBars = useMemo(() => {
    return trades.map((trade: any) => {
      const tradeStart = trade.startDate
        ? startOfDay(new Date(trade.startDate))
        : timelineStart;
      const tradeEnd = trade.endDate
        ? startOfDay(new Date(trade.endDate))
        : new Date(tradeStart.getTime() + 14 * DAY_MS);

      let effectiveStart = tradeStart;
      let effectiveEnd = tradeEnd;

      // Apply drag offsets
      if (dragState && dragState.tradeId === trade.id && dragOffset !== 0) {
        const daysDelta = Math.round(dragOffset / dayWidth);
        if (dragState.edge === 'move') {
          effectiveStart = new Date(tradeStart.getTime() + daysDelta * DAY_MS);
          effectiveEnd = new Date(tradeEnd.getTime() + daysDelta * DAY_MS);
        } else if (dragState.edge === 'left') {
          effectiveStart = new Date(tradeStart.getTime() + daysDelta * DAY_MS);
          if (effectiveStart >= effectiveEnd) effectiveStart = new Date(effectiveEnd.getTime() - DAY_MS);
        } else {
          effectiveEnd = new Date(tradeEnd.getTime() + daysDelta * DAY_MS);
          if (effectiveEnd <= effectiveStart) effectiveEnd = new Date(effectiveStart.getTime() + DAY_MS);
        }
      }

      const offsetPx = Math.round(
        ((effectiveStart.getTime() - timelineStart.getTime()) / DAY_MS) * dayWidth
      );
      const widthPx = Math.max(
        Math.round(((effectiveEnd.getTime() - effectiveStart.getTime()) / DAY_MS) * dayWidth),
        dayWidth
      );

      const tasksDone = trade.tasks?.filter((tk: any) => tk.done).length || 0;
      const tasksTotal = trade.tasks?.length || 0;

      return {
        trade,
        offsetPx,
        widthPx,
        effectiveStart,
        effectiveEnd,
        hasDates: !!(trade.startDate && trade.endDate),
        tasksDone,
        tasksTotal,
      };
    });
  }, [trades, timelineStart, dayWidth, dragState, dragOffset]);

  const timelineWidth = totalDays * dayWidth;

  // If no project dates and no trade dates, show setup message
  if (!hasProjectDates && noDatesSet && !showSuggestions) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Set project dates to enable timeline</h3>
        <p className="text-sm text-gray-500 mb-4">
          Add a start date and target end date to your project, or use a timeline template to get started quickly.
        </p>
        <button
          onClick={() => setShowSuggestions(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Use a Timeline Template
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Suggestions panel */}
      {showSuggestions && (
        <TimelineSuggestions
          projectId={projectId}
          projectName={project.name}
          trades={trades}
          projectStartDate={project.startDate || null}
          onApply={() => setShowSuggestions(false)}
          onClose={() => setShowSuggestions(false)}
        />
      )}

      {/* Timeline header controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-brand-500" />
            Suggest Timeline
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-400 w-12 text-center">
            {dayWidth <= 24 ? 'Month' : dayWidth <= 48 ? 'Week' : 'Day'}
          </span>
          <button
            onClick={zoomIn}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timeline grid */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex">
          {/* Left labels column */}
          <div
            className="flex-shrink-0 border-r border-gray-200 bg-gray-50/50"
            style={{ width: LABEL_WIDTH }}
          >
            {/* Header spacer */}
            <div
              className="border-b border-gray-200 px-4 flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wide"
              style={{ height: HEADER_HEIGHT }}
            >
              Trade
            </div>

            {/* Trade labels */}
            {tradeBars.map(({ trade, tasksDone, tasksTotal }) => {
              const status = trade.status || 'not_started';
              const StatusIcon = STATUS_ICONS[status] || Circle;
              const colors = STATUS_COLORS[status] || STATUS_COLORS.not_started;

              return (
                <div
                  key={trade.id}
                  className="border-b border-gray-100 px-4 flex flex-col justify-center"
                  style={{ height: ROW_HEIGHT }}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${TRADE_ACCENT[trade.trade] || 'bg-gray-400'}`} />
                    <span className="text-sm font-medium text-gray-900 truncate">{trade.trade}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 ml-4">
                    <StatusIcon className={`w-3 h-3 flex-shrink-0 ${colors.text}`} />
                    <span className={`text-xs ${colors.text}`}>
                      {tasksTotal > 0 ? `${tasksDone}/${tasksTotal}` : 'No tasks'}
                    </span>
                    {trade.budget != null && (
                      <span className="text-xs text-gray-400">{formatCurrency(trade.budget)}</span>
                    )}
                  </div>
                  {trade.assignedSub && (
                    <div className="flex items-center gap-1 mt-0.5 ml-4">
                      <User className="w-3 h-3 text-gray-400" />
                      <span className="text-[11px] text-gray-500 truncate">
                        {trade.assignedSub.businessName || trade.assignedSub.name || 'Sub assigned'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {trades.length === 0 && (
              <div className="px-4 py-6 text-sm text-gray-400 text-center">No trades added yet</div>
            )}
          </div>

          {/* Right scrollable timeline */}
          <div ref={scrollRef} className="flex-1 overflow-x-auto">
            <div style={{ width: timelineWidth, minWidth: '100%' }}>
              {/* Week header row */}
              <div
                className="relative border-b border-gray-200 bg-gray-50/30"
                style={{ height: HEADER_HEIGHT }}
              >
                {weekMarkers.map((marker, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full flex items-end pb-2"
                    style={{ left: marker.offsetPx }}
                  >
                    <span
                      className={`text-[11px] whitespace-nowrap pl-1.5 ${
                        marker.isMonth ? 'font-semibold text-gray-700' : 'text-gray-400'
                      }`}
                    >
                      {marker.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Trade rows */}
              {tradeBars.map(({ trade, offsetPx, widthPx, effectiveStart, effectiveEnd, hasDates }) => {
                const status = trade.status || 'not_started';
                const colors = STATUS_COLORS[status] || STATUS_COLORS.not_started;
                const isDragging = dragState?.tradeId === trade.id;
                const isHovered = hoveredTrade === trade.id;
                const tradeStartDate = trade.startDate ? startOfDay(new Date(trade.startDate)) : timelineStart;
                const tradeEndDate = trade.endDate
                  ? startOfDay(new Date(trade.endDate))
                  : new Date(tradeStartDate.getTime() + 14 * DAY_MS);

                return (
                  <div
                    key={trade.id}
                    className="relative border-b border-gray-100"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {/* Vertical grid lines for weeks */}
                    {weekMarkers.map((marker, i) => (
                      <div
                        key={i}
                        className="absolute top-0 h-full border-l border-gray-100"
                        style={{ left: marker.offsetPx }}
                      />
                    ))}

                    {/* Trade bar */}
                    <div
                      className={`absolute top-3 rounded-lg transition-all duration-100 ${
                        isDragging
                          ? 'shadow-lg ring-2 ring-brand-400 z-20 scale-[1.02]'
                          : isHovered
                          ? 'shadow-md ring-1 ring-gray-300 z-10'
                          : 'shadow-sm'
                      } ${hasDates ? '' : 'opacity-40 border border-dashed border-gray-400'}`}
                      style={{
                        left: offsetPx,
                        width: widthPx,
                        height: ROW_HEIGHT - 24,
                      }}
                      onMouseEnter={() => setHoveredTrade(trade.id)}
                      onMouseLeave={() => setHoveredTrade(null)}
                    >
                      {/* Bar fill */}
                      <div
                        className={`absolute inset-0 rounded-lg ${colors.bar} ${colors.barHover} transition-colors`}
                        style={{ opacity: hasDates ? 0.9 : 0.3 }}
                      />

                      {/* Bar content — draggable (move) */}
                      <div
                        className="relative z-10 h-full flex items-center px-3 text-white cursor-grab active:cursor-grabbing select-none"
                        onMouseDown={(e) => handleDragStart(e, trade.id, 'move', tradeStartDate, tradeEndDate)}
                      >
                        {/* Grip indicator */}
                        {(isHovered || isDragging) && widthPx > 50 && (
                          <GripVertical className="w-3 h-3 text-white/50 flex-shrink-0 mr-1" />
                        )}
                        {widthPx > 100 && (
                          <span className="text-xs font-medium truncate drop-shadow-sm">
                            {trade.trade}
                            {trade.assignedSub
                              ? ` - ${trade.assignedSub.businessName || trade.assignedSub.name || ''}`
                              : ''}
                          </span>
                        )}
                        {!hasDates && widthPx > 60 && (
                          <span className="text-[10px] text-gray-600 ml-auto">No dates</span>
                        )}
                      </div>

                      {/* Date tooltip on hover */}
                      {(isHovered || isDragging) && hasDates && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-medium px-2 py-1 rounded-md whitespace-nowrap z-30 pointer-events-none shadow-lg">
                          {formatShortDate(effectiveStart)} — {formatShortDate(effectiveEnd)}
                          {isDragging && dragState?.edge === 'move' && (
                            <span className="text-brand-300 ml-1">
                              ({Math.round(dragOffset / dayWidth) > 0 ? '+' : ''}{Math.round(dragOffset / dayWidth)}d)
                            </span>
                          )}
                        </div>
                      )}

                      {/* Left resize handle */}
                      <div
                        className="absolute -left-1 top-0 w-3 h-full cursor-col-resize z-20 group"
                        onMouseDown={(e) => handleDragStart(e, trade.id, 'left', tradeStartDate, tradeEndDate)}
                      >
                        <div className={`absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-full transition-all ${
                          isDragging && dragState?.edge === 'left'
                            ? 'bg-white scale-110'
                            : isHovered
                            ? 'bg-white/70'
                            : 'bg-white/0 group-hover:bg-white/70'
                        }`} />
                      </div>

                      {/* Right resize handle */}
                      <div
                        className="absolute -right-1 top-0 w-3 h-full cursor-col-resize z-20 group"
                        onMouseDown={(e) => handleDragStart(e, trade.id, 'right', tradeStartDate, tradeEndDate)}
                      >
                        <div className={`absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-full transition-all ${
                          isDragging && dragState?.edge === 'right'
                            ? 'bg-white scale-110'
                            : isHovered
                            ? 'bg-white/70'
                            : 'bg-white/0 group-hover:bg-white/70'
                        }`} />
                      </div>
                    </div>

                    {/* Today line */}
                    {todayOffset !== null && (
                      <div
                        className="absolute top-0 h-full border-l-2 border-dashed border-red-400 z-10 pointer-events-none"
                        style={{ left: todayOffset }}
                      />
                    )}
                  </div>
                );
              })}

              {trades.length === 0 && (
                <div className="flex items-center justify-center h-32 text-sm text-gray-400">
                  Add trades to see them on the timeline
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-sm bg-gray-300" />
          Not Started
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-sm bg-blue-500" />
          In Progress
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-sm bg-green-500" />
          Completed
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-sm bg-red-500" />
          Blocked
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0 border-t-2 border-dashed border-red-400" />
          Today
        </div>
        <div className="flex items-center gap-1.5 ml-auto text-gray-400">
          Drag edges to resize &middot; Grab bar to move
        </div>
      </div>
    </div>
  );
}
