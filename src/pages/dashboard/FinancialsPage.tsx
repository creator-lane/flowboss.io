import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { format } from 'date-fns';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Briefcase,
  AlertCircle,
} from 'lucide-react';

type Period = 'week' | 'month' | 'year';

const PERIOD_LABELS: Record<Period, string> = {
  week: 'This Week',
  month: 'This Month',
  year: 'This Year',
};

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-neutral-200 p-5 animate-pulse ${className}`}>
      <div className="h-3 bg-neutral-200 rounded w-20 mb-3" />
      <div className="h-7 bg-neutral-200 rounded w-28" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 animate-pulse">
      <div className="h-4 bg-neutral-200 rounded w-32 flex-1" />
      <div className="h-4 bg-neutral-200 rounded w-20" />
      <div className="h-4 bg-neutral-100 rounded w-24" />
    </div>
  );
}

export function FinancialsPage() {
  const [period, setPeriod] = useState<Period>('month');

  const { data, isLoading } = useQuery({
    queryKey: ['financials', period],
    queryFn: () => api.getFinancials(period),
  });

  const fin = data?.data;
  const revenue = fin?.revenue ?? 0;
  const expenses = fin?.expenses ?? 0;
  const profit = revenue - expenses;
  const outstanding = fin?.outstanding ?? 0;
  const jobsCompleted = fin?.jobsCompleted ?? 0;
  const recentPayments = fin?.recentPayments || [];
  const recentExpenses = fin?.recentExpenses || [];

  // Invoice breakdown: paid = revenue, outstanding, overdue (estimate: outstanding > 30 days)
  const totalInvoiceValue = revenue + outstanding;
  const paidPct = totalInvoiceValue > 0 ? (revenue / totalInvoiceValue) * 100 : 0;
  const outstandingPct = totalInvoiceValue > 0 ? (outstanding / totalInvoiceValue) * 100 : 0;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Financials</h1>

        {/* Period Tabs */}
        <div className="flex bg-neutral-100 rounded-lg p-1">
          {(['week', 'month', 'year'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                period === p
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Revenue */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 border-l-4 border-l-green-500">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-sm font-semibold text-neutral-500">Revenue</span>
            </div>
            <p className="text-2xl font-extrabold text-green-600">{formatCurrency(revenue)}</p>
          </div>

          {/* Expenses */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 border-l-4 border-l-red-500">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-neutral-500">Expenses</span>
            </div>
            <p className="text-2xl font-extrabold text-red-600">{formatCurrency(expenses)}</p>
          </div>

          {/* Net Profit */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 border-l-4 border-l-blue-500">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-neutral-500">Net Profit</span>
            </div>
            <p className={`text-2xl font-extrabold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(profit)}
            </p>
          </div>

          {/* Jobs Completed */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 border-l-4 border-l-neutral-400">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-4 h-4 text-neutral-500" />
              <span className="text-sm font-semibold text-neutral-500">Jobs Completed</span>
            </div>
            <p className="text-2xl font-extrabold text-neutral-900">{jobsCompleted}</p>
          </div>
        </div>
      )}

      {/* Outstanding Balance */}
      {isLoading ? (
        <div className="mb-6">
          <SkeletonCard />
        </div>
      ) : (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 mb-6 flex items-center gap-4">
          <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-700">Outstanding Invoices</p>
            <p className="text-xs text-neutral-500">Unpaid invoices total</p>
          </div>
          <p className="text-xl font-extrabold text-amber-600">{formatCurrency(outstanding)}</p>
        </div>
      )}

      {/* Invoice Status Breakdown */}
      {isLoading ? (
        <div className="mb-6">
          <SkeletonCard />
        </div>
      ) : totalInvoiceValue > 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-5 mb-6">
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-4">
            Invoice Breakdown
          </h2>
          {/* Bar */}
          <div className="flex h-4 rounded-full overflow-hidden bg-neutral-100 mb-3">
            {paidPct > 0 && (
              <div
                className="bg-green-500 transition-all duration-500"
                style={{ width: `${paidPct}%` }}
              />
            )}
            {outstandingPct > 0 && (
              <div
                className="bg-blue-500 transition-all duration-500"
                style={{ width: `${outstandingPct}%` }}
              />
            )}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-neutral-600">Paid</span>
              <span className="font-semibold text-neutral-900">{formatCurrency(revenue)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-neutral-600">Outstanding</span>
              <span className="font-semibold text-neutral-900">{formatCurrency(outstanding)}</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Recent Payments */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 mb-6">
        <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-4">
          Recent Payments
        </h2>
        {isLoading ? (
          <div className="space-y-1">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : recentPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b border-neutral-200">
                  <th className="pb-2 font-semibold">Customer</th>
                  <th className="pb-2 font-semibold text-right">Amount</th>
                  <th className="pb-2 font-semibold text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((p: any) => (
                  <tr key={p.id} className="border-b border-neutral-100 last:border-0">
                    <td className="py-3 font-medium text-neutral-900">
                      {p.customerName || 'Payment'}
                    </td>
                    <td className="py-3 text-right font-semibold text-green-600">
                      +{formatCurrency(p.amount || 0)}
                    </td>
                    <td className="py-3 text-right text-neutral-500">
                      {p.date ? format(new Date(p.date), 'MMM d, yyyy') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-neutral-400 text-center py-6">No recent payments</p>
        )}
      </div>

      {/* Recent Expenses */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 mb-6">
        <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-4">
          Recent Expenses
        </h2>
        {isLoading ? (
          <div className="space-y-1">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : recentExpenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b border-neutral-200">
                  <th className="pb-2 font-semibold">Description</th>
                  <th className="pb-2 font-semibold text-right">Amount</th>
                  <th className="pb-2 font-semibold text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentExpenses.map((e: any) => (
                  <tr key={e.id} className="border-b border-neutral-100 last:border-0">
                    <td className="py-3">
                      <span className="font-medium text-neutral-900">
                        {e.description || e.category || 'Expense'}
                      </span>
                      {e.category && e.description && (
                        <span className="block text-xs text-neutral-400">{e.category}</span>
                      )}
                    </td>
                    <td className="py-3 text-right font-semibold text-red-600">
                      -{formatCurrency(e.amount || 0)}
                    </td>
                    <td className="py-3 text-right text-neutral-500">
                      {e.date ? format(new Date(e.date), 'MMM d, yyyy') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-neutral-400 text-center py-6">No recent expenses</p>
        )}
      </div>
    </div>
  );
}
