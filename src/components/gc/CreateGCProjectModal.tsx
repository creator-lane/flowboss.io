import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { Plus, X, ChevronDown, ChevronUp, Pencil } from 'lucide-react';

/* ─── Types ─── */

interface TradeEntry {
  trade: string;
  laborHours: number;
  laborRate: number;
  materialsBudget: number;
}

interface ZoneEntry {
  name: string;
  trades: string[];
}

/* ─── Templates ─── */

// Project type library.
//
// Split into two groups so the picker leads with multi-trade GC work (the
// primary user of this modal is a GC) and keeps the single-trade service-job
// templates available but secondary. The `group` discriminator is also used
// below by `generateZones` so, e.g. kitchen_remodel doesn't accidentally
// seed bathroom + general framing zones meant for a whole-house build.
type ProjectGroup = 'multi' | 'single';
type ProjectTypeDef = { value: string; label: string; icon: string; group: ProjectGroup };

const PROJECT_TYPES: ProjectTypeDef[] = [
  // Multi-trade (GC) — shown first
  { value: 'kitchen_remodel', label: 'Kitchen Remodel', icon: '\u{1F373}', group: 'multi' },
  { value: 'bathroom_remodel', label: 'Bathroom Remodel', icon: '\u{1F6BF}', group: 'multi' },
  { value: 'new_construction', label: 'New Construction', icon: '\u{1F3D7}\u{FE0F}', group: 'multi' },
  { value: 'room_addition', label: 'Room Addition', icon: '\u{1F3E0}', group: 'multi' },
  { value: 'custom', label: 'Custom Project', icon: '\u{1F4CB}', group: 'multi' },
  // Single-trade service jobs — available but secondary
  { value: 'hvac_replacement', label: 'HVAC Replacement', icon: '\u{2744}\u{FE0F}', group: 'single' },
  { value: 'repipe', label: 'Whole House Repipe', icon: '\u{1F527}', group: 'single' },
  { value: 'panel_upgrade', label: 'Panel Upgrade', icon: '\u{26A1}', group: 'single' },
];

const PROJECT_TYPES_MULTI = PROJECT_TYPES.filter(p => p.group === 'multi');
const PROJECT_TYPES_SINGLE = PROJECT_TYPES.filter(p => p.group === 'single');

const STRUCTURE_TYPES = ['House', 'Condo', 'Townhouse', 'Apartment', 'Commercial'];

const TRADE_OPTIONS = [
  'Plumbing', 'Electrical', 'HVAC', 'Framing', 'Drywall',
  'Painting', 'Roofing', 'Concrete', 'Flooring', 'Landscaping',
  'Tiling', 'Siding', 'Insulation', 'Cabinetry',
];

const DEFAULT_TRADE_RATES: Record<string, { laborHours: number; laborRate: number; materialsBudget: number }> = {
  Plumbing: { laborHours: 20, laborRate: 95, materialsBudget: 2000 },
  Electrical: { laborHours: 16, laborRate: 95, materialsBudget: 1200 },
  HVAC: { laborHours: 20, laborRate: 95, materialsBudget: 2500 },
  Framing: { laborHours: 32, laborRate: 65, materialsBudget: 3000 },
  Drywall: { laborHours: 24, laborRate: 55, materialsBudget: 1000 },
  Painting: { laborHours: 16, laborRate: 50, materialsBudget: 400 },
  Roofing: { laborHours: 32, laborRate: 70, materialsBudget: 5000 },
  Concrete: { laborHours: 24, laborRate: 60, materialsBudget: 3000 },
  Flooring: { laborHours: 16, laborRate: 60, materialsBudget: 2000 },
  Landscaping: { laborHours: 20, laborRate: 50, materialsBudget: 1500 },
  Tiling: { laborHours: 20, laborRate: 65, materialsBudget: 1200 },
  Siding: { laborHours: 24, laborRate: 60, materialsBudget: 3000 },
  Insulation: { laborHours: 16, laborRate: 55, materialsBudget: 1800 },
  Cabinetry: { laborHours: 24, laborRate: 70, materialsBudget: 4000 },
};

/* ─── Zone generator ─── */

function generateZones(bedrooms: number, bathrooms: number, projectType: string): ZoneEntry[] {
  // Kitchen-only remodel: ONE zone, kitchen-relevant trades only.
  // Prior behavior leaked bathroom + general framing/drywall/HVAC zones into
  // every kitchen remodel, which surprised GCs who picked "Kitchen Remodel"
  // and got a full-house-gut template back. Cabinetry + Tiling are
  // kitchen-critical; framing/drywall are not auto-added (the GC can drop
  // them in as a custom zone or trade if they're reframing cabinets).
  if (projectType === 'kitchen_remodel') {
    return [
      {
        name: 'Kitchen',
        trades: ['Plumbing', 'Electrical', 'HVAC', 'Cabinetry', 'Tiling', 'Flooring', 'Painting'],
      },
    ];
  }

  // Bathroom-only remodel: ONE bathroom zone, same logic as kitchen above.
  if (projectType === 'bathroom_remodel') {
    return [
      {
        name: 'Bathroom',
        trades: ['Plumbing', 'Electrical', 'Tiling', 'Flooring', 'Painting'],
      },
    ];
  }

  // Single-trade service jobs: one focused zone, no whole-house scaffolding.
  if (projectType === 'hvac_replacement') {
    return [{ name: 'HVAC Replacement', trades: ['HVAC'] }];
  }
  if (projectType === 'repipe') {
    return [{ name: 'Repipe', trades: ['Plumbing'] }];
  }
  if (projectType === 'panel_upgrade') {
    return [{ name: 'Panel Upgrade', trades: ['Electrical'] }];
  }

  // Multi-zone whole-house templates below (new_construction, room_addition,
  // custom): keep the richer auto-seed.
  const zones: ZoneEntry[] = [];

  // Kitchen is expected in most whole-house scopes
  zones.push({ name: 'Kitchen', trades: ['Plumbing', 'Electrical', 'HVAC', 'Cabinetry', 'Tiling', 'Flooring', 'Painting'] });

  // Bathrooms (only when user has specified 1+)
  if (bathrooms === 1) {
    zones.push({ name: 'Bathroom', trades: ['Plumbing', 'Electrical', 'Tiling', 'Painting'] });
  } else if (bathrooms > 1) {
    zones.push({ name: 'Master Bathroom', trades: ['Plumbing', 'Electrical', 'Tiling', 'Painting'] });
    for (let i = 2; i <= bathrooms; i++) {
      zones.push({ name: `Bathroom ${i}`, trades: ['Plumbing', 'Tiling', 'Painting'] });
    }
  }

  // Exterior + Garage for new construction only
  if (projectType === 'new_construction') {
    zones.push({ name: 'Exterior', trades: ['Roofing', 'Siding', 'Landscaping'] });
    zones.push({ name: 'Garage', trades: ['Electrical', 'Concrete'] });
  }

  // General always last (framing/drywall/whole-house HVAC)
  zones.push({ name: 'General', trades: ['Framing', 'Drywall', 'HVAC'] });

  return zones;
}

/* ─── Helpers ─── */

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const ZONE_EMOJI: Record<string, string> = {
  'Kitchen': '\u{1F373}',
  'Bathroom': '\u{1F6BF}', 'Bathroom 1': '\u{1F6BF}', 'Bathroom 2': '\u{1F6BF}', 'Master Bathroom': '\u{1F6BF}',
  'Master Suite': '\u{1F6CF}\u{FE0F}', 'Living Room': '\u{1F6CB}\u{FE0F}',
  'Garage': '\u{1F697}', 'Exterior': '\u{1F3E1}', 'General': '\u{1F527}',
};

const ZONE_BORDER: Record<string, string> = {
  'Kitchen': 'border-amber-400',
  'Bathroom': 'border-cyan-400', 'Bathroom 1': 'border-cyan-400', 'Bathroom 2': 'border-cyan-500', 'Master Bathroom': 'border-cyan-600',
  'Garage': 'border-slate-400', 'Exterior': 'border-green-500',
  'General': 'border-blue-500',
};

/* ─── Component ─── */

export function CreateGCProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  // Phase 1: Project type
  const [projectType, setProjectType] = useState('');

  // Phase 2: Structure details
  const [structureType, setStructureType] = useState('House');
  const [sqFootage, setSqFootage] = useState<number | ''>('');
  const [stories, setStories] = useState(1);
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);

  // Zones (auto-generated, editable)
  const [zones, setZones] = useState<ZoneEntry[]>([]);
  const [zonesGenerated, setZonesGenerated] = useState(false);
  const [addingZoneName, setAddingZoneName] = useState('');

  // Budget
  const [overheadPercent, setOverheadPercent] = useState(10);
  const [profitPercent, setProfitPercent] = useState(15);
  const [showBudgetDetails, setShowBudgetDetails] = useState(false);

  // Phase 4: Name + Customer
  const [name, setName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');

  // Build trade entries from zones for budget calc
  const allTrades = useMemo(() => {
    const tradeSet = new Set<string>();
    const entries: TradeEntry[] = [];
    for (const zone of zones) {
      for (const tradeName of zone.trades) {
        if (!tradeSet.has(tradeName)) {
          tradeSet.add(tradeName);
          const defaults = DEFAULT_TRADE_RATES[tradeName] || { laborHours: 16, laborRate: 75, materialsBudget: 1000 };
          entries.push({ trade: tradeName, ...defaults });
        }
      }
    }
    return entries;
  }, [zones]);

  const totals = useMemo(() => {
    const labor = allTrades.reduce((s, t) => s + t.laborHours * t.laborRate, 0);
    const materials = allTrades.reduce((s, t) => s + t.materialsBudget, 0);
    const subtotal = labor + materials;
    const overhead = subtotal * (overheadPercent / 100);
    const profit = subtotal * (profitPercent / 100);
    const customerPrice = subtotal + overhead + profit;
    return { labor, materials, subtotal, customerPrice };
  }, [allTrades, overheadPercent, profitPercent]);

  const resetForm = () => {
    setProjectType(''); setStructureType('House'); setSqFootage('');
    setStories(1); setBedrooms(3); setBathrooms(2);
    setZones([]); setZonesGenerated(false); setAddingZoneName('');
    setOverheadPercent(10); setProfitPercent(15); setShowBudgetDetails(false);
    setName(''); setCustomerName('');
    setAddress(''); setCity(''); setState(''); setZip('');
    setStartDate(''); setTargetEndDate('');
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createGCProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-projects'] });
      addToast('Project created', 'success');
      resetForm();
      onClose();
    },
    onError: (err: any) => addToast(err.message || 'Failed to create project', 'error'),
  });

  // When user picks a project type
  const handleTypeSelect = (type: string) => {
    setProjectType(type);
    // Auto-generate zones with current bedroom/bathroom counts
    const generated = generateZones(bedrooms, bathrooms, type);
    setZones(generated);
    setZonesGenerated(true);
  };

  // Regenerate zones when structure details change
  const handleRegenerateZones = () => {
    const generated = generateZones(bedrooms, bathrooms, projectType);
    setZones(generated);
  };

  // Zone editing
  const removeZone = (idx: number) => setZones(zones.filter((_, i) => i !== idx));
  const renameZone = (idx: number, newName: string) => {
    const updated = [...zones];
    updated[idx] = { ...updated[idx], name: newName };
    setZones(updated);
  };
  const removeTradeFromZone = (zoneIdx: number, tradeName: string) => {
    const updated = [...zones];
    updated[zoneIdx] = { ...updated[zoneIdx], trades: updated[zoneIdx].trades.filter(t => t !== tradeName) };
    setZones(updated);
  };
  const addTradeToZone = (zoneIdx: number, tradeName: string) => {
    const updated = [...zones];
    if (!updated[zoneIdx].trades.includes(tradeName)) {
      updated[zoneIdx] = { ...updated[zoneIdx], trades: [...updated[zoneIdx].trades, tradeName] };
    }
    setZones(updated);
  };
  const addCustomZone = () => {
    if (!addingZoneName.trim()) return;
    setZones([...zones, { name: addingZoneName.trim(), trades: [] }]);
    setAddingZoneName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Build zone-based project data
    const zoneData = zones.map(z => ({
      name: z.name,
      zoneType: z.name.toLowerCase(),
      trades: z.trades.map(tradeName => {
        const defaults = DEFAULT_TRADE_RATES[tradeName] || { laborHours: 16, laborRate: 75, materialsBudget: 1000 };
        return {
          trade: tradeName,
          budget: defaults.laborHours * defaults.laborRate + defaults.materialsBudget,
          laborHours: defaults.laborHours,
          laborRate: defaults.laborRate,
          materialsBudget: defaults.materialsBudget,
          tasks: [],
        };
      }),
    }));

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
      structureType: structureType.toLowerCase(),
      sqFootage: sqFootage || null,
      bedrooms: bedrooms || null,
      bathrooms: bathrooms || null,
      stories: stories || null,
      zones: zoneData,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="New Project" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">

        {/* ── Phase 1: Project type picker ── */}
        {!projectType ? (
          <div className="space-y-5">
            {/* GC / multi-trade templates — lead with these since the primary
                user of this modal is a general contractor. */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1 dark:text-white">Multi-trade projects</h3>
              <p className="text-xs text-gray-500 mb-3 dark:text-gray-400">For GC-run work across multiple trades and zones.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PROJECT_TYPES_MULTI.map(pt => (
                  <button
                    key={pt.value}
                    type="button"
                    onClick={() => handleTypeSelect(pt.value)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-all text-center dark:border-white/10 dark:hover:bg-blue-500/20"
                  >
                    <span className="text-2xl">{pt.icon}</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{pt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Single-trade service jobs — shown second, visually de-emphasized. */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-1 dark:text-gray-300">Single-trade service jobs</h3>
              <p className="text-xs text-gray-500 mb-3 dark:text-gray-400">For one-trade swaps and upgrades.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PROJECT_TYPES_SINGLE.map(pt => (
                  <button
                    key={pt.value}
                    type="button"
                    onClick={() => handleTypeSelect(pt.value)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 bg-gray-50/50 hover:border-brand-300 hover:bg-brand-50 transition-all text-center dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-blue-500/20"
                  >
                    <span className="text-2xl">{pt.icon}</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{pt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ── Type badge (click to change) ── */}
            <button
              type="button"
              onClick={() => { setProjectType(''); setZones([]); setZonesGenerated(false); }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 text-sm font-medium rounded-lg hover:bg-brand-100 transition-colors dark:bg-blue-500/10 dark:text-blue-300"
            >
              {PROJECT_TYPES.find(p => p.value === projectType)?.icon}{' '}
              {PROJECT_TYPES.find(p => p.value === projectType)?.label}
              <X className="w-3.5 h-3.5" />
            </button>

            {/* ── Phase 2: Structure Details ── */}
            <div className="bg-gray-50 rounded-xl p-4 dark:bg-white/[0.02]">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 dark:text-white">Structure</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 dark:text-gray-400">Type</label>
                  <select
                    value={structureType}
                    onChange={e => setStructureType(e.target.value)}
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-sm dark:focus:ring-blue-400"
                  >
                    {STRUCTURE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 dark:text-gray-400">Sq Ft</label>
                  <input
                    type="number"
                    value={sqFootage}
                    onChange={e => setSqFootage(e.target.value ? Number(e.target.value) : '')}
                    placeholder="2400"
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 dark:text-gray-400">Beds</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={bedrooms}
                    onChange={e => setBedrooms(Number(e.target.value))}
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 dark:text-gray-400">Baths</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={bathrooms}
                    onChange={e => setBathrooms(Number(e.target.value))}
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 dark:text-gray-400">Stories</label>
                  <select
                    value={stories}
                    onChange={e => setStories(Number(e.target.value))}
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-sm dark:focus:ring-blue-400"
                  >
                    {[1, 2, 3].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1 sm:col-span-3 flex items-end">
                  <button
                    type="button"
                    onClick={handleRegenerateZones}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium dark:text-blue-300"
                  >
                    Regenerate zones from structure
                  </button>
                </div>
              </div>
            </div>

            {/* ── Zone Cards ── */}
            {zonesGenerated && zones.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2 dark:text-white">Zones</h3>
                <p className="text-xs text-gray-400 mb-3 dark:text-gray-500">Each zone groups trades by area. Rename, remove, or add zones below.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {zones.map((zone, zi) => (
                    <ZoneCard
                      key={zi}
                      zone={zone}
                      onRename={(n) => renameZone(zi, n)}
                      onRemove={() => removeZone(zi)}
                      onRemoveTrade={(t) => removeTradeFromZone(zi, t)}
                      onAddTrade={(t) => addTradeToZone(zi, t)}
                      allTradeOptions={TRADE_OPTIONS}
                    />
                  ))}
                </div>
                {/* Add custom zone */}
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="text"
                    value={addingZoneName}
                    onChange={e => setAddingZoneName(e.target.value)}
                    placeholder="Add custom zone..."
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomZone(); } }}
                  />
                  {addingZoneName.trim() && (
                    <button type="button" onClick={addCustomZone} className="px-3 py-1.5 bg-brand-500 text-white text-xs font-medium rounded-lg hover:bg-brand-600">
                      Add
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Phase 3: Budget summary ── */}
            {allTrades.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 dark:bg-white/[0.02]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Budget Estimate</h3>
                  <button
                    type="button"
                    onClick={() => setShowBudgetDetails(!showBudgetDetails)}
                    className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 dark:text-blue-300"
                  >
                    {showBudgetDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {showBudgetDetails ? 'Hide details' : 'Show details'}
                  </button>
                </div>

                {showBudgetDetails && (
                  <div className="space-y-1 mb-3 max-h-40 overflow-y-auto">
                    {allTrades.map((t, i) => (
                      <div key={i} className="flex items-center justify-between text-xs px-2 py-1 bg-white rounded dark:bg-white/5 dark:backdrop-blur-sm">
                        <span className="text-gray-600 dark:text-gray-300">{t.trade}</span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {t.laborHours}h @ ${t.laborRate} + ${t.materialsBudget.toLocaleString()} mat
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">{fmt(t.laborHours * t.laborRate + t.materialsBudget)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Cost</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">{fmt(totals.subtotal)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400 text-xs dark:text-gray-500">OH</span>
                      <input
                        type="number"
                        value={overheadPercent}
                        onChange={e => setOverheadPercent(Number(e.target.value))}
                        className="w-10 px-1 py-0.5 border border-gray-200 rounded text-xs text-center dark:border-white/10"
                      />
                      <span className="text-gray-400 text-xs dark:text-gray-500">%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400 text-xs dark:text-gray-500">Profit</span>
                      <input
                        type="number"
                        value={profitPercent}
                        onChange={e => setProfitPercent(Number(e.target.value))}
                        className="w-10 px-1 py-0.5 border border-gray-200 rounded text-xs text-center dark:border-white/10"
                      />
                      <span className="text-gray-400 text-xs dark:text-gray-500">%</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between dark:border-white/10">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Customer Price</span>
                  <span className="text-lg font-bold text-brand-600 dark:text-blue-300">{fmt(totals.customerPrice)}</span>
                </div>
              </div>
            )}

            {/* ── Phase 4: Name + Customer ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 dark:text-gray-400">Project Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Smith Kitchen Remodel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 dark:text-gray-400">Customer</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-3 gap-2">
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" className="col-span-3 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400" />
              <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400" />
              <input type="text" value={state} onChange={e => setState(e.target.value)} placeholder="State" className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400" />
              <input type="text" value={zip} onChange={e => setZip(e.target.value)} placeholder="Zip" className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400" />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 dark:text-gray-400">Start</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 dark:text-gray-400">Target End</label>
                <input type="date" value={targetEndDate} onChange={e => setTargetEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400" />
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => { resetForm(); onClose(); }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
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

/* ─── Zone Card (inline editor) ─── */

function ZoneCard({
  zone,
  onRename,
  onRemove,
  onRemoveTrade,
  onAddTrade,
  allTradeOptions,
}: {
  zone: ZoneEntry;
  onRename: (name: string) => void;
  onRemove: () => void;
  onRemoveTrade: (trade: string) => void;
  onAddTrade: (trade: string) => void;
  allTradeOptions: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(zone.name);
  const [addingTrade, setAddingTrade] = useState('');

  const emoji = ZONE_EMOJI[zone.name] || '\u{1F4CD}';
  const borderClass = ZONE_BORDER[zone.name] || 'border-gray-300';

  const availableTrades = allTradeOptions.filter(t => !zone.trades.includes(t));

  return (
    <div className={`bg-white rounded-xl border-t-2 dark:bg-white/5 dark:backdrop-blur-sm${borderClass} border border-gray-200 p-3 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-base">{emoji}</span>
          {editing ? (
            <input
              autoFocus
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={() => { onRename(editName); setEditing(false); }}
              onKeyDown={e => { if (e.key === 'Enter') { onRename(editName); setEditing(false); } }}
              className="flex-1 text-sm font-bold text-gray-900 px-1 py-0.5 border border-brand-300 rounded focus:outline-none dark:text-white dark:border-blue-500/40"
            />
          ) : (
            <span className="text-sm font-bold text-gray-900 truncate cursor-pointer dark:text-white" onClick={() => { setEditName(zone.name); setEditing(true); }}>
              {zone.name}
              <Pencil className="w-3 h-3 text-gray-300 inline ml-1.5 -mt-0.5" />
            </span>
          )}
        </div>
        <button type="button" onClick={onRemove} className="text-gray-300 hover:text-red-500 transition-colors p-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Trade pills */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {zone.trades.map(t => (
          <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 dark:bg-white/[0.02] dark:border-white/10 dark:text-gray-300">
            {t}
            <button type="button" onClick={() => onRemoveTrade(t)} className="text-gray-300 hover:text-red-500">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Add trade to zone */}
      {availableTrades.length > 0 && (
        <select
          value={addingTrade}
          onChange={e => {
            if (e.target.value) {
              onAddTrade(e.target.value);
              setAddingTrade('');
            }
          }}
          className="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-white focus:ring-1 focus:ring-brand-500 outline-none text-gray-400 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-sm dark:focus:ring-blue-400 dark:text-gray-500"
        >
          <option value="">+ Add scope...</option>
          {availableTrades.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      )}
    </div>
  );
}
