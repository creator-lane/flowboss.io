import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { CreateCustomerModal } from '../../components/customers/CreateCustomerModal';
import { EmptyState } from '../../components/ui/EmptyState';
import { QueryErrorState } from '../../components/ui/QueryErrorState';
import {
  Search,
  Plus,
  Phone,
  MapPin,
  Users,
  X,
  Briefcase,
  DollarSign,
} from 'lucide-react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 animate-pulse dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-full bg-neutral-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-neutral-200 rounded w-36" />
          <div className="h-3 bg-neutral-100 rounded w-28 dark:bg-white/10" />
          <div className="h-3 bg-neutral-100 rounded w-40 dark:bg-white/10" />
        </div>
        <div className="space-y-2 text-right">
          <div className="h-3 bg-neutral-100 rounded w-14 ml-auto dark:bg-white/10" />
          <div className="h-3 bg-neutral-100 rounded w-16 ml-auto dark:bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export function CustomersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customers', debouncedSearch],
    queryFn: () =>
      api.getCustomers(
        debouncedSearch ? { search: debouncedSearch } : undefined
      ),
  });
  void error; // retained for future error-message plumbing; consumed via QueryErrorState

  const customers = data?.data || [];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Customers</h1>
          <p className="text-sm text-neutral-500 mt-1 dark:text-gray-400">
            {!isLoading && `${customers.length} customer${customers.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm dark:shadow-black/30"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      <CreateCustomerModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-neutral-400 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10 dark:focus:ring-blue-400"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 dark:bg-red-500/10 dark:border-red-500/30">
          <p className="text-sm text-red-700 dark:text-red-300">
            Failed to load customers. Please try again.
          </p>
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Query error */}
      {!isLoading && isError && (
        <QueryErrorState
          title="Couldn't load customers"
          description="We hit an error reaching the server. Your customers are safe — this is just a display problem."
          onRetry={() => refetch()}
        />
      )}

      {/* Customer grid */}
      {!isLoading && customers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customers.map((customer: any) => {
            const jobCount =
              customer._count?.jobs ?? customer.jobs?.length ?? 0;
            const balance =
              customer.invoices
                ?.filter((i: any) => i.status !== 'paid' && i.status !== 'PAID')
                .reduce(
                  (sum: number, i: any) =>
                    sum + Number(i.balanceDue || i.balance_due || i.total || 0),
                  0
                ) || 0;
            const property = customer.properties?.[0];

            return (
              <button
                key={customer.id}
                onClick={() =>
                  navigate(`/dashboard/customers/${customer.id}`)
                }
                className="bg-white rounded-xl border border-neutral-200 p-5 hover:border-brand-300 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-0.5 transition-all duration-200 text-left w-full group dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-100 transition-colors dark:bg-blue-500/10">
                    <span className="text-sm font-bold text-brand-600 dark:text-blue-300">
                      {customer.firstName?.[0] || '?'}
                      {customer.lastName?.[0] || ''}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate dark:text-white">
                      {customer.firstName} {customer.lastName}
                    </p>
                    {customer.phone && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Phone className="w-3 h-3 text-neutral-400 flex-shrink-0 dark:text-gray-500" />
                        <span className="text-xs text-neutral-500 truncate dark:text-gray-400">
                          {customer.phone}
                        </span>
                      </div>
                    )}
                    {property && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-neutral-400 flex-shrink-0 dark:text-gray-500" />
                        <span className="text-xs text-neutral-400 truncate dark:text-gray-500">
                          {property.city}
                          {property.state ? `, ${property.state}` : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-gray-400">
                      <Briefcase className="w-3 h-3" />
                      <span className="font-medium">
                        {jobCount} job{jobCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {balance > 0 && (
                      <div className="flex items-center gap-1 text-xs text-red-600 font-semibold dark:text-red-300">
                        <DollarSign className="w-3 h-3" />
                        <span>${balance.toFixed(0)} due</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty state (only when query succeeded with zero rows — not when it failed) */}
      {!isLoading && !isError && customers.length === 0 && (
        debouncedSearch ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-base font-medium text-neutral-500 dark:text-gray-400">
              No customers match your search
            </p>
            <p className="text-sm text-neutral-400 mt-1 dark:text-gray-500">
              Try a different search term
            </p>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No customers yet"
            description="Add your first customer to start creating jobs, sending invoices, and building your client list."
            actionLabel="Add Your First Customer"
            onAction={() => setShowCreateModal(true)}
            accentColor="brand"
          />
        )
      )}
    </div>
  );
}
