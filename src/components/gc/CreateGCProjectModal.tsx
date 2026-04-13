import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { Plus, X, Zap } from 'lucide-react';

const TRADE_OPTIONS = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Framing',
  'Drywall',
  'Painting',
  'Roofing',
  'Concrete',
  'Flooring',
  'Landscaping',
  'Custom',
];

const COMMON_TRADES = ['Plumbing', 'Electrical', 'HVAC', 'Framing', 'Drywall'];

interface Trade {
  trade: string;
  customName?: string;
  budget: string;
  tasks: { name: string }[];
}

const emptyTrade = (): Trade => ({ trade: '', customName: '', budget: '', tasks: [] });

export function CreateGCProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [newTaskInputs, setNewTaskInputs] = useState<Record<number, string>>({});

  const resetForm = () => {
    setName('');
    setCustomerName('');
    setAddress('');
    setCity('');
    setState('');
    setZip('');
    setDescription('');
    setBudget('');
    setStartDate('');
    setTargetEndDate('');
    setTrades([]);
    setNewTaskInputs({});
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createGCProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-projects'] });
      resetForm();
      onClose();
    },
  });

  const addTrade = () => setTrades([...trades, emptyTrade()]);

  const removeTrade = (idx: number) => {
    setTrades(trades.filter((_, i) => i !== idx));
    const inputs = { ...newTaskInputs };
    delete inputs[idx];
    setNewTaskInputs(inputs);
  };

  const updateTrade = (idx: number, field: keyof Trade, value: any) => {
    const updated = [...trades];
    updated[idx] = { ...updated[idx], [field]: value };
    setTrades(updated);
  };

  const addTaskToTrade = (tradeIdx: number) => {
    const taskName = newTaskInputs[tradeIdx]?.trim();
    if (!taskName) return;
    const updated = [...trades];
    updated[tradeIdx] = { ...updated[tradeIdx], tasks: [...updated[tradeIdx].tasks, { name: taskName }] };
    setTrades(updated);
    setNewTaskInputs({ ...newTaskInputs, [tradeIdx]: '' });
  };

  const removeTaskFromTrade = (tradeIdx: number, taskIdx: number) => {
    const updated = [...trades];
    updated[tradeIdx] = {
      ...updated[tradeIdx],
      tasks: updated[tradeIdx].tasks.filter((_, i) => i !== taskIdx),
    };
    setTrades(updated);
  };

  const addCommonTrades = () => {
    const existing = new Set(trades.map((t) => t.trade));
    const newTrades = COMMON_TRADES.filter((t) => !existing.has(t)).map((trade) => ({
      trade,
      customName: '',
      budget: '',
      tasks: [],
    }));
    setTrades([...trades, ...newTrades]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createMutation.mutate({
      name: name.trim(),
      customerName: customerName.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      zip: zip.trim() || null,
      description: description.trim() || null,
      budget: budget ? parseFloat(budget) : null,
      startDate: startDate || null,
      targetEndDate: targetEndDate || null,
      status: 'planning',
      trades: trades
        .filter((t) => t.trade)
        .map((t) => ({
          trade: t.trade === 'Custom' ? (t.customName || 'Custom') : t.trade,
          budget: t.budget ? parseFloat(t.budget) : null,
          tasks: t.tasks,
        })),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="New GC Project" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Project Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Smith Residence Remodel"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="John Smith"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="TX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zip</label>
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="75001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="50000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target End Date</label>
            <input
              type="date"
              value={targetEndDate}
              onChange={(e) => setTargetEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Project notes..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
          />
        </div>

        {/* Trades Section */}
        <div className="border-t border-gray-200 pt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Trades</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addCommonTrades}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
              >
                <Zap className="w-3 h-3" />
                Add Common Trades
              </button>
              <button
                type="button"
                onClick={addTrade}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Trade
              </button>
            </div>
          </div>

          {trades.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No trades added yet. Click "Add Trade" or "Add Common Trades" to get started.</p>
          )}

          <div className="space-y-3">
            {trades.map((trade, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <select
                    value={trade.trade}
                    onChange={(e) => updateTrade(idx, 'trade', e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  >
                    <option value="">Select trade...</option>
                    {TRADE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {trade.trade === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Custom name"
                      value={trade.customName || ''}
                      onChange={(e) => updateTrade(idx, 'customName', e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                    />
                  )}
                  <input
                    type="number"
                    placeholder="Budget"
                    value={trade.budget}
                    onChange={(e) => updateTrade(idx, 'budget', e.target.value)}
                    className="w-28 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeTrade(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Tasks for this trade */}
                {trade.tasks.length > 0 && (
                  <div className="ml-2 mb-2 space-y-1">
                    {trade.tasks.map((task, taskIdx) => (
                      <div key={taskIdx} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        <span className="flex-1">{task.name}</span>
                        <button
                          type="button"
                          onClick={() => removeTaskFromTrade(idx, taskIdx)}
                          className="text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 ml-2">
                  <input
                    type="text"
                    placeholder="Add a task..."
                    value={newTaskInputs[idx] || ''}
                    onChange={(e) => setNewTaskInputs({ ...newTaskInputs, [idx]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTaskToTrade(idx);
                      }
                    }}
                    className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addTaskToTrade(idx)}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => { resetForm(); onClose(); }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || createMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-60"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
