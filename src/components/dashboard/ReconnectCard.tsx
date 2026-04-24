import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, ArrowRight, Phone, Mail } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

// ──────────────────────────────────────────────────────────────────────
// ReconnectCard — surfaces past customers who've gone quiet.
//
// Most contractors never think about re-engaging old customers — they
// wait for the phone to ring. This card flips that: we find customers
// who've had at least one completed job but haven't had *any* job
// activity in the last 90 days, and prompt a follow-up.
//
// Cold but real math:
//   - Existing customers convert at ~5-10× the rate of a cold lead.
//   - The incremental cost of a "just checking in" text is zero.
//   - Two reconnects per month per contractor = one extra job/mo.
//
// Reads from existing jobs/customers props. No new queries.
// ──────────────────────────────────────────────────────────────────────

interface Job {
  id?: string;
  customerId?: string;
  customer_id?: string;
  customer?: { id?: string };
  status?: string;
  completedAt?: string;
  completed_at?: string;
  scheduledEnd?: string;
  scheduled_end?: string;
  updatedAt?: string;
  updated_at?: string;
}

interface Customer {
  id?: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
}

interface ReconnectCardProps {
  customers: Customer[];
  jobs: Job[];
  /** Days of inactivity that makes a customer "quiet". Default 90. */
  thresholdDays?: number;
}

function jobCustomerId(job: Job): string | undefined {
  return job.customerId || job.customer_id || job.customer?.id;
}

function jobLastTouched(job: Job): Date | null {
  const ts =
    job.completedAt ||
    job.completed_at ||
    job.scheduledEnd ||
    job.scheduled_end ||
    job.updatedAt ||
    job.updated_at;
  if (!ts) return null;
  try {
    return parseISO(ts);
  } catch {
    return null;
  }
}

function customerName(c: Customer): string {
  const first = c.firstName || c.first_name || '';
  const last = c.lastName || c.last_name || '';
  return `${first} ${last}`.trim() || 'Customer';
}

export function ReconnectCard({ customers, jobs, thresholdDays = 90 }: ReconnectCardProps) {
  const quietCustomers = useMemo(() => {
    const now = new Date();

    // Build a map of customerId → most recent job activity.
    const lastByCustomer = new Map<string, Date>();
    for (const job of jobs) {
      const cid = jobCustomerId(job);
      if (!cid) continue;
      const touched = jobLastTouched(job);
      if (!touched) continue;
      const prev = lastByCustomer.get(cid);
      if (!prev || touched > prev) lastByCustomer.set(cid, touched);
    }

    // Must also have had at least one completed job — we don't want to
    // prompt re-engagement for a customer who only ever had a canceled
    // job or a pending estimate.
    const hasCompletedJob = new Set<string>();
    for (const job of jobs) {
      if (job.status !== 'COMPLETED') continue;
      const cid = jobCustomerId(job);
      if (cid) hasCompletedJob.add(cid);
    }

    const quiet: Array<{ customer: Customer; daysQuiet: number }> = [];
    for (const c of customers) {
      if (!c.id || !hasCompletedJob.has(c.id)) continue;
      const last = lastByCustomer.get(c.id);
      if (!last) continue;
      const days = differenceInDays(now, last);
      if (days >= thresholdDays) {
        quiet.push({ customer: c, daysQuiet: days });
      }
    }

    // Longest-quiet first — those are slipping away fastest.
    quiet.sort((a, b) => b.daysQuiet - a.daysQuiet);
    return quiet;
  }, [customers, jobs, thresholdDays]);

  if (quietCustomers.length === 0) return null;

  const top = quietCustomers.slice(0, 3);

  return (
    <section className="rounded-xl border border-amber-200/60 dark:border-amber-500/30 bg-gradient-to-br from-amber-50 to-white dark:from-amber-500/10 dark:to-transparent p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/10 ring-1 ring-amber-300/60 dark:ring-amber-400/30 flex items-center justify-center">
            <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-300" />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-amber-700 dark:text-amber-300">
              Reconnect
            </p>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              {quietCustomers.length} past customer{quietCustomers.length === 1 ? '' : 's'} gone quiet — easy win-back
            </p>
          </div>
        </div>
      </div>

      <ul className="space-y-2">
        {top.map(({ customer, daysQuiet }) => {
          const name = customerName(customer);
          const monthsQuiet = Math.round(daysQuiet / 30);
          const phone = customer.phone;
          const email = customer.email;
          const smsHref = phone
            ? `sms:${phone.replace(/\D/g, '')}?body=${encodeURIComponent(
                `Hey ${customer.firstName || customer.first_name || ''}, just checking in — anything I can help with this spring?`
              )}`
            : undefined;
          const mailHref = email
            ? `mailto:${email}?subject=${encodeURIComponent(
                'Checking in'
              )}&body=${encodeURIComponent(
                `Hi ${customer.firstName || customer.first_name || ''},\n\nJust wanted to check in — let me know if there's anything I can help with.\n\nThanks,`
              )}`
            : undefined;

          return (
            <li
              key={customer.id}
              className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white/70 dark:bg-white/5 ring-1 ring-amber-200/40 dark:ring-white/10"
            >
              <Link
                to={`/dashboard/customers/${customer.id}`}
                className="flex-1 min-w-0 hover:underline"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {name}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Quiet for {monthsQuiet < 1 ? `${daysQuiet} days` : `${monthsQuiet} month${monthsQuiet === 1 ? '' : 's'}`}
                </p>
              </Link>
              <div className="flex items-center gap-1.5 shrink-0">
                {smsHref && (
                  <a
                    href={smsHref}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                    title={`Text ${name}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                )}
                {mailHref && (
                  <a
                    href={mailHref}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-white/10 ring-1 ring-amber-300 dark:ring-amber-400/30 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-white/15 transition-colors"
                    title={`Email ${name}`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {quietCustomers.length > 3 && (
        <Link
          to="/dashboard/customers"
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline"
        >
          +{quietCustomers.length - 3} more to reach out to
          <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </section>
  );
}
