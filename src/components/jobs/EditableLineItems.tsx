import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { Plus, X, Loader2, Check, Save } from 'lucide-react';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface PricebookItem {
  id: string;
  name: string;
  default_price: number;
  unit?: string;
  category?: string;
}

interface EditableLineItemsProps {
  jobId: string;
  initialItems: any[];
  onSave?: () => void;
}

export function EditableLineItems({ jobId, initialItems, onSave }: EditableLineItemsProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  // Normalize initial items
  const normalized = useMemo(
    () =>
      (initialItems || []).map((li: any) => ({
        description: li.description || '',
        quantity: li.quantity || 1,
        unitPrice: li.unitPrice || li.unit_price || 0,
      })),
    [initialItems],
  );

  const [items, setItems] = useState<LineItem[]>(normalized);
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Autocomplete state
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Pricebook query
  const { data: pricebookData } = useQuery({
    queryKey: ['pricebook'],
    queryFn: () => api.getPricebook(),
  });

  const pricebookItems: PricebookItem[] = pricebookData?.data || [];

  // Filtered pricebook items for autocomplete
  const filteredPricebook = useMemo(() => {
    if (!autocompleteQuery.trim()) return pricebookItems.slice(0, 8);
    const q = autocompleteQuery.toLowerCase();
    return pricebookItems.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [pricebookItems, autocompleteQuery]);

  // Reset items when initialItems change (e.g. after refetch)
  useEffect(() => {
    if (!isDirty) {
      setItems(normalized);
    }
  }, [normalized, isDirty]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (lineItems: LineItem[]) =>
      api.saveJobLineItems(
        jobId,
        lineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
        })),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onSave?.();
    },
    onError: (err: any) => addToast(err.message || 'Failed to save line items', 'error'),
  });

  const updateItem = useCallback(
    (index: number, field: keyof LineItem, value: string | number) => {
      setItems((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
      setIsDirty(true);
    },
    [],
  );

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  }, []);

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, { description: '', quantity: 1, unitPrice: 0 }]);
    setIsDirty(true);
  }, []);

  const selectPricebookItem = useCallback(
    (rowIndex: number, pbItem: PricebookItem) => {
      setItems((prev) => {
        const next = [...prev];
        next[rowIndex] = {
          ...next[rowIndex],
          description: pbItem.name,
          unitPrice: pbItem.default_price,
        };
        return next;
      });
      setIsDirty(true);
      setShowDropdown(false);
      setAutocompleteQuery('');
    },
    [],
  );

  const total = items.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);

  const handleSave = () => {
    saveMutation.mutate(items);
  };

  return (
    <div>
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider py-2 pr-2">
                Description
              </th>
              <th className="text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider py-2 px-2 w-20">
                Qty
              </th>
              <th className="text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider py-2 px-2 w-28">
                Unit Price
              </th>
              <th className="text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider py-2 px-2 w-28">
                Total
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-2 pr-2 relative">
                  <div className="relative" ref={activeRow === idx ? dropdownRef : undefined}>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => {
                        updateItem(idx, 'description', e.target.value);
                        setAutocompleteQuery(e.target.value);
                        setActiveRow(idx);
                        setShowDropdown(true);
                      }}
                      onFocus={() => {
                        setActiveRow(idx);
                        setAutocompleteQuery(item.description);
                        setShowDropdown(true);
                      }}
                      placeholder="Description"
                      className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-md text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                    />
                    {showDropdown && activeRow === idx && filteredPricebook.length > 0 && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredPricebook.map((pbItem) => (
                          <button
                            key={pbItem.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectPricebookItem(idx, pbItem);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-brand-50 transition-colors flex items-center justify-between gap-2"
                          >
                            <span className="text-sm text-neutral-700 truncate">{pbItem.name}</span>
                            <span className="text-xs text-neutral-400 whitespace-nowrap">
                              {formatCurrency(pbItem.default_price)}
                              {pbItem.unit ? ` / ${pbItem.unit}` : ''}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="1"
                    className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-md text-sm text-right focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-md text-sm text-right focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                  />
                </td>
                <td className="py-2 px-2 text-right font-medium text-neutral-700 text-sm">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </td>
                <td className="py-2 pl-1">
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1 rounded hover:bg-red-50 text-neutral-400 hover:text-red-500 transition"
                    aria-label="Remove line item"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200">
              <td colSpan={3} className="py-3 pr-2 text-right text-sm font-semibold text-neutral-900">
                Total
              </td>
              <td className="py-3 px-2 text-right text-sm font-bold text-neutral-900">
                {formatCurrency(total)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Line Item
        </button>

        {isDirty && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50 transition"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        )}

        {saveSuccess && (
          <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
            <Check className="w-4 h-4" />
            Saved
          </span>
        )}
      </div>
    </div>
  );
}
