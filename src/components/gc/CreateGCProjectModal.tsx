import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { Plus, X, Zap, ChevronDown, ChevronUp } from 'lucide-react';

/* ─── Types ─── */

interface TradeEntry {
  trade: string;
  laborHours: number;
  laborRate: number;
  materialsBudget: number;
}

/* ─── Templates ─── */

const PROJECT_TYPES = [
  { value: 'kitchen_remodel', label: 'Kitchen Remodel', icon: '🍳' },
  { value: 'bathroom_remodel', label: 'Bathroom Remodel', icon: '🚿' },
  { value: 'new_construction', label: 'New Construction', icon: '🏗️' },
  { value: 'room_addition', label: 'Room Addition', icon: '🏠' },
  { value: 'hvac_replacement', label: 'HVAC Replacement', icon: '❄️' },
  { value: 'repipe', label: 'Whole House Repipe', icon: '🔧' },
  { value: 'panel_upgrade', label: 'Panel Upgrade', icon: '⚡' },
  { value: 'custom', label: 'Custom Project', icon: '📋' },
];

const TEMPLATES: Record<string, TradeEntry[]> = {
  kitchen_remodel: [
    { trade: 'Framing', laborHours: 40, laborRate: 65, materialsBudget: 3500 },
    { trade: 'Plumbing', laborHours: 30, laborRate: 95, materialsBudget: 2800 },
    { trade: 'Electrical', laborHours: 24, laborRate: 95, materialsBudget: 1800 },
    { trade: 'HVAC', laborHours: 16, laborRate: 95, materialsBudget: 1200 },
    { trade: 'Drywall', laborHours: 24, laborRate: 55, materialsBudget: 800 },
    { trade: 'Painting', laborHours: 20, laborRate: 50, materialsBudget: 600 },
    { trade: 'Flooring', laborHours: 16, laborRate: 60, materialsBudget: 2000 },
  ],
  bathroom_remodel: [
    { trade: 'Plumbing', laborHours: 24, laborRate: 95, materialsBudget: 2500 },
    { trade: 'Electrical', laborHours: 12, laborRate: 95, materialsBudget: 800 },
    { trade: 'Drywall', laborHours: 12, laborRate: 55, materialsBudget: 400 },
    { trade: 'Painting', laborHours: 8, laborRate: 50, materialsBudget: 200 },
    { trade: 'Flooring', laborHours: 8, laborRate: 60, materialsBudget: 1000 },
  ],
  new_construction: [
    { trade: 'Concrete', laborHours: 80, laborRate: 60, materialsBudget: 15000 },
    { trade: 'Framing', laborHours: 160, laborRate: 65, materialsBudget: 25000 },
    { trade: 'Roofing', laborHours: 40, laborRate: 70, materialsBudget: 8000 },
    { trade: 'Plumbing', laborHours: 60, laborRate: 95, materialsBudget: 8000 },
    { trade: 'Electrical', laborHours: 60, laborRate: 95, materialsBudget: 6000 },
    { trade: 'HVAC', laborHours: 48, laborRate: 95, materialsBudget: 10000 },
    { trade: 'Drywall', laborHours: 80, laborRate: 55, materialsBudget: 4000 },
    { trade: 'Painting', laborHours: 60, laborRate: 50, materialsBudget: 2000 },
    { trade: 'Flooring', laborHours: 40, laborRate: 60, materialsBudget: 5000 },
    { trade: 'Landscaping', laborHours: 30, laborRate: 50, materialsBudget: 3000 },
  ],
  room_addition: [
    { trade: 'Concrete', laborHours: 24, laborRate: 60, materialsBudget: 3000 },
    { trade: 'Framing', laborHours: 60, laborRate: 65, materialsBudget: 8000 },
    { trade: 'Plumbing', laborHours: 20, laborRate: 95, materialsBudget: 2000 },
    { trade: 'Electrical', laborHours: 24, laborRate: 95, materialsBudget: 2000 },
    { trade: 'HVAC', laborHours: 16, laborRate: 95, materialsBudget: 2500 },
    { trade: 'Drywall', laborHours: 32, laborRate: 55, materialsBudget: 1200 },
    { trade: 'Painting', laborHours: 20, laborRate: 50, materialsBudget: 500 },
  ],
  hvac_replacement: [
    { trade: 'HVAC', laborHours: 32, laborRate: 95, materialsBudget: 6000 },
    { trade: 'Electrical', laborHours: 8, laborRate: 95, materialsBudget: 500 },
  ],
  repipe: [
    { trade: 'Plumbing', laborHours: 48, laborRate: 95, materialsBudget: 4000 },
    { trade: 'Drywall', laborHours: 16, laborRate: 55, materialsBudget: 600 },
  ],
  panel_upgrade: [
    { trade: 'Electrical', laborHours: 24, laborRate: 95, materialsBudget: 2500 },
  ],
  custom: [],
};

const TRADE_OPTIONS = [
  'Plumbing', 'Electrical', 'HVAC', 'Framing', 'Drywall',
  'Painting', 'Roofing', 'Concrete', 'Flooring', 'Landscaping',
];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

/* ─── Component ─── */

export function CreateGCProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();

  // Core fields
  const [name, setName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');

  // Trades (auto-populated from template)
  const [trades, setTrades] = useState<TradeEntry[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [addingTrade, setAddingTrade] = useState('');

  // Budget
  const [overheadPercent, setOverheadPercent] = useState(10);
  const [profitPercent, setProfitPercent] = useState(15);

  const totals = useMemo(() => {
    const labor = trades.reduce((s, t) => s + t.laborHours * t.laborRate, 0);
    const materials = trades.reduce((s, t) => s + t.materialsBudget, 0);
    const subtotal = labor + materials;
    const overhead = subtotal * (overheadPercent / 100);
    const profit = subtotal * (profitPercent / 100);
    const customerPrice = subtotal + overhead + profit;
    return { labor, materials, subtotal, customerPrice };
  }, [trades, overheadPercent, profitPercent]);

  const resetForm = () => {
    setName(''); setProjectType(''); setCustomerName('');
    setAddress(''); setCity(''); setState(''); setZip('');
    setStartDate(''); setTargetEndDate('');
    setTrades([]); setShowDetails(false); setAddingTrade('');
    setOverheadPercent(10); setProfitPercent(15);
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createGCProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-projects'] });
      resetForm();
      onClose();
    },
  });

  // When user picks a project type → auto-populate trades
  const handleTypeSelect = (type: string) => {
    setProjectType(type);
    const template = TEMPLATES[type];
    if (template && template.length > 0) {
      setTrades(template.map(t => ({ ...t })));
    }
  };

  const removeTrade = (idx: number) => setTrades(trades.filter((_, i) => i !== idx));

  const updateTrade = (idx: number, field: keyof TradeEntry, value: any) => {
    const updated = [...trades];
    updated[idx] = { ...updated[idx], [field]: value };
    setTrades(updated);
  };

  const handleAddTrade = () => {
    if (!addingTrade) return;
    setTrades([...trades, { trade: addingTrade, laborHours: 16, laborRate: 75, materialsBudget: 1000 }]);
    setAddingTrade('');
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
      budget: totals.customerPrice || null,
      startDate: startDate || null,
      targetEndDate: targetEndDate || null,
      status: 'planning',
      trades: trades.map(t => ({
        trade: t.trade,
        budget: t.laborHours * t.laborRate + t.materialsBudget,
        laborHours: t.laborHours,
        laborRate: t.laborRate,
        materialsBudget: t.materialsBudget,
        tasks: [],
      })),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="New Project" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Project type picker (the first thing they see) ── */}
        {!projectType ? (
          <div>
            <p className="text-sm text-gray-500 mb-3">What kind of project?</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PROJECT_TYPES.map(pt => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => handleTypeSelect(pt.value)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-all text-center"
                >
                  <span className="text-2xl">{pt.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{pt.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* ── Type badge (click to change) ── */}
            <button
              type="button"
              onClick={() => { setProjectType(''); setTrades([]); }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 text-sm font-medium rounded-lg hover:bg-brand-100 transition-colors"
            >
              {PROJECT_TYPES.find(p => p.value === projectType)?.icon}{' '}
              {PROJECT_TYPES.find(p => p.value === projectType)?.label}
              <X className="w-3.5 h-3.5" />
            </button>

            {/* ── Name + Customer (two key fields) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Smith Kitchen Remodel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Customer</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            {/* ── Location (collapsible) ── */}
            <div className="grid grid-cols-3 gap-2">
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" className="col-span-3 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              <input type="text" value={state} onChange={e => setState(e.target.value)} placeholder="State" className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              <input type="text" value={zip} onChange={e => setZip(e.target.value)} placeholder="Zip" className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
            </div>

            {/* ── Dates ── */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Start</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Target End</label>
                <input type="date" value={targetEndDate} onChange={e => setTargetEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
            </div>

            {/* ── Trades (auto-populated, compact) ── */}
            {trades.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Trades</h3>
                  <button
                    type="button"
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {showDetails ? 'Simple view' : 'Edit budgets'}
                  </button>
                </div>

                {!showDetails ? (
                  /* ── Simple view: just trade names with totals ── */
                  <div className="flex flex-wrap gap-2">
                    {trades.map((t, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      >
                        {t.trade}
                        <span className="text-gray-400 text-xs">{fmt(t.laborHours * t.laborRate + t.materialsBudget)}</span>
                        <button type="button" onClick={() => removeTrade(i)} className="text-gray-300 hover:text-red-500 ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  /* ── Detail view: editable labor + materials per trade ── */
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {trades.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm">
                        <span className="font-medium text-gray-700 w-24 truncate">{t.trade}</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={t.laborHours || ''}
                            onChange={e => updateTrade(i, 'laborHours', Number(e.target.value))}
                            className="w-14 px-1.5 py-1 border border-gray-200 rounded text-xs text-center"
                            placeholder="hrs"
                          />
                          <span className="text-gray-400 text-xs">hrs @</span>
                          <span className="text-gray-400 text-xs">$</span>
                          <input
                            type="number"
                            value={t.laborRate || ''}
                            onChange={e => updateTrade(i, 'laborRate', Number(e.target.value))}
                            className="w-14 px-1.5 py-1 border border-gray-200 rounded text-xs text-center"
                            placeholder="rate"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-xs">Mat $</span>
                          <input
                            type="number"
                            value={t.materialsBudget || ''}
                            onChange={e => updateTrade(i, 'materialsBudget', Number(e.target.value))}
                            className="w-16 px-1.5 py-1 border border-gray-200 rounded text-xs text-center"
                            placeholder="mats"
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-900 ml-auto">{fmt(t.laborHours * t.laborRate + t.materialsBudget)}</span>
                        <button type="button" onClick={() => removeTrade(i)} className="text-gray-300 hover:text-red-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add trade */}
                <div className="flex items-center gap-2 mt-2">
                  <select
                    value={addingTrade}
                    onChange={e => setAddingTrade(e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="">+ Add trade...</option>
                    {TRADE_OPTIONS.filter(t => !trades.some(tr => tr.trade === t)).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {addingTrade && (
                    <button type="button" onClick={handleAddTrade} className="px-3 py-1.5 bg-brand-500 text-white text-xs font-medium rounded-lg hover:bg-brand-600">
                      Add
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Budget summary (always visible, compact) ── */}
            {trades.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-500">Cost</span>
                    <span className="ml-2 font-semibold text-gray-900">{fmt(totals.subtotal)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400 text-xs">OH</span>
                      <input
                        type="number"
                        value={overheadPercent}
                        onChange={e => setOverheadPercent(Number(e.target.value))}
                        className="w-10 px-1 py-0.5 border border-gray-200 rounded text-xs text-center"
                      />
                      <span className="text-gray-400 text-xs">%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400 text-xs">Profit</span>
                      <input
                        type="number"
                        value={profitPercent}
                        onChange={e => setProfitPercent(Number(e.target.value))}
                        className="w-10 px-1 py-0.5 border border-gray-200 rounded text-xs text-center"
                      />
                      <span className="text-gray-400 text-xs">%</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">Customer Price</span>
                  <span className="text-lg font-bold text-brand-600">{fmt(totals.customerPrice)}</span>
                </div>
              </div>
            )}

            {/* ── Submit ── */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => { resetForm(); onClose(); }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || createMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
