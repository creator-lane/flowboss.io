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

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  ClipboardList,
  DollarSign,
  Hammer,
  List,
  Loader2,
  Package,
  Search,
  Sparkles,
  Square,
  X,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { api } from '../../lib/api';
import { normalizeTradeLabel } from '../../lib/tradeConfig';

// Lightweight, surface-local types — match the camelCased shape the API
// returns. We don't import from src/lib/projectTemplates anymore; that
// file is the engineer-facing authoring format that gets synced into
// Supabase via scripts/seed-template-library.ts.
type TemplateListRow = {
  id: string;
  name: string;
  icon: string;
  category: string;
  trade: string;
  description: string;
  estimatedDays: number;
  estimatedBudgetLow: number;
  estimatedBudgetHigh: number;
};

type TemplatePhaseDetail = {
  id: string;
  name: string;
  sortOrder: number;
  estimatedDays: number;
  description: string;
  inspectionRequired?: string | null;
  tasks: { id: string; name: string; sortOrder: number; optional: boolean }[];
  materials: { id: string; name: string; estimatedCost: number; category: string; optional: boolean; sortOrder: number }[];
};

type TemplateDetail = TemplateListRow & {
  phases: TemplatePhaseDetail[];
};

interface TemplatePickerProps {
  open: boolean;
  onClose: () => void;
  tradeId: string;
  tradeLabel: string; // e.g. "Plumbing" — what the GC put on the trade row
  projectId: string;
  // Optional: jump straight to the review step for a specific template id.
  // Used by the project-name-based suggestion in the empty state — when
  // the sub clicks "Use Bathroom Remodel as your starting point", we
  // open the picker already on the customize/preview screen.
  initialTemplateId?: string;
}

// Local copy of the row-level state the picker keeps. We don't mutate the
// source PROJECT_TEMPLATES — picking just toggles flags on a per-render
// snapshot that gets consumed when "Apply" is hit.
type SelectableTask = { name: string; phaseName: string; selected: boolean };
type SelectableMaterial = { name: string; cost: number; category: string; selected: boolean };

export function TemplatePicker({ open, onClose, tradeId, tradeLabel, projectId, initialTemplateId }: TemplatePickerProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const tradeKey = useMemo(() => normalizeTradeLabel(tradeLabel), [tradeLabel]);

  // Pull the catalog from Supabase. Cached for the session — the catalog
  // changes on the order of "we shipped a new template" not "every
  // request" — but keeping it inside React Query lets us share fetches
  // across multiple TemplatePicker instances on the same page.
  const listQuery = useQuery({
    queryKey: ['project-templates', tradeKey || 'none'],
    queryFn: () => api.getProjectTemplates(tradeKey || undefined),
    enabled: open && !!tradeKey,
    staleTime: 5 * 60 * 1000,
  });
  const allTemplates: TemplateListRow[] = (listQuery.data?.data || []) as any;

  const [step, setStep] = useState<'pick' | 'review' | 'done'>('pick');
  const [search, setSearch] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(initialTemplateId ?? null);

  // If the caller hands us a pre-selected template (from the suggestion
  // surface in the empty state), jump straight to the review step the
  // moment the modal opens. Re-evaluated on each open so a follow-up
  // "Use Bathroom Remodel" click after dismiss-without-apply still works.
  useEffect(() => {
    if (!open) return;
    if (initialTemplateId) {
      setSelectedTemplateId(initialTemplateId);
      setStep('review');
    }
  }, [open, initialTemplateId]);
  const [tasks, setTasks] = useState<SelectableTask[]>([]);
  const [materials, setMaterials] = useState<SelectableMaterial[]>([]);

  // Hydrated detail (phases → tasks/materials) for the chosen template.
  // Skipped until the user actually picks one so we don't pay for 38
  // template detail fetches just to render the grid.
  const detailQuery = useQuery({
    queryKey: ['project-template-detail', selectedTemplateId],
    queryFn: () => api.getProjectTemplate(selectedTemplateId!),
    enabled: !!selectedTemplateId,
    staleTime: 5 * 60 * 1000,
  });
  const selectedTemplate: TemplateDetail | null = (detailQuery.data?.data || null) as any;

  // When detail lands, expand its phases into selectable rows. Non-
  // optional rows start checked; optional ones start unchecked so the
  // sub explicitly opts in.
  useMemo(() => {
    if (!selectedTemplate) return;
    const flatTasks: SelectableTask[] = (selectedTemplate.phases || []).flatMap((phase) =>
      (phase.tasks || []).map((task) => ({
        name: task.name,
        phaseName: phase.name,
        selected: !task.optional,
      })),
    );
    const flatMaterials: SelectableMaterial[] = (selectedTemplate.phases || []).flatMap((phase) =>
      (phase.materials || []).map((m) => ({
        name: m.name,
        cost: m.estimatedCost,
        category: m.category,
        selected: !m.optional,
      })),
    );
    setTasks(flatTasks);
    setMaterials(flatMaterials);
    // intentional: keys depend only on which template id is selected
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate?.id]);

  function chooseTemplate(t: TemplateListRow) {
    setSelectedTemplateId(t.id);
    setStep('review');
  }

  function backToList() {
    setSelectedTemplateId(null);
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
      || (t.category || '').toLowerCase().includes(q),
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
    setSelectedTemplateId(null);
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

        {listQuery.isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        ) : listQuery.isError ? (
          <p className="text-sm text-red-600 text-center py-8 dark:text-red-300">Couldn't load templates. Try again in a moment.</p>
        ) : filteredTemplates.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8 dark:text-gray-500">
            {search ? `No templates match "${search}".` : `No templates yet for ${tradeLabel}.`}
          </p>
        ) : (
          // Template list — visual parity with apps/mobile/app/project/create.tsx
          // styles.templateCard. Same purple accent (#7c3aed on #f3e8ff),
          // same meta-icon row (calendar / list / cash), same right-side
          // chevron-forward affordance. Mobile uses native SafeArea +
          // Pressable; web uses card buttons inside a single-column list
          // for thumbable scanning on desktop too.
          <div className="space-y-2.5">
            {filteredTemplates.map((t) => (
              <button
                key={t.id}
                onClick={() => chooseTemplate(t)}
                className="w-full flex items-center gap-4 text-left p-4 bg-white border border-gray-200 rounded-2xl hover:border-purple-300 hover:bg-purple-50/30 transition-all group dark:bg-white/[0.03] dark:border-white/10 dark:hover:border-purple-400/40 dark:hover:bg-purple-500/[0.07]"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors dark:bg-purple-500/15 dark:group-hover:bg-purple-500/25">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-gray-900 truncate dark:text-white">{t.name}</h3>
                  <p className="text-[13px] text-gray-500 line-clamp-2 leading-snug mt-0.5 dark:text-gray-400">{t.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      ~{t.estimatedDays} days
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      ${(t.estimatedBudgetLow / 1000).toFixed(0)}k&ndash;${(t.estimatedBudgetHigh / 1000).toFixed(0)}k
                    </span>
                    {t.category && (
                      <span className="flex items-center gap-1">
                        <List className="w-3 h-3" />
                        {t.category}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 dark:text-gray-600" />
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
  if (!selectedTemplate) {
    return (
      <Modal open={open} onClose={handleClose} title="Loading template…" size="lg">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      </Modal>
    );
  }

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

      {/* Apply — primary action treatment so it visibly stands out as the
          CTA, especially in dark mode where bg-gray-900 was indistinguishable
          from the modal panel itself. The same brand gradient is used by
          the "Use a starter template" entry point so the user sees
          continuity between picking and applying. */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-white/10">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-gray-700 dark:text-gray-200">
            {selectedTaskCount} task{selectedTaskCount === 1 ? '' : 's'}
          </span>
          {selectedMaterialCount > 0 && (
            <>
              {', '}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {selectedMaterialCount} material{selectedMaterialCount === 1 ? '' : 's'}
              </span>
            </>
          )}
          {' '}will be added.
        </div>
        <button
          onClick={() => apply.mutate()}
          disabled={apply.isPending || selectedTaskCount === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg text-sm font-semibold shadow-lg shadow-purple-500/30 hover:from-purple-500 hover:to-purple-500 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
        >
          {apply.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading&hellip;
            </>
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
