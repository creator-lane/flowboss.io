import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Loader2,
  Package,
  Download,
} from 'lucide-react';

const TRADE_OPTIONS = ['Plumbing', 'HVAC', 'Electrical'] as const;

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);

interface PricebookItem {
  id: string;
  name: string;
  default_price: number;
  category?: string;
  unit?: string;
  description?: string;
  use_count?: number;
  last_used_at?: string;
}

export function PricebookManager() {
  const queryClient = useQueryClient();

  // State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [seedTrade, setSeedTrade] = useState<string>('plumbing');

  // Add form state
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newUnit, setNewUnit] = useState('ea');
  const [newDescription, setNewDescription] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Queries
  const { data: pricebookData, isLoading } = useQuery({
    queryKey: ['pricebook'],
    queryFn: () => api.getPricebook(),
  });

  const items: PricebookItem[] = pricebookData?.data || [];

  // Derived
  const categories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach((item) => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((item) => item.name.toLowerCase().includes(q));
    }
    if (categoryFilter) {
      result = result.filter((item) => item.category === categoryFilter);
    }
    return result;
  }, [items, search, categoryFilter]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, PricebookItem[]> = {};
    filteredItems.forEach((item) => {
      const cat = item.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredItems]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (item: { name: string; default_price: number; category?: string; unit?: string; description?: string }) =>
      api.createPricebookItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricebook'] });
      setNewName('');
      setNewPrice('');
      setNewCategory('');
      setNewUnit('ea');
      setNewDescription('');
      setShowAddForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      api.updatePricebookItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricebook'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deletePricebookItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricebook'] });
      setDeleteConfirmId(null);
    },
  });

  const seedMutation = useMutation({
    mutationFn: (trade: string) => api.seedDefaultPricebook(trade),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricebook'] });
    },
  });

  const handleAdd = () => {
    if (!newName.trim() || !newPrice) return;
    createMutation.mutate({
      name: newName.trim(),
      default_price: parseFloat(newPrice),
      category: newCategory.trim() || undefined,
      unit: newUnit.trim() || undefined,
      description: newDescription.trim() || undefined,
    });
  };

  const startEdit = (item: PricebookItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPrice(String(item.default_price));
    setEditCategory(item.category || '');
    setEditUnit(item.unit || '');
    setEditDescription(item.description || '');
  };

  const handleUpdate = () => {
    if (!editingId || !editName.trim() || !editPrice) return;
    updateMutation.mutate({
      id: editingId,
      updates: {
        name: editName.trim(),
        default_price: parseFloat(editPrice),
        category: editCategory.trim() || null,
        unit: editUnit.trim() || null,
        description: editDescription.trim() || null,
      },
    });
  };

  const formatDate = (iso: string | undefined) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-neutral-100 rounded-lg w-full" />
        <div className="h-64 bg-neutral-50 rounded-xl" />
      </div>
    );
  }

  // Empty state with seed option
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-neutral-700 mb-2">No pricebook items yet</h3>
        <p className="text-sm text-neutral-400 mb-6 max-w-md mx-auto">
          Start by loading a default pricebook for your trade, or add items manually.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <select
            value={seedTrade}
            onChange={(e) => setSeedTrade(e.target.value)}
            className="px-4 py-2.5 border border-neutral-300 rounded-lg text-sm bg-white"
          >
            {TRADE_OPTIONS.map((t) => (
              <option key={t} value={t.toLowerCase()}>
                {t}
              </option>
            ))}
          </select>
          <button
            onClick={() => seedMutation.mutate(seedTrade)}
            disabled={seedMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50 transition text-sm"
          >
            {seedMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Load Default Pricebook
          </button>
        </div>

        <div className="mt-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="text-sm text-brand-500 hover:text-brand-600 font-medium"
          >
            Or add items manually
          </button>
        </div>

        {showAddForm && (
          <div className="mt-6 max-w-lg mx-auto text-left">
            <AddItemForm
              newName={newName}
              setNewName={setNewName}
              newPrice={newPrice}
              setNewPrice={setNewPrice}
              newCategory={newCategory}
              setNewCategory={setNewCategory}
              newUnit={newUnit}
              setNewUnit={setNewUnit}
              newDescription={newDescription}
              setNewDescription={setNewDescription}
              onAdd={handleAdd}
              onCancel={() => setShowAddForm(false)}
              isPending={createMutation.isPending}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 border border-neutral-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 transition text-sm whitespace-nowrap"
        >
          {showAddForm ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          Add Item
        </button>
      </div>

      {/* Add item form */}
      {showAddForm && (
        <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-5">
          <AddItemForm
            newName={newName}
            setNewName={setNewName}
            newPrice={newPrice}
            setNewPrice={setNewPrice}
            newCategory={newCategory}
            setNewCategory={setNewCategory}
            newUnit={newUnit}
            setNewUnit={setNewUnit}
            newDescription={newDescription}
            setNewDescription={setNewDescription}
            onAdd={handleAdd}
            onCancel={() => setShowAddForm(false)}
            isPending={createMutation.isPending}
            existingCategories={categories}
          />
        </div>
      )}

      {/* Item list grouped by category */}
      {groupedItems.length === 0 ? (
        <p className="text-sm text-neutral-400 text-center py-8">
          No items match your search.
        </p>
      ) : (
        <div className="space-y-6">
          {groupedItems.map(([category, catItems]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                {category} ({catItems.length})
              </h3>
              <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
                {catItems.map((item) => (
                  <div key={item.id} className="px-4 py-3">
                    {editingId === item.id ? (
                      /* Edit mode */
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Item name"
                            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none sm:col-span-2"
                          />
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            placeholder="Price"
                            step="0.01"
                            min="0"
                            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            placeholder="Category"
                            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                          />
                          <input
                            type="text"
                            value={editUnit}
                            onChange={(e) => setEditUnit(e.target.value)}
                            placeholder="Unit (ea, hr, ft)"
                            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                          />
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Description"
                            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleUpdate}
                            disabled={updateMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50 transition"
                          >
                            {updateMutation.isPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-neutral-600 text-sm font-medium rounded-lg hover:bg-neutral-100 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display mode */
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-medium text-neutral-900 truncate">
                              {item.name}
                            </p>
                            <span className="text-sm font-semibold text-brand-600">
                              {formatCurrency(item.default_price)}
                            </span>
                            {item.unit && (
                              <span className="text-xs text-neutral-400">/ {item.unit}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            {item.description && (
                              <span className="text-xs text-neutral-400 truncate">
                                {item.description}
                              </span>
                            )}
                            <span className="text-xs text-neutral-300">
                              Used {item.use_count || 0}x
                              {item.last_used_at
                                ? ` | Last: ${formatDate(item.last_used_at)}`
                                : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition"
                            aria-label="Edit item"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {deleteConfirmId === item.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => deleteMutation.mutate(item.id)}
                                disabled={deleteMutation.isPending}
                                className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition"
                              >
                                {deleteMutation.isPending ? '...' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 text-xs font-medium text-neutral-500 rounded hover:bg-neutral-100 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="p-1.5 rounded-md hover:bg-red-50 text-neutral-400 hover:text-red-500 transition"
                              aria-label="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-neutral-400 text-center pt-2">
        {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} total
      </p>
    </div>
  );
}

/* ── Add Item sub-form ───────────────────────────────────────────────────────── */

function AddItemForm({
  newName,
  setNewName,
  newPrice,
  setNewPrice,
  newCategory,
  setNewCategory,
  newUnit,
  setNewUnit,
  newDescription,
  setNewDescription,
  onAdd,
  onCancel,
  isPending,
  existingCategories,
}: {
  newName: string;
  setNewName: (v: string) => void;
  newPrice: string;
  setNewPrice: (v: string) => void;
  newCategory: string;
  setNewCategory: (v: string) => void;
  newUnit: string;
  setNewUnit: (v: string) => void;
  newDescription: string;
  setNewDescription: (v: string) => void;
  onAdd: () => void;
  onCancel: () => void;
  isPending: boolean;
  existingCategories?: string[];
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-neutral-700">Add New Item</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Item name *"
          className="px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
        />
        <input
          type="number"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          placeholder="Default price *"
          step="0.01"
          min="0"
          className="px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Category"
            list="pricebook-categories"
            className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
          />
          {existingCategories && existingCategories.length > 0 && (
            <datalist id="pricebook-categories">
              {existingCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          )}
        </div>
        <select
          value={newUnit}
          onChange={(e) => setNewUnit(e.target.value)}
          className="px-3 py-2.5 border border-neutral-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none"
        >
          <option value="ea">ea</option>
          <option value="hr">hr</option>
          <option value="ft">ft</option>
          <option value="sqft">sqft</option>
          <option value="job">job</option>
        </select>
        <input
          type="text"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Description"
          className="px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onAdd}
          disabled={!newName.trim() || !newPrice || isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50 transition"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add Item
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-neutral-600 rounded-lg hover:bg-neutral-100 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
