/**
 * Invoice status helpers — single source of truth so the home dashboard,
 * the invoices list, and any other place that counts "overdue" agree.
 *
 * Previously InvoicesPage used `status === 'overdue'` literal matching (which
 * requires the server to have flipped the status) while CommandCenterPage
 * computed overdue based on `dueDate < now`. Two pages, two numbers for the
 * same invoices — classic trust-killer. Everyone funnels through here now.
 */

type AnyInvoice = {
  status?: string | null;
  dueDate?: string | null;
  due_date?: string | null;
  total?: number | string | null;
  balanceDue?: number | string | null;
  balance_due?: number | string | null;
};

/** Is this invoice past due (regardless of whether the server has flipped the status flag yet)? */
export function isOverdue(inv: AnyInvoice, now: Date = new Date()): boolean {
  const status = (inv.status || '').toLowerCase();
  if (status === 'paid') return false;
  if (status === 'draft') return false; // drafts aren't sent, can't be overdue
  if (status === 'overdue') return true;
  const due = inv.dueDate || inv.due_date;
  if (!due) return false;
  try {
    const dueMs = new Date(due).getTime();
    if (Number.isNaN(dueMs)) return false;
    return dueMs < now.getTime();
  } catch {
    return false;
  }
}

/** Is this invoice "sent-ish" — sent OR viewed but not yet paid? */
export function isSent(inv: AnyInvoice): boolean {
  const status = (inv.status || '').toLowerCase();
  return status === 'sent' || status === 'viewed';
}

/** Is this invoice paid? */
export function isPaid(inv: AnyInvoice): boolean {
  return (inv.status || '').toLowerCase() === 'paid';
}

/** Is this a draft (not yet sent)? */
export function isDraft(inv: AnyInvoice): boolean {
  return (inv.status || '').toLowerCase() === 'draft';
}
