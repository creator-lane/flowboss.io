import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { format } from 'date-fns';
import {
  ArrowLeft,
  HardHat,
  Phone,
  Mail,
  Pencil,
  Trash2,
  Briefcase,
  DollarSign,
  TrendingUp,
  Loader2,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);

const JOB_STATUS_STYLE: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  SCHEDULED: 'bg-purple-100 text-purple-700',
  EN_ROUTE: 'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-neutral-100 text-neutral-500',
};

export function ContractorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    company_name: '',
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  const { data: contractorRaw, isLoading } = useQuery({
    queryKey: ['contractor', id],
    queryFn: () => api.getContractor(id!),
    enabled: !!id,
  });

  const { data: statsRaw } = useQuery({
    queryKey: ['contractor-stats', id],
    queryFn: () => api.getContractorStats(id!),
    enabled: !!id,
  });

  // Fetch jobs linked to this contractor
  const { data: jobsRaw } = useQuery({
    queryKey: ['contractor-jobs', id],
    queryFn: async () => {
      // We'll use the supabase client through a simple approach
      // Since we don't have a dedicated API method, we use getContractorStats which fetches jobs
      // For now, use a workaround: fetch from getTodaysJobs with month range and filter
      const result = await api.getTodaysJobs(undefined, 'month');
      const allJobs = result?.data || [];
      return allJobs.filter((j: any) => (j.contractorId || j.contractor_id) === id);
    },
    enabled: !!id,
  });

  const contractor = contractorRaw?.data;
  const stats = statsRaw?.data;
  const linkedJobs = jobsRaw || [];

  const updateMutation = useMutation({
    mutationFn: (updates: any) => api.updateContractor(id!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor', id] });
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      addToast('Contractor updated', 'success');
      setEditing(false);
    },
    onError: (err: any) => addToast(err.message || 'Failed to update contractor', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteContractor(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      addToast('Contractor deleted', 'success');
      navigate('/dashboard/contractors');
    },
    onError: (err: any) => addToast(err.message || 'Failed to delete contractor', 'error'),
  });

  const startEditing = () => {
    if (!contractor) return;
    setEditForm({
      company_name: contractor.companyName || contractor.company_name || '',
      name: contractor.name || '',
      phone: contractor.phone || '',
      email: contractor.email || '',
      notes: contractor.notes || '',
    });
    setEditing(true);
  };

  const saveEdits = () => {
    updateMutation.mutate(editForm);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => navigate('/dashboard/contractors')}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contractors
        </button>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-32 bg-gray-100 rounded-xl" />
          <div className="h-32 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto text-center py-20">
        <AlertTriangle className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
        <p className="text-neutral-500">Contractor not found</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard/contractors')}
          className="mt-4 text-sm text-brand-500 hover:text-brand-600 font-medium"
        >
          Back to Contractors
        </button>
      </div>
    );
  }

  const companyName = contractor.companyName || contractor.company_name || 'Unnamed Company';
  const jobCount = stats?.jobCount || 0;
  const totalRevenue = stats?.totalRevenue || 0;
  const avgTicket = jobCount > 0 ? totalRevenue / jobCount : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate('/dashboard/contractors')}
        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Contractors
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Company Name</label>
                <input
                  type="text"
                  value={editForm.company_name}
                  onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Notes</label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={saveEdits}
                disabled={updateMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
              >
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="inline-flex items-center gap-2 px-4 py-2 text-neutral-700 hover:bg-gray-100 rounded-lg text-sm font-medium"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                <HardHat className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">{companyName}</h1>
                {contractor.name && (
                  <p className="text-sm text-neutral-500 mt-0.5">{contractor.name}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  {contractor.phone && (
                    <a
                      href={`tel:${contractor.phone}`}
                      className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-brand-600 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {contractor.phone}
                    </a>
                  )}
                  {contractor.email && (
                    <a
                      href={`mailto:${contractor.email}`}
                      className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-brand-600 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {contractor.email}
                    </a>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={startEditing}
              className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Total Jobs</p>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{jobCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Total Revenue</p>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Avg Ticket</p>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{formatCurrency(avgTicket)}</p>
        </div>
      </div>

      {/* Notes */}
      {contractor.notes && !editing && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-2">Notes</h3>
          <p className="text-sm text-neutral-600 whitespace-pre-wrap">{contractor.notes}</p>
        </div>
      )}

      {/* Linked jobs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-neutral-400" />
            Linked Jobs ({linkedJobs.length})
          </h3>
        </div>
        {linkedJobs.length === 0 ? (
          <div className="p-8 text-center">
            <Briefcase className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">No jobs linked to this contractor yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {linkedJobs.map((job: any) => {
              const customerName =
                [job.customer?.firstName || job.customer?.first_name, job.customer?.lastName || job.customer?.last_name]
                  .filter(Boolean)
                  .join(' ') || 'Unknown Customer';
              const statusCls = JOB_STATUS_STYLE[job.status] || JOB_STATUS_STYLE.SCHEDULED;

              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
                  className="w-full text-left px-5 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{customerName}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {job.description || 'No description'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCls}`}>
                      {(job.status || 'SCHEDULED').replace(/_/g, ' ')}
                    </span>
                    {(job.scheduledStart || job.scheduled_start) && (
                      <span className="text-xs text-neutral-400">
                        {format(new Date(job.scheduledStart || job.scheduled_start), 'MMM d')}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">Actions</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-neutral-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit Contractor
          </button>

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Contractor
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600 font-medium">Are you sure?</span>
              <button
                type="button"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-2 text-sm text-neutral-500 hover:text-neutral-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
