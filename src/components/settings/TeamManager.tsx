import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Users, Plus, Trash2, Mail, Phone, Shield, UserCog, Wrench, Loader2 } from 'lucide-react';
import { ConfirmDialog } from '../ui/ConfirmDialog';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'technician', label: 'Technician' },
  { value: 'member', label: 'Member' },
];

const ROLE_BADGES: Record<string, { label: string; color: string }> = {
  owner: { label: 'Owner', color: 'bg-purple-100 text-purple-700' },
  admin: { label: 'Admin', color: 'bg-blue-100 text-blue-700' },
  project_manager: { label: 'Project Manager', color: 'bg-amber-100 text-amber-700' },
  technician: { label: 'Technician', color: 'bg-green-100 text-green-700' },
  member: { label: 'Member', color: 'bg-gray-100 text-gray-600' },
};

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  invited: { label: 'Invited', color: 'bg-yellow-100 text-yellow-700' },
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
};

export function TeamManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('member');
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => api.getTeamMembersWeb(),
  });

  const members = data?.data || [];

  const addMutation = useMutation({
    mutationFn: (member: { name: string; email?: string; phone?: string; role: string }) =>
      api.addTeamMember(member),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      setName('');
      setEmail('');
      setPhone('');
      setRole('member');
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      api.updateTeamMember(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.removeTeamMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      setConfirmRemove(null);
    },
  });

  const handleAdd = () => {
    if (!name.trim()) return;
    addMutation.mutate({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      role,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-500" />
          <h2 className="text-lg font-bold text-neutral-900">Team Members</h2>
          {members.length > 0 && (
            <span className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
              {members.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-700">Invite a Team Member</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white appearance-none"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAdd}
              disabled={!name.trim() || addMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50 transition"
            >
              {addMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Member
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-neutral-300 text-neutral-600 text-sm font-medium rounded-lg hover:bg-neutral-50 transition"
            >
              Cancel
            </button>
            {addMutation.isError && (
              <span className="text-sm text-red-600">Failed to add member. Please try again.</span>
            )}
          </div>
        </div>
      )}

      {/* Members list */}
      {members.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
          <Users className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-neutral-500">No team members yet.</p>
          <p className="text-xs text-neutral-400 mt-1">Invite your first team member.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
          {members.map((m: any) => {
            const roleCfg = ROLE_BADGES[m.role] || ROLE_BADGES.member;
            const statusCfg = STATUS_BADGES[m.status] || STATUS_BADGES.invited;
            return (
              <div key={m.id} className="flex items-center gap-4 px-5 py-4">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-600 font-bold text-sm">
                    {(m.name?.[0] || '?').toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">{m.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {m.email && (
                      <span className="flex items-center gap-1 text-xs text-neutral-400 truncate">
                        <Mail className="w-3 h-3" />
                        {m.email}
                      </span>
                    )}
                    {m.phone && (
                      <span className="flex items-center gap-1 text-xs text-neutral-400">
                        <Phone className="w-3 h-3" />
                        {m.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Role select */}
                <select
                  value={m.role}
                  onChange={(e) => updateMutation.mutate({ id: m.id, updates: { role: e.target.value } })}
                  className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>

                {/* Status badge */}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                  {statusCfg.label}
                </span>

                {/* Remove */}
                <button
                  onClick={() => setConfirmRemove(m.id)}
                  className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="Remove member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm remove dialog */}
      <ConfirmDialog
        open={!!confirmRemove}
        title="Remove Team Member"
        message="Are you sure you want to remove this team member? This action cannot be undone."
        confirmLabel="Remove"
        variant="danger"
        loading={removeMutation.isPending}
        onConfirm={() => confirmRemove && removeMutation.mutate(confirmRemove)}
        onCancel={() => setConfirmRemove(null)}
      />
    </div>
  );
}
