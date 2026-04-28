import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { Plus, X } from 'lucide-react';
import { addDays, format } from 'date-fns';

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

interface CreateInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  prefillJobId?: string;
  prefillCustomerId?: string;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);

function PricebookAutocomplete({
  value,
  onChange,
  onSelect,
  pricebookItems,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (item: { name: string; default_price: number }) => void;
  pricebookItems: any[];
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!value.trim()) return pricebookItems.slice(0, 8);
    const lower = value.toLowerCase();
    return pricebookItems.filter(
      (item: any) =>
        item.name?.toLowerCase().includes(lower) ||
        item.description?.toLowerCase().includes(lower),
    ).slice(0, 8);
  }, [value, pricebookItems]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => {
          setFocused(true);
          setShowDropdown(true);
        }}
        onBlur={() => setFocused(false)}
        placeholder="Description"
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      />
      {showDropdown && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((item: any) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item);
                setShowDropdown(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-brand-50 transition-colors flex items-center justify-between"
            >
              <span className="text-neutral-700 truncate">{item.name}</span>
              {item.default_price != null && (
                <span className="text-neutral-400 text-xs ml-2 shrink-0">
                  {formatCurrency(Number(item.default_price))}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CreateInvoiceModal({
  open,
  onClose,
  prefillJobId,
  prefillCustomerId,
}: CreateInvoiceModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  // Form state
  const [customerId, setCustomerId] = useState(prefillCustomerId || '');
  const [jobId, setJobId] = useState(prefillJobId || '');
  const [items, setItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0 },
  ]);
  const [taxRate, setTaxRate] = useState(0);
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Queries
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.getCustomers(),
    enabled: open,
  });

  const { data: pricebookData } = useQuery({
    queryKey: ['pricebook'],
    queryFn: () => api.getPricebook(),
    enabled: open,
  });

  const { data: jobData } = useQuery({
    queryKey: ['job', prefillJobId],
    queryFn: () => api.getJob(prefillJobId!),
    enabled: !!prefillJobId && open,
  });

  const customers = customersData?.data || [];
  const pricebookItems = pricebookData?.data || [];
  const job = jobData?.data || jobData;

  // Pre-fill from job data when it loads
  const [jobPrefilled, setJobPrefilled] = useState(false);
  useEffect(() => {
    if (job && prefillJobId && !jobPrefilled && open) {
      const jobLineItems = job.lineItems || [];
      if (jobLineItems.length > 0) {
        setItems(
          jobLineItems.map((li: any) => ({
            description: li.description || '',
            quantity: li.quantity || 1,
            unit_price: li.unitPrice || li.unit_price || 0,
          })),
        );
      }
      if (job.customerId || job.customer_id) {
        setCustomerId(job.customerId || job.customer_id);
      }
      setJobPrefilled(true);
    }
  }, [job, prefillJobId, jobPrefilled, open]);

  // Reset when prefill props change
  useEffect(() => {
    if (prefillCustomerId) setCustomerId(prefillCustomerId);
    if (prefillJobId) setJobId(prefillJobId);
  }, [prefillCustomerId, prefillJobId]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setJobPrefilled(false);
      setSubmitting(false);
      setNotes('');
      setTaxRate(0);
      setDueDate(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
      if (!prefillJobId) {
        setItems([{ description: '', quantity: 1, unit_price: 0 }]);
      }
      if (!prefillCustomerId) {
        setCustomerId('');
      }
      if (!prefillJobId) {
        setJobId('');
      }
    }
  }, [open, prefillJobId, prefillCustomerId]);

  // Calculations
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
    [items],
  );
  const tax = useMemo(() => subtotal * taxRate / 100, [subtotal, taxRate]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  // Line item helpers
  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;
    if (items.every((i) => !i.description.trim())) return;

    setSubmitting(true);
    try {
      const result = await api.createInvoice({
        customer_id: customerId,
        job_id: jobId || null,
        subtotal,
        tax_rate: taxRate,
        tax,
        total,
        balance_due: total,
        due_date: dueDate,
        notes: notes || null,
        status: 'draft',
        lineItems: items
          .filter((i) => i.description.trim())
          .map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unit_price: i.unit_price,
          })),
      });

      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      if (prefillJobId) {
        queryClient.invalidateQueries({ queryKey: ['job-invoices', prefillJobId] });
      }

      // Train the adaptive pricebook — bumps use_count on every line item
      // that matches an existing pricebook row, and inserts new rows for
      // descriptions that don't. The pricebook page sorts by use_count so
      // high-frequency items float to the top, which is the whole point of
      // "adaptive." Mobile does the same in app/invoice/create.tsx; web
      // just never wired it. Don't await — it's a background training
      // step, the invoice is already saved.
      api
        .recordPriceUsage(
          items
            .filter((i) => i.description.trim())
            .map((i) => ({
              description: i.description,
              unitPrice: i.unit_price,
              quantity: i.quantity,
            })),
          'invoice',
          result?.data?.id,
        )
        .catch(() => {/* best-effort, don't block save */});

      onClose();
      if (result?.data?.id) {
        navigate(`/dashboard/invoices/${result.data.id}`);
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to create invoice', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Invoice" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer select */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Customer <span className="text-red-500">*</span>
          </label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
          >
            <option value="">Select a customer...</option>
            {customers.map((c: any) => (
              <option key={c.id} value={c.id}>
                {[c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || c.phone || 'Unnamed'}
              </option>
            ))}
          </select>
        </div>

        {/* Job link (read-only info if prefilled) */}
        {prefillJobId && job && (
          <div className="bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">
            <p className="text-xs font-medium text-brand-600">
              Linked to Job: {job.description || job.title || prefillJobId.slice(0, 8)}
            </p>
          </div>
        )}

        {/* Line Items */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Line Items
          </label>
          <div className="space-y-2">
            {/* Header row (desktop) */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_70px_100px_90px_32px] gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider px-1">
              <span>Description</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Unit Price</span>
              <span className="text-right">Total</span>
              <span />
            </div>

            {items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-[1fr_70px_100px_90px_32px] gap-2 items-start"
              >
                <PricebookAutocomplete
                  value={item.description}
                  onChange={(v) => updateItem(idx, 'description', v)}
                  onSelect={(pbItem) => {
                    updateItem(idx, 'description', pbItem.name);
                    if (pbItem.default_price != null) {
                      updateItem(idx, 'unit_price', Number(pbItem.default_price));
                    }
                  }}
                  pricebookItems={pricebookItems}
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(idx, 'quantity', Math.max(0, Number(e.target.value)))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-right text-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) =>
                    updateItem(idx, 'unit_price', Math.max(0, Number(e.target.value)))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-right text-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <div className="flex items-center justify-end h-[38px] text-sm font-medium text-neutral-700 px-1">
                  {formatCurrency(item.quantity * item.unit_price)}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={items.length <= 1}
                  className="flex items-center justify-center w-8 h-[38px] rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Remove line item"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Line Item
            </button>
          </div>
        </div>

        {/* Totals */}
        <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Subtotal</span>
            <span className="font-medium text-neutral-900">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm gap-3">
            <span className="text-neutral-500">Tax Rate</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(Math.max(0, Number(e.target.value)))}
                className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-sm text-right text-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              <span className="text-neutral-400 text-sm">%</span>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Tax</span>
            <span className="font-medium text-neutral-700">{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-neutral-200">
            <span className="font-semibold text-neutral-900">Total</span>
            <span className="font-bold text-neutral-900 text-base">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full sm:w-48 rounded-lg border border-gray-200 px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Notes <span className="text-neutral-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes for this invoice..."
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !customerId}
            className="px-5 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
