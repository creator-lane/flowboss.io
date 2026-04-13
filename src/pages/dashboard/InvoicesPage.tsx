import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { format } from 'date-fns';
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';
import { CreateInvoiceModal } from '../../components/invoices/CreateInvoiceModal';

type FilterTab = 'all' | 'draft' | 'sent' | 'paid' | 'overdue';

const STATUS_STYLE: Record<string, { badge: string; row?: string }> = {
  draft: { badge: 'bg-neutral-100 text-neutral-600' },
  sent: { badge: 'bg-blue-100 text-blue-700' },
  viewed: { badge: 'bg-purple-100 text-purple-700' },
  paid: { badge: 'bg-green-100 text-green-700' },
  partially_paid: { badge: 'bg-yellow-100 text-yellow-700' },
  overdue: {
    badge: 'bg-red-100 text-red-700',
    row: 'bg-red-50/50',
  },
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  valueColor,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  iconBg: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
          {title}
        </p>
        <p
          className={`text-lg font-bold mt-0.5 ${valueColor || 'text-neutral-900'}`}
        >
          {value}
        </p>
        <p className="text-xs text-neutral-400">{subtitle}</p>
      </div>
    </div>
  );
}

export function InvoicesPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.getInvoices(),
  });

  const invoices = data?.data || [];

  // Compute summary
  const summary = useMemo(() => {
    let totalOutstanding = 0;
    let totalPaid = 0;
    let overdueCount = 0;
    let unpaidCount = 0;
    let paidCount = 0;

    for (const inv of invoices) {
      const total = Number(inv.total || 0);
      const balance = Number(inv.balanceDue ?? inv.balance_due ?? total);
      const status = (inv.status || 'draft').toLowerCase();

      if (status === 'paid') {
        totalPaid += total;
        paidCount++;
      } else {
        totalOutstanding += balance;
        unpaidCount++;
        if (status === 'overdue') overdueCount++;
      }
    }

    return { totalOutstanding, totalPaid, overdueCount, unpaidCount, paidCount };
  }, [invoices]);

  // Client-side filter
  const filtered = useMemo(() => {
    if (filter === 'all') return invoices;
    return invoices.filter((inv: any) => {
      const status = (inv.status || 'draft').toLowerCase();
      return status === filter;
    });
  }, [invoices, filter]);

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: invoices.length },
    {
      key: 'draft',
      label: 'Draft',
      count: invoices.filter((i: any) => i.status === 'draft').length,
    },
    {
      key: 'sent',
      label: 'Sent',
      count: invoices.filter(
        (i: any) => i.status === 'sent' || i.status === 'viewed'
      ).length,
    },
    { key: 'paid', label: 'Paid', count: summary.paidCount },
    { key: 'overdue', label: 'Overdue', count: summary.overdueCount },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Invoices</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {!isLoading && `${invoices.length} total invoices`}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          title="Outstanding"
          value={formatCurrency(summary.totalOutstanding)}
          subtitle={`${summary.unpaidCount} invoice${summary.unpaidCount !== 1 ? 's' : ''}`}
          icon={Clock}
          iconBg="bg-yellow-500"
        />
        <SummaryCard
          title="Collected"
          value={formatCurrency(summary.totalPaid)}
          subtitle={`${summary.paidCount} paid`}
          icon={CheckCircle}
          iconBg="bg-green-500"
          valueColor="text-green-600"
        />
        <SummaryCard
          title="Overdue"
          value={String(summary.overdueCount)}
          subtitle={`${summary.overdueCount} need attention`}
          icon={AlertTriangle}
          iconBg="bg-red-500"
          valueColor={summary.overdueCount > 0 ? 'text-red-600' : undefined}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
              filter === tab.key
                ? 'bg-brand-500 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center font-bold ${
                  filter === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-700">
            Failed to load invoices. Please try again.
          </p>
        </div>
      )}

      {/* Desktop table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase">
                Invoice #
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase">
                Customer
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase">
                Amount
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase">
                Status
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase">
                Due Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-4 bg-neutral-200 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              : filtered.map((inv: any) => {
                  const status = (inv.status || 'draft').toLowerCase();
                  const style = STATUS_STYLE[status] || STATUS_STYLE.draft;
                  const dueDate = inv.dueDate || inv.due_date;

                  return (
                    <tr
                      key={inv.id}
                      onClick={() =>
                        navigate(`/dashboard/invoices/${inv.id}`)
                      }
                      className={`hover:bg-neutral-50 cursor-pointer transition-colors ${style.row || ''}`}
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-brand-600">
                          {inv.invoiceNumber ||
                            inv.invoice_number ||
                            inv.id?.slice(0, 8)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-900">
                        {inv.customer?.firstName} {inv.customer?.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-neutral-900">
                        {formatCurrency(Number(inv.total || 0))}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${style.badge}`}
                        >
                          {status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-500">
                        {dueDate
                          ? format(new Date(dueDate), 'MMM d, yyyy')
                          : '--'}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-neutral-500">
              {filter === 'all'
                ? 'No invoices yet'
                : `No ${filter} invoices`}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {filter === 'all'
                ? 'Create your first invoice to get started'
                : 'Try a different filter'}
            </p>
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-neutral-200 p-4 animate-pulse"
              >
                <div className="h-4 bg-neutral-200 rounded w-24 mb-2" />
                <div className="h-3 bg-neutral-100 rounded w-36 mb-3" />
                <div className="h-5 bg-neutral-200 rounded w-20" />
              </div>
            ))
          : filtered.map((inv: any) => {
              const status = (inv.status || 'draft').toLowerCase();
              const style = STATUS_STYLE[status] || STATUS_STYLE.draft;
              const dueDate = inv.dueDate || inv.due_date;

              return (
                <button
                  key={inv.id}
                  onClick={() =>
                    navigate(`/dashboard/invoices/${inv.id}`)
                  }
                  className={`w-full text-left bg-white rounded-xl border border-neutral-200 p-4 hover:border-brand-300 hover:shadow-md transition-all ${style.row || ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-brand-600">
                      {inv.invoiceNumber ||
                        inv.invoice_number ||
                        inv.id?.slice(0, 8)}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${style.badge}`}
                    >
                      {status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-900 mb-1">
                    {inv.customer?.firstName} {inv.customer?.lastName}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-neutral-900">
                      {formatCurrency(Number(inv.total || 0))}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {dueDate
                        ? `Due ${format(new Date(dueDate), 'MMM d')}`
                        : ''}
                    </span>
                  </div>
                </button>
              );
            })}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-neutral-500">
              {filter === 'all'
                ? 'No invoices yet'
                : `No ${filter} invoices`}
            </p>
          </div>
        )}
      </div>

      <CreateInvoiceModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
