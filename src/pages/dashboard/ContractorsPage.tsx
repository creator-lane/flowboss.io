import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  Search,
  Plus,
  HardHat,
  ChevronRight,
  Phone,
  Mail,
  Briefcase,
  DollarSign,
} from 'lucide-react';
import { CreateContractorModal } from '../../components/contractors/CreateContractorModal';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-40 mb-3" />
      <div className="h-4 bg-gray-100 rounded w-32 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-48 mb-3" />
      <div className="flex gap-2">
        <div className="h-5 bg-gray-200 rounded-full w-20" />
        <div className="h-5 bg-gray-100 rounded w-24" />
      </div>
    </div>
  );
}

export function ContractorsPage() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const { data: raw, isLoading } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => api.getContractorsWithStats(),
  });

  const allContractors: any[] = useMemo(() => {
    const list = raw?.data || raw || [];
    return Array.isArray(list) ? list : [];
  }, [raw]);

  const filteredContractors = useMemo(() => {
    if (!search.trim()) return allContractors;
    const q = search.toLowerCase();
    return allContractors.filter((c: any) => {
      const companyName = (c.companyName || c.company_name || '').toLowerCase();
      const contactName = (c.name || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      return companyName.includes(q) || contactName.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [allContractors, search]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Contractors</h1>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Contractor
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search contractors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-neutral-400"
        />
      </div>

      {/* Contractor cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredContractors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <HardHat className="w-12 h-12 text-neutral-300 mb-4" />
          <p className="text-lg font-medium text-neutral-500 mb-1">No contractors found</p>
          <p className="text-sm text-neutral-400 mb-6">
            {allContractors.length === 0
              ? 'Add your first contractor to track subcontractor relationships.'
              : 'Try adjusting your search.'}
          </p>
          {allContractors.length === 0 && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Contractor
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredContractors.map((contractor: any) => (
            <button
              key={contractor.id}
              type="button"
              onClick={() => navigate(`/dashboard/contractors/${contractor.id}`)}
              className="w-full text-left bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-neutral-900 truncate">
                    {contractor.companyName || contractor.company_name || 'Unnamed Company'}
                  </h3>
                  {contractor.name && (
                    <p className="text-xs text-neutral-500 mt-0.5">{contractor.name}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-300 mt-0.5 flex-shrink-0 group-hover:text-neutral-500 transition-colors" />
              </div>

              <div className="space-y-1 mb-3">
                {contractor.phone && (
                  <p className="text-xs text-neutral-400 flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />
                    {contractor.phone}
                  </p>
                )}
                {contractor.email && (
                  <p className="text-xs text-neutral-400 flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{contractor.email}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-medium">
                  <Briefcase className="w-3 h-3" />
                  {contractor.jobCount || 0} jobs
                </span>
                {(contractor.totalRevenue || 0) > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs font-medium">
                    <DollarSign className="w-3 h-3" />
                    {formatCurrency(contractor.totalRevenue)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Result count */}
      {!isLoading && filteredContractors.length > 0 && (
        <p className="text-xs text-neutral-400 text-center mt-6">
          Showing {filteredContractors.length} contractor{filteredContractors.length !== 1 ? 's' : ''}
        </p>
      )}

      <CreateContractorModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </div>
  );
}
