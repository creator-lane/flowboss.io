import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Modal } from '../ui/Modal';

interface EditCustomerModalProps {
  open: boolean;
  onClose: () => void;
  customer: any;
}

export function EditCustomerModal({ open, onClose, customer }: EditCustomerModalProps) {
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Pre-fill when customer changes or modal opens
  useEffect(() => {
    if (customer && open) {
      setFirstName(customer.firstName || '');
      setLastName(customer.lastName || '');
      setPhone(customer.phone || '');
      setEmail(customer.email || '');
    }
  }, [customer, open]);

  const mutation = useMutation({
    mutationFn: (updates: Record<string, string>) =>
      api.updateCustomer(customer.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customer.id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onClose();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({ firstName, lastName, phone, email });
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Customer">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        {/* Error */}
        {mutation.isError && (
          <p className="text-sm text-red-600">Failed to update customer. Please try again.</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
