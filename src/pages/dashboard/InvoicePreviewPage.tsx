import { useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Lock, ShieldCheck, CreditCard, Eye, ArrowLeft, FileText, Loader2 } from 'lucide-react';

import { api } from '../../lib/api';

// ─────────────────────────────────────────────────────────────────────────
// /dashboard/invoices/:id/preview — in-app preview of what the *customer*
// sees when the contractor sends them a payment link.
//
// In production, the actual customer pay page is hosted by Stripe — but
// the contractor never sees it. The demo demonstrated the value of
// "let me see what my customer is going to see before I send" and this
// is the prod backport: real invoice data, Stripe-style hosted-invoice
// look, NO chrome (no dashboard sidebar) so the contractor experiences
// it the way their customer would.
//
// The "Pay" button is non-functional here — this is a preview, not a
// real charge. Real charges happen on Stripe's hosted page after sending.
// ─────────────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

export function InvoicePreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ?print=1 mode strips the preview banner, the Pay button, and the
  // contractor-only action footer, then auto-fires window.print() on
  // mount. Browsers' "Save as PDF" destination produces a clean PDF
  // no library needed, works in every modern browser, and the @media
  // print rules below keep the output paginated and free of any
  // screen-only chrome (sticky banner, gradients, hover states).
  const printMode = searchParams.get('print') === '1';

  const { data, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.getInvoice(id!),
    enabled: !!id,
  });
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
  });

  const invoice = data?.data;
  const companyName = settings?.data?.business_name || 'FlowBoss';
  const companyEmail = settings?.data?.business_email || settings?.data?.email || 'billing@flowboss.io';

  // Auto-scroll to top on mount.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Print mode: fire the print dialog as soon as the invoice is hydrated.
  // We wait for `invoice` so the page isn't empty when the print dialog
  // opens, then add a small delay so paint completes before print.
  useEffect(() => {
    if (!printMode) return;
    if (isLoading) return;
    const t = setTimeout(() => window.print(), 250);
    return () => clearTimeout(t);
  }, [printMode, isLoading]);

  const lineItems: any[] = useMemo(
    () => invoice?.lineItems || invoice?.line_items || [],
    [invoice],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Invoice not found.</p>
          <button
            onClick={() => navigate('/dashboard/invoices')}
            className="text-sm text-brand-600 hover:underline mt-2 inline-block"
          >
            Back to invoices
          </button>
        </div>
      </div>
    );
  }

  const customer = invoice.customer || {};
  const customerName =
    [customer.firstName, customer.lastName].filter(Boolean).join(' ') ||
    customer.first_name ||
    customer.last_name ||
    customer.name ||
    'Customer';
  const total = Number(invoice.total) || 0;
  const balance = Number(invoice.balance_due ?? invoice.balanceDue ?? total) || 0;
  const dueDate = invoice.dueDate || invoice.due_date;
  const invoiceNumber =
    invoice.invoiceNumber ||
    invoice.invoice_number ||
    invoice.id?.slice(0, 8);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 print:bg-white print:from-white print:to-white">
      {/* Print stylesheet — paginated A4 / letter, no margins, no
          backgrounds. Hides anything tagged .no-print so the customer-
          preview header and contractor-only footer don't bleed into the
          PDF. */}
      <style>{`
        @media print {
          @page { margin: 0.5in; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-card {
            box-shadow: none !important;
            ring-width: 0 !important;
            border: 1px solid #e5e7eb !important;
          }
        }
      `}</style>

      {/* Preview banner — kept light so the page reads like a real
          customer-facing invoice, with a clear "this is a preview" label. */}
      {!printMode && (
        <div className="no-print sticky top-0 z-50 bg-gradient-to-r from-violet-600 via-brand-600 to-blue-600 text-white shadow-md">
          <div className="px-4 py-2 flex items-center justify-between gap-3 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 min-w-0 text-xs sm:text-sm font-semibold">
              <Eye className="w-4 h-4 shrink-0" />
              <span className="truncate">Preview — this is what your customer sees</span>
            </div>
            <Link
              to={`/dashboard/invoices/${id}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-white/90 hover:bg-white/15 transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to invoice
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14 print:max-w-full print:px-0 print:py-0">
        {/* Card */}
        <div className="print-card bg-white rounded-2xl shadow-xl shadow-gray-200/60 ring-1 ring-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 sm:px-8 py-6 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold tracking-wider uppercase text-brand-600">
                  {companyName}
                </p>
                <h1 className="text-xl font-bold text-gray-900 mt-0.5">
                  Invoice {invoiceNumber}
                </h1>
                <p className="text-xs text-gray-500 mt-1">For {customerName}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                  Amount due
                </p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(balance)}</p>
                {dueDate && (
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Due{' '}
                    {new Date(dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Line items */}
          {lineItems.length > 0 && (
            <div className="px-6 sm:px-8 py-5 border-b border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                    <th className="text-left pb-2">Description</th>
                    <th className="text-right pb-2 w-16">Qty</th>
                    <th className="text-right pb-2 w-24">Rate</th>
                    <th className="text-right pb-2 w-24">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((li: any, i: number) => {
                    const qty = Number(li.quantity) || 0;
                    const rate = Number(li.unitPrice || li.unit_price) || 0;
                    const lineTotal = Number(li.total || li.amount) || qty * rate;
                    return (
                      <tr key={li.id || i} className="border-t border-gray-50">
                        <td className="py-2.5 text-gray-700">{li.description}</td>
                        <td className="py-2.5 text-right text-gray-600">{qty}</td>
                        <td className="py-2.5 text-right text-gray-600">{formatCurrency(rate)}</td>
                        <td className="py-2.5 text-right text-gray-900 font-semibold">
                          {formatCurrency(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex justify-end pt-3 mt-2 border-t border-gray-100">
                <div className="text-right">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                    Total
                  </p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(total)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Pay box — disabled in preview, mirrors the real Stripe-hosted
              page so the contractor knows what they're sending. Hidden
              in print mode (a printed invoice doesn't need a Pay button). */}
          <div className={`${printMode ? 'no-print' : ''} px-6 sm:px-8 py-6 bg-gradient-to-b from-white to-gray-50`}>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
              <Lock className="w-3.5 h-3.5" />
              Secure checkout · powered by Stripe
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Pay with card</p>
                  <p className="text-[11px] text-gray-500">Visa, Mastercard, Amex, Discover</p>
                </div>
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Preview
                </div>
              </div>
            </div>
            <button
              type="button"
              disabled
              title="This is a preview — actual payments happen on the Stripe-hosted page"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 text-white text-sm font-bold shadow-md opacity-70 cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              Pay {formatCurrency(balance)}
            </button>
            <p className="text-[10px] text-center text-gray-400 mt-3">
              By paying you agree to {companyName}'s terms. Receipt sent to your email.
            </p>
          </div>

          {/* Footer */}
          <div className="px-6 sm:px-8 py-4 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
            <div>
              Questions?{' '}
              <a href={`mailto:${companyEmail}`} className="text-brand-600 hover:underline">
                {companyEmail}
              </a>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <ShieldCheck className="w-3 h-3" />
              SSL encrypted
            </div>
          </div>
        </div>

        {/* Action footer — only shown to the contractor (preview viewer).
            Hidden in print mode so the PDF doesn't carry contractor chrome. */}
        <div className="no-print mt-6 rounded-2xl bg-white ring-1 ring-gray-200 p-4 text-sm text-gray-600 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Eye className="w-4 h-4 text-brand-600 shrink-0" />
            <span className="truncate">Looks good? Send it from the invoice page.</span>
          </div>
          <Link
            to={`/dashboard/invoices/${id}`}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors"
          >
            Back to invoice
          </Link>
        </div>
      </div>
    </div>
  );
}
