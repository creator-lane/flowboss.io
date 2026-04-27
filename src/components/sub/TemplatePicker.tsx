/**
 * Template Picker — pulls the mobile-app project-template UX onto the web
 * sub view. A tradesperson assigned to a GC's project hits "Use a starter
 * template", picks (e.g.) "Bathroom Remodel", and gets the full phase /
 * task / materials checklist prepopulated, with the ability to toggle off
 * anything they don't need before applying.
 *
 * The template library and trade mapping come from src/lib/projectTemplates
 * (verbatim copy of apps/mobile/lib/projectTemplates) and src/lib/tradeConfig.
 * This component is the web-side equivalent of the mobile create.tsx
 * template/review steps, restructured for a Modal + slide-in flow.
 *
 * Free for invited subs by design — there's no paywall in this surface.
 * The whole pitch of the sub experience is "use the product to run your
 * job, scoped to this project, free." Templates are the most valuable
 * piece of that pitch.
 */

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  ClipboardList,
  Clock,
  DollarSign,
  Hammer,
  Layers,
  Package,
  Search,
  Sparkles,
  Square,
  X,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { api } from '../../lib/api';
import {
  PROJECT_TEMPLATES,
  type ProjectTemplate,
  getTemplatesForTrade,
} from '../../lib/projectTemplates';
import { normalizeTradeLabel } from '../../lib/tradeConfig';

interface TemplatePickerProps {
  open: boolean;
  onClose: () => void;
  tradeId: string;
  tradeLabel: string; // e.g. "Plumbing" — what the GC put on the trade row
  projectId: string;
}

// Local copy of the row-level state the picker keeps. We don't mutate the
// source PROJECT_TEMPLATES — picking just toggles flags on a per-render
// snapshot that gets consumed when "Apply" is hit.
type SelectableTask = { name: string; phaseName: string; selected: boolean };
type SelectableMaterial = { name: string; cost: number; category: string; selected: boolean };

export function TemplatePicker({ open, onClose, tradeId, tradeLabel, projectId }: TemplatePickerProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const tradeKey = useMemo(() => normalizeTradeLabel(tradeLabel), [tradeLabel]);
  const allTemplates = useMemo<ProjectTemplate[]>(() => {
    if (!tradeKey) return [];
    return getTemplatesForTrade(tradeKey);
  }, [tradeKey]);

  const [step, setStep] = useState<'pick' | 'review' | 'done'>('pick');
  const [search, setSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [tasks, setTasks] = useState<SelectableTask[]>([]);
  const [materials, setMaterials] = useState<SelectableMaterial[]>([]);

  // When the user picks a template, flatten its phases into a single
  // selectable list (phase name kept on each row so we can group + prepend
  // when applying). All non-optional rows start checked; optional rows
  // start unchecked so the sub explicitly opts in to extras.
  function chooseTemplate(t: ProjectTemplate) {
    const flatTasks: SelectableTask[] = t.phases.flatMap((phase) =>
      phase.tasks.map((task) => ({
        name: task.name,
        phaseName: phase.name,
        selected: !task.optional,
      })),
    );
    const flatMaterials: SelectableMaterial[] = t.phases.flatMap((phase) =>
      phase.materials.map((m) => ({
        name: m.name,
        cost: m.estimatedCost,
        category: m.category,
        selected: !m.optional,
      })),
    );
    setSelectedTemplate(t);
    setTasks(flatTasks);
    setMaterials(flatMaterials);
    setStep('review');
  }

  function backToList() {
    setSelectedTemplate(null);
    setTasks([]);
    setMaterials([]);
    setStep('pick');
  }

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allTemplates;
    return allTemplates.filter((t) =>
      t.name.toLowerCase().includes(q)
      || t.description.toLowerCase().includes(q)
      || t.category.toLowerCase().includes(q),
    );
  }, [allTemplates, search]);

  const selectedTaskCount = tasks.filter((t) => t.selected).length;
  const selectedMaterialCount = materials.filter((m) => m.selected).length;
  const selectedMaterialCost = materials
    .filter((m) => m.selected)
    .reduce((sum, m) => sum + (m.cost || 0), 0);

  const apply = useMutation({
    mutationFn: () => {
      if (!selectedTemplate) throw new Error('No template chosen');
      return api.applyTemplateToTrade(tradeId, {
        tasks: tasks.filter((t) => t.selected).map((t) => ({ name: t.name, phaseName: t.phaseName })),
        materials: materials.filter((m) => m.selected).map((m) => ({ name: m.name, cost: m.cost, category: m.category })),
        templateName: selectedTemplate.name,
      });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] });
      addToast(
        `Loaded ${selectedTemplate?.name}: ${res?.tasksInserted ?? 0} tasks${res?.materialsInserted ? `, ${res.materialsInserted} materials` : ''}`,
        'success',
      );
      setStep('done');
      // Close after a short success beat so the toast registers.
      setTimeout(() => {
        handleClose();
      }, 1200);
    },
    onError: (err: any) => addToast(err?.message || 'Failed to apply template', 'error'),
  });

  function handleClose() {
    setStep('pick');
    setSelectedTemplate(null);
    setSearch('');
    setTasks([]);
    setMaterials([]);
    onClose();
  }

  // ── No-templates-for-this-trade state ──────────────────────────────────
  if (!tradeKey) {
    return (
      <Modal open={open} onClose={handleClose} title="Starter templates" size="sm">
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 dark:bg-white/5">
            <Hammer className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">No templates yet for {tradeLabel}</p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed dark:text-gray-400 max-w-xs mx-auto">
            We're rolling templates out trade by trade. Plumbing, HVAC, and Electrical are live. Yours is coming &mdash; in the meantime, build your plan inline.
          </p>
        </div>
      </Modal>
    );
  }

  // ── Template list ──────────────────────────────────────────────────────
  if (step === 'pick') {
    return (
      <Modal open={open} onClose={handleClose} title={`${tradeLabel} starter templates`} size="lg">
        <p className="text-sm text-gray-500 mb-4 leading-relaxed dark:text-gray-400">
          Pick a job type and we'll prefill the phases, tasks, and a materials list. Toggle off anything you don't need before applying.
        </p>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bathroom remodel, water heater, repipe…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>

        {filteredTemplates.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8 dark:text-gray-500">No templates match &ldquo;{search}&rdquo;.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2.5">
            {filteredTemplates.map((t) => (
              <button
                key={t.id}
                onClick={() => chooseTemplate(t)}
                className="text-left p-4 border border-gray-200 rounded-xl hover:border-brand-300 hover:bg-brand-50/40 transition-all group dark:border-white/10 dark:hover:border-blue-400/40 dark:hover:bg-blue-500/5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-100 transition-colors dark:bg-blue-500/10">
                    <Sparkles className="w-4 h-4 text-brand-600 dark:text-blue-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 truncate dark:text-white">{t.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mt-0.5 dark:text-gray-400">{t.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3" /> {t.phases.length} phases
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> ~{t.estimatedDays}d
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> ${(t.estimatedBudgetLow / 1000).toFixed(0)}k&ndash;${(t.estimatedBudgetHigh / 1000).toFixed(0)}k
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </Modal>
    );
  }

  // ── Done state (brief celebratory beat before auto-close) ──────────────
  if (step === 'done') {
    return (
      <Modal open={open} onClose={handleClose} title="" size="sm">
        <div className="text-center py-8">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3 dark:bg-green-500/20">
            <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-300" />
          </div>
          <p className="text-base font-semibold text-gray-900 dark:text-white">Plan loaded</p>
          <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
            {selectedTaskCount} tasks{selectedMaterialCount > 0 ? `, ${selectedMaterialCount} materials` : ''} added to your work plan.
          </p>
        </div>
      </Modal>
    );
  }

  // ── Review / customize ─────────────────────────────────────────────────
  if (!selectedTemplate) return null;

  const phaseGroups: { phaseName: string; tasks: { idx: number; row: SelectableTask }[] }[] = [];
  tasks.forEach((row, idx) => {
    const last = phaseGroups[phaseGroups.length - 1];
    if (last && last.phaseName === row.phaseName) last.tasks.push({ idx, row });
    else phaseGroups.push({ phaseName: row.phaseName, tasks: [{ idx, row }] });
  });

  return (
    <Modal open={open} onClose={handleClose} title={selectedTemplate.name} size="lg">
      <button
        onClick={backToList}
        className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 mb-3 transition-colors dark:text-blue-300"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Pick a different template
      </button>

      <p className="text-sm text-gray-500 mb-4 leading-relaxed dark:text-gray-400">
        {selectedTemplate.description}
      </p>

      {/* Tasks by phase */}
      <div className="border border-gray-200 rounded-xl overflow-hidden mb-5 dark:border-white/10">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between dark:bg-white/5 dark:border-white/10">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Tasks</h3>
          </div>
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            {selectedTaskCount}/{tasks.length} selected
          </span>
        </div>
        <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-white/10">
          {phaseGroups.map((group) => (
            <div key={group.phaseName}>
              <div className="px-4 py-2 bg-gray-50/50 text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:bg-white/[0.02] dark:text-gray-400">
                {group.phaseName}
              </div>
              {group.tasks.map(({ idx, row }) => (
                <label
                  key={idx}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors dark:hover:bg-white/5"
                >
                  <button
                    type="button"
                    onClick={() => setTasks((prev) => prev.map((t, i) => i === idx ? { ...t, selected: !t.selected } : t))}
                    className="flex-shrink-0"
                  >
                    {row.selected ? (
                      <CheckSquare className="w-4 h-4 text-brand-600 dark:text-blue-300" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-300 hover:text-gray-500" />
                    )}
                  </button>
                  <span className={`text-sm ${row.selected ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                    {row.name}
                  </span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Materials */}
      {materials.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-5 dark:border-white/10">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between dark:bg-white/5 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Materials</h3>
            </div>
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
              {selectedMaterialCount}/{materials.length} &middot; ~${selectedMaterialCost.toLocaleString()}
            </span>
          </div>
          <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-white/10">
            {materials.map((m, idx) => (
              <label
                key={idx}
                className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors dark:hover:bg-white/5"
              >
                <button
                  type="button"
                  onClick={() => setMaterials((prev) => prev.map((mm, i) => i === idx ? { ...mm, selected: !mm.selected } : mm))}
                  className="flex-shrink-0"
                >
                  {m.selected ? (
                    <CheckSquare className="w-4 h-4 text-brand-600 dark:text-blue-300" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-300 hover:text-gray-500" />
                  )}
                </button>
                <span className={`flex-1 text-sm truncate ${m.selected ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                  {m.name}
                </span>
                <span className={`text-xs font-medium flex-shrink-0 ${m.selected ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
                  ${m.cost.toLocaleString()}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Apply */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-white/10">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {selectedTaskCount} tasks{selectedMaterialCount > 0 ? `, ${selectedMaterialCount} materials` : ''} will be added to your plan.
        </div>
        <button
          onClick={() => apply.mutate()}
          disabled={apply.isPending || selectedTaskCount === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {apply.isPending ? (
            <>Loading…</>
          ) : (
            <>
              Apply to my plan
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}

// Re-export the lightweight Modal close icon so consumers don't need to
// pull lucide-react themselves when they want to render their own header.
export { X };
