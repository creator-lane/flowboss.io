import { MessageSquare } from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────
// TextReminderButton — one-tap overdue-invoice reminder via the user's
// native SMS app. No API, no Twilio bill, no deliverability worries.
// Works on phone AND desktop (macOS/iPhone handoff) because we're just
// handing the OS a pre-baked sms: URL.
//
// Why native SMS instead of building a reminder feature:
//   - Contractors already have relationships with these customers.
//     A templated SMS from "flowboss-noreply" feels like collections;
//     a text from the actual contractor gets replies.
//   - Zero per-message cost (no Twilio), zero approval friction.
//   - Keeps the reminder thread in the contractor's own phone history.
// ──────────────────────────────────────────────────────────────────────

interface TextReminderButtonProps {
  phone?: string | null;
  customerFirstName?: string | null;
  amount?: number | null;
  invoiceNumber?: string | null;
  daysOverdue?: number | null;
  /** Optional payment link to include in the message body. */
  paymentUrl?: string | null;
  /** How the button renders — icon-only for table rows, full for detail. */
  variant?: 'icon' | 'full';
  className?: string;
  /** Prevents the row-click navigation from firing underneath. */
  stopPropagation?: boolean;
}

function buildMessage(opts: {
  firstName?: string | null;
  amount?: number | null;
  invoiceNumber?: string | null;
  daysOverdue?: number | null;
  paymentUrl?: string | null;
}): string {
  const name = opts.firstName ? `Hi ${opts.firstName}` : 'Hi';
  const amountPart = opts.amount
    ? `for $${opts.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '';
  const invoicePart = opts.invoiceNumber ? ` (Invoice #${opts.invoiceNumber})` : '';
  const overduePart =
    opts.daysOverdue && opts.daysOverdue > 0
      ? ` — it's ${opts.daysOverdue} day${opts.daysOverdue > 1 ? 's' : ''} past due`
      : '';
  const payPart = opts.paymentUrl ? `\n\nYou can pay online here: ${opts.paymentUrl}` : '';
  return `${name}, quick reminder about your invoice${invoicePart} ${amountPart}${overduePart}. Let me know if you have any questions — happy to sort it out.${payPart}`;
}

export function TextReminderButton({
  phone,
  customerFirstName,
  amount,
  invoiceNumber,
  daysOverdue,
  paymentUrl,
  variant = 'icon',
  className = '',
  stopPropagation = true,
}: TextReminderButtonProps) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  const body = buildMessage({
    firstName: customerFirstName,
    amount,
    invoiceNumber,
    daysOverdue,
    paymentUrl,
  });
  const href = `sms:${digits}?&body=${encodeURIComponent(body)}`;

  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
  };

  if (variant === 'full') {
    return (
      <a
        href={href}
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold ring-1 ring-inset ring-amber-500/20 hover:bg-amber-100 transition-colors dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30 ${className}`}
      >
        <MessageSquare className="w-3.5 h-3.5" />
        Text reminder
      </a>
    );
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      title="Text a friendly reminder"
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-500/20 hover:bg-amber-100 transition-colors dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30 ${className}`}
    >
      <MessageSquare className="w-3.5 h-3.5" />
    </a>
  );
}
