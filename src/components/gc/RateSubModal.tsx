import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { api } from '../../lib/api';
import { useToast } from '../ui/Toast';

interface RateSubModalProps {
  open: boolean;
  onClose: () => void;
  tradeId: string;
  projectId: string;
  subName: string;
  subUserId?: string;
  tradeName: string;
}

const CATEGORIES = [
  { key: 'quality', label: 'Quality of Work' },
  { key: 'timeliness', label: 'Timeliness' },
  { key: 'communication', label: 'Communication' },
  { key: 'budgetAdherence', label: 'Budget Adherence' },
] as const;

function StarRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            className="p-0.5 transition-colors"
          >
            <Star
              className={`w-5 h-5 ${
                star <= (hover || value)
                  ? 'fill-current text-amber-400'
                  : 'text-gray-300 hover:text-amber-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function RateSubModal({
  open,
  onClose,
  tradeId,
  projectId,
  subName,
  subUserId,
  tradeName,
}: RateSubModalProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [ratings, setRatings] = useState<Record<string, number>>({
    quality: 0,
    timeliness: 0,
    communication: 0,
    budgetAdherence: 0,
  });
  const [notes, setNotes] = useState('');

  const overall = useMemo(() => {
    const q = ratings.quality;
    const t = ratings.timeliness;
    const b = ratings.budgetAdherence;
    const c = ratings.communication;
    if (!q || !t || !b || !c) return 0;
    return Math.round(((q * 0.35) + (t * 0.25) + (b * 0.25) + (c * 0.15)) * 10) / 10;
  }, [ratings]);

  const allRated = ratings.quality > 0 && ratings.timeliness > 0 && ratings.communication > 0 && ratings.budgetAdherence > 0;

  const submitMutation = useMutation({
    mutationFn: () =>
      api.rateTradePerformance({
        tradeId,
        gcProjectId: projectId,
        subUserId,
        timeliness: ratings.timeliness,
        quality: ratings.quality,
        communication: ratings.communication,
        budgetAdherence: ratings.budgetAdherence,
        overall: Math.round(overall),
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trade-rating'] });
      queryClient.invalidateQueries({ queryKey: ['gc-sub-directory'] });
      queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] });
      addToast('Rating submitted', 'success');
      onClose();
    },
    onError: (err: any) => addToast(err.message || 'Failed to submit rating', 'error'),
  });

  const scoreColor = overall >= 4 ? 'text-green-600' : overall >= 3 ? 'text-amber-500' : overall > 0 ? 'text-red-500' : 'text-gray-300';

  return (
    <Modal open={open} onClose={onClose} title={`Rate ${subName}`} size="sm">
      <div className="space-y-5">
        {/* Trade badge */}
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300">
          {tradeName}
        </span>

        {/* Star ratings */}
        <div className="space-y-3">
          {CATEGORIES.map((cat) => (
            <StarRow
              key={cat.key}
              label={cat.label}
              value={ratings[cat.key]}
              onChange={(v) => setRatings((prev) => ({ ...prev, [cat.key]: v }))}
            />
          ))}
        </div>

        {/* Overall score */}
        <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-white/10">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Overall Score</span>
          <span className={`text-2xl font-bold ${scoreColor}`}>
            {allRated ? overall.toFixed(1) : '--'}
          </span>
        </div>

        {/* Notes */}
        <textarea
          placeholder="Optional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400"
        />

        {/* Submit */}
        <button
          onClick={() => submitMutation.mutate()}
          disabled={!allRated || submitMutation.isPending}
          className="w-full px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors"
        >
          {submitMutation.isPending ? 'Submitting...' : 'Submit Rating'}
        </button>
      </div>
    </Modal>
  );
}
