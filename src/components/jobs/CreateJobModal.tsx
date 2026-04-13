import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ChevronDown, Plus, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { api } from '../../lib/api';

interface CreateJobModalProps {
  open: boolean;
  onClose: () => void;
  defaultDate?: Date;
}

export function CreateJobModal({ open, onClose, defaultDate }: CreateJobModalProps) {
  const queryClient = useQueryClient();

  // -- Customer state --
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ first_name: '', last_name: '', phone: '', email: '' });

  // -- Property state --
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isNewProperty, setIsNewProperty] = useState(false);
  const [newProperty, setNewProperty] = useState({ address: '', city: '', state: '', zip: '' });

  // -- Job fields --
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [scheduleDate, setScheduleDate] = useState(
    defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [notes, setNotes] = useState('');

  // Reset defaults when defaultDate changes or modal opens
  // (handled by key on the modal render in parent, or we can reset on open)

  // -- Queries --
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
      const name = `${c.firstName || c.first_name || ''} ${c.lastName || c.last_name || ''}`.toLowerCase();
      return name.includes(q);
    });
  }, [customers, customerSearch]);

  const selectedCustomer = customers.find((c: any) => c.id === selectedCustomerId);
  const customerProperties: any[] = selectedCustomer?.properties || [];

  // -- Mutations --
  const createCustomerMutation = useMutation({
    mutationFn: (data: any) => api.createCustomer(data),
  });

  const createJobMutation = useMutation({
    mutationFn: (data: any) => api.createJob(data),
  });

  const isSubmitting = createCustomerMutation.isPending || createJobMutation.isPending;

  const resetForm = () => {
    setCustomerSearch('');
    setSelectedCustomerId(null);
    setShowCustomerDropdown(false);
    setIsNewCustomer(false);
    setNewCustomer({ first_name: '', last_name: '', phone: '', email: '' });
    setSelectedPropertyId(null);
    setIsNewProperty(false);
    setNewProperty({ address: '', city: '', state: '', zip: '' });
    setDescription('');
    setPriority('NORMAL');
    setScheduleDate(defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
    setStartTime('09:00');
    setEndTime('11:00');
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let customerId = selectedCustomerId;
      let propertyId = selectedPropertyId;

      // 1. Create customer if new
      if (isNewCustomer) {
        const propertyPayload = isNewProperty
          ? newProperty
          : undefined;
        const result = await createCustomerMutation.mutateAsync({
          ...newCustomer,
          property: propertyPayload,
        });
        customerId = result.data?.id;
        // If we created a property along with the customer, we need the property ID
        // The API creates property inline; for now we refetch
        if (propertyPayload) {
          propertyId = null; // Will be linked via customer
        }
      }

      // 2. Create the job
      const scheduledStart = new Date(`${scheduleDate}T${startTime}:00`).toISOString();
      const scheduledEnd = new Date(`${scheduleDate}T${endTime}:00`).toISOString();

      await createJobMutation.mutateAsync({
        customer_id: customerId,
        property_id: propertyId,
        description,
        priority,
        status: 'SCHEDULED',
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        notes: notes || undefined,
      });

      // 3. Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });

      // 4. Close modal
      handleClose();
    } catch (err) {
      console.error('Failed to create job:', err);
    }
  };

  const customerDisplayName = (c: any) =>
    `${c.firstName || c.first_name || ''} ${c.lastName || c.last_name || ''}`.trim() || 'Unnamed';

  return (
    <Modal open={open} onClose={handleClose} title="Create Job" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer Select */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Customer</label>
          {isNewCustomer ? (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-neutral-600">New Customer</span>
                <button
                  type="button"
                  onClick={() => setIsNewCustomer(false)}
                  className="text-xs text-brand-500 hover:text-brand-600"
                >
                  Select existing
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="First name"
                  value={newCustomer.first_name}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, first_name: e.target.value }))}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={newCustomer.last_name}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, last_name: e.target.value }))}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <input
                type="tel"
                placeholder="Phone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer((p) => ({ ...p, phone: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          ) : (
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
                        setIsNewProperty(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    >
                      {customerDisplayName(c)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewCustomer(true);
                      setIsNewProperty(true);
                      setShowCustomerDropdown(false);
                      setCustomerSearch('');
                      setSelectedCustomerId(null);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-brand-500 font-medium hover:bg-brand-50 transition-colors flex items-center gap-2 border-t border-gray-100"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Customer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Property Select */}
        {(selectedCustomerId || isNewCustomer) && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Property</label>
            {isNewProperty ? (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-neutral-600">New Property</span>
                  {!isNewCustomer && customerProperties.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsNewProperty(false)}
                      className="text-xs text-brand-500 hover:text-brand-600"
                    >
                      Select existing
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Address"
                  value={newProperty.address}
                  onChange={(e) => setNewProperty((p) => ({ ...p, address: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="City"
                    value={newProperty.city}
                    onChange={(e) => setNewProperty((p) => ({ ...p, city: e.target.value }))}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={newProperty.state}
                    onChange={(e) => setNewProperty((p) => ({ ...p, state: e.target.value }))}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <input
                    type="text"
                    placeholder="ZIP"
                    value={newProperty.zip}
                    onChange={(e) => setNewProperty((p) => ({ ...p, zip: e.target.value }))}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {customerProperties.length > 0 ? (
                  <select
                    value={selectedPropertyId || ''}
                    onChange={(e) => {
                      if (e.target.value === '__new__') {
                        setIsNewProperty(true);
                        setSelectedPropertyId(null);
                      } else {
                        setSelectedPropertyId(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Select a property...</option>
                    {customerProperties.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.street || p.address || p.city || 'Property'}
                        {p.city ? `, ${p.city}` : ''}
                      </option>
                    ))}
                    <option value="__new__">+ Add New Property</option>
                  </select>
                ) : (
                  <div className="text-sm text-neutral-500 italic">
                    No properties found.{' '}
                    <button
                      type="button"
                      onClick={() => setIsNewProperty(true)}
                      className="text-brand-500 hover:text-brand-600 font-medium not-italic"
                    >
                      Add one
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What needs to be done?"
            rows={3}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            required
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">Urgent</option>
            <option value="EMERGENCY">Emergency</option>
          </select>
        </div>

        {/* Schedule */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Schedule</label>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>
          <div className="flex text-xs text-neutral-400 mt-1 px-1">
            <span className="flex-1">Date</span>
            <span className="flex-1">Start time</span>
            <span className="flex-1">End time</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Notes <span className="font-normal text-neutral-400">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes..."
            rows={2}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
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
            disabled={isSubmitting || (!selectedCustomerId && !isNewCustomer)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Creating...' : 'Create Job'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
