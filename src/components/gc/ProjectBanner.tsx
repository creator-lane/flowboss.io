import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, AlertTriangle, AlertCircle, Plus } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../ui/Toast';

// Extracted from GCProjectDetailPage as part of the carve-out audit item.
// This component lets a GC broadcast a single active announcement to all subs
// on a project. Supports three severity levels (info / warning / urgent), an
// inline editor, and a subtle "+ Set Project Banner" affordance when none is
// active. Writes are persisted via api.updateGCProject and invalidate the
// `gc-project` query so the rest of the page re-renders with the new banner.

const BANNER_TYPE_CONFIG: Record<
  string,
  { bg: string; borderColor: string; textColor: string; Icon: typeof Megaphone }
> = {
  info:    { bg: 'bg-blue-50',  borderColor: 'border-blue-600',  textColor: 'text-blue-600',  Icon: Megaphone },
  warning: { bg: 'bg-amber-50', borderColor: 'border-amber-500', textColor: 'text-amber-500', Icon: AlertTriangle },
  urgent:  { bg: 'bg-red-50',   borderColor: 'border-red-500',   textColor: 'text-red-500',   Icon: AlertCircle },
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ProjectBanner({
  projectId,
  project,
}: {
  projectId: string;
  project: any;
}) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [bannerText, setBannerText] = useState('');
  const [bannerType, setBannerType] = useState<string>('info');

  const bannerMessage: string | null = project?.bannerMessage ?? null;
  const currentType: string = project?.bannerType ?? 'info';
  const bannerUpdatedAt: string | null = project?.bannerUpdatedAt ?? null;

  const cfg = BANNER_TYPE_CONFIG[currentType] || BANNER_TYPE_CONFIG.info;

  const saveBanner = useMutation({
    mutationFn: (payload: { bannerMessage: string | null; bannerType: string; bannerUpdatedAt: string }) =>
      api.updateGCProject(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] });
      setIsEditing(false);
      setBannerText('');
      addToast('Banner updated — all subs will see this', 'success');
    },
    onError: (err: any) => addToast(err.message || 'Failed to update banner', 'error'),
  });

  const handleSave = () => {
    if (!bannerText.trim()) return;
    saveBanner.mutate({ bannerMessage: bannerText.trim(), bannerType, bannerUpdatedAt: new Date().toISOString() });
  };

  const handleClear = () => {
    saveBanner.mutate({ bannerMessage: null, bannerType: 'info', bannerUpdatedAt: new Date().toISOString() });
  };

  // --- Active banner display ---
  if (!isEditing && bannerMessage) {
    const TypeIcon = cfg.Icon;
    return (
      <div className="mb-5">
        <div className={`${cfg.bg} border-l-4 ${cfg.borderColor} rounded-r-xl px-4 py-3`}>
          <div className="flex items-start gap-3">
            <TypeIcon className={`w-5 h-5 ${cfg.textColor} flex-shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${cfg.textColor}`}>{bannerMessage}</p>
              {bannerUpdatedAt && (
                <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">{formatTime(bannerUpdatedAt)}</p>
              )}
            </div>
            <button
              onClick={() => { setIsEditing(true); setBannerText(bannerMessage); setBannerType(currentType); }}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium flex-shrink-0 px-2 py-1 rounded hover:bg-white/50 transition-colors dark:text-gray-400 dark:hover:text-gray-200"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Inline editor ---
  if (isEditing) {
    return (
      <div className="mb-5">
        <div className="bg-white rounded-xl border border-gray-200 p-4 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Set Project Banner</h3>
            <span className="text-xs text-gray-400 dark:text-gray-500">All subs will see this</span>
          </div>

          {/* Type selector */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(Object.keys(BANNER_TYPE_CONFIG) as string[]).map((key) => {
              const t = BANNER_TYPE_CONFIG[key];
              const TypeIcon = t.Icon;
              return (
                <button
                  key={key}
                  onClick={() => setBannerType(key)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                    bannerType === key
                      ? `${t.bg} border ${t.borderColor} ${t.textColor}`
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <TypeIcon className="w-3.5 h-3.5" />
                  {key}
                </button>
              );
            })}
          </div>

          {/* Message input */}
          <textarea
            placeholder="e.g. Concrete pour Friday — site closed until 2pm"
            value={bannerText}
            onChange={(e) => setBannerText(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none mb-3 dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400"
            autoFocus
          />

          <div className="flex items-center justify-end gap-2">
            {bannerMessage && (
              <button
                onClick={handleClear}
                disabled={saveBanner.isPending}
                className="px-3 py-1.5 text-sm text-red-500 hover:text-red-700 transition-colors"
              >
                Clear Banner
              </button>
            )}
            <button
              onClick={() => { setIsEditing(false); setBannerText(''); }}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!bannerText.trim() || saveBanner.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-60"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- No banner set — subtle "+ Set Project Banner" button ---
  return (
    <div className="mb-5">
      <button
        onClick={() => setIsEditing(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/10"
      >
        <Plus className="w-3.5 h-3.5" />
        Set Project Banner
      </button>
    </div>
  );
}
