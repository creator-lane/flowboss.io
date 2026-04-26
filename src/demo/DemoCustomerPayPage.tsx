import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Lock, ShieldCheck, CreditCard, Sparkles, ArrowRight, FileText } from 'lucide-react';

import { PERSONAS } from './data/personas';
import type { DemoPersona } from './data/personas';

// ──────────────────────────────────────────────────────────────────────
// /demo/full/:persona/customer-pay/:invoiceId — the page the *customer*
// sees when the contractor sends them a payment link.
//
// Reached via createPaymentLink in demo mode (apiOverride wires the link
// here instead of hitting Stripe). Renders OUTSIDE the dashboard chrome
// — a Stripe-style hosted invoice page so the contractor can see what
// their customer would see, with a soft "Sign up free to send real pay
// links" footer.
// ──────────────────────────────────────────────────────────────────────

function isValidPersona(p: string | undefined): p is DemoPersona {
  return p === 'gc' || p === 'sub';
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

export function DemoCustomerPayPage() {
  const { persona, invoiceId } = useParams<{ persona: string; invoiceId: string }>();
  if (!isValidPersona(persona)) return <Navigate to="/demo/full" replace />;

  const seed = PERSONAS[persona];
  const invoice = useMemo(
    () => seed.invoices.find((i: any) => i.id === invoiceId),
    [seed.invoices, invoiceId],
  );

  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  // Auto-scroll to top on mount (the contractor opens this in a new tab
  // from the invoice detail page; landing mid-fold feels broken).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Invoice not found.</p>
          <Link to={`/demo/full/${persona}/dashboard/invoices`} className="text-sm text-brand-600 hover:underline mt-2 inline-block">
            Back to invoices
          </Link>
        </div>
      </div>
    );
  }

  const customer = invoice.customer || {};
  const customerName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Customer';
  const companyName = seed.profile?.business_name || seed.profile?.businessName || 'FlowBoss';
  const companyEmail = seed.profile?.email || 'billing@flowboss.io';
  const total = Number(invoice.total) || 0;
  const balance = Number(invoice.balance_due ?? invoice.balanceDue ?? total) || 0;
  const dueDate = invoice.dueDate || invoice.due_date;
  const lineItems: any[] = invoice.lineItems || invoice.line_items || [];

  const handlePay = () => {
    if (paying || paid) return;
    setPaying(true);
    // Fake the Stripe redirect — in prod this would post to Stripe checkout.
    window.setTimeout(() => {
      setPaying(false);
      setPaid(true);
    }, 1400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Demo banner — hover-disclosable, kept light so the page reads as
          a real customer-facing invoice. */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-violet-600 via-brand-600 to-blue-600 text-white shadow-md">
        <div className="px-4 py-2 flex items-center justify-between gap-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2 min-w-0 text-xs sm:text-sm font-semibold">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="truncate">This is what your customer sees when you send a pay link</span>
          </div>
          <Link
            to={`/demo/full/${persona}/dashboard/invoices/${invoiceId}`}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-white/90 hover:bg-white/15 transition-colors whitespace-nowrap"
          >
            Back to invoice
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 ring-1 ring-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 sm:px-8 py-6 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold tracking-wider uppercase text-brand-600">{companyName}</p>
                <h1 className="text-xl font-bold text-gray-900 mt-0.5">Invoice {invoice.invoiceNumber || invoice.invoice_number || invoice.id?.slice(0, 8)}</h1>
                <p className="text-xs text-gray-500 mt-1">For {customerName}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Amount due</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(balance)}</p>
                {dueDate && (
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Due {new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                  {lineItems.map((li: any, i: number) => (
                    <tr key={li.id || i} className="border-t border-gray-50">
                      <td className="py-2.5 text-gray-700">{li.description}</td>
                      <td className="py-2.5 text-right text-gray-600">{li.quantity}</td>
                      <td className="py-2.5 text-right text-gray-600">{formatCurrency(Number(li.unitPrice || li.unit_price) || 0)}</td>
                      <td className="py-2.5 text-right text-gray-900 font-semibold">
                        {formatCurrency(Number(li.total || li.amount) || (Number(li.quantity) * Number(li.unitPrice || li.unit_price)) || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end pt-3 mt-2 border-t border-gray-100">
                <div className="text-right">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Total</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(total)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Pay box */}
          <div className="px-6 sm:px-8 py-6 bg-gradient-to-b from-white to-gray-50">
            {paid ? (
              <div className="rounded-xl bg-green-50 border border-green-200 p-5 text-center">
                <div className="w-12 h-12 rounded-full bg-green-500 mx-auto flex items-center justify-center mb-2">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <p className="font-bold text-green-900">Payment received</p>
                <p className="text-xs text-green-700 mt-0.5">A receipt was emailed to {customer.email || 'your customer'}.</p>
              </div>
            ) : (
              <>
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
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Demo</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-700 hover:to-violet-700 disabled:opacity-60 text-white text-sm font-bold transition-colors shadow-md"
                >
                  {paying ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Pay {formatCurrency(balance)}
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-gray-400 mt-3">
                  By paying you agree to {companyName}'s terms. Receipt sent to your email.
                </p>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 sm:px-8 py-4 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
            <div>
              Questions? <a href={`mailto:${companyEmail}`} className="text-brand-600 hover:underline">{companyEmail}</a>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <ShieldCheck className="w-3 h-3" />
              SSL encrypted
            </div>
          </div>
        </div>

        {/* Soft conversion footer — only the contractor (running the demo)
            ever sees this; real customers in production never get this card. */}
        <div className="mt-6 rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 p-5 text-white shadow-lg shadow-brand-500/20">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">This is the page your customer pays on.</p>
              <p className="text-xs text-white/85 mt-0.5 leading-relaxed">
                Sign up free to start sending real pay links. Stripe + QuickBooks built in. Money hits your account next day.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white text-brand-700 text-xs font-bold hover:bg-gray-100 transition-colors"
                >
                  Sign up free
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to={`/demo/full/${persona}/dashboard/invoices/${invoiceId}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
                >
                  Back to demo
                </Link>
              </div>
              <p className="text-[10px] text-white/70 mt-2.5">14-day free trial · no credit card required</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
