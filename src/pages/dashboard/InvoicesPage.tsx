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
import { EmptyState } from '../../components/ui/EmptyState';
import { InvoiceIllustration } from '../../components/ui/illustrations/InvoiceIllustration';
import { QueryErrorState } from '../../components/ui/QueryErrorState';
import { SpotlightTip } from '../../components/ui/SpotlightTip';
import { isOverdue, isPaid, isDraft, isSent } from '../../lib/invoiceStatus';
import { DemoChip } from '../../components/ui/DemoChip';

type FilterTab = 'all' | 'draft' | 'sent' | 'paid' | 'overdue';

const STATUS_STYLE: Record<string, { badge: string; dot: string; row?: string }> = {
  draft: { badge: 'bg-neutral-50 text-neutral-600 ring-1 ring-inset ring-neutral-500/20', dot: 'bg-neutral-400' },
  sent: { badge: 'bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-500/20', dot: 'bg-blue-500' },
  viewed: { badge: 'bg-purple-50 text-purple-600 ring-1 ring-inset ring-purple-500/20', dot: 'bg-purple-500' },
  paid: { badge: 'bg-green-50 text-green-600 ring-1 ring-inset ring-green-500/20', dot: 'bg-green-500' },
  partially_paid: { badge: 'bg-yellow-50 text-yellow-600 ring-1 ring-inset ring-yellow-500/20', dot: 'bg-yellow-500' },
  overdue: {
    badge: 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-500/20',
    dot: 'bg-red-500',
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
    <div className="bg-white rounded-xl border border-neutral-200 p-5 flex items-center gap-4 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide dark:text-gray-400">
          {title}
        </p>
        <p
          className={`text-lg font-bold mt-0.5 ${valueColor || 'text-neutral-900'}`}
        >
          {value}
        </p>
        <p className="text-xs text-neutral-400 dark:text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

export function InvoicesPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.getInvoices(),
  });
  void error;

  const invoices = data?.data || [];

  // Compute summary — use the shared helpers so this agrees with CommandCenter.
  const summary = useMemo(() => {
    let totalOutstanding = 0;
    let totalPaid = 0;
    let overdueCount = 0;
    let unpaidCount = 0;
    let paidCount = 0;
    const now = new Date();

    for (const inv of invoices) {
      const total = Number(inv.total || 0);
      const balance = Number(inv.balanceDue ?? inv.balance_due ?? total);

      if (isPaid(inv)) {
        totalPaid += total;
        paidCount++;
      } else {
        totalOutstanding += balance;
        unpaidCount++;
        if (isOverdue(inv, now)) overdueCount++;
      }
    }

    return { totalOutstanding, totalPaid, overdueCount, unpaidCount, paidCount };
  }, [invoices]);

  // Client-side filter — matches the tab count logic (treat viewed as sent, use
  // date-based overdue detection instead of status-string literal).
  const filtered = useMemo(() => {
    if (filter === 'all') return invoices;
    const now = new Date();
    return invoices.filter((inv: any) => {
      switch (filter) {
        case 'paid': return isPaid(inv);
        case 'draft': return isDraft(inv);
        case 'sent': return isSent(inv);
        case 'overdue': return isOverdue(inv, now);
        default: return true;
      }
    });
  }, [invoices, filter]);

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: invoices.length },
    {
      key: 'draft',
      label: 'Draft',
      count: invoices.filter((i: any) => isDraft(i)).length,
    },
    {
      key: 'sent',
      label: 'Sent',
      count: invoices.filter((i: any) => isSent(i)).length,
    },
    { key: 'paid', label: 'Paid', count: summary.paidCount },
    { key: 'overdue', label: 'Overdue', count: summary.overdueCount },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Invoices</h1>
          <p className="text-sm text-neutral-500 mt-1 dark:text-gray-400">
            {!isLoading && `${invoices.length} total invoices`}
          </p>
        </div>
        <SpotlightTip
          tipId="invoices-create-btn"
          title="Bill your customers"
          message="Create invoices with line items, tax, and payment links. FlowBoss tracks who's paid."
          position="left"
        >
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm dark:shadow-black/30"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </SpotlightTip>
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
            } dark:text-gray-300`}
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

      {/* Error — replaces empty state when the fetch failed. */}
      {isError && (
        <QueryErrorState
          title="Couldn't load invoices"
          description="We hit an error reaching the server. Your invoices are safe — this is just a display problem."
          onRetry={() => refetch()}
        />
      )}

      {/* Desktop table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden hidden md:block dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[0.02]">
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase dark:text-gray-400">
                Invoice #
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase dark:text-gray-400">
                Customer
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase dark:text-gray-400">
                Amount
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase dark:text-gray-400">
                Status
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase dark:text-gray-400">
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
                  const rawStatus = (inv.status || 'draft').toLowerCase();
                  // Treat date-past-due invoices as overdue visually even if the
                  // server hasn't flipped the status flag yet. Consistent with
                  // CommandCenterPage and the tab count.
                  const effectiveStatus = isOverdue(inv) ? 'overdue' : rawStatus;
                  const style = STATUS_STYLE[effectiveStatus] || STATUS_STYLE.draft;
                  const dueDate = inv.dueDate || inv.due_date;

                  return (
                    <tr
                      key={inv.id}
                      onClick={() =>
                        navigate(`/dashboard/invoices/${inv.id}`)
                      }
                      className={`hover:bg-neutral-50 cursor-pointer transition-colors dark:hover:bg-white/10 ${style.row || ''}`}
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-brand-600 dark:text-blue-300">
                          {inv.invoiceNumber ||
                            inv.invoice_number ||
                            inv.id?.slice(0, 8)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>
                            {inv.customer?.firstName} {inv.customer?.lastName}
                          </span>
                          <DemoChip record={inv} compact />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-neutral-900 dark:text-white">
                        {formatCurrency(Number(inv.total || 0))}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${style.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {effectiveStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-500 dark:text-gray-400">
                        {dueDate
                          ? format(new Date(dueDate), 'MMM d, yyyy')
                          : '--'}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>

        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState
            illustration={<InvoiceIllustration className="w-full h-full" />}
            title="Nobody owes you money"
            description="Create an invoice and FlowBoss handles the math, sends the payment link, and pings you the moment it's paid."
            actionLabel="Create Your First Invoice"
            onAction={() => setShowCreateModal(true)}
            accentColor="emerald"
          />
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-neutral-200 p-4 animate-pulse dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10"
              >
                <div className="h-4 bg-neutral-200 rounded w-24 mb-2" />
                <div className="h-3 bg-neutral-100 rounded w-36 mb-3 dark:bg-white/10" />
                <div className="h-5 bg-neutral-200 rounded w-20" />
              </div>
            ))
          : filtered.map((inv: any) => {
              const rawStatus = (inv.status || 'draft').toLowerCase();
              const effectiveStatus = isOverdue(inv) ? 'overdue' : rawStatus;
              const style = STATUS_STYLE[effectiveStatus] || STATUS_STYLE.draft;
              const dueDate = inv.dueDate || inv.due_date;

              return (
                <button
                  key={inv.id}
                  onClick={() =>
                    navigate(`/dashboard/invoices/${inv.id}`)
                  }
                  className={`w-full text-left bg-white rounded-xl border border-neutral-200 p-4 hover:border-brand-300 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-0.5 transition-all duration-200 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10 ${style.row || ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-brand-600 dark:text-blue-300">
                      {inv.invoiceNumber ||
                        inv.invoice_number ||
                        inv.id?.slice(0, 8)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${style.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {effectiveStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-neutral-900 dark:text-white">
                      {inv.customer?.firstName} {inv.customer?.lastName}
                    </p>
                    <DemoChip record={inv} compact />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-neutral-900 dark:text-white">
                      {formatCurrency(Number(inv.total || 0))}
                    </span>
                    <span className="text-xs text-neutral-400 dark:text-gray-500">
                      {dueDate
                        ? `Due ${format(new Date(dueDate), 'MMM d')}`
                        : ''}
                    </span>
                  </div>
                </button>
              );
            })}

        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState
            illustration={<InvoiceIllustration className="w-full h-full" />}
            title="Nobody owes you money"
            description="Create an invoice and FlowBoss handles the math, sends the payment link, and pings you the moment it's paid."
            actionLabel="Create Your First Invoice"
            onAction={() => setShowCreateModal(true)}
            accentColor="emerald"
          />
        )}
      </div>

      <CreateInvoiceModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
