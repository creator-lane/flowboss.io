import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { Sparkles, Check, X } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   Timeline Templates
   ═══════════════════════════════════════════════════════════════════════════ */

interface TradeTemplate {
  trade: string;
  offsetWeeks: number;
  durationWeeks: number;
}

interface TimelineTemplate {
  name: string;
  description: string;
  trades: TradeTemplate[];
}

const TIMELINE_TEMPLATES: Record<string, TimelineTemplate> = {
  kitchen_remodel: {
    name: 'Kitchen Remodel',
    description: '6-8 week kitchen renovation',
    trades: [
      { trade: 'Framing', offsetWeeks: 0, durationWeeks: 1 },
      { trade: 'Plumbing', offsetWeeks: 1, durationWeeks: 2 },
      { trade: 'Electrical', offsetWeeks: 1, durationWeeks: 2 },
      { trade: 'HVAC', offsetWeeks: 2, durationWeeks: 1 },
      { trade: 'Drywall', offsetWeeks: 3, durationWeeks: 1 },
      { trade: 'Painting', offsetWeeks: 4, durationWeeks: 1 },
      { trade: 'Flooring', offsetWeeks: 5, durationWeeks: 1 },
    ],
  },
  bathroom_remodel: {
    name: 'Bathroom Remodel',
    description: '4-6 week bathroom renovation',
    trades: [
      { trade: 'Framing', offsetWeeks: 0, durationWeeks: 1 },
      { trade: 'Plumbing', offsetWeeks: 1, durationWeeks: 2 },
      { trade: 'Electrical', offsetWeeks: 1, durationWeeks: 1 },
      { trade: 'Drywall', offsetWeeks: 3, durationWeeks: 1 },
      { trade: 'Painting', offsetWeeks: 4, durationWeeks: 1 },
      { trade: 'Flooring', offsetWeeks: 4, durationWeeks: 1 },
    ],
  },
  new_construction: {
    name: 'New Construction',
    description: '16-24 week residential build',
    trades: [
      { trade: 'Concrete', offsetWeeks: 0, durationWeeks: 2 },
      { trade: 'Framing', offsetWeeks: 2, durationWeeks: 4 },
      { trade: 'Roofing', offsetWeeks: 6, durationWeeks: 2 },
      { trade: 'Plumbing', offsetWeeks: 6, durationWeeks: 3 },
      { trade: 'Electrical', offsetWeeks: 6, durationWeeks: 3 },
      { trade: 'HVAC', offsetWeeks: 7, durationWeeks: 3 },
      { trade: 'Drywall', offsetWeeks: 10, durationWeeks: 2 },
      { trade: 'Painting', offsetWeeks: 12, durationWeeks: 2 },
      { trade: 'Flooring', offsetWeeks: 12, durationWeeks: 2 },
      { trade: 'Landscaping', offsetWeeks: 14, durationWeeks: 2 },
    ],
  },
  addition: {
    name: 'Room Addition',
    description: '10-14 week room addition',
    trades: [
      { trade: 'Concrete', offsetWeeks: 0, durationWeeks: 1 },
      { trade: 'Framing', offsetWeeks: 1, durationWeeks: 3 },
      { trade: 'Roofing', offsetWeeks: 4, durationWeeks: 1 },
      { trade: 'Plumbing', offsetWeeks: 4, durationWeeks: 2 },
      { trade: 'Electrical', offsetWeeks: 4, durationWeeks: 2 },
      { trade: 'HVAC', offsetWeeks: 5, durationWeeks: 2 },
      { trade: 'Drywall', offsetWeeks: 7, durationWeeks: 2 },
      { trade: 'Painting', offsetWeeks: 9, durationWeeks: 1 },
      { trade: 'Flooring', offsetWeeks: 9, durationWeeks: 1 },
    ],
  },
  hvac_replacement: {
    name: 'HVAC System Replacement',
    description: '1-2 week system swap',
    trades: [
      { trade: 'HVAC', offsetWeeks: 0, durationWeeks: 1 },
      { trade: 'Electrical', offsetWeeks: 0, durationWeeks: 1 },
      { trade: 'Drywall', offsetWeeks: 1, durationWeeks: 1 },
    ],
  },
  whole_house_repipe: {
    name: 'Whole House Repipe',
    description: '2-3 week repipe project',
    trades: [
      { trade: 'Plumbing', offsetWeeks: 0, durationWeeks: 2 },
      { trade: 'Drywall', offsetWeeks: 2, durationWeeks: 1 },
      { trade: 'Painting', offsetWeeks: 3, durationWeeks: 1 },
    ],
  },
  panel_upgrade: {
    name: 'Electrical Panel Upgrade',
    description: '1-2 week panel upgrade',
    trades: [
      { trade: 'Electrical', offsetWeeks: 0, durationWeeks: 2 },
      { trade: 'Drywall', offsetWeeks: 2, durationWeeks: 1 },
    ],
  },
};

const TRADE_BAR_COLORS: Record<string, string> = {
  Plumbing: 'bg-blue-400',
  Electrical: 'bg-yellow-400',
  HVAC: 'bg-cyan-400',
  Framing: 'bg-orange-400',
  Drywall: 'bg-stone-400',
  Painting: 'bg-purple-400',
  Roofing: 'bg-red-400',
  Concrete: 'bg-gray-400',
  Flooring: 'bg-amber-400',
  Landscaping: 'bg-green-400',
};

/* ═══════════════════════════════════════════════════════════════════════════
   Smart Suggestion Logic
   ═══════════════════════════════════════════════════════════════════════════ */

function getRecommendedTemplate(projectName: string): string | null {
  const name = projectName.toLowerCase();
  if (name.includes('kitchen')) return 'kitchen_remodel';
  if (name.includes('bathroom') || name.includes('bath')) return 'bathroom_remodel';
  if (name.includes('addition') || name.includes('room')) return 'addition';
  if (name.includes('new') && (name.includes('house') || name.includes('home') || name.includes('construction')))
    return 'new_construction';
  if (name.includes('repipe') || name.includes('pipe')) return 'whole_house_repipe';
  if (name.includes('panel') || name.includes('electrical')) return 'panel_upgrade';
  if (name.includes('hvac') || name.includes('ac ') || name.includes('furnace')) return 'hvac_replacement';
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Mini Timeline Preview
   ═══════════════════════════════════════════════════════════════════════════ */

function MiniTimeline({ template }: { template: TimelineTemplate }) {
  const maxWeek = Math.max(...template.trades.map((t) => t.offsetWeeks + t.durationWeeks));
  return (
    <div className="mt-3 space-y-1">
      {template.trades.map((t, i) => {
        const leftPct = (t.offsetWeeks / maxWeek) * 100;
        const widthPct = (t.durationWeeks / maxWeek) * 100;
        return (
          <div key={i} className="flex items-center gap-2 h-4">
            <span className="text-[10px] text-gray-500 w-16 truncate text-right">{t.trade}</span>
            <div className="flex-1 relative h-3 bg-gray-50 rounded-sm">
              <div
                className={`absolute top-0 h-full rounded-sm ${TRADE_BAR_COLORS[t.trade] || 'bg-brand-300'}`}
                style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 3)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TimelineSuggestions Component
   ═══════════════════════════════════════════════════════════════════════════ */

interface TimelineSuggestionsProps {
  projectId: string;
  projectName: string;
  trades: any[];
  projectStartDate: string | null;
  onApply: () => void;
  onClose: () => void;
}

export function TimelineSuggestions({
  projectId,
  projectName,
  trades,
  projectStartDate,
  onApply,
  onClose,
}: TimelineSuggestionsProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [applyingKey, setApplyingKey] = useState<string | null>(null);

  const recommended = useMemo(() => getRecommendedTemplate(projectName), [projectName]);

  const sortedKeys = useMemo(() => {
    const keys = Object.keys(TIMELINE_TEMPLATES);
    if (!recommended) return keys;
    return [recommended, ...keys.filter((k) => k !== recommended)];
  }, [recommended]);

  const applyMutation = useMutation({
    mutationFn: async (templateKey: string) => {
      const template = TIMELINE_TEMPLATES[templateKey];
      const startDate = projectStartDate ? new Date(projectStartDate) : new Date();

      for (const entry of template.trades) {
        const tradeStart = new Date(startDate.getTime() + entry.offsetWeeks * 7 * 24 * 60 * 60 * 1000);
        const tradeEnd = new Date(tradeStart.getTime() + entry.durationWeeks * 7 * 24 * 60 * 60 * 1000);

        const startStr = tradeStart.toISOString().split('T')[0];
        const endStr = tradeEnd.toISOString().split('T')[0];

        const existingTrade = trades.find(
          (t: any) => t.trade?.toLowerCase() === entry.trade.toLowerCase()
        );

        if (existingTrade) {
          await api.updateGCTrade(existingTrade.id, { startDate: startStr, endDate: endStr });
        } else {
          await api.addGCTrade(projectId, {
            trade: entry.trade,
            startDate: startStr,
            endDate: endStr,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['gc-projects'] });
      addToast('Timeline applied', 'success');
      setApplyingKey(null);
      onApply();
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to apply timeline', 'error');
      setApplyingKey(null);
    },
  });

  const handleApply = (key: string) => {
    setApplyingKey(key);
    applyMutation.mutate(key);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-500" />
          <h3 className="font-semibold text-gray-900">Timeline Suggestions</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {!projectStartDate && (
        <div className="mx-5 mt-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          No project start date set. Templates will use today as the start date.
        </div>
      )}

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[520px] overflow-y-auto">
        {sortedKeys.map((key) => {
          const template = TIMELINE_TEMPLATES[key];
          const isRecommended = key === recommended;
          const isApplying = applyingKey === key;

          return (
            <div
              key={key}
              className={`relative border rounded-xl p-4 transition-all hover:shadow-md ${
                isRecommended
                  ? 'border-brand-300 bg-brand-50/30 ring-1 ring-brand-200'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {isRecommended && (
                <div className="absolute -top-2.5 left-3 px-2 py-0.5 bg-brand-500 text-white text-[10px] font-semibold rounded-full uppercase tracking-wide">
                  Recommended
                </div>
              )}

              <div className="mt-1">
                <h4 className="font-semibold text-sm text-gray-900">{template.name}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
              </div>

              <MiniTimeline template={template} />

              <button
                onClick={() => handleApply(key)}
                disabled={applyMutation.isPending}
                className={`mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  isRecommended
                    ? 'bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-60'
                }`}
              >
                {isApplying ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Apply Template
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
