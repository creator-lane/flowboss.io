import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ChevronDown, Plus, Loader2, Trash2, Zap } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { api } from '../../lib/api';

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

const TRADE_TEMPLATES: Record<string, { name: string; phases: { name: string; tasks: string[] }[] }> = {
  Plumbing: {
    name: 'Plumbing Project',
    phases: [
      { name: 'Demo & Rough-In', tasks: ['Shut off water', 'Demo existing fixtures', 'Rough-in new supply lines', 'Rough-in drain lines'] },
      { name: 'Fixture Install', tasks: ['Install fixtures', 'Connect supply lines', 'Test for leaks'] },
      { name: 'Final Inspection', tasks: ['Pressure test', 'Code inspection', 'Customer walkthrough'] },
    ],
  },
  HVAC: {
    name: 'HVAC Project',
    phases: [
      { name: 'Assessment & Prep', tasks: ['Load calculation', 'Equipment sizing', 'Order equipment', 'Pull permits'] },
      { name: 'Installation', tasks: ['Remove old equipment', 'Install new unit', 'Run ductwork', 'Electrical connections'] },
      { name: 'Commissioning', tasks: ['Charge refrigerant', 'Test airflow', 'Calibrate thermostat', 'Final inspection'] },
    ],
  },
  Electrical: {
    name: 'Electrical Project',
    phases: [
      { name: 'Planning & Permits', tasks: ['Create wiring diagram', 'Pull electrical permit', 'Order materials'] },
      { name: 'Rough-In', tasks: ['Run conduit/wire', 'Install boxes', 'Rough-in inspection'] },
      { name: 'Finish & Test', tasks: ['Install devices & covers', 'Panel terminations', 'Test all circuits', 'Final inspection'] },
    ],
  },
};

interface PhaseInput {
  name: string;
  tasks: string[];
}

export function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
  const queryClient = useQueryClient();

  // Customer state
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Property state
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Project fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [targetEndDate, setTargetEndDate] = useState('');

  // Phases
  const [phases, setPhases] = useState<PhaseInput[]>([]);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseTask, setNewPhaseTask] = useState('');
  const [editingPhaseIdx, setEditingPhaseIdx] = useState<number | null>(null);

  // Queries
  const { data: customersRaw } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.getCustomers(),
    enabled: open,
  });

  const customers: any[] = useMemo(() => {
    const list = customersRaw?.data || customersRaw || [];
    return Array.isArray(list) ? list : [];
  }, [customersRaw]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter((c: any) => {
      const cName = `${c.firstName || c.first_name || ''} ${c.lastName || c.last_name || ''}`.toLowerCase();
      return cName.includes(q);
    });
  }, [customers, customerSearch]);

  const selectedCustomer = customers.find((c: any) => c.id === selectedCustomerId);
  const customerProperties: any[] = selectedCustomer?.properties || [];

  const customerDisplayName = (c: any) =>
    `${c.firstName || c.first_name || ''} ${c.lastName || c.last_name || ''}`.trim() || 'Unnamed';

  // Mutations
  const createProjectMutation = useMutation({
    mutationFn: (data: any) => api.createProject(data),
  });

  const isSubmitting = createProjectMutation.isPending;

  const resetForm = () => {
    setCustomerSearch('');
    setSelectedCustomerId(null);
    setShowCustomerDropdown(false);
    setSelectedPropertyId(null);
    setName('');
    setDescription('');
    setBudget('');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setTargetEndDate('');
    setPhases([]);
    setNewPhaseName('');
    setNewPhaseTask('');
    setEditingPhaseIdx(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addPhase = () => {
    if (!newPhaseName.trim()) return;
    setPhases([...phases, { name: newPhaseName.trim(), tasks: [] }]);
    setNewPhaseName('');
  };

  const removePhase = (idx: number) => {
    setPhases(phases.filter((_, i) => i !== idx));
    if (editingPhaseIdx === idx) setEditingPhaseIdx(null);
  };

  const addTaskToPhase = (phaseIdx: number) => {
    if (!newPhaseTask.trim()) return;
    const updated = [...phases];
    updated[phaseIdx] = {
      ...updated[phaseIdx],
      tasks: [...updated[phaseIdx].tasks, newPhaseTask.trim()],
    };
    setPhases(updated);
    setNewPhaseTask('');
  };

  const removeTaskFromPhase = (phaseIdx: number, taskIdx: number) => {
    const updated = [...phases];
    updated[phaseIdx] = {
      ...updated[phaseIdx],
      tasks: updated[phaseIdx].tasks.filter((_, i) => i !== taskIdx),
    };
    setPhases(updated);
  };

  const loadTemplate = (templateKey: string) => {
    const template = TRADE_TEMPLATES[templateKey];
    if (!template) return;
    if (!name) setName(template.name);
    setPhases(template.phases.map((p) => ({ name: p.name, tasks: [...p.tasks] })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    try {
      const projectData: any = {
        name: name.trim(),
        customer_id: selectedCustomerId || undefined,
        property_id: selectedPropertyId || undefined,
        description: description || undefined,
        budget: budget ? parseFloat(budget) : undefined,
        start_date: startDate ? new Date(startDate + 'T00:00:00').toISOString() : undefined,
        target_end_date: targetEndDate ? new Date(targetEndDate + 'T00:00:00').toISOString() : undefined,
        status: 'NOT_STARTED',
        phases: phases.map((p) => ({
          name: p.name,
          status: 'NOT_STARTED',
          tasks: p.tasks.map((t) => ({ name: t, done: false })),
          materials: [],
        })),
      };

      await createProjectMutation.mutateAsync(projectData);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      handleClose();
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="New Project" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Project Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g., Kitchen Remodel - 123 Main St"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />
        </div>

        {/* Customer Select */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Customer</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search customers..."
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setShowCustomerDropdown(true);
                if (selectedCustomerId) {
                  setSelectedCustomerId(null);
                  setSelectedPropertyId(null);
                }
              }}
              onFocus={() => setShowCustomerDropdown(true)}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 pr-10"
            />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />

            {showCustomerDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredCustomers.map((c: any) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCustomerId(c.id);
                      setCustomerSearch(customerDisplayName(c));
                      setShowCustomerDropdown(false);
                      setSelectedPropertyId(null);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                  >
                    {customerDisplayName(c)}
                  </button>
                ))}
                {filteredCustomers.length === 0 && (
                  <p className="px-4 py-2.5 text-sm text-neutral-400">No customers found</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Property Select */}
        {selectedCustomerId && customerProperties.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Property</label>
            <select
              value={selectedPropertyId || ''}
              onChange={(e) => setSelectedPropertyId(e.target.value || null)}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select a property...</option>
              {customerProperties.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.street || p.address || p.city || 'Property'}
                  {p.city ? `, ${p.city}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Description <span className="font-normal text-neutral-400">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Project scope and details..."
            rows={2}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>

        {/* Budget & Dates */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Budget <span className="font-normal text-neutral-400">(opt)</span>
            </label>
            <input
              type="number"
              placeholder="$0"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              step="0.01"
              min="0"
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Target End <span className="font-normal text-neutral-400">(opt)</span>
            </label>
            <input
              type="date"
              value={targetEndDate}
              onChange={(e) => setTargetEndDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Phase builder */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-neutral-700">Phases</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Templates:</span>
              {Object.keys(TRADE_TEMPLATES).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => loadTemplate(key)}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-brand-50 text-brand-600 rounded text-xs font-medium hover:bg-brand-100 transition-colors"
                >
                  <Zap className="w-3 h-3" />
                  {key}
                </button>
              ))}
            </div>
          </div>

          {phases.length > 0 && (
            <div className="space-y-3 mb-3">
              {phases.map((phase, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-neutral-700">{phase.name}</h5>
                    <button
                      type="button"
                      onClick={() => removePhase(idx)}
                      className="p-1 text-neutral-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {phase.tasks.length > 0 && (
                    <ul className="space-y-1 mb-2">
                      {phase.tasks.map((task, tidx) => (
                        <li key={tidx} className="flex items-center gap-2 text-xs text-neutral-500">
                          <span className="w-1 h-1 bg-neutral-300 rounded-full flex-shrink-0" />
                          <span className="flex-1">{task}</span>
                          <button
                            type="button"
                            onClick={() => removeTaskFromPhase(idx, tidx)}
                            className="text-neutral-300 hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {editingPhaseIdx === idx ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Task name..."
                        value={newPhaseTask}
                        onChange={(e) => setNewPhaseTask(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTaskToPhase(idx);
                          }
                        }}
                        autoFocus
                        className="flex-1 px-2 py-1 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <button
                        type="button"
                        onClick={() => addTaskToPhase(idx)}
                        className="px-2 py-1 bg-brand-500 text-white rounded text-xs hover:bg-brand-600"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingPhaseIdx(null); setNewPhaseTask(''); }}
                        className="text-xs text-neutral-500"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingPhaseIdx(idx)}
                      className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Task
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add phase */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Phase name..."
              value={newPhaseName}
              onChange={(e) => setNewPhaseName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addPhase();
                }
              }}
              className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={addPhase}
              className="px-3 py-2 bg-gray-100 text-neutral-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Add Phase
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
