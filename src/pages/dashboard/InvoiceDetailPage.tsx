import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { format } from 'date-fns';
import {
  ArrowLeft,
  FileText,
  Send,
  Link2,
  CheckCircle,
  Copy,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  User,
  Calendar,
  StickyNote,
  ExternalLink,
} from 'lucide-react';

const STATUS_STYLE: Record<string, { badge: string; label: string }> = {
  draft: { badge: 'bg-neutral-100 text-neutral-600', label: 'Draft' },
  sent: { badge: 'bg-blue-100 text-blue-700', label: 'Sent' },
  viewed: { badge: 'bg-purple-100 text-purple-700', label: 'Viewed' },
  paid: { badge: 'bg-green-100 text-green-700', label: 'Paid' },
  partially_paid: {
    badge: 'bg-yellow-100 text-yellow-700',
    label: 'Partially Paid',
  },
  overdue: { badge: 'bg-red-100 text-red-700', label: 'Overdue' },
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [paymentLink, setPaymentLink] = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showConfirmPaid, setShowConfirmPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.getInvoice(id!),
    enabled: !!id,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
  });
  const companyName = settings?.data?.business_name || 'FlowBoss';

  const invoice = data?.data;

  const markPaidMutation = useMutation({
    mutationFn: () =>
      api.updateInvoice(id!, {
        status: 'paid',
        paid_at: new Date().toISOString(),
        balance_due: 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowConfirmPaid(false);
      setActionSuccess('Invoice marked as paid');
      setTimeout(() => setActionSuccess(''), 3000);
    },
    onError: (err: Error) => {
      setActionError(err.message);
      setTimeout(() => setActionError(''), 5000);
    },
  });

  const sendStatusMutation = useMutation({
    mutationFn: () => api.updateInvoice(id!, { status: 'sent' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setActionSuccess('Invoice status updated to Sent');
      setTimeout(() => setActionSuccess(''), 3000);
    },
    onError: (err: Error) => {
      setActionError(err.message);
      setTimeout(() => setActionError(''), 5000);
    },
  });

  const handleSendEmail = async () => {
    setActionError('');
    if (!invoice?.customer?.email) {
      setActionError('Customer does not have an email address on file');
      return;
    }
    setSendingEmail(true);
    try {
      await api.sendInvoiceEmail(invoice, paymentLink || undefined, companyName);
      setActionSuccess('Invoice email sent successfully');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCreatePaymentLink = async () => {
    setActionError('');
    setGeneratingLink(true);
    try {
      const result = await api.createPaymentLink(id!, invoice, companyName);
      if (result.url) {
        setPaymentLink(result.url);
        setActionSuccess('Payment link created');
        setTimeout(() => setActionSuccess(''), 3000);
      } else {
        setActionError('Could not generate payment link');
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to create payment link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setActionError('Failed to copy to clipboard');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/dashboard/invoices')}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </button>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-56" />
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div className="h-5 bg-neutral-200 rounded w-40" />
            <div className="h-4 bg-neutral-100 rounded w-32" />
            <div className="h-4 bg-neutral-100 rounded w-48" />
          </div>
          <div className="h-48 bg-neutral-100 rounded-xl" />
          <div className="h-32 bg-neutral-100 rounded-xl" />
        </div>
      </div>
    );
  }

  // Error / not found
  if (error || !invoice) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/dashboard/invoices')}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </button>
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-base font-medium text-neutral-500">
            Invoice not found
          </p>
        </div>
      </div>
    );
  }

  const status = (invoice.status || 'draft').toLowerCase();
  const statusStyle = STATUS_STYLE[status] || STATUS_STYLE.draft;
  const isPaid = status === 'paid';
  const isDraft = status === 'draft';
  const dueDate = invoice.dueDate || invoice.due_date;
  const lineItems = invoice.lineItems || invoice.line_items || [];

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard/invoices')}
        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Invoices
      </button>

      {/* Alerts */}
      {actionError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{actionError}</p>
        </div>
      )}
      {actionSuccess && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700">{actionSuccess}</p>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-neutral-900">
                Invoice #
                {invoice.invoiceNumber ||
                  invoice.invoice_number ||
                  invoice.id?.slice(0, 8)}
              </h1>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusStyle.badge}`}
              >
                {statusStyle.label}
              </span>
            </div>
            {invoice.customer && (
              <p className="text-sm text-neutral-600">
                {invoice.customer.firstName} {invoice.customer.lastName}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-neutral-900">
              {formatCurrency(Number(invoice.total || 0))}
            </p>
            {Number(invoice.balanceDue ?? invoice.balance_due ?? 0) > 0 &&
              !isPaid && (
                <p className="text-sm text-red-600 font-semibold mt-1">
                  Balance due:{' '}
                  {formatCurrency(
                    Number(invoice.balanceDue ?? invoice.balance_due ?? 0)
                  )}
                </p>
              )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer info */}
          {invoice.customer && (
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                Bill To
              </h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-neutral-400" />
                  <span className="text-sm font-medium text-neutral-900">
                    {invoice.customer.firstName} {invoice.customer.lastName}
                  </span>
                </div>
                {invoice.customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-neutral-400" />
                    <a
                      href={`mailto:${invoice.customer.email}`}
                      className="text-sm text-neutral-600 hover:text-brand-600"
                    >
                      {invoice.customer.email}
                    </a>
                  </div>
                )}
                {invoice.customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-neutral-400" />
                    <a
                      href={`tel:${invoice.customer.phone}`}
                      className="text-sm text-neutral-600 hover:text-brand-600"
                    >
                      {invoice.customer.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Line items */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-neutral-100 bg-neutral-50">
              <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Line Items
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-neutral-500">
                      Description
                    </th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-neutral-500 w-20">
                      Qty
                    </th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-neutral-500 w-28">
                      Unit Price
                    </th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-neutral-500 w-28">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {lineItems.length > 0 ? (
                    lineItems.map((item: any, i: number) => {
                      const qty = Number(item.quantity || 1);
                      const price = Number(
                        item.unitPrice || item.unit_price || 0
                      );
                      const lineTotal = qty * price;
                      return (
                        <tr key={item.id || i}>
                          <td className="px-5 py-3 text-sm text-neutral-900">
                            {item.description}
                          </td>
                          <td className="px-5 py-3 text-sm text-neutral-600 text-right">
                            {qty}
                          </td>
                          <td className="px-5 py-3 text-sm text-neutral-600 text-right">
                            {formatCurrency(price)}
                          </td>
                          <td className="px-5 py-3 text-sm font-medium text-neutral-900 text-right">
                            {formatCurrency(lineTotal)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-6 text-sm text-neutral-400 text-center"
                      >
                        No line items
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t border-neutral-200 px-5 py-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Subtotal</span>
                <span className="text-neutral-900 font-medium">
                  {formatCurrency(Number(invoice.subtotal || 0))}
                </span>
              </div>
              {Number(invoice.tax || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">
                    Tax
                    {invoice.taxRate || invoice.tax_rate
                      ? ` (${invoice.taxRate || invoice.tax_rate}%)`
                      : ''}
                  </span>
                  <span className="text-neutral-900 font-medium">
                    {formatCurrency(Number(invoice.tax || 0))}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-base pt-2 border-t border-neutral-100">
                <span className="font-bold text-neutral-900">Total</span>
                <span className="font-bold text-neutral-900">
                  {formatCurrency(Number(invoice.total || 0))}
                </span>
              </div>
              {!isPaid && (
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-red-600">
                    Balance Due
                  </span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(
                      Number(
                        invoice.balanceDue ?? invoice.balance_due ?? invoice.total ?? 0
                      )
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Due Date */}
          {dueDate && (
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-400" />
                <span className="text-sm text-neutral-500">Due Date:</span>
                <span className="text-sm font-medium text-neutral-900">
                  {format(new Date(dueDate), 'MMMM d, yyyy')}
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <StickyNote className="w-4 h-4 text-neutral-400" />
                <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Notes
                </h2>
              </div>
              <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
                {invoice.notes}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar: Actions */}
        <div className="space-y-4">
          {/* Paid banner */}
          {isPaid && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-base font-bold text-green-700">
                Payment Received
              </p>
              {(invoice.paidAt || invoice.paid_at) && (
                <p className="text-xs text-green-600 mt-1">
                  {format(
                    new Date(invoice.paidAt || invoice.paid_at),
                    'MMM d, yyyy'
                  )}
                </p>
              )}
            </div>
          )}

          {/* Actions for unpaid invoices */}
          {!isPaid && (
            <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3">
              <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                Actions
              </h2>

              {/* Send (change draft to sent) */}
              {isDraft && (
                <button
                  onClick={() => sendStatusMutation.mutate()}
                  disabled={sendStatusMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 transition-colors disabled:opacity-60"
                >
                  {sendStatusMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Mark as Sent
                </button>
              )}

              {/* Send Email */}
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-800 text-white rounded-lg text-sm font-semibold hover:bg-neutral-900 transition-colors disabled:opacity-60"
              >
                {sendingEmail ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                {sendingEmail ? 'Sending...' : 'Send Email'}
              </button>

              {/* Create Payment Link */}
              {!paymentLink ? (
                <button
                  onClick={handleCreatePaymentLink}
                  disabled={generatingLink}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-brand-300 text-brand-600 rounded-lg text-sm font-semibold hover:bg-brand-50 transition-colors disabled:opacity-60"
                >
                  {generatingLink ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4" />
                  )}
                  {generatingLink
                    ? 'Generating...'
                    : 'Create Payment Link'}
                </button>
              ) : (
                <div className="bg-brand-50 border border-brand-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-brand-500" />
                    <span className="text-xs font-semibold text-brand-700">
                      Payment Link Ready
                    </span>
                  </div>
                  <p
                    className="text-xs text-brand-600 truncate mb-2 select-all"
                    title={paymentLink}
                  >
                    {paymentLink}
                  </p>
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-brand-200 rounded-md text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    {copied ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copied ? (
                      <span className="text-green-600">Copied!</span>
                    ) : (
                      'Copy Link'
                    )}
                  </button>
                  <a
                    href={paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-2 bg-white border border-neutral-200 rounded-md text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open in Browser
                  </a>
                  <p className="text-[11px] text-brand-500 mt-2 text-center">
                    Copy this link and text it to your customer
                  </p>
                </div>
              )}

              {/* Mark as Paid */}
              {!showConfirmPaid ? (
                <button
                  onClick={() => setShowConfirmPaid(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Paid
                </button>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800 font-medium mb-3">
                    Confirm payment of{' '}
                    {formatCurrency(Number(invoice.total || 0))}?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => markPaidMutation.mutate()}
                      disabled={markPaidMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-md text-sm font-semibold hover:bg-green-600 disabled:opacity-60"
                    >
                      {markPaidMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                      Confirm
                    </button>
                    <button
                      onClick={() => setShowConfirmPaid(false)}
                      className="flex-1 px-3 py-2 bg-white border border-neutral-200 text-neutral-600 rounded-md text-sm font-semibold hover:bg-neutral-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
