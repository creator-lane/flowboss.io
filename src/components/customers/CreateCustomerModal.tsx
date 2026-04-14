import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { api } from '../../lib/api';
import { useToast } from '../ui/Toast';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'DC',
];

const initialForm = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  street: '',
  city: '',
  state: '',
  zip: '',
};

export function CreateCustomerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [showProperty, setShowProperty] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () =>
      api.createCustomer({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        property: showProperty
          ? {
              address: form.street.trim(),
              city: form.city.trim(),
              state: form.state,
              zip: form.zip.trim(),
            }
          : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      addToast('Customer created', 'success');
      handleClose();
    },
    onError: (err: any) => addToast(err.message || 'Failed to create customer', 'error'),
  });

  const handleClose = () => {
    setForm(initialForm);
    setShowProperty(false);
    mutation.reset();
    onClose();
  };

  const canSubmit = form.firstName.trim() && form.lastName.trim() && !mutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    mutation.mutate();
  };

  const inputCls =
    'w-full px-3 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-neutral-400';
  const labelCls = 'block text-sm font-medium text-neutral-700 mb-1';

  return (
    <Modal open={open} onClose={handleClose} title="Add Customer">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.firstName}
              onChange={set('firstName')}
              placeholder="John"
              className={inputCls}
              autoFocus
            />
          </div>
          <div>
            <label className={labelCls}>
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.lastName}
              onChange={set('lastName')}
              placeholder="Smith"
              className={inputCls}
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className={labelCls}>Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            placeholder="(555) 123-4567"
            className={inputCls}
          />
        </div>

        {/* Email */}
        <div>
          <label className={labelCls}>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="john@example.com"
            className={inputCls}
          />
        </div>

        {/* Property toggle */}
        <button
          type="button"
          onClick={() => setShowProperty((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          {showProperty ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {showProperty ? 'Remove Property' : 'Add Property'}
        </button>

        {/* Property fields */}
        {showProperty && (
          <div className="space-y-3 pl-1 border-l-2 border-brand-100 ml-1 pl-4">
            <div>
              <label className={labelCls}>Street Address</label>
              <input
                type="text"
                value={form.street}
                onChange={set('street')}
                placeholder="123 Main St"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={set('city')}
                  placeholder="Austin"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <select
                  value={form.state}
                  onChange={set('state')}
                  className={inputCls}
                >
                  <option value="">--</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Zip Code</label>
                <input
                  type="text"
                  value={form.zip}
                  onChange={set('zip')}
                  placeholder="78701"
                  className={inputCls}
                  maxLength={10}
                />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {mutation.isError && (
          <p className="text-sm text-red-600">
            Failed to create customer. Please try again.
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {mutation.isPending ? 'Creating...' : 'Create Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
