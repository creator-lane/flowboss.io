import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../ui/Toast';

// Extracted from GCProjectDetailPage as part of the carve-out audit item.
// Modal for editing top-level GC project fields (name, customer, address,
// dates, status, budget breakdown). Writes via api.updateGCProject and
// invalidates both the single-project and list queries.
//
// STATUS_LABELS and PROJECT_STATUSES are duplicated locally (kept
// intentionally minimal — the page's STATUS_CONFIG has visual styling the
// modal doesn't need). If the status list grows or styling needs to sync,
// promote these to a shared `src/components/gc/projectConstants.ts`.

const PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'completed'] as const;

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
};

export function EditGCProjectModal({
  project,
  projectId,
  onClose,
}: {
  project: any;
  projectId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: project.name || '',
    customerName: project.customerName || project.customer_name || '',
    address: project.address || '',
    city: project.city || '',
    state: project.state || '',
    zip: project.zip || '',
    startDate: project.startDate || project.start_date || '',
    targetEndDate: project.targetEndDate || project.target_end_date || '',
    status: project.status || 'planning',
    budget: project.budget || '',
    overheadPercent: project.overheadPercent || project.overhead_percent || '',
    profitPercent: project.profitPercent || project.profit_percent || '',
  });

  const updateProject = useMutation({
    mutationFn: (updates: any) => api.updateGCProject(projectId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['gc-projects'] });
      addToast('Project updated', 'success');
      onClose();
    },
    onError: (err: any) => addToast(err.message || 'Failed to update project', 'error'),
  });

  const handleSave = () => {
    updateProject.mutate({
      name: form.name,
      customerName: form.customerName,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      startDate: form.startDate || null,
      targetEndDate: form.targetEndDate || null,
      status: form.status,
      budget: form.budget ? parseFloat(String(form.budget)) : null,
      overheadPercent: form.overheadPercent ? parseFloat(String(form.overheadPercent)) : null,
      profitPercent: form.profitPercent ? parseFloat(String(form.profitPercent)) : null,
    });
  };

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto dark:bg-white/5 dark:backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Project</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors dark:hover:bg-white/10 dark:text-gray-500 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Project Name */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block dark:text-gray-300">Project Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              />
            </div>

            {/* Customer */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block dark:text-gray-300">Customer Name</label>
              <input
                type="text"
                value={form.customerName}
                onChange={(e) => set('customerName', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              />
            </div>

            {/* Address */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block dark:text-gray-300">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              />
            </div>

            {/* City / State / Zip */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block dark:text-gray-300">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block dark:text-gray-300">State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => set('state', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block dark:text-gray-300">Zip</label>
                <input
                  type="text"
                  value={form.zip}
                  onChange={(e) => set('zip', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block dark:text-gray-300">Start Date</label>
                <input
                  type="date"
                  value={form.startDate ? form.startDate.slice(0, 10) : ''}
                  onChange={(e) => set('startDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block dark:text-gray-300">Target End Date</label>
                <input
                  type="date"
                  value={form.targetEndDate ? form.targetEndDate.slice(0, 10) : ''}
                  onChange={(e) => set('targetEndDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block dark:text-gray-300">Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:bg-white/5 dark:backdrop-blur-sm"
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
                ))}
              </select>
            </div>

            {/* Budget / Overhead / Profit */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block dark:text-gray-300">Budget ($)</label>
                <input
                  type="number"
                  value={form.budget}
                  onChange={(e) => set('budget', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block dark:text-gray-300">Overhead %</label>
                <input
                  type="number"
                  value={form.overheadPercent}
                  onChange={(e) => set('overheadPercent', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block dark:text-gray-300">Profit %</label>
                <input
                  type="number"
                  value={form.profitPercent}
                  onChange={(e) => set('profitPercent', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 p-5 border-t border-gray-100 dark:border-white/10">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:text-gray-300 dark:bg-white/10 dark:hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!form.name.trim() || updateProject.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-60"
            >
              {updateProject.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
