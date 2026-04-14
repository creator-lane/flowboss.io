import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { format } from 'date-fns';
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  CheckSquare,
  Square,
  Package,
  Clock,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  NOT_STARTED: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Not Started' },
  IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
};

const STATUS_FLOW = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const;

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status] || STATUS_BADGE.NOT_STARTED;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function Section({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-neutral-400" />
          <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function PhaseCard({
  phase,
  projectId,
}: {
  phase: any;
  projectId: string;
}) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [expanded, setExpanded] = useState(true);
  const [newTaskName, setNewTaskName] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialCost, setNewMaterialCost] = useState('');
  const [showAddMaterial, setShowAddMaterial] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['project', projectId] });

  const updatePhaseMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => api.updatePhase(id, updates),
    onSuccess: invalidate,
    onError: (err: any) => addToast(err.message || 'Failed to update phase', 'error'),
  });

  const toggleTaskMutation = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => api.updateTask(id, { done }),
    onSuccess: invalidate,
    onError: (err: any) => addToast(err.message || 'Failed to update task', 'error'),
  });

  const addTaskMutation = useMutation({
    mutationFn: (data: { phaseId: string; name: string; sortOrder: number }) =>
      api.addTask(data.phaseId, { name: data.name, sortOrder: data.sortOrder }),
    onSuccess: () => {
      setNewTaskName('');
      setShowAddTask(false);
      invalidate();
    },
    onError: (err: any) => addToast(err.message || 'Failed to add task', 'error'),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => api.deleteTask(taskId),
    onSuccess: invalidate,
    onError: (err: any) => addToast(err.message || 'Failed to delete task', 'error'),
  });

  const addMaterialMutation = useMutation({
    mutationFn: (data: { phaseId: string; name: string; cost: number }) =>
      api.addMaterial(data.phaseId, { name: data.name, cost: data.cost }),
    onSuccess: () => {
      setNewMaterialName('');
      setNewMaterialCost('');
      setShowAddMaterial(false);
      invalidate();
    },
    onError: (err: any) => addToast(err.message || 'Failed to add material', 'error'),
  });

  const toggleMaterialMutation = useMutation({
    mutationFn: ({ id, purchased }: { id: string; purchased: boolean }) =>
      api.updateMaterial(id, { purchased }),
    onSuccess: invalidate,
    onError: (err: any) => addToast(err.message || 'Failed to update material', 'error'),
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: (materialId: string) => api.deleteMaterial(materialId),
    onSuccess: invalidate,
    onError: (err: any) => addToast(err.message || 'Failed to delete material', 'error'),
  });

  const tasks = phase.tasks || [];
  const materials = phase.materials || [];
  const completedTasks = tasks.filter((t: any) => t.done).length;
  const materialCost = materials.reduce((sum: number, m: any) => sum + Number(m.cost || 0), 0);

  const phaseStatus = phase.status || 'NOT_STARTED';

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          )}
          <h4 className="text-sm font-semibold text-neutral-900">{phase.name}</h4>
          <StatusBadge status={phaseStatus} />
        </div>
        <div className="flex items-center gap-4 text-xs text-neutral-400">
          <span>{completedTasks}/{tasks.length} tasks</span>
          {materialCost > 0 && <span>{formatCurrency(materialCost)}</span>}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5">
          {/* Phase status control */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 mr-2">Phase Status:</span>
            {STATUS_FLOW.map((s) => {
              const cfg = STATUS_BADGE[s];
              const isActive = phaseStatus === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => updatePhaseMutation.mutate({ id: phase.id, updates: { status: s } })}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    isActive
                      ? `${cfg.bg} ${cfg.text} ring-2 ring-offset-1 ring-current`
                      : 'bg-gray-50 text-neutral-400 hover:bg-gray-100'
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Tasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tasks</h5>
              <button
                type="button"
                onClick={() => setShowAddTask(true)}
                className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Task
              </button>
            </div>

            {tasks.length === 0 && !showAddTask && (
              <p className="text-xs text-neutral-400 italic">No tasks yet</p>
            )}

            <div className="space-y-1">
              {tasks.map((task: any) => (
                <div key={task.id} className="flex items-center gap-2 group py-1">
                  <button
                    type="button"
                    onClick={() => toggleTaskMutation.mutate({ id: task.id, done: !task.done })}
                    className="flex-shrink-0"
                  >
                    {task.done ? (
                      <CheckSquare className="w-4 h-4 text-green-500" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-300 hover:text-neutral-500" />
                    )}
                  </button>
                  <span className={`text-sm flex-1 ${task.done ? 'line-through text-neutral-400' : 'text-neutral-700'}`}>
                    {task.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteTaskMutation.mutate(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-300 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {showAddTask && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newTaskName.trim()) return;
                    addTaskMutation.mutate({
                      phaseId: phase.id,
                      name: newTaskName.trim(),
                      sortOrder: tasks.length,
                    });
                  }}
                  className="flex items-center gap-2 mt-2"
                >
                  <input
                    type="text"
                    placeholder="Task name..."
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    autoFocus
                    className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={addTaskMutation.isPending}
                    className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600 disabled:opacity-50"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddTask(false); setNewTaskName(''); }}
                    className="px-2 py-1.5 text-xs text-neutral-500 hover:text-neutral-700"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Materials */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Materials</h5>
              <button
                type="button"
                onClick={() => setShowAddMaterial(true)}
                className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Material
              </button>
            </div>

            {materials.length === 0 && !showAddMaterial && (
              <p className="text-xs text-neutral-400 italic">No materials yet</p>
            )}

            {materials.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-neutral-400 uppercase tracking-wider">
                      <th className="text-left pb-2 font-semibold">Name</th>
                      <th className="text-right pb-2 font-semibold">Cost</th>
                      <th className="text-center pb-2 font-semibold">Purchased</th>
                      <th className="w-8 pb-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {materials.map((m: any) => (
                      <tr key={m.id} className="group">
                        <td className="py-1.5 text-neutral-700">{m.name}</td>
                        <td className="py-1.5 text-right text-neutral-500">
                          {formatCurrency(Number(m.cost || 0))}
                        </td>
                        <td className="py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              toggleMaterialMutation.mutate({
                                id: m.id,
                                purchased: !m.purchased,
                              })
                            }
                          >
                            {m.purchased ? (
                              <CheckSquare className="w-4 h-4 text-green-500 mx-auto" />
                            ) : (
                              <Square className="w-4 h-4 text-neutral-300 hover:text-neutral-500 mx-auto" />
                            )}
                          </button>
                        </td>
                        <td className="py-1.5">
                          <button
                            type="button"
                            onClick={() => deleteMaterialMutation.mutate(m.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-300 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {showAddMaterial && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newMaterialName.trim()) return;
                  addMaterialMutation.mutate({
                    phaseId: phase.id,
                    name: newMaterialName.trim(),
                    cost: parseFloat(newMaterialCost) || 0,
                  });
                }}
                className="flex items-center gap-2 mt-2"
              >
                <input
                  type="text"
                  placeholder="Material name..."
                  value={newMaterialName}
                  onChange={(e) => setNewMaterialName(e.target.value)}
                  autoFocus
                  className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <input
                  type="number"
                  placeholder="Cost"
                  value={newMaterialCost}
                  onChange={(e) => setNewMaterialCost(e.target.value)}
                  step="0.01"
                  min="0"
                  className="w-24 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  disabled={addMaterialMutation.isPending}
                  className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600 disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddMaterial(false); setNewMaterialName(''); setNewMaterialCost(''); }}
                  className="px-2 py-1.5 text-xs text-neutral-500 hover:text-neutral-700"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>

          {/* Labor */}
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {phase.laborHours || phase.labor_hours || 0} hrs
            </span>
            <span>
              @ {formatCurrency(Number(phase.laborRate || phase.labor_rate || 0))}/hr
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [showAddPhase, setShowAddPhase] = useState(false);

  const { data: raw, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.getProject(id!),
    enabled: !!id,
  });

  const project = raw?.data;

  const updateProjectMutation = useMutation({
    mutationFn: (updates: any) => api.updateProject(id!, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', id] }),
    onError: (err: any) => addToast(err.message || 'Failed to update project', 'error'),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => api.deleteProject(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      addToast('Project deleted', 'success');
      navigate('/dashboard/projects');
    },
    onError: (err: any) => addToast(err.message || 'Failed to delete project', 'error'),
  });

  const duplicateProjectMutation = useMutation({
    mutationFn: () => api.duplicateProject(project),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      addToast('Project duplicated', 'success');
      const newId = result?.data?.id;
      if (newId) navigate(`/dashboard/projects/${newId}`);
    },
    onError: (err: any) => addToast(err.message || 'Failed to duplicate project', 'error'),
  });

  const addPhaseMutation = useMutation({
    mutationFn: (data: { name: string; sortOrder: number }) =>
      api.addPhase(id!, data),
    onSuccess: () => {
      setNewPhaseName('');
      setShowAddPhase(false);
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: (err: any) => addToast(err.message || 'Failed to add phase', 'error'),
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-100 rounded w-64" />
          <div className="h-40 bg-gray-100 rounded-xl" />
          <div className="h-40 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center py-20">
        <AlertTriangle className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
        <p className="text-neutral-500">Project not found</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard/projects')}
          className="mt-4 text-sm text-brand-500 hover:text-brand-600 font-medium"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  const phases = project.phases || [];
  const customerName = project.customer
    ? `${project.customer.firstName || project.customer.first_name || ''} ${project.customer.lastName || project.customer.last_name || ''}`.trim()
    : '';
  const propertyAddress = project.property
    ? [project.property.street || project.property.address, project.property.city, project.property.state].filter(Boolean).join(', ')
    : '';

  const totalMaterialCost = phases.reduce((sum: number, p: any) => {
    const mats = p.materials || [];
    return sum + mats.reduce((s: number, m: any) => s + Number(m.cost || 0), 0);
  }, 0);

  const budget = Number(project.budget || 0);
  const currentNotes = notes !== null ? notes : (project.notes || '');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate('/dashboard/projects')}
        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{project.name}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <StatusBadge status={project.status} />
              {customerName && (
                <span className="text-sm text-neutral-500">{customerName}</span>
              )}
              {propertyAddress && (
                <span className="text-sm text-neutral-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {propertyAddress}
                </span>
              )}
            </div>
          </div>
        </div>

        {project.description && (
          <p className="text-sm text-neutral-500 mt-3">{project.description}</p>
        )}
      </div>

      {/* Status controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="text-sm font-semibold text-neutral-900 mb-3">Project Status</h3>
        <div className="flex items-center gap-2">
          {STATUS_FLOW.map((s) => {
            const cfg = STATUS_BADGE[s];
            const isActive = project.status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => updateProjectMutation.mutate({ status: s })}
                disabled={updateProjectMutation.isPending}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? `${cfg.bg} ${cfg.text} ring-2 ring-offset-1 ring-current`
                    : 'bg-gray-50 text-neutral-400 hover:bg-gray-100'
                }`}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Budget section */}
      {budget > 0 && (
        <Section title="Budget" icon={DollarSign}>
          <div className="flex items-center gap-8">
            <div>
              <p className="text-xs text-neutral-400 mb-1">Budget</p>
              <p className="text-lg font-semibold text-neutral-900">{formatCurrency(budget)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-1">Materials Spent</p>
              <p className="text-lg font-semibold text-neutral-900">{formatCurrency(totalMaterialCost)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-1">Remaining</p>
              <p className={`text-lg font-semibold ${budget - totalMaterialCost >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(budget - totalMaterialCost)}
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${totalMaterialCost > budget ? 'bg-red-500' : 'bg-brand-500'}`}
              style={{ width: `${Math.min((totalMaterialCost / budget) * 100, 100)}%` }}
            />
          </div>
        </Section>
      )}

      {/* Phases */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-neutral-400" />
            Phases ({phases.length})
          </h3>
          <button
            type="button"
            onClick={() => setShowAddPhase(true)}
            className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Phase
          </button>
        </div>

        {phases.length === 0 && !showAddPhase && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">No phases yet. Add your first phase to get started.</p>
          </div>
        )}

        {phases
          .sort((a: any, b: any) => (a.sortOrder ?? a.sort_order ?? 0) - (b.sortOrder ?? b.sort_order ?? 0))
          .map((phase: any) => (
            <PhaseCard key={phase.id} phase={phase} projectId={id!} />
          ))}

        {showAddPhase && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newPhaseName.trim()) return;
              addPhaseMutation.mutate({ name: newPhaseName.trim(), sortOrder: phases.length });
            }}
            className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3"
          >
            <input
              type="text"
              placeholder="Phase name..."
              value={newPhaseName}
              onChange={(e) => setNewPhaseName(e.target.value)}
              autoFocus
              className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={addPhaseMutation.isPending}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
            >
              {addPhaseMutation.isPending ? 'Adding...' : 'Add Phase'}
            </button>
            <button
              type="button"
              onClick={() => { setShowAddPhase(false); setNewPhaseName(''); }}
              className="px-3 py-2 text-sm text-neutral-500 hover:text-neutral-700"
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      {/* Notes */}
      <div className="mt-6">
        <Section title="Notes" icon={Clock}>
          <textarea
            value={currentNotes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => {
              if (notes !== null && notes !== (project.notes || '')) {
                updateProjectMutation.mutate({ notes });
              }
            }}
            placeholder="Add project notes..."
            rows={4}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </Section>
      </div>

      {/* Actions */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">Actions</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => duplicateProjectMutation.mutate()}
            disabled={duplicateProjectMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-neutral-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {duplicateProjectMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            Duplicate Project
          </button>

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Project
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600 font-medium">Are you sure?</span>
              <button
                type="button"
                onClick={() => deleteProjectMutation.mutate()}
                disabled={deleteProjectMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleteProjectMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-2 text-sm text-neutral-500 hover:text-neutral-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
