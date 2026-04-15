import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Pencil,
  Briefcase,
  FileText,
  Home,
  User,
  Star,
} from 'lucide-react';
import { EditCustomerModal } from '../../components/customers/EditCustomerModal';

const JOB_STATUS_STYLE: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  SCHEDULED: 'bg-purple-100 text-purple-700',
  EN_ROUTE: 'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-neutral-100 text-neutral-500',
};

const INVOICE_STATUS_STYLE: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-600',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-purple-100 text-purple-700',
  paid: 'bg-green-100 text-green-700',
  partially_paid: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

function Section({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
      <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 bg-neutral-50 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-neutral-500 dark:text-gray-400" />
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide dark:text-gray-400">
            {title}
          </h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.getCustomer(id!),
    enabled: !!id,
  });

  const customer = data?.data;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/dashboard/customers')}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-6 dark:text-gray-400"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customers
        </button>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-48" />
          <div className="bg-white rounded-xl border border-neutral-200 p-6 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-neutral-200" />
              <div className="space-y-2">
                <div className="h-5 bg-neutral-200 rounded w-40" />
                <div className="h-4 bg-neutral-100 rounded w-32 dark:bg-white/10" />
                <div className="h-4 bg-neutral-100 rounded w-48 dark:bg-white/10" />
              </div>
            </div>
          </div>
          <div className="h-48 bg-neutral-100 rounded-xl dark:bg-white/10" />
          <div className="h-48 bg-neutral-100 rounded-xl dark:bg-white/10" />
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/dashboard/customers')}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-6 dark:text-gray-400"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customers
        </button>
        <div className="text-center py-16">
          <User className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-base font-medium text-neutral-500 dark:text-gray-400">
            Customer not found
          </p>
          <p className="text-sm text-neutral-400 mt-1 dark:text-gray-500">
            This customer may have been deleted or the link is incorrect.
          </p>
        </div>
      </div>
    );
  }

  const outstandingBalance =
    customer.invoices
      ?.filter((i: any) => i.status !== 'paid' && i.status !== 'PAID')
      .reduce(
        (sum: number, i: any) =>
          sum + Number(i.balanceDue || i.balance_due || i.total || 0),
        0
      ) || 0;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard/customers')}
        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-6 transition-colors dark:text-gray-400"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Customers
      </button>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center dark:bg-blue-500/10">
              <span className="text-xl font-bold text-brand-600 dark:text-blue-300">
                {customer.firstName?.[0] || '?'}
                {customer.lastName?.[0] || ''}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
                  {customer.firstName} {customer.lastName}
                </h1>
                {(customer.jobs?.length ?? 0) >= 3 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full dark:bg-amber-500/20 dark:text-amber-300">
                    <Star className="w-3 h-3" />
                    VIP
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                {customer.phone && (
                  <a
                    href={`tel:${customer.phone}`}
                    className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-brand-600 transition-colors dark:text-gray-300"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {customer.phone}
                  </a>
                )}
                {customer.email && (
                  <a
                    href={`mailto:${customer.email}`}
                    className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-brand-600 transition-colors dark:text-gray-300"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {customer.email}
                  </a>
                )}
              </div>
              {customer.leadSource && (
                <p className="text-xs text-neutral-400 mt-1 dark:text-gray-500">
                  Lead source: <span className="text-neutral-600 dark:text-gray-300">{customer.leadSource}</span>
                </p>
              )}
              {outstandingBalance > 0 && (
                <p className="text-sm font-semibold text-red-600 mt-2 dark:text-red-300">
                  Outstanding balance: {formatCurrency(outstandingBalance)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors dark:text-gray-300 dark:border-white/10 dark:hover:bg-white/10"
              >
                <Phone className="w-3.5 h-3.5" />
                Call
              </a>
            )}
            {customer.email && (
              <a
                href={`mailto:${customer.email}`}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors dark:text-gray-300 dark:border-white/10 dark:hover:bg-white/10"
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </a>
            )}
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors dark:text-gray-300 dark:border-white/10 dark:hover:bg-white/10"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>
        </div>
      </div>

      <EditCustomerModal open={editOpen} onClose={() => setEditOpen(false)} customer={customer} />

      <div className="space-y-6">
        {/* Properties */}
        {customer.properties && customer.properties.length > 0 && (
          <Section title="Properties" icon={Home}>
            <div className="space-y-3">
              {customer.properties.map((prop: any) => (
                <div
                  key={prop.id}
                  className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg dark:bg-white/[0.02]"
                >
                  <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0 dark:text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                      {prop.street}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-gray-400">
                      {prop.city}
                      {prop.state ? `, ${prop.state}` : ''}
                      {prop.zip ? ` ${prop.zip}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Jobs */}
        <Section
          title="Jobs"
          icon={Briefcase}
          action={
            <span className="text-xs text-neutral-400 dark:text-gray-500">
              {customer.jobs?.length || 0} total
            </span>
          }
        >
          {customer.jobs && customer.jobs.length > 0 ? (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="text-left border-b border-neutral-100 dark:border-white/10">
                    <th className="pb-2 text-xs font-semibold text-neutral-500 uppercase dark:text-gray-400">
                      Description
                    </th>
                    <th className="pb-2 text-xs font-semibold text-neutral-500 uppercase dark:text-gray-400">
                      Status
                    </th>
                    <th className="pb-2 text-xs font-semibold text-neutral-500 uppercase dark:text-gray-400">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {customer.jobs
                    .slice()
                    .sort(
                      (a: any, b: any) =>
                        new Date(b.scheduledStart || b.scheduled_start || 0).getTime() -
                        new Date(a.scheduledStart || a.scheduled_start || 0).getTime()
                    )
                    .map((job: any) => {
                      const statusClass =
                        JOB_STATUS_STYLE[job.status] ||
                        'bg-neutral-100 text-neutral-600';
                      const jobDate = job.scheduledStart || job.scheduled_start;
                      return (
                        <tr
                          key={job.id}
                          onClick={() =>
                            navigate(`/dashboard/jobs/${job.id}`)
                          }
                          className="hover:bg-neutral-50 cursor-pointer transition-colors dark:hover:bg-white/10"
                        >
                          <td className="py-3 pr-4">
                            <span className="text-sm text-neutral-900 dark:text-white">
                              {job.description || 'Untitled Job'}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${statusClass}`}
                            >
                              {(job.status || 'unknown')
                                .replace(/_/g, ' ')
                                .toLowerCase()}
                            </span>
                          </td>
                          <td className="py-3 text-sm text-neutral-500 dark:text-gray-400">
                            {jobDate
                              ? format(new Date(jobDate), 'MMM d, yyyy')
                              : '--'}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-neutral-400 text-center py-4 dark:text-gray-500">
              No jobs yet
            </p>
          )}
        </Section>

        {/* Invoices */}
        <Section
          title="Invoices"
          icon={FileText}
          action={
            <span className="text-xs text-neutral-400 dark:text-gray-500">
              {customer.invoices?.length || 0} total
            </span>
          }
        >
          {customer.invoices && customer.invoices.length > 0 ? (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="text-left border-b border-neutral-100 dark:border-white/10">
                    <th className="pb-2 text-xs font-semibold text-neutral-500 uppercase dark:text-gray-400">
                      Invoice #
                    </th>
                    <th className="pb-2 text-xs font-semibold text-neutral-500 uppercase dark:text-gray-400">
                      Amount
                    </th>
                    <th className="pb-2 text-xs font-semibold text-neutral-500 uppercase dark:text-gray-400">
                      Status
                    </th>
                    <th className="pb-2 text-xs font-semibold text-neutral-500 uppercase dark:text-gray-400">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {customer.invoices
                    .slice()
                    .sort(
                      (a: any, b: any) =>
                        new Date(b.createdAt || b.created_at || 0).getTime() -
                        new Date(a.createdAt || a.created_at || 0).getTime()
                    )
                    .map((inv: any) => {
                      const status = (inv.status || 'draft').toLowerCase();
                      const statusClass =
                        INVOICE_STATUS_STYLE[status] ||
                        'bg-neutral-100 text-neutral-600';
                      const invDate =
                        inv.createdAt || inv.created_at || inv.dueDate || inv.due_date;
                      return (
                        <tr
                          key={inv.id}
                          onClick={() =>
                            navigate(`/dashboard/invoices/${inv.id}`)
                          }
                          className="hover:bg-neutral-50 cursor-pointer transition-colors dark:hover:bg-white/10"
                        >
                          <td className="py-3 pr-4">
                            <span className="text-sm font-medium text-brand-600 dark:text-blue-300">
                              {inv.invoiceNumber ||
                                inv.invoice_number ||
                                inv.id?.slice(0, 8)}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-sm font-medium text-neutral-900 dark:text-white">
                            {formatCurrency(Number(inv.total || 0))}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusClass}`}
                            >
                              {status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3 text-sm text-neutral-500 dark:text-gray-400">
                            {invDate
                              ? format(new Date(invDate), 'MMM d, yyyy')
                              : '--'}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-neutral-400 text-center py-4 dark:text-gray-500">
              No invoices yet
            </p>
          )}
        </Section>
      </div>
    </div>
  );
}
