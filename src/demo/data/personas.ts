// Seeded persona data for the full sandboxed demo at /demo/full.
//
// Two personas: GC (general contractor running multi-trade projects) and
// Sub (solo electrician taking direct jobs + GC invites). Each persona has
// a profile, a customer book, jobs, invoices, and (for GC) projects.
//
// Shapes mirror what api.ts returns from Supabase — snake_case primary
// fields with camelCase mirrors for the consumer side. The actual app reads
// either form thanks to camelify() in api.ts; we mimic that here.

import { addDays, addHours, formatISO, startOfDay, subDays } from 'date-fns';

const NOW = new Date();
const TODAY_9AM = addHours(startOfDay(NOW), 9);

function iso(d: Date) {
  return formatISO(d);
}

export type DemoPersona = 'gc' | 'sub';

interface DemoSeed {
  profile: any;
  customers: any[];
  jobs: any[];
  invoices: any[];
  gcProjects: any[];
  gcProjectMessages: Record<string, any[]>;
  /** Typed event-stream feed (eventType / actorName / summary) — what the
   *  ProjectActivityFeed + MultiProjectActivityFeed widgets render. Keyed by
   *  project id. Distinct from gcProjectMessages, which is the chat thread on
   *  the project detail page. Every event MUST carry a real actorName — the
   *  feed is the public face of the demo and "Someone" reads as a bug. */
  gcProjectActivity: Record<string, any[]>;
  gcSubDirectory: any[];
  /** Real-name ratings keyed by sub userId — drives getSubPerformance. */
  gcRatings: Record<string, any[]>;
  /** Job-level line items keyed by job id — JobDetailPage reads these. */
  jobLineItems: Record<string, any[]>;
  /** Job-level photos keyed by job id — JobDetailPage gallery. */
  jobPhotos: Record<string, any[]>;
  invitedProjects: any[];
  contractors: any[];
  expenses: any[];
  pricebook: any[];
  organization: any | null;
}

// ── GC PERSONA: Marcos Rivera, Riverside Construction ─────────────
const GC_USER_ID = 'demo-gc-user-0001';

const GC_PROFILE = {
  id: GC_USER_ID,
  email: 'marcos@riverside-demo.com',
  business_name: 'Riverside Construction',
  trade: 'general',
  team_size: 'small',
  business_role: 'gc',
  priorities: ['Project management', 'Finding reliable subs', 'Tracking job costs'],
  phone: '(415) 555-0142',
  zip: '94110',
  subscription_status: 'active',
  subscription_tier: 'gc',
  subscription_provider: 'stripe',
  stripe_account_id: 'acct_demo_riverside',
  stripe_onboarding_complete: true,
  created_at: iso(subDays(NOW, 184)),
  // mirror camelCase
  businessName: 'Riverside Construction',
  businessRole: 'gc',
  teamSize: 'small',
  subscriptionStatus: 'active',
  subscriptionTier: 'gc',
  subscriptionProvider: 'stripe',
  stripeAccountId: 'acct_demo_riverside',
  stripeOnboardingComplete: true,
  createdAt: iso(subDays(NOW, 184)),
};

function customer(id: string, fullName: string, email: string, phone: string, address: string, zip?: string) {
  const [firstName, ...rest] = fullName.split(' ');
  const lastName = rest.join(' ');
  // Crude city/state extraction from "..., City, ST" tail.
  const parts = address.split(',').map((s) => s.trim());
  const state = parts[parts.length - 1] || '';
  const city = parts[parts.length - 2] || '';
  const street = parts.slice(0, -2).join(', ') || address;
  return {
    id, name: fullName,
    firstName, lastName,
    first_name: firstName, last_name: lastName,
    email, phone, address,
    city, state, zip: zip || null,
    property: { address: street, city, state, zip: zip || null },
  };
}

const GC_CUSTOMERS = [
  customer('demo-cust-1', 'Sarah Mitchell', 'sarah.m@example.com', '(415) 555-0188', '142 Oak Lane, San Francisco, CA', '94110'),
  customer('demo-cust-2', 'Tom Rodriguez', 'trodriguez@example.com', '(415) 555-0291', '2281 Maple Dr, San Francisco, CA', '94114'),
  customer('demo-cust-3', 'Karen Chen', 'k.chen@example.com', '(415) 555-0312', '509 Birch Ct, Oakland, CA', '94612'),
  customer('demo-cust-4', 'James Taylor', 'jtaylor@example.com', '(415) 555-0408', '88 Cedar St, Berkeley, CA', '94704'),
  customer('demo-cust-5', 'Priya Patel', 'priya.p@example.com', '(415) 555-0517', '3124 Elm Ave, San Francisco, CA', '94110'),
  customer('demo-cust-6', 'Robert Henderson', 'rhenderson@example.com', '(415) 555-0623', '4200 Westlake Hills Blvd, Austin, TX', '78746'),
  customer('demo-cust-7', 'Aisha Thompson', 'athompson@example.com', '(415) 555-0734', '17 Sycamore Way, San Francisco, CA', '94114'),
  customer('demo-cust-8', 'Marco Bianchi', 'mbianchi@example.com', '(415) 555-0845', '951 Hyde St, San Francisco, CA', '94109'),
  customer('demo-cust-9', 'Linda Park', 'lpark@example.com', '(415) 555-0956', '2210 Lake Merritt Blvd, Oakland, CA', '94606'),
  customer('demo-cust-10', 'Daniel Wright', 'dwright@example.com', '(415) 555-1067', '672 Geary St, San Francisco, CA', '94102'),
  customer('demo-cust-11', 'Emma Foster', 'efoster@example.com', '(415) 555-1178', '4480 Telegraph Ave, Oakland, CA', '94609'),
  customer('demo-cust-12', 'Jordan Reyes', 'jreyes@example.com', '(415) 555-1289', '120 Folsom St, San Francisco, CA', '94105'),
  customer('demo-cust-13', 'Sophie Klein', 'sklein@example.com', '(415) 555-1390', '4012 24th St, San Francisco, CA', '94114'),
  customer('demo-cust-14', 'Andre Williams', 'awilliams@example.com', '(415) 555-1401', '88 King St, San Francisco, CA', '94107'),
];

// Build a single job with snake + camel mirrors. Jobs power the schedule, the
// jobs list, and (when COMPLETED with started_at/completed_at) the insights
// "money makers" analytics. Keeping started/completed timestamps populated for
// historical jobs is what makes the insights page actually look populated.
function job(opts: {
  id: string;
  customerId: string;
  customer: any;
  userId: string;
  title: string;
  description: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  start: Date;
  end: Date;
  estimatedDurationMin?: number;
}) {
  const startedAt = opts.status !== 'SCHEDULED' ? opts.start : null;
  const completedAt = opts.status === 'COMPLETED' ? opts.end : null;
  return {
    id: opts.id,
    user_id: opts.userId,
    customer_id: opts.customerId,
    customerId: opts.customerId,
    customer: opts.customer,
    title: opts.title,
    description: opts.description,
    status: opts.status,
    scheduled_start: iso(opts.start),
    scheduled_end: iso(opts.end),
    scheduledStart: iso(opts.start),
    scheduledEnd: iso(opts.end),
    started_at: startedAt ? iso(startedAt) : null,
    startedAt: startedAt ? iso(startedAt) : null,
    completed_at: completedAt ? iso(completedAt) : null,
    completedAt: completedAt ? iso(completedAt) : null,
    estimated_duration: opts.estimatedDurationMin || 240,
    estimatedDuration: opts.estimatedDurationMin || 240,
    // Service Area Analysis (Insights) reads `job.property.zip` — derive from
    // the customer's address record so jobs always carry a location.
    property: opts.customer?.property || null,
    contractor_id: null,
    contractorId: null,
  };
}

// Today's lineup + this week's schedule + ~30 historical completed jobs.
// Job descriptions are deliberately repetitive across customers so the
// insights "money makers" view groups them into a meaningful leaderboard.
const GC_JOBS = [
  // ── Today (mix of statuses for the schedule view) ────────────────
  job({ id: 'demo-job-gc-1', customerId: 'demo-cust-1', customer: GC_CUSTOMERS[0], userId: GC_USER_ID,
    title: 'Kitchen reno — demo + framing',
    description: 'Kitchen renovation', status: 'IN_PROGRESS',
    start: TODAY_9AM, end: addHours(TODAY_9AM, 4), estimatedDurationMin: 240 }),
  job({ id: 'demo-job-gc-2', customerId: 'demo-cust-2', customer: GC_CUSTOMERS[1], userId: GC_USER_ID,
    title: 'Site walkthrough — Maple Dr addition',
    description: 'Site walkthrough', status: 'SCHEDULED',
    start: addHours(TODAY_9AM, 4.5), end: addHours(TODAY_9AM, 6), estimatedDurationMin: 90 }),
  job({ id: 'demo-job-gc-3', customerId: 'demo-cust-3', customer: GC_CUSTOMERS[2], userId: GC_USER_ID,
    title: 'Bath remodel — punch list',
    description: 'Bathroom remodel', status: 'SCHEDULED',
    start: addHours(TODAY_9AM, 7), end: addHours(TODAY_9AM, 8), estimatedDurationMin: 60 }),

  // ── Tomorrow + this week ─────────────────────────────────────────
  job({ id: 'demo-job-gc-4', customerId: 'demo-cust-7', customer: GC_CUSTOMERS[6], userId: GC_USER_ID,
    title: 'Estimate visit — Sycamore deck rebuild',
    description: 'Deck rebuild', status: 'SCHEDULED',
    start: addHours(addDays(TODAY_9AM, 1), 0), end: addHours(addDays(TODAY_9AM, 1), 2) }),
  job({ id: 'demo-job-gc-5', customerId: 'demo-cust-8', customer: GC_CUSTOMERS[7], userId: GC_USER_ID,
    title: 'Garage conversion — framing day 1',
    description: 'Garage conversion', status: 'SCHEDULED',
    start: addHours(addDays(TODAY_9AM, 2), 0), end: addHours(addDays(TODAY_9AM, 2), 8) }),
  job({ id: 'demo-job-gc-6', customerId: 'demo-cust-9', customer: GC_CUSTOMERS[8], userId: GC_USER_ID,
    title: 'Roofing inspection — pre-storm',
    description: 'Roofing inspection', status: 'SCHEDULED',
    start: addHours(addDays(TODAY_9AM, 3), 0), end: addHours(addDays(TODAY_9AM, 3), 1) }),

  // ── Historical — last 6 months of completed work ─────────────────
  job({ id: 'demo-job-gc-h1', customerId: 'demo-cust-1', customer: GC_CUSTOMERS[0], userId: GC_USER_ID,
    title: 'Mitchell — initial scope walkthrough',
    description: 'Site walkthrough', status: 'COMPLETED',
    start: subDays(NOW, 16), end: addHours(subDays(NOW, 16), 2) }),
  job({ id: 'demo-job-gc-h2', customerId: 'demo-cust-4', customer: GC_CUSTOMERS[3], userId: GC_USER_ID,
    title: 'Taylor — full bath remodel',
    description: 'Bathroom remodel', status: 'COMPLETED',
    start: subDays(NOW, 38), end: addHours(subDays(NOW, 30), 8) }),
  job({ id: 'demo-job-gc-h3', customerId: 'demo-cust-5', customer: GC_CUSTOMERS[4], userId: GC_USER_ID,
    title: 'Patel — kitchen renovation',
    description: 'Kitchen renovation', status: 'COMPLETED',
    start: subDays(NOW, 56), end: addHours(subDays(NOW, 38), 8) }),
  job({ id: 'demo-job-gc-h4', customerId: 'demo-cust-6', customer: GC_CUSTOMERS[5], userId: GC_USER_ID,
    title: 'Henderson — Phase 1 demo and framing',
    description: 'Whole-house renovation', status: 'COMPLETED',
    start: subDays(NOW, 88), end: addHours(subDays(NOW, 72), 8) }),
  job({ id: 'demo-job-gc-h5', customerId: 'demo-cust-7', customer: GC_CUSTOMERS[6], userId: GC_USER_ID,
    title: 'Thompson — deck rebuild',
    description: 'Deck rebuild', status: 'COMPLETED',
    start: subDays(NOW, 70), end: addHours(subDays(NOW, 64), 8) }),
  job({ id: 'demo-job-gc-h6', customerId: 'demo-cust-8', customer: GC_CUSTOMERS[7], userId: GC_USER_ID,
    title: 'Bianchi — garage conversion',
    description: 'Garage conversion', status: 'COMPLETED',
    start: subDays(NOW, 95), end: addHours(subDays(NOW, 75), 8) }),
  job({ id: 'demo-job-gc-h7', customerId: 'demo-cust-9', customer: GC_CUSTOMERS[8], userId: GC_USER_ID,
    title: 'Park — kitchen renovation',
    description: 'Kitchen renovation', status: 'COMPLETED',
    start: subDays(NOW, 110), end: addHours(subDays(NOW, 88), 8) }),
  job({ id: 'demo-job-gc-h8', customerId: 'demo-cust-10', customer: GC_CUSTOMERS[9], userId: GC_USER_ID,
    title: 'Wright — bathroom remodel',
    description: 'Bathroom remodel', status: 'COMPLETED',
    start: subDays(NOW, 120), end: addHours(subDays(NOW, 108), 8) }),
  job({ id: 'demo-job-gc-h9', customerId: 'demo-cust-11', customer: GC_CUSTOMERS[10], userId: GC_USER_ID,
    title: 'Foster — roofing replacement',
    description: 'Roofing replacement', status: 'COMPLETED',
    start: subDays(NOW, 130), end: addHours(subDays(NOW, 124), 8) }),
  job({ id: 'demo-job-gc-h10', customerId: 'demo-cust-12', customer: GC_CUSTOMERS[11], userId: GC_USER_ID,
    title: 'Reyes — kitchen renovation',
    description: 'Kitchen renovation', status: 'COMPLETED',
    start: subDays(NOW, 145), end: addHours(subDays(NOW, 122), 8) }),
  job({ id: 'demo-job-gc-h11', customerId: 'demo-cust-13', customer: GC_CUSTOMERS[12], userId: GC_USER_ID,
    title: 'Klein — bathroom remodel',
    description: 'Bathroom remodel', status: 'COMPLETED',
    start: subDays(NOW, 160), end: addHours(subDays(NOW, 150), 8) }),
  job({ id: 'demo-job-gc-h12', customerId: 'demo-cust-14', customer: GC_CUSTOMERS[13], userId: GC_USER_ID,
    title: 'Williams — fence install',
    description: 'Fence install', status: 'COMPLETED',
    start: subDays(NOW, 50), end: addHours(subDays(NOW, 47), 6) }),
  job({ id: 'demo-job-gc-h13', customerId: 'demo-cust-2', customer: GC_CUSTOMERS[1], userId: GC_USER_ID,
    title: 'Rodriguez — gutter replacement',
    description: 'Gutter replacement', status: 'COMPLETED',
    start: subDays(NOW, 22), end: addHours(subDays(NOW, 21), 4) }),
  job({ id: 'demo-job-gc-h14', customerId: 'demo-cust-4', customer: GC_CUSTOMERS[3], userId: GC_USER_ID,
    title: 'Taylor — interior painting',
    description: 'Interior painting', status: 'COMPLETED',
    start: subDays(NOW, 12), end: addHours(subDays(NOW, 9), 8) }),
  job({ id: 'demo-job-gc-h15', customerId: 'demo-cust-7', customer: GC_CUSTOMERS[6], userId: GC_USER_ID,
    title: 'Thompson — door replacement',
    description: 'Door replacement', status: 'COMPLETED',
    start: subDays(NOW, 28), end: addHours(subDays(NOW, 28), 6) }),
  job({ id: 'demo-job-gc-h16', customerId: 'demo-cust-9', customer: GC_CUSTOMERS[8], userId: GC_USER_ID,
    title: 'Park — window replacement',
    description: 'Window replacement', status: 'COMPLETED',
    start: subDays(NOW, 42), end: addHours(subDays(NOW, 41), 8) }),
  job({ id: 'demo-job-gc-h17', customerId: 'demo-cust-10', customer: GC_CUSTOMERS[9], userId: GC_USER_ID,
    title: 'Wright — interior painting',
    description: 'Interior painting', status: 'COMPLETED',
    start: subDays(NOW, 60), end: addHours(subDays(NOW, 57), 8) }),
  job({ id: 'demo-job-gc-h18', customerId: 'demo-cust-11', customer: GC_CUSTOMERS[10], userId: GC_USER_ID,
    title: 'Foster — kitchen renovation',
    description: 'Kitchen renovation', status: 'COMPLETED',
    start: subDays(NOW, 175), end: addHours(subDays(NOW, 152), 8) }),
  job({ id: 'demo-job-gc-h19', customerId: 'demo-cust-12', customer: GC_CUSTOMERS[11], userId: GC_USER_ID,
    title: 'Reyes — deck rebuild',
    description: 'Deck rebuild', status: 'COMPLETED',
    start: subDays(NOW, 80), end: addHours(subDays(NOW, 75), 8) }),
  job({ id: 'demo-job-gc-h20', customerId: 'demo-cust-13', customer: GC_CUSTOMERS[12], userId: GC_USER_ID,
    title: 'Klein — kitchen renovation',
    description: 'Kitchen renovation', status: 'COMPLETED',
    start: subDays(NOW, 90), end: addHours(subDays(NOW, 70), 8) }),

  // ── Older history (May 2025 – Oct 2025) — fills out 12-month chart ─
  job({ id: 'demo-job-gc-h21', customerId: 'demo-cust-1', customer: GC_CUSTOMERS[0], userId: GC_USER_ID,
    title: 'Mitchell — exterior paint refresh',
    description: 'Exterior painting', status: 'COMPLETED',
    start: subDays(NOW, 200), end: addHours(subDays(NOW, 195), 8) }),
  job({ id: 'demo-job-gc-h22', customerId: 'demo-cust-4', customer: GC_CUSTOMERS[3], userId: GC_USER_ID,
    title: 'Taylor — basement finish',
    description: 'Basement finish', status: 'COMPLETED',
    start: subDays(NOW, 220), end: addHours(subDays(NOW, 200), 8) }),
  job({ id: 'demo-job-gc-h23', customerId: 'demo-cust-5', customer: GC_CUSTOMERS[4], userId: GC_USER_ID,
    title: 'Patel — kitchen renovation',
    description: 'Kitchen renovation', status: 'COMPLETED',
    start: subDays(NOW, 240), end: addHours(subDays(NOW, 215), 8) }),
  job({ id: 'demo-job-gc-h24', customerId: 'demo-cust-9', customer: GC_CUSTOMERS[8], userId: GC_USER_ID,
    title: 'Park — sunroom addition',
    description: 'Sunroom addition', status: 'COMPLETED',
    start: subDays(NOW, 255), end: addHours(subDays(NOW, 230), 8) }),
  job({ id: 'demo-job-gc-h25', customerId: 'demo-cust-11', customer: GC_CUSTOMERS[10], userId: GC_USER_ID,
    title: 'Foster — bathroom remodel',
    description: 'Bathroom remodel', status: 'COMPLETED',
    start: subDays(NOW, 270), end: addHours(subDays(NOW, 255), 8) }),
  job({ id: 'demo-job-gc-h26', customerId: 'demo-cust-12', customer: GC_CUSTOMERS[11], userId: GC_USER_ID,
    title: 'Reyes — second-story addition',
    description: 'Second-story addition', status: 'COMPLETED',
    start: subDays(NOW, 290), end: addHours(subDays(NOW, 260), 8) }),
  job({ id: 'demo-job-gc-h27', customerId: 'demo-cust-7', customer: GC_CUSTOMERS[6], userId: GC_USER_ID,
    title: 'Thompson — front porch rebuild',
    description: 'Porch rebuild', status: 'COMPLETED',
    start: subDays(NOW, 305), end: addHours(subDays(NOW, 295), 8) }),
  job({ id: 'demo-job-gc-h28', customerId: 'demo-cust-13', customer: GC_CUSTOMERS[12], userId: GC_USER_ID,
    title: 'Klein — bathroom remodel',
    description: 'Bathroom remodel', status: 'COMPLETED',
    start: subDays(NOW, 320), end: addHours(subDays(NOW, 305), 8) }),
  job({ id: 'demo-job-gc-h29', customerId: 'demo-cust-14', customer: GC_CUSTOMERS[13], userId: GC_USER_ID,
    title: 'Williams — garage conversion',
    description: 'Garage conversion', status: 'COMPLETED',
    start: subDays(NOW, 335), end: addHours(subDays(NOW, 305), 8) }),
  job({ id: 'demo-job-gc-h30', customerId: 'demo-cust-2', customer: GC_CUSTOMERS[1], userId: GC_USER_ID,
    title: 'Rodriguez — kitchen renovation',
    description: 'Kitchen renovation', status: 'COMPLETED',
    start: subDays(NOW, 348), end: addHours(subDays(NOW, 320), 8) }),
  job({ id: 'demo-job-gc-h31', customerId: 'demo-cust-8', customer: GC_CUSTOMERS[7], userId: GC_USER_ID,
    title: 'Bianchi — interior painting',
    description: 'Interior painting', status: 'COMPLETED',
    start: subDays(NOW, 360), end: addHours(subDays(NOW, 354), 8) }),
  job({ id: 'demo-job-gc-h32', customerId: 'demo-cust-10', customer: GC_CUSTOMERS[9], userId: GC_USER_ID,
    title: 'Wright — deck rebuild',
    description: 'Deck rebuild', status: 'COMPLETED',
    start: subDays(NOW, 350), end: addHours(subDays(NOW, 330), 8) }),
];

// Build a single invoice with line items so the insights page's revenue
// breakdown shows individual items, not just totals.
function invoice(opts: {
  id: string;
  number: string;
  customerId: string;
  customer: any;
  status: 'sent' | 'paid' | 'overdue' | 'draft';
  jobId?: string;
  createdDaysAgo: number;
  paidDaysAgo?: number;
  dueDaysFromNow?: number;
  lines: Array<{ desc: string; qty: number; unitPrice: number }>;
}) {
  const lineItems = opts.lines.map((li, i) => ({
    id: `${opts.id}-li-${i + 1}`,
    description: li.desc,
    quantity: li.qty,
    unit_price: li.unitPrice,
    unitPrice: li.unitPrice,
    total: li.qty * li.unitPrice,
    amount: li.qty * li.unitPrice,
  }));
  const total = lineItems.reduce((s, li) => s + li.total, 0);
  return {
    id: opts.id,
    invoice_number: opts.number, invoiceNumber: opts.number,
    customer_id: opts.customerId, customerId: opts.customerId,
    customer: opts.customer,
    job_id: opts.jobId || null, jobId: opts.jobId || null,
    status: opts.status,
    total, amount: total,
    line_items: lineItems, lineItems,
    created_at: iso(subDays(NOW, opts.createdDaysAgo)),
    createdAt: iso(subDays(NOW, opts.createdDaysAgo)),
    due_date: iso(opts.dueDaysFromNow != null ? addDays(NOW, opts.dueDaysFromNow) : addDays(subDays(NOW, opts.createdDaysAgo), 30)),
    dueDate: iso(opts.dueDaysFromNow != null ? addDays(NOW, opts.dueDaysFromNow) : addDays(subDays(NOW, opts.createdDaysAgo), 30)),
    paid_at: opts.paidDaysAgo != null ? iso(subDays(NOW, opts.paidDaysAgo)) : null,
    paidAt: opts.paidDaysAgo != null ? iso(subDays(NOW, opts.paidDaysAgo)) : null,
  };
}

const GC_INVOICES = [
  // ── Open / overdue ───────────────────────────────────────────────
  invoice({ id: 'demo-inv-gc-1', number: 'INV-1042', customerId: 'demo-cust-4', customer: GC_CUSTOMERS[3], status: 'overdue', createdDaysAgo: 32, dueDaysFromNow: -17, jobId: 'demo-job-gc-h2', lines: [
    { desc: 'Bathroom remodel — labor', qty: 56, unitPrice: 145 },
    { desc: 'Tile and fixtures', qty: 1, unitPrice: 4380 },
  ]}),
  invoice({ id: 'demo-inv-gc-2', number: 'INV-1043', customerId: 'demo-cust-5', customer: GC_CUSTOMERS[4], status: 'sent', createdDaysAgo: 21, dueDaysFromNow: -6, jobId: 'demo-job-gc-h3', lines: [
    { desc: 'Kitchen renovation — labor', qty: 28, unitPrice: 145 },
    { desc: 'Cabinet hardware + finish work', qty: 1, unitPrice: 890 },
  ]}),
  invoice({ id: 'demo-inv-gc-12', number: 'INV-1054', customerId: 'demo-cust-7', customer: GC_CUSTOMERS[6], status: 'sent', createdDaysAgo: 10, dueDaysFromNow: 20, lines: [
    { desc: 'Deposit — deck rebuild', qty: 1, unitPrice: 6500 },
  ]}),
  invoice({ id: 'demo-inv-gc-13', number: 'INV-1055', customerId: 'demo-cust-2', customer: GC_CUSTOMERS[1], status: 'sent', createdDaysAgo: 4, dueDaysFromNow: 26, jobId: 'demo-job-gc-h13', lines: [
    { desc: 'Gutter replacement — full perimeter', qty: 1, unitPrice: 2400 },
  ]}),

  // ── Paid (this quarter) ──────────────────────────────────────────
  invoice({ id: 'demo-inv-gc-3', number: 'INV-1044', customerId: 'demo-cust-1', customer: GC_CUSTOMERS[0], status: 'paid', createdDaysAgo: 18, paidDaysAgo: 4, jobId: 'demo-job-gc-h1', lines: [
    { desc: 'Initial scope walkthrough + estimate', qty: 1, unitPrice: 850 },
    { desc: 'Permit pull and prep', qty: 1, unitPrice: 1200 },
    { desc: 'Demo (kitchen + framing)', qty: 1, unitPrice: 6870 },
  ]}),
  invoice({ id: 'demo-inv-gc-4', number: 'INV-1045', customerId: 'demo-cust-2', customer: GC_CUSTOMERS[1], status: 'paid', createdDaysAgo: 24, paidDaysAgo: 9, lines: [
    { desc: 'Garage conversion — phase 1', qty: 1, unitPrice: 18250 },
  ]}),
  invoice({ id: 'demo-inv-gc-5', number: 'INV-1030', customerId: 'demo-cust-6', customer: GC_CUSTOMERS[5], status: 'paid', createdDaysAgo: 88, paidDaysAgo: 78, jobId: 'demo-job-gc-h4', lines: [
    { desc: 'Whole-house demo + framing — Phase 1', qty: 1, unitPrice: 88500 },
  ]}),
  invoice({ id: 'demo-inv-gc-6', number: 'INV-1032', customerId: 'demo-cust-7', customer: GC_CUSTOMERS[6], status: 'paid', createdDaysAgo: 70, paidDaysAgo: 60, jobId: 'demo-job-gc-h5', lines: [
    { desc: 'Deck rebuild — labor', qty: 64, unitPrice: 95 },
    { desc: 'Lumber and hardware', qty: 1, unitPrice: 4800 },
  ]}),
  invoice({ id: 'demo-inv-gc-7', number: 'INV-1034', customerId: 'demo-cust-8', customer: GC_CUSTOMERS[7], status: 'paid', createdDaysAgo: 95, paidDaysAgo: 80, jobId: 'demo-job-gc-h6', lines: [
    { desc: 'Garage conversion — full', qty: 1, unitPrice: 38500 },
  ]}),
  invoice({ id: 'demo-inv-gc-8', number: 'INV-1036', customerId: 'demo-cust-9', customer: GC_CUSTOMERS[8], status: 'paid', createdDaysAgo: 110, paidDaysAgo: 92, jobId: 'demo-job-gc-h7', lines: [
    { desc: 'Kitchen renovation — labor', qty: 120, unitPrice: 145 },
    { desc: 'Cabinetry, counters, appliances', qty: 1, unitPrice: 42000 },
  ]}),
  invoice({ id: 'demo-inv-gc-9', number: 'INV-1037', customerId: 'demo-cust-10', customer: GC_CUSTOMERS[9], status: 'paid', createdDaysAgo: 120, paidDaysAgo: 102, jobId: 'demo-job-gc-h8', lines: [
    { desc: 'Bathroom remodel — labor + materials', qty: 1, unitPrice: 18900 },
  ]}),
  invoice({ id: 'demo-inv-gc-10', number: 'INV-1039', customerId: 'demo-cust-11', customer: GC_CUSTOMERS[10], status: 'paid', createdDaysAgo: 130, paidDaysAgo: 122, jobId: 'demo-job-gc-h9', lines: [
    { desc: 'Roof replacement — architectural shingles', qty: 1, unitPrice: 28400 },
  ]}),
  invoice({ id: 'demo-inv-gc-11', number: 'INV-1041', customerId: 'demo-cust-12', customer: GC_CUSTOMERS[11], status: 'paid', createdDaysAgo: 145, paidDaysAgo: 130, jobId: 'demo-job-gc-h10', lines: [
    { desc: 'Kitchen renovation — full scope', qty: 1, unitPrice: 67500 },
  ]}),
  invoice({ id: 'demo-inv-gc-14', number: 'INV-1024', customerId: 'demo-cust-13', customer: GC_CUSTOMERS[12], status: 'paid', createdDaysAgo: 160, paidDaysAgo: 148, jobId: 'demo-job-gc-h11', lines: [
    { desc: 'Bathroom remodel', qty: 1, unitPrice: 21500 },
  ]}),
  invoice({ id: 'demo-inv-gc-15', number: 'INV-1026', customerId: 'demo-cust-14', customer: GC_CUSTOMERS[13], status: 'paid', createdDaysAgo: 50, paidDaysAgo: 44, jobId: 'demo-job-gc-h12', lines: [
    { desc: 'Fence install — 120 linear ft', qty: 120, unitPrice: 38 },
  ]}),
  invoice({ id: 'demo-inv-gc-16', number: 'INV-1028', customerId: 'demo-cust-4', customer: GC_CUSTOMERS[3], status: 'paid', createdDaysAgo: 12, paidDaysAgo: 6, jobId: 'demo-job-gc-h14', lines: [
    { desc: 'Interior painting — 4 rooms', qty: 1, unitPrice: 4200 },
  ]}),
  invoice({ id: 'demo-inv-gc-17', number: 'INV-1029', customerId: 'demo-cust-7', customer: GC_CUSTOMERS[6], status: 'paid', createdDaysAgo: 28, paidDaysAgo: 18, jobId: 'demo-job-gc-h15', lines: [
    { desc: 'Door replacement — entry + 3 interior', qty: 4, unitPrice: 685 },
  ]}),
  invoice({ id: 'demo-inv-gc-18', number: 'INV-1031', customerId: 'demo-cust-9', customer: GC_CUSTOMERS[8], status: 'paid', createdDaysAgo: 42, paidDaysAgo: 30, jobId: 'demo-job-gc-h16', lines: [
    { desc: 'Window replacement — 6 windows', qty: 6, unitPrice: 950 },
  ]}),
  invoice({ id: 'demo-inv-gc-19', number: 'INV-1033', customerId: 'demo-cust-10', customer: GC_CUSTOMERS[9], status: 'paid', createdDaysAgo: 60, paidDaysAgo: 50, jobId: 'demo-job-gc-h17', lines: [
    { desc: 'Interior painting — whole house', qty: 1, unitPrice: 8400 },
  ]}),
  invoice({ id: 'demo-inv-gc-20', number: 'INV-1018', customerId: 'demo-cust-11', customer: GC_CUSTOMERS[10], status: 'paid', createdDaysAgo: 175, paidDaysAgo: 158, jobId: 'demo-job-gc-h18', lines: [
    { desc: 'Kitchen renovation — full scope', qty: 1, unitPrice: 58200 },
  ]}),
  invoice({ id: 'demo-inv-gc-21', number: 'INV-1022', customerId: 'demo-cust-12', customer: GC_CUSTOMERS[11], status: 'paid', createdDaysAgo: 80, paidDaysAgo: 70, jobId: 'demo-job-gc-h19', lines: [
    { desc: 'Deck rebuild — labor + materials', qty: 1, unitPrice: 14200 },
  ]}),
  invoice({ id: 'demo-inv-gc-22', number: 'INV-1023', customerId: 'demo-cust-13', customer: GC_CUSTOMERS[12], status: 'paid', createdDaysAgo: 90, paidDaysAgo: 70, jobId: 'demo-job-gc-h20', lines: [
    { desc: 'Kitchen renovation — labor', qty: 160, unitPrice: 145 },
    { desc: 'Cabinetry and finishes', qty: 1, unitPrice: 38500 },
  ]}),

  // ── Older paid invoices (May 2025 – Oct 2025) ────────────────────
  invoice({ id: 'demo-inv-gc-23', number: 'INV-1010', customerId: 'demo-cust-1', customer: GC_CUSTOMERS[0], status: 'paid', createdDaysAgo: 198, paidDaysAgo: 188, jobId: 'demo-job-gc-h21', lines: [
    { desc: 'Exterior painting — full house', qty: 1, unitPrice: 12400 },
  ]}),
  invoice({ id: 'demo-inv-gc-24', number: 'INV-1008', customerId: 'demo-cust-4', customer: GC_CUSTOMERS[3], status: 'paid', createdDaysAgo: 215, paidDaysAgo: 200, jobId: 'demo-job-gc-h22', lines: [
    { desc: 'Basement finish — labor', qty: 220, unitPrice: 95 },
    { desc: 'Materials + electrical', qty: 1, unitPrice: 18600 },
  ]}),
  invoice({ id: 'demo-inv-gc-25', number: 'INV-1005', customerId: 'demo-cust-5', customer: GC_CUSTOMERS[4], status: 'paid', createdDaysAgo: 232, paidDaysAgo: 220, jobId: 'demo-job-gc-h23', lines: [
    { desc: 'Kitchen renovation — full scope', qty: 1, unitPrice: 47800 },
  ]}),
  invoice({ id: 'demo-inv-gc-26', number: 'INV-1003', customerId: 'demo-cust-9', customer: GC_CUSTOMERS[8], status: 'paid', createdDaysAgo: 250, paidDaysAgo: 234, jobId: 'demo-job-gc-h24', lines: [
    { desc: 'Sunroom addition — full scope', qty: 1, unitPrice: 38900 },
  ]}),
  invoice({ id: 'demo-inv-gc-27', number: 'INV-1001', customerId: 'demo-cust-11', customer: GC_CUSTOMERS[10], status: 'paid', createdDaysAgo: 268, paidDaysAgo: 252, jobId: 'demo-job-gc-h25', lines: [
    { desc: 'Bathroom remodel', qty: 1, unitPrice: 22400 },
  ]}),
  invoice({ id: 'demo-inv-gc-28', number: 'INV-0996', customerId: 'demo-cust-12', customer: GC_CUSTOMERS[11], status: 'paid', createdDaysAgo: 285, paidDaysAgo: 268, jobId: 'demo-job-gc-h26', lines: [
    { desc: 'Second-story addition — labor', qty: 480, unitPrice: 95 },
    { desc: 'Materials + structural', qty: 1, unitPrice: 64200 },
  ]}),
  invoice({ id: 'demo-inv-gc-29', number: 'INV-0992', customerId: 'demo-cust-7', customer: GC_CUSTOMERS[6], status: 'paid', createdDaysAgo: 302, paidDaysAgo: 290, jobId: 'demo-job-gc-h27', lines: [
    { desc: 'Front porch rebuild', qty: 1, unitPrice: 11800 },
  ]}),
  invoice({ id: 'demo-inv-gc-30', number: 'INV-0988', customerId: 'demo-cust-13', customer: GC_CUSTOMERS[12], status: 'paid', createdDaysAgo: 318, paidDaysAgo: 302, jobId: 'demo-job-gc-h28', lines: [
    { desc: 'Bathroom remodel', qty: 1, unitPrice: 24800 },
  ]}),
  invoice({ id: 'demo-inv-gc-31', number: 'INV-0982', customerId: 'demo-cust-14', customer: GC_CUSTOMERS[13], status: 'paid', createdDaysAgo: 332, paidDaysAgo: 312, jobId: 'demo-job-gc-h29', lines: [
    { desc: 'Garage conversion', qty: 1, unitPrice: 41600 },
  ]}),
  invoice({ id: 'demo-inv-gc-32', number: 'INV-0978', customerId: 'demo-cust-2', customer: GC_CUSTOMERS[1], status: 'paid', createdDaysAgo: 345, paidDaysAgo: 326, jobId: 'demo-job-gc-h30', lines: [
    { desc: 'Kitchen renovation — full scope', qty: 1, unitPrice: 51400 },
  ]}),
  invoice({ id: 'demo-inv-gc-33', number: 'INV-0974', customerId: 'demo-cust-8', customer: GC_CUSTOMERS[7], status: 'paid', createdDaysAgo: 356, paidDaysAgo: 348, jobId: 'demo-job-gc-h31', lines: [
    { desc: 'Interior painting — three rooms', qty: 1, unitPrice: 4800 },
  ]}),
  invoice({ id: 'demo-inv-gc-34', number: 'INV-0976', customerId: 'demo-cust-10', customer: GC_CUSTOMERS[9], status: 'paid', createdDaysAgo: 348, paidDaysAgo: 332, jobId: 'demo-job-gc-h32', lines: [
    { desc: 'Deck rebuild', qty: 1, unitPrice: 16400 },
  ]}),
];

// Build a trade row in the shape GCProjectDetailPage / GCDashboardPage expect:
// camelCase fields, lowercase status, `trade` (not `name`) for the trade type,
// and a `zoneId` since the detail page groups trades by zone.
function trade(t: {
  id: string;
  zoneId: string | null;
  trade: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  assignedUserId?: string | null;
  assignedOrgId?: string | null;
  assignedBusinessName?: string | null;
  laborHours?: number;
  laborRate?: number;
  materialsBudget?: number;
  notes?: string;
  startDaysFromNow?: number;
  endDaysFromNow?: number;
  tasks?: Array<{ name: string; done: boolean }>;
}) {
  const tasks = (t.tasks || []).map((tk, i) => ({ id: `${t.id}-task-${i + 1}`, name: tk.name, done: tk.done }));
  const laborHours = t.laborHours || 0;
  const laborRate = t.laborRate || 0;
  const materialsBudget = t.materialsBudget || 0;
  const startDate = t.startDaysFromNow != null ? iso(addDays(NOW, t.startDaysFromNow)) : null;
  const endDate = t.endDaysFromNow != null ? iso(addDays(NOW, t.endDaysFromNow)) : null;
  return {
    id: t.id,
    zoneId: t.zoneId,
    zone_id: t.zoneId,
    trade: t.trade,
    status: t.status || 'not_started',
    assignedUserId: t.assignedUserId || null,
    assignedOrgId: t.assignedOrgId || null,
    assignedBusinessName: t.assignedBusinessName || null,
    laborHours,
    laborRate,
    materialsBudget,
    budget: laborHours * laborRate + materialsBudget,
    actualLabor: 0,
    actualMaterials: 0,
    notes: t.notes || '',
    startDate,
    endDate,
    start_date: startDate,
    end_date: endDate,
    tasks,
    labor_hours: laborHours,
    labor_rate: laborRate,
    materials_budget: materialsBudget,
    assigned_user_id: t.assignedUserId || null,
    assigned_org_id: t.assignedOrgId || null,
    assigned_business_name: t.assignedBusinessName || null,
  };
}

const GC_PROJECTS = [
  {
    id: 'demo-proj-1', user_id: GC_USER_ID,
    name: 'Mitchell Kitchen Renovation',
    customerName: 'Sarah Mitchell',
    address: '142 Oak Lane',
    city: 'San Francisco',
    state: 'CA',
    zip: '94110',
    structureType: 'house',
    sqFootage: 2400,
    bedrooms: 3,
    bathrooms: 2,
    stories: 2,
    status: 'active',
    startDate: iso(subDays(NOW, 14)),
    start_date: iso(subDays(NOW, 14)),
    targetEndDate: iso(addDays(NOW, 42)),
    target_end_date: iso(addDays(NOW, 42)),
    budget: 128500,
    coverImageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=75',
    cover_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=75',
    zones: [
      { id: 'demo-zone-1a', name: 'Kitchen', zoneType: 'kitchen' },
      { id: 'demo-zone-1b', name: 'Dining', zoneType: 'dining' },
    ],
    trades: [
      trade({ id: 'demo-trade-1a', zoneId: 'demo-zone-1a', trade: 'Demolition', status: 'completed', assignedBusinessName: 'In-house crew', laborHours: 32, laborRate: 70, materialsBudget: 800, startDaysFromNow: -14, endDaysFromNow: -10, tasks: [
        { name: 'Demo cabinets + countertops', done: true },
        { name: 'Demo flooring + tile', done: true },
        { name: 'Haul-off + dispose', done: true },
      ]}),
      trade({ id: 'demo-trade-1b', zoneId: 'demo-zone-1a', trade: 'Plumbing', status: 'in_progress', assignedUserId: 'demo-sub-rivera', assignedBusinessName: 'Rivera Plumbing', laborHours: 28, laborRate: 145, materialsBudget: 4200, startDaysFromNow: -10, endDaysFromNow: 4, notes: 'Pot filler back-ordered until Thursday.', tasks: [
        { name: 'Rough-in supply lines', done: true },
        { name: 'Relocate gas line', done: true },
        { name: 'Install pot filler', done: false },
        { name: 'Hook up dishwasher + disposal', done: false },
        { name: 'Final pressure test', done: false },
      ]}),
      trade({ id: 'demo-trade-1c', zoneId: 'demo-zone-1a', trade: 'Electrical', status: 'in_progress', assignedUserId: 'demo-sub-carlos', assignedBusinessName: 'Carlos Electric', laborHours: 24, laborRate: 155, materialsBudget: 3800, startDaysFromNow: -7, endDaysFromNow: 8, tasks: [
        { name: 'Run dedicated circuits (6)', done: true },
        { name: 'Rough wiring for island', done: true },
        { name: 'Install recessed lighting (14)', done: false },
        { name: 'Under-cabinet LED strips', done: false },
        { name: 'Hook up appliances', done: false },
        { name: 'Code inspection', done: false },
      ]}),
      trade({ id: 'demo-trade-1d', zoneId: 'demo-zone-1a', trade: 'HVAC', status: 'not_started', assignedBusinessName: 'Bay Climate Pros', laborHours: 14, laborRate: 165, materialsBudget: 2400, startDaysFromNow: 6, endDaysFromNow: 12, tasks: [
        { name: 'Reroute supply duct over island', done: false },
        { name: 'Install range hood ductwork', done: false },
        { name: 'Add return air for new layout', done: false },
      ]}),
      trade({ id: 'demo-trade-1e', zoneId: 'demo-zone-1a', trade: 'Drywall', status: 'not_started', assignedBusinessName: 'Apex Drywall', laborHours: 36, laborRate: 65, materialsBudget: 1800, startDaysFromNow: 8, endDaysFromNow: 16, tasks: [
        { name: 'Patch demo openings', done: false },
        { name: 'Hang new drywall (kitchen + dining)', done: false },
        { name: 'Tape, mud, sand to L4', done: false },
      ]}),
      trade({ id: 'demo-trade-1f', zoneId: 'demo-zone-1a', trade: 'Cabinetry', status: 'in_progress', assignedBusinessName: 'Bay Cabinet Co.', laborHours: 48, laborRate: 95, materialsBudget: 26500, startDaysFromNow: -3, endDaysFromNow: 18, tasks: [
        { name: 'Cabinet delivery + staging', done: true },
        { name: 'Install perimeter boxes', done: false },
        { name: 'Install island', done: false },
        { name: 'Mount doors + drawer fronts', done: false },
        { name: 'Pulls + soft-close adjust', done: false },
      ]}),
      // Intentionally unassigned in the demo so visitors can experience the
      // "Invite Sub" flow firsthand. The selling point is the clearest with a
      // real open seat in front of them.
      trade({ id: 'demo-trade-1g', zoneId: 'demo-zone-1a', trade: 'Countertops', status: 'not_started', assignedBusinessName: null, laborHours: 16, laborRate: 110, materialsBudget: 14800, startDaysFromNow: 18, endDaysFromNow: 24, tasks: [
        { name: 'Template after cabinet install', done: false },
        { name: 'Fabrication (10-day lead)', done: false },
        { name: 'Install + seal', done: false },
      ]}),
      trade({ id: 'demo-trade-1h', zoneId: 'demo-zone-1a', trade: 'Flooring', status: 'not_started', assignedBusinessName: 'Bay Cabinet Co.', laborHours: 28, laborRate: 95, materialsBudget: 9200, startDaysFromNow: 16, endDaysFromNow: 22, tasks: [
        { name: 'Level subfloor', done: false },
        { name: 'Install engineered hardwood', done: false },
        { name: 'Trim + transitions', done: false },
      ]}),
      trade({ id: 'demo-trade-1i', zoneId: 'demo-zone-1b', trade: 'Painting', status: 'not_started', assignedBusinessName: null, laborHours: 32, laborRate: 65, materialsBudget: 1400, startDaysFromNow: 22, endDaysFromNow: 28, tasks: [
        { name: 'Prime walls + trim', done: false },
        { name: 'Two coats finish (walls)', done: false },
        { name: 'Trim + cabinet boxes (semi-gloss)', done: false },
      ]}),
      trade({ id: 'demo-trade-1j', zoneId: 'demo-zone-1a', trade: 'Finish Carpentry', status: 'not_started', assignedBusinessName: 'In-house crew', laborHours: 24, laborRate: 85, materialsBudget: 2200, startDaysFromNow: 26, endDaysFromNow: 32, tasks: [
        { name: 'Crown + base + shoe molding', done: false },
        { name: 'Window casings', done: false },
        { name: 'Punch-list', done: false },
      ]}),
    ],
  },
  {
    id: 'demo-proj-2', user_id: GC_USER_ID,
    name: 'Rodriguez Garage Conversion',
    customerName: 'Tom Rodriguez',
    address: '2281 Maple Dr',
    city: 'San Francisco',
    state: 'CA',
    zip: '94114',
    structureType: 'house',
    sqFootage: 540,
    status: 'active',
    startDate: iso(subDays(NOW, 7)),
    start_date: iso(subDays(NOW, 7)),
    targetEndDate: iso(addDays(NOW, 60)),
    target_end_date: iso(addDays(NOW, 60)),
    budget: 95000,
    coverImageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=75',
    cover_url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=75',
    zones: [
      { id: 'demo-zone-2a', name: 'Living Area', zoneType: 'living' },
      { id: 'demo-zone-2b', name: 'Kitchenette + Bath', zoneType: 'kitchen' },
    ],
    trades: [
      trade({ id: 'demo-trade-2a', zoneId: 'demo-zone-2a', trade: 'Framing', status: 'in_progress', assignedBusinessName: 'In-house crew', laborHours: 64, laborRate: 85, materialsBudget: 8200, startDaysFromNow: -7, endDaysFromNow: 6, tasks: [
        { name: 'Frame interior walls', done: true },
        { name: 'Frame closet + bath', done: true },
        { name: 'Install windows + man-door', done: false },
        { name: 'Header for new opening', done: false },
      ]}),
      trade({ id: 'demo-trade-2b', zoneId: 'demo-zone-2b', trade: 'Plumbing', status: 'not_started', assignedUserId: 'demo-sub-rivera', assignedBusinessName: 'Rivera Plumbing', laborHours: 28, laborRate: 145, materialsBudget: 5400, startDaysFromNow: 6, endDaysFromNow: 14, tasks: [
        { name: 'Stub out kitchenette + bath', done: false },
        { name: 'Run waste line + vent', done: false },
        { name: 'Rough-in inspection', done: false },
      ]}),
      trade({ id: 'demo-trade-2c', zoneId: 'demo-zone-2a', trade: 'Electrical', status: 'not_started', assignedUserId: 'demo-sub-carlos', assignedBusinessName: 'Carlos Electric', laborHours: 32, laborRate: 155, materialsBudget: 4600, startDaysFromNow: 8, endDaysFromNow: 18, tasks: [
        { name: 'New 100A subpanel', done: false },
        { name: 'Run circuits (kitchen, bath, HVAC)', done: false },
        { name: 'Recessed lighting (8)', done: false },
        { name: 'Code inspection', done: false },
      ]}),
      trade({ id: 'demo-trade-2d', zoneId: 'demo-zone-2a', trade: 'HVAC', status: 'not_started', assignedBusinessName: 'Bay Climate Pros', laborHours: 14, laborRate: 165, materialsBudget: 5200, startDaysFromNow: 14, endDaysFromNow: 20, tasks: [
        { name: 'Install ductless mini-split', done: false },
        { name: 'Run refrigerant lines', done: false },
        { name: 'Bath exhaust fan + duct', done: false },
      ]}),
      trade({ id: 'demo-trade-2e', zoneId: 'demo-zone-2a', trade: 'Insulation', status: 'not_started', assignedBusinessName: null, laborHours: 18, laborRate: 70, materialsBudget: 2400, startDaysFromNow: 20, endDaysFromNow: 24, tasks: [
        { name: 'Walls — R-15 batts', done: false },
        { name: 'Ceiling — R-30 blown-in', done: false },
        { name: 'Air-seal penetrations', done: false },
      ]}),
      trade({ id: 'demo-trade-2f', zoneId: 'demo-zone-2a', trade: 'Drywall', status: 'not_started', assignedBusinessName: 'Apex Drywall', laborHours: 56, laborRate: 65, materialsBudget: 4200, startDaysFromNow: 24, endDaysFromNow: 32, tasks: [
        { name: 'Hang drywall', done: false },
        { name: 'Tape and mud', done: false },
        { name: 'Sand to L4', done: false },
      ]}),
      trade({ id: 'demo-trade-2g', zoneId: 'demo-zone-2a', trade: 'Flooring', status: 'not_started', assignedBusinessName: 'Bay Cabinet Co.', laborHours: 24, laborRate: 95, materialsBudget: 6800, startDaysFromNow: 36, endDaysFromNow: 42, tasks: [
        { name: 'Self-leveling pour over slab', done: false },
        { name: 'Install LVP click flooring', done: false },
        { name: 'Trim + transitions', done: false },
      ]}),
      trade({ id: 'demo-trade-2h', zoneId: 'demo-zone-2a', trade: 'Painting', status: 'not_started', assignedBusinessName: null, laborHours: 28, laborRate: 65, materialsBudget: 1100, startDaysFromNow: 42, endDaysFromNow: 48, tasks: [
        { name: 'Prime new drywall', done: false },
        { name: 'Two coats walls + ceiling', done: false },
        { name: 'Trim + doors', done: false },
      ]}),
    ],
  },
  {
    id: 'demo-proj-3', user_id: GC_USER_ID,
    name: 'Chen Bathroom Remodel',
    customerName: 'Karen & Dave Chen',
    address: '509 Birch Ct',
    city: 'Oakland',
    state: 'CA',
    zip: '94612',
    structureType: 'house',
    sqFootage: 95,
    bathrooms: 1,
    status: 'active',
    startDate: iso(subDays(NOW, 3)),
    start_date: iso(subDays(NOW, 3)),
    targetEndDate: iso(addDays(NOW, 22)),
    target_end_date: iso(addDays(NOW, 22)),
    budget: 48500,
    coverImageUrl: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=75',
    cover_url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=75',
    zones: [
      { id: 'demo-zone-3a', name: 'Master Bath', zoneType: 'bathroom' },
    ],
    trades: [
      trade({ id: 'demo-trade-3a', zoneId: 'demo-zone-3a', trade: 'Demolition', status: 'completed', assignedBusinessName: 'In-house crew', laborHours: 14, laborRate: 70, materialsBudget: 350, startDaysFromNow: -3, endDaysFromNow: -1, tasks: [
        { name: 'Demo tile + tub surround', done: true },
        { name: 'Demo vanity + toilet', done: true },
        { name: 'Haul-off + dispose', done: true },
      ]}),
      trade({ id: 'demo-trade-3b', zoneId: 'demo-zone-3a', trade: 'Plumbing', status: 'completed', assignedUserId: 'demo-sub-rivera', assignedBusinessName: 'Rivera Plumbing', laborHours: 18, laborRate: 145, materialsBudget: 3200, startDaysFromNow: -1, endDaysFromNow: 2, tasks: [
        { name: 'Rough-in supply + waste', done: true },
        { name: 'Move shower drain (offset 4")', done: true },
        { name: 'Pressure test', done: true },
      ]}),
      trade({ id: 'demo-trade-3c', zoneId: 'demo-zone-3a', trade: 'Electrical', status: 'in_progress', assignedUserId: 'demo-sub-carlos', assignedBusinessName: 'Carlos Electric', laborHours: 10, laborRate: 155, materialsBudget: 1100, startDaysFromNow: 2, endDaysFromNow: 5, tasks: [
        { name: 'Run circuit for heated floor', done: true },
        { name: 'GFCI outlet relocation', done: false },
        { name: 'Vanity sconces', done: false },
        { name: 'Code inspection', done: false },
      ]}),
      trade({ id: 'demo-trade-3d', zoneId: 'demo-zone-3a', trade: 'Waterproofing', status: 'in_progress', assignedBusinessName: 'Stone & Tile SF', laborHours: 12, laborRate: 110, materialsBudget: 1800, startDaysFromNow: 4, endDaysFromNow: 7, tasks: [
        { name: 'Schluter Kerdi membrane (walls)', done: true },
        { name: 'Pre-formed shower pan', done: true },
        { name: 'Flood test', done: false },
      ]}),
      trade({ id: 'demo-trade-3e', zoneId: 'demo-zone-3a', trade: 'Tile', status: 'not_started', assignedBusinessName: 'Stone & Tile SF', laborHours: 32, laborRate: 110, materialsBudget: 6800, startDaysFromNow: 7, endDaysFromNow: 13, tasks: [
        { name: 'Tile shower walls (subway 3x12)', done: false },
        { name: 'Tile floor (24x24 porcelain)', done: false },
        { name: 'Niche + accent strip', done: false },
        { name: 'Grout + seal', done: false },
      ]}),
      trade({ id: 'demo-trade-3f', zoneId: 'demo-zone-3a', trade: 'Cabinetry', status: 'not_started', assignedBusinessName: 'Bay Cabinet Co.', laborHours: 8, laborRate: 95, materialsBudget: 4200, startDaysFromNow: 13, endDaysFromNow: 15, tasks: [
        { name: 'Install double vanity', done: false },
        { name: 'Mount wall cabinet', done: false },
      ]}),
      trade({ id: 'demo-trade-3g', zoneId: 'demo-zone-3a', trade: 'Fixtures', status: 'not_started', assignedUserId: 'demo-sub-rivera', assignedBusinessName: 'Rivera Plumbing', laborHours: 10, laborRate: 145, materialsBudget: 5400, startDaysFromNow: 15, endDaysFromNow: 18, tasks: [
        { name: 'Set toilet', done: false },
        { name: 'Faucets + shower trim', done: false },
        { name: 'Glass shower enclosure', done: false },
        { name: 'Final connections', done: false },
      ]}),
      trade({ id: 'demo-trade-3h', zoneId: 'demo-zone-3a', trade: 'Painting', status: 'not_started', assignedBusinessName: null, laborHours: 8, laborRate: 65, materialsBudget: 400, startDaysFromNow: 18, endDaysFromNow: 20, tasks: [
        { name: 'Prime patches', done: false },
        { name: 'Two coats finish', done: false },
        { name: 'Trim + door', done: false },
      ]}),
    ],
  },
  // ── Completed project — fills out historical/portfolio view ─────
  {
    id: 'demo-proj-4', user_id: GC_USER_ID,
    name: 'Henderson Estate — Phase 1',
    customerName: 'Robert Henderson',
    address: '4200 Westlake Hills Blvd',
    city: 'Austin', state: 'TX', zip: '78746',
    structureType: 'house', sqFootage: 5800, bedrooms: 5, bathrooms: 4, stories: 2,
    status: 'completed',
    startDate: iso(subDays(NOW, 92)), start_date: iso(subDays(NOW, 92)),
    targetEndDate: iso(subDays(NOW, 70)), target_end_date: iso(subDays(NOW, 70)),
    budget: 185000,
    coverImageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=75',
    cover_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=75',
    zones: [
      { id: 'demo-zone-4a', name: 'Living Room', zoneType: 'living' },
      { id: 'demo-zone-4b', name: 'Master Suite', zoneType: 'bedroom' },
    ],
    trades: [
      trade({ id: 'demo-trade-4a', zoneId: 'demo-zone-4a', trade: 'Demolition', status: 'completed', assignedBusinessName: 'In-house crew', laborHours: 36, laborRate: 70, materialsBudget: 1200, startDaysFromNow: -92, endDaysFromNow: -88, tasks: [
        { name: 'Demo non-bearing walls', done: true },
        { name: 'Demo master bath', done: true },
        { name: 'Haul-off + dispose', done: true },
      ]}),
      trade({ id: 'demo-trade-4b', zoneId: 'demo-zone-4a', trade: 'Framing', status: 'completed', assignedBusinessName: 'In-house crew', laborHours: 80, laborRate: 85, materialsBudget: 12000, startDaysFromNow: -88, endDaysFromNow: -80, tasks: [
        { name: 'Install LVL beams (open concept)', done: true },
        { name: 'Frame new pantry + butler kitchen', done: true },
        { name: 'Header + reframe master closet', done: true },
        { name: 'Structural inspection', done: true },
      ]}),
      trade({ id: 'demo-trade-4c', zoneId: 'demo-zone-4b', trade: 'Plumbing', status: 'completed', assignedUserId: 'demo-sub-rivera', assignedBusinessName: 'Rivera Plumbing', laborHours: 36, laborRate: 145, materialsBudget: 11400, startDaysFromNow: -84, endDaysFromNow: -78, tasks: [
        { name: 'Rough-in freestanding tub', done: true },
        { name: 'Double vanity + bidet', done: true },
        { name: 'Curbless shower drain', done: true },
        { name: 'Pressure test', done: true },
      ]}),
      trade({ id: 'demo-trade-4d', zoneId: 'demo-zone-4a', trade: 'Electrical', status: 'completed', assignedUserId: 'demo-sub-carlos', assignedBusinessName: 'Carlos Electric', laborHours: 48, laborRate: 155, materialsBudget: 8200, startDaysFromNow: -82, endDaysFromNow: -76, tasks: [
        { name: 'Recessed lighting layout (28)', done: true },
        { name: 'Smart home hub + Cat6 drops', done: true },
        { name: 'Master suite USB outlets', done: true },
        { name: 'Code inspection', done: true },
      ]}),
      trade({ id: 'demo-trade-4e', zoneId: 'demo-zone-4a', trade: 'HVAC', status: 'completed', assignedBusinessName: 'Bay Climate Pros', laborHours: 28, laborRate: 165, materialsBudget: 9800, startDaysFromNow: -80, endDaysFromNow: -76, tasks: [
        { name: 'Add zoned damper (master)', done: true },
        { name: 'Reroute supply for open layout', done: true },
        { name: 'Bath exhaust fans (2)', done: true },
      ]}),
      trade({ id: 'demo-trade-4f', zoneId: 'demo-zone-4a', trade: 'Drywall', status: 'completed', assignedBusinessName: 'Apex Drywall', laborHours: 96, laborRate: 65, materialsBudget: 5800, startDaysFromNow: -76, endDaysFromNow: -72, tasks: [
        { name: 'Hang drywall (living + master)', done: true },
        { name: 'Tape and mud (L5 in living)', done: true },
        { name: 'Texture match', done: true },
      ]}),
      trade({ id: 'demo-trade-4g', zoneId: 'demo-zone-4a', trade: 'Flooring', status: 'completed', assignedBusinessName: 'Bay Cabinet Co.', laborHours: 56, laborRate: 95, materialsBudget: 18400, startDaysFromNow: -74, endDaysFromNow: -72, tasks: [
        { name: 'Wide-plank engineered oak', done: true },
        { name: 'Heated floor (master bath)', done: true },
        { name: 'Trim + transitions', done: true },
      ]}),
      trade({ id: 'demo-trade-4h', zoneId: 'demo-zone-4a', trade: 'Painting', status: 'completed', assignedBusinessName: 'Premium Painting Co.', laborHours: 64, laborRate: 65, materialsBudget: 2400, startDaysFromNow: -73, endDaysFromNow: -71, tasks: [
        { name: 'Prime + two coats walls', done: true },
        { name: 'Trim + ceilings', done: true },
        { name: 'Accent wall (limewash)', done: true },
      ]}),
      trade({ id: 'demo-trade-4i', zoneId: 'demo-zone-4a', trade: 'Cabinetry', status: 'completed', assignedBusinessName: 'Bay Cabinet Co.', laborHours: 40, laborRate: 95, materialsBudget: 14600, startDaysFromNow: -76, endDaysFromNow: -72, tasks: [
        { name: 'Built-in pantry millwork', done: true },
        { name: 'Master closet system', done: true },
        { name: 'Vanity install (master)', done: true },
      ]}),
      trade({ id: 'demo-trade-4j', zoneId: 'demo-zone-4a', trade: 'Finish Carpentry', status: 'completed', assignedBusinessName: 'In-house crew', laborHours: 48, laborRate: 85, materialsBudget: 4800, startDaysFromNow: -72, endDaysFromNow: -70, tasks: [
        { name: 'Crown + base throughout', done: true },
        { name: 'Custom mantle (living)', done: true },
        { name: 'Punch-list', done: true },
      ]}),
    ],
  },
  // ── Planning project — fills out the pipeline view ──────────────
  {
    id: 'demo-proj-5', user_id: GC_USER_ID,
    name: 'Foster Backyard ADU',
    customerName: 'Emma Foster',
    address: '4480 Telegraph Ave',
    city: 'Oakland', state: 'CA', zip: '94609',
    structureType: 'adu', sqFootage: 720, bedrooms: 1, bathrooms: 1, stories: 1,
    status: 'planning',
    startDate: iso(addDays(NOW, 18)), start_date: iso(addDays(NOW, 18)),
    targetEndDate: iso(addDays(NOW, 150)), target_end_date: iso(addDays(NOW, 150)),
    budget: 310000,
    coverImageUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&q=75',
    cover_url: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&q=75',
    zones: [
      { id: 'demo-zone-5a', name: 'ADU Shell', zoneType: 'general' },
      { id: 'demo-zone-5b', name: 'Kitchen + Bath', zoneType: 'kitchen' },
    ],
    trades: [
      trade({ id: 'demo-trade-5a', zoneId: 'demo-zone-5a', trade: 'Concrete', status: 'not_started', assignedBusinessName: 'Foundation First', laborHours: 56, laborRate: 78, materialsBudget: 12500, startDaysFromNow: 18, endDaysFromNow: 28, tasks: [
        { name: 'Excavation + grade', done: false },
        { name: 'Form footings + slab', done: false },
        { name: 'Pour + cure foundation', done: false },
        { name: 'Strip forms', done: false },
      ]}),
      trade({ id: 'demo-trade-5b', zoneId: 'demo-zone-5a', trade: 'Framing', status: 'not_started', assignedBusinessName: 'In-house crew', laborHours: 160, laborRate: 85, materialsBudget: 28500, startDaysFromNow: 28, endDaysFromNow: 50, tasks: [
        { name: 'Frame walls', done: false },
        { name: 'Frame roof + trusses', done: false },
        { name: 'Sheathe + house-wrap', done: false },
        { name: 'Windows + exterior doors', done: false },
        { name: 'Structural inspection', done: false },
      ]}),
      trade({ id: 'demo-trade-5c', zoneId: 'demo-zone-5a', trade: 'Roofing', status: 'not_started', assignedBusinessName: 'Modern Roofing Co.', laborHours: 48, laborRate: 95, materialsBudget: 11800, startDaysFromNow: 50, endDaysFromNow: 56, tasks: [
        { name: 'Underlayment + ice/water shield', done: false },
        { name: 'Architectural shingles', done: false },
        { name: 'Gutters + downspouts', done: false },
        { name: 'Flashing + ridge vent', done: false },
      ]}),
      trade({ id: 'demo-trade-5d', zoneId: 'demo-zone-5b', trade: 'Plumbing', status: 'not_started', assignedUserId: 'demo-sub-rivera', assignedBusinessName: 'Rivera Plumbing', laborHours: 56, laborRate: 145, materialsBudget: 10800, startDaysFromNow: 56, endDaysFromNow: 66, tasks: [
        { name: 'Run main service line from house', done: false },
        { name: 'DWV rough-in', done: false },
        { name: 'Supply rough-in', done: false },
        { name: 'Tankless water heater', done: false },
        { name: 'Rough-in inspection', done: false },
      ]}),
      trade({ id: 'demo-trade-5e', zoneId: 'demo-zone-5a', trade: 'Electrical', status: 'not_started', assignedUserId: 'demo-sub-carlos', assignedBusinessName: 'Carlos Electric', laborHours: 60, laborRate: 155, materialsBudget: 9200, startDaysFromNow: 58, endDaysFromNow: 68, tasks: [
        { name: 'Trench + run subpanel feed', done: false },
        { name: '125A subpanel', done: false },
        { name: 'Whole-unit rough-in', done: false },
        { name: 'EV-ready 240V circuit', done: false },
        { name: 'Code inspection', done: false },
      ]}),
      trade({ id: 'demo-trade-5f', zoneId: 'demo-zone-5a', trade: 'HVAC', status: 'not_started', assignedBusinessName: 'Bay Climate Pros', laborHours: 24, laborRate: 165, materialsBudget: 9400, startDaysFromNow: 64, endDaysFromNow: 70, tasks: [
        { name: 'Heat pump (12k BTU)', done: false },
        { name: 'Refrigerant lines + condensate', done: false },
        { name: 'Bath + kitchen exhaust', done: false },
      ]}),
      trade({ id: 'demo-trade-5g', zoneId: 'demo-zone-5a', trade: 'Insulation', status: 'not_started', assignedBusinessName: null, laborHours: 36, laborRate: 70, materialsBudget: 5200, startDaysFromNow: 70, endDaysFromNow: 74, tasks: [
        { name: 'Walls — closed-cell spray foam', done: false },
        { name: 'Ceiling — R-38 blown-in', done: false },
        { name: 'Air-seal + acoustic', done: false },
      ]}),
      trade({ id: 'demo-trade-5h', zoneId: 'demo-zone-5a', trade: 'Drywall', status: 'not_started', assignedBusinessName: 'Apex Drywall', laborHours: 96, laborRate: 65, materialsBudget: 6800, startDaysFromNow: 74, endDaysFromNow: 84, tasks: [
        { name: 'Hang + tape', done: false },
        { name: 'Mud + sand to L4', done: false },
        { name: 'Knockdown texture', done: false },
      ]}),
      trade({ id: 'demo-trade-5i', zoneId: 'demo-zone-5a', trade: 'Exterior Siding', status: 'not_started', assignedBusinessName: 'Modern Roofing Co.', laborHours: 80, laborRate: 95, materialsBudget: 18400, startDaysFromNow: 56, endDaysFromNow: 70, tasks: [
        { name: 'WRB + flashing details', done: false },
        { name: 'Hardie panel install', done: false },
        { name: 'Trim + soffit', done: false },
        { name: 'Caulk + paint prep', done: false },
      ]}),
      trade({ id: 'demo-trade-5j', zoneId: 'demo-zone-5b', trade: 'Cabinetry', status: 'not_started', assignedBusinessName: 'Bay Cabinet Co.', laborHours: 40, laborRate: 95, materialsBudget: 16500, startDaysFromNow: 90, endDaysFromNow: 98, tasks: [
        { name: 'Kitchen cabinets', done: false },
        { name: 'Bath vanity', done: false },
        { name: 'Closet systems', done: false },
      ]}),
      trade({ id: 'demo-trade-5k', zoneId: 'demo-zone-5b', trade: 'Tile', status: 'not_started', assignedBusinessName: null, laborHours: 36, laborRate: 110, materialsBudget: 8200, startDaysFromNow: 98, endDaysFromNow: 106, tasks: [
        { name: 'Bath floor + shower', done: false },
        { name: 'Kitchen backsplash', done: false },
        { name: 'Grout + seal', done: false },
      ]}),
      trade({ id: 'demo-trade-5l', zoneId: 'demo-zone-5a', trade: 'Flooring', status: 'not_started', assignedBusinessName: 'Bay Cabinet Co.', laborHours: 32, laborRate: 95, materialsBudget: 8400, startDaysFromNow: 106, endDaysFromNow: 112, tasks: [
        { name: 'LVP throughout living', done: false },
        { name: 'Trim + transitions', done: false },
      ]}),
      trade({ id: 'demo-trade-5m', zoneId: 'demo-zone-5a', trade: 'Painting', status: 'not_started', assignedBusinessName: null, laborHours: 56, laborRate: 65, materialsBudget: 2200, startDaysFromNow: 112, endDaysFromNow: 120, tasks: [
        { name: 'Interior — prime + two coats', done: false },
        { name: 'Exterior — Hardie paint', done: false },
        { name: 'Trim + doors', done: false },
      ]}),
    ],
  },
  // ── Whole-house build — the marquee project. 22 trades across 6 zones,
  //    spanning foundation through final punch. This is the "look at the
  //    depth" project — a full ground-up build for the demo to show that
  //    FlowBoss handles real GC scope, not just remodels. ──────────────
  {
    id: 'demo-proj-6', user_id: GC_USER_ID,
    name: 'Cunningham — Whole-House Build',
    customerName: 'Daniel & Elise Cunningham',
    address: '1812 Sea Cliff Ave',
    city: 'San Francisco', state: 'CA', zip: '94121',
    structureType: 'house', sqFootage: 4850, bedrooms: 5, bathrooms: 4.5, stories: 2,
    status: 'active',
    startDate: iso(subDays(NOW, 56)), start_date: iso(subDays(NOW, 56)),
    targetEndDate: iso(addDays(NOW, 168)), target_end_date: iso(addDays(NOW, 168)),
    budget: 1845000,
    coverImageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=75',
    cover_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=75',
    zones: [
      { id: 'demo-zone-6a', name: 'Foundation + Shell', zoneType: 'general' },
      { id: 'demo-zone-6b', name: 'Main Floor — Living', zoneType: 'living' },
      { id: 'demo-zone-6c', name: 'Main Floor — Kitchen', zoneType: 'kitchen' },
      { id: 'demo-zone-6d', name: 'Upper Floor — Master Suite', zoneType: 'bedroom' },
      { id: 'demo-zone-6e', name: 'Upper Floor — Kids + Guest', zoneType: 'bedroom' },
      { id: 'demo-zone-6f', name: 'Exterior + Site', zoneType: 'general' },
    ],
    trades: [
      trade({ id: 'demo-trade-6a', zoneId: 'demo-zone-6a', trade: 'Site Prep', status: 'completed', assignedBusinessName: 'Sierra Excavation', laborHours: 96, laborRate: 95, materialsBudget: 24000, startDaysFromNow: -56, endDaysFromNow: -50, tasks: [
        { name: 'Demo existing structure', done: true },
        { name: 'Excavate basement + footings', done: true },
        { name: 'Site grading + drainage rough', done: true },
        { name: 'Erosion control + temp power', done: true },
      ]}),
      trade({ id: 'demo-trade-6b', zoneId: 'demo-zone-6a', trade: 'Concrete', status: 'completed', assignedBusinessName: 'Foundation First', laborHours: 184, laborRate: 78, materialsBudget: 86500, startDaysFromNow: -50, endDaysFromNow: -38, tasks: [
        { name: 'Form + pour footings', done: true },
        { name: 'Foundation walls (basement)', done: true },
        { name: 'Slab on grade (garage + basement)', done: true },
        { name: 'Strip + waterproof', done: true },
        { name: 'Backfill + compaction', done: true },
      ]}),
      trade({ id: 'demo-trade-6c', zoneId: 'demo-zone-6a', trade: 'Framing', status: 'completed', assignedBusinessName: 'In-house crew', laborHours: 640, laborRate: 85, materialsBudget: 124000, startDaysFromNow: -38, endDaysFromNow: -14, tasks: [
        { name: 'First floor walls + decking', done: true },
        { name: 'Second floor walls + decking', done: true },
        { name: 'Roof framing + trusses', done: true },
        { name: 'Sheathing + house-wrap', done: true },
        { name: 'Windows + exterior doors', done: true },
        { name: 'Structural inspection', done: true },
      ]}),
      trade({ id: 'demo-trade-6d', zoneId: 'demo-zone-6a', trade: 'Roofing', status: 'completed', assignedBusinessName: 'Modern Roofing Co.', laborHours: 96, laborRate: 95, materialsBudget: 38500, startDaysFromNow: -16, endDaysFromNow: -10, tasks: [
        { name: 'Underlayment + ice/water', done: true },
        { name: 'Standing-seam metal roof', done: true },
        { name: 'Gutters + downspouts', done: true },
        { name: 'Skylight install (2)', done: true },
      ]}),
      trade({ id: 'demo-trade-6e', zoneId: 'demo-zone-6a', trade: 'Plumbing', status: 'in_progress', assignedUserId: 'demo-sub-rivera', assignedBusinessName: 'Rivera Plumbing', laborHours: 240, laborRate: 145, materialsBudget: 64500, startDaysFromNow: -12, endDaysFromNow: 14, notes: 'Whole-house copper repipe; 4.5 baths plus utility + bar.', tasks: [
        { name: 'Service line + meter set', done: true },
        { name: 'DWV rough — basement + 1st floor', done: true },
        { name: 'DWV rough — 2nd floor', done: true },
        { name: 'Supply rough — manifolds', done: true },
        { name: 'Tankless WH (2 units)', done: false },
        { name: 'Recirc loop + softener tie-in', done: false },
        { name: 'Rough-in inspection', done: false },
      ]}),
      trade({ id: 'demo-trade-6f', zoneId: 'demo-zone-6a', trade: 'Electrical', status: 'in_progress', assignedUserId: 'demo-sub-carlos', assignedBusinessName: 'Carlos Electric', laborHours: 280, laborRate: 155, materialsBudget: 58400, startDaysFromNow: -10, endDaysFromNow: 18, tasks: [
        { name: '400A service + meter', done: true },
        { name: 'Two 200A subpanels', done: true },
        { name: '1st floor rough', done: true },
        { name: '2nd floor rough', done: false },
        { name: 'Whole-house Cat6 + WAP backbone', done: false },
        { name: 'Lutron lighting controls rough', done: false },
        { name: 'EV chargers (2) + solar feed', done: false },
        { name: 'Code inspection', done: false },
      ]}),
      trade({ id: 'demo-trade-6g', zoneId: 'demo-zone-6a', trade: 'HVAC', status: 'in_progress', assignedBusinessName: 'Bay Climate Pros', laborHours: 168, laborRate: 165, materialsBudget: 72400, startDaysFromNow: -8, endDaysFromNow: 22, tasks: [
        { name: 'Equipment set — 2 zones', done: true },
        { name: 'Trunk + supply rough (1st floor)', done: true },
        { name: 'Trunk + supply rough (2nd floor)', done: false },
        { name: 'Returns + bath exhausts', done: false },
        { name: 'Heat-pump water heater tie-in', done: false },
        { name: 'Refrigerant + condensate', done: false },
      ]}),
      trade({ id: 'demo-trade-6h', zoneId: 'demo-zone-6a', trade: 'Low Voltage', status: 'in_progress', assignedBusinessName: 'NorCal AV', laborHours: 96, laborRate: 125, materialsBudget: 28400, startDaysFromNow: -6, endDaysFromNow: 24, tasks: [
        { name: 'Pre-wire — speakers (whole house)', done: true },
        { name: 'Pre-wire — security + cameras', done: false },
        { name: 'Pre-wire — TV locations (8)', done: false },
        { name: 'Equipment rack rough', done: false },
      ]}),
      trade({ id: 'demo-trade-6i', zoneId: 'demo-zone-6a', trade: 'Insulation', status: 'not_started', assignedBusinessName: 'Coastal Insulation', laborHours: 96, laborRate: 70, materialsBudget: 32500, startDaysFromNow: 18, endDaysFromNow: 24, tasks: [
        { name: 'Walls — closed-cell + batts', done: false },
        { name: 'Roof deck — closed-cell foam', done: false },
        { name: 'Sound batts (interior + master)', done: false },
        { name: 'Air-seal + acoustic seal', done: false },
      ]}),
      trade({ id: 'demo-trade-6j', zoneId: 'demo-zone-6a', trade: 'Drywall', status: 'not_started', assignedBusinessName: 'Apex Drywall', laborHours: 320, laborRate: 65, materialsBudget: 28500, startDaysFromNow: 24, endDaysFromNow: 38, tasks: [
        { name: 'Hang — 1st floor', done: false },
        { name: 'Hang — 2nd floor', done: false },
        { name: 'Tape + mud (L5 in living + master)', done: false },
        { name: 'Texture match', done: false },
      ]}),
      trade({ id: 'demo-trade-6k', zoneId: 'demo-zone-6f', trade: 'Exterior Siding', status: 'not_started', assignedBusinessName: 'Modern Roofing Co.', laborHours: 240, laborRate: 95, materialsBudget: 86200, startDaysFromNow: -8, endDaysFromNow: 18, tasks: [
        { name: 'WRB + flashing details', done: true },
        { name: 'Cedar shingle siding (S+E elevations)', done: false },
        { name: 'Hardie panel + reveal trim (N+W)', done: false },
        { name: 'Soffit + fascia', done: false },
        { name: 'Caulk + paint prep', done: false },
      ]}),
      trade({ id: 'demo-trade-6l', zoneId: 'demo-zone-6c', trade: 'Cabinetry', status: 'not_started', assignedBusinessName: 'Bay Cabinet Co.', laborHours: 184, laborRate: 95, materialsBudget: 142500, startDaysFromNow: 38, endDaysFromNow: 54, notes: 'Custom rift-cut white oak — 14-week lead, deposit paid wk 4.', tasks: [
        { name: 'Kitchen perimeter + island', done: false },
        { name: 'Butler pantry + bar', done: false },
        { name: 'Master closet system', done: false },
        { name: 'Bath vanities (4)', done: false },
        { name: 'Built-ins (living + office)', done: false },
      ]}),
      trade({ id: 'demo-trade-6m', zoneId: 'demo-zone-6c', trade: 'Countertops', status: 'not_started', assignedBusinessName: 'Stone & Tile SF', laborHours: 56, laborRate: 110, materialsBudget: 68200, startDaysFromNow: 50, endDaysFromNow: 56, tasks: [
        { name: 'Template after cabinet install', done: false },
        { name: 'Quartzite — kitchen + island', done: false },
        { name: 'Marble — master bath', done: false },
        { name: 'Quartz — secondary baths', done: false },
        { name: 'Install + seal', done: false },
      ]}),
      trade({ id: 'demo-trade-6n', zoneId: 'demo-zone-6c', trade: 'Tile', status: 'not_started', assignedBusinessName: 'Stone & Tile SF', laborHours: 220, laborRate: 110, materialsBudget: 48400, startDaysFromNow: 32, endDaysFromNow: 50, tasks: [
        { name: 'Master bath — floor + shower + tub deck', done: false },
        { name: 'Kids bath + Jack-n-Jill', done: false },
        { name: 'Powder + guest bath', done: false },
        { name: 'Kitchen backsplash + bar', done: false },
        { name: 'Grout + seal', done: false },
      ]}),
      trade({ id: 'demo-trade-6o', zoneId: 'demo-zone-6b', trade: 'Flooring', status: 'not_started', assignedBusinessName: 'Bay Cabinet Co.', laborHours: 144, laborRate: 95, materialsBudget: 64800, startDaysFromNow: 44, endDaysFromNow: 52, tasks: [
        { name: 'Wide-plank rift oak (1st floor)', done: false },
        { name: 'Engineered oak (2nd floor)', done: false },
        { name: 'Heated floor (master + kids bath)', done: false },
        { name: 'Stair treads + risers', done: false },
        { name: 'Trim + transitions', done: false },
      ]}),
      trade({ id: 'demo-trade-6p', zoneId: 'demo-zone-6a', trade: 'Painting', status: 'not_started', assignedBusinessName: 'Premium Painting Co.', laborHours: 280, laborRate: 65, materialsBudget: 18400, startDaysFromNow: 38, endDaysFromNow: 56, tasks: [
        { name: 'Prime + two coats walls (whole house)', done: false },
        { name: 'Trim + ceilings', done: false },
        { name: 'Limewash accent (living + master)', done: false },
        { name: 'Exterior paint (Hardie + trim)', done: false },
      ]}),
      trade({ id: 'demo-trade-6q', zoneId: 'demo-zone-6a', trade: 'Finish Carpentry', status: 'not_started', assignedBusinessName: 'In-house crew', laborHours: 220, laborRate: 85, materialsBudget: 22400, startDaysFromNow: 44, endDaysFromNow: 60, tasks: [
        { name: 'Crown + base throughout', done: false },
        { name: 'Wainscoting (dining + powder)', done: false },
        { name: 'Custom mantle (living + master)', done: false },
        { name: 'Stair handrail + balusters', done: false },
        { name: 'Door + window casings', done: false },
        { name: 'Punch-list', done: false },
      ]}),
      trade({ id: 'demo-trade-6r', zoneId: 'demo-zone-6c', trade: 'Appliances', status: 'not_started', assignedBusinessName: 'In-house crew', laborHours: 24, laborRate: 85, materialsBudget: 84200, startDaysFromNow: 56, endDaysFromNow: 60, notes: 'Wolf range, Sub-Zero pair, Miele DW, Best hood.', tasks: [
        { name: 'Receive + stage (4-week lead)', done: false },
        { name: 'Set + hook up gas + water', done: false },
        { name: 'Commission + warranty register', done: false },
      ]}),
      trade({ id: 'demo-trade-6s', zoneId: 'demo-zone-6a', trade: 'Plumbing Fixtures', status: 'not_started', assignedUserId: 'demo-sub-rivera', assignedBusinessName: 'Rivera Plumbing', laborHours: 56, laborRate: 145, materialsBudget: 78400, startDaysFromNow: 56, endDaysFromNow: 64, tasks: [
        { name: 'Master suite (Kohler Purist)', done: false },
        { name: 'Secondary baths', done: false },
        { name: 'Kitchen + bar', done: false },
        { name: 'Outdoor + utility', done: false },
        { name: 'Final pressure test', done: false },
      ]}),
      // Open seat #1 — Landscape. Demo visitors should feel the "Invite Sub" pull.
      trade({ id: 'demo-trade-6t', zoneId: 'demo-zone-6f', trade: 'Landscape', status: 'not_started', assignedBusinessName: null, laborHours: 280, laborRate: 95, materialsBudget: 124500, startDaysFromNow: 60, endDaysFromNow: 90, tasks: [
        { name: 'Hardscape — pavers + retaining', done: false },
        { name: 'Pool + spa shell', done: false },
        { name: 'Irrigation + lighting', done: false },
        { name: 'Plant install + sod', done: false },
        { name: 'Fence + gates', done: false },
      ]}),
      // Open seat #2 — Smart Home commissioning.
      trade({ id: 'demo-trade-6u', zoneId: 'demo-zone-6a', trade: 'Smart Home', status: 'not_started', assignedBusinessName: null, laborHours: 64, laborRate: 165, materialsBudget: 38500, startDaysFromNow: 70, endDaysFromNow: 78, tasks: [
        { name: 'Lutron RadioRA programming', done: false },
        { name: 'Sonos + Apple TV stack', done: false },
        { name: 'Security + camera commission', done: false },
        { name: 'Owner training', done: false },
      ]}),
      trade({ id: 'demo-trade-6v', zoneId: 'demo-zone-6a', trade: 'Final Punch', status: 'not_started', assignedBusinessName: 'In-house crew', laborHours: 96, laborRate: 85, materialsBudget: 4800, startDaysFromNow: 72, endDaysFromNow: 84, tasks: [
        { name: 'Walkthrough w/ owner — 30 day list', done: false },
        { name: 'Touch-up paint + caulk', done: false },
        { name: 'Final clean', done: false },
        { name: 'Warranty + manuals binder', done: false },
        { name: 'Final inspection + CO', done: false },
      ]}),
    ],
  },
];

// Project chat thread — the threaded conversation on the project detail page.
// Distinct from GC_PROJECT_ACTIVITY below: this is what GCs and subs type at
// each other; the activity feed is the system event log.
const GC_PROJECT_MESSAGES: Record<string, any[]> = {
  'demo-proj-1': [
    { id: 'msg-1-1', message: 'Pot filler is back-ordered until Thursday — pushing dishwasher hookup to Friday so we don\'t double-trip.', createdAt: iso(subDays(NOW, 6)), created_at: iso(subDays(NOW, 6)), author: 'Mike Reyes — Rivera Plumbing', authorRole: 'sub' },
    { id: 'msg-1-2', message: 'Got it. Let\'s aim Friday AM. Cabinets staged in the garage already.', createdAt: iso(subDays(NOW, 6)), created_at: iso(subDays(NOW, 6)), author: 'Marcos (you)', authorRole: 'gc' },
    { id: 'msg-1-3', message: 'Wired the island this morning — 4 dedicated circuits + USB. Recessed lights are next.', createdAt: iso(subDays(NOW, 4)), created_at: iso(subDays(NOW, 4)), author: 'Carlos Vargas — Carlos Electric', authorRole: 'sub' },
    { id: 'msg-1-4', message: 'Cabinets delivered — staged in garage. Bay starts Monday.', createdAt: iso(subDays(NOW, 3)), created_at: iso(subDays(NOW, 3)), author: 'Marcos (you)', authorRole: 'gc' },
    { id: 'msg-1-5', message: 'Pot filler arrives Wed end of day per Ferguson. Will set Thursday AM.', createdAt: iso(subDays(NOW, 1)), created_at: iso(subDays(NOW, 1)), author: 'Mike Reyes — Rivera Plumbing', authorRole: 'sub' },
  ],
  'demo-proj-2': [
    { id: 'msg-2-1', message: 'Framing 60% complete. Window order arrived this morning — staging in garage.', createdAt: iso(subDays(NOW, 4)), created_at: iso(subDays(NOW, 4)), author: 'Marcos (you)', authorRole: 'gc' },
    { id: 'msg-2-2', message: 'Got the rough plumbing scope. Can start Mon if framing\'s ready for me.', createdAt: iso(subDays(NOW, 3)), created_at: iso(subDays(NOW, 3)), author: 'Mike Reyes — Rivera Plumbing', authorRole: 'sub' },
    { id: 'msg-2-3', message: 'Header for kitchenette is in. You\'re clear for Monday.', createdAt: iso(subDays(NOW, 1)), created_at: iso(subDays(NOW, 1)), author: 'Marcos (you)', authorRole: 'gc' },
  ],
  'demo-proj-3': [
    { id: 'msg-3-1', message: 'Rough plumbing passed inspection on the first try. Pressure test holds at 150 psi.', createdAt: iso(subDays(NOW, 2)), created_at: iso(subDays(NOW, 2)), author: 'Mike Reyes — Rivera Plumbing', authorRole: 'sub' },
    { id: 'msg-3-2', message: 'Heated floor circuit is in. GFCI relocation tomorrow.', createdAt: iso(subDays(NOW, 2)), created_at: iso(subDays(NOW, 2)), author: 'Carlos Vargas — Carlos Electric', authorRole: 'sub' },
    { id: 'msg-3-3', message: 'Tile arrived. Stone & Tile starts walls tomorrow — Karen requested the niche moved 4" left, FYI.', createdAt: iso(subDays(NOW, 1)), created_at: iso(subDays(NOW, 1)), author: 'Marcos (you)', authorRole: 'gc' },
    { id: 'msg-3-4', message: 'Noted. Will pre-cut the niche frame tonight.', createdAt: iso(subDays(NOW, 1)), created_at: iso(subDays(NOW, 1)), author: 'Tasha Lin — Stone & Tile SF', authorRole: 'sub' },
  ],
  'demo-proj-4': [
    { id: 'msg-4-1', message: 'Final walkthrough went great — Henderson is thrilled. Sending the warranty binder Friday.', createdAt: iso(subDays(NOW, 71)), created_at: iso(subDays(NOW, 71)), author: 'Marcos (you)', authorRole: 'gc' },
    { id: 'msg-4-2', message: 'Thanks for the smooth run, team. Happy to be the reference for the next one.', createdAt: iso(subDays(NOW, 70)), created_at: iso(subDays(NOW, 70)), author: 'Robert Henderson', authorRole: 'customer' },
  ],
  'demo-proj-5': [
    { id: 'msg-5-1', message: 'Plans approved at the city. Permit pickup Monday — kicking site prep on the 18th.', createdAt: iso(subDays(NOW, 4)), created_at: iso(subDays(NOW, 4)), author: 'Marcos (you)', authorRole: 'gc' },
    { id: 'msg-5-2', message: 'Locked Foundation First for the 18th. They\'ll have the dumpster Sat.', createdAt: iso(subDays(NOW, 2)), created_at: iso(subDays(NOW, 2)), author: 'Marcos (you)', authorRole: 'gc' },
  ],
  'demo-proj-6': [
    { id: 'msg-6-1', message: 'Foundation is poured + cured. Framers start Wednesday.', createdAt: iso(subDays(NOW, 38)), created_at: iso(subDays(NOW, 38)), author: 'Reggie Park — Foundation First', authorRole: 'sub' },
    { id: 'msg-6-2', message: 'Truss package landed. Dry-in by Friday next week if weather holds.', createdAt: iso(subDays(NOW, 22)), created_at: iso(subDays(NOW, 22)), author: 'Tomás Riley — In-house lead', authorRole: 'gc' },
    { id: 'msg-6-3', message: 'Roofing wrapped. Standing-seam looks clean — Daniel + Elise stopped by Sat to walk it.', createdAt: iso(subDays(NOW, 10)), created_at: iso(subDays(NOW, 10)), author: 'Jay Liu — Modern Roofing Co.', authorRole: 'sub' },
    { id: 'msg-6-4', message: 'Plumbing rough is 70% in. Master tub valve location got moved 6" — owner sign-off pending.', createdAt: iso(subDays(NOW, 4)), created_at: iso(subDays(NOW, 4)), author: 'Mike Reyes — Rivera Plumbing', authorRole: 'sub' },
    { id: 'msg-6-5', message: 'Approved on the tub valve move. Send me the marked plan.', createdAt: iso(subDays(NOW, 3)), created_at: iso(subDays(NOW, 3)), author: 'Daniel Cunningham', authorRole: 'customer' },
    { id: 'msg-6-6', message: 'Cat6 + Lutron rough in by EOD Friday. WAP locations confirmed.', createdAt: iso(subDays(NOW, 2)), created_at: iso(subDays(NOW, 2)), author: 'Carlos Vargas — Carlos Electric', authorRole: 'sub' },
    { id: 'msg-6-7', message: 'Cabinet shop drawings v2 attached. Lead is now wk 14, deposit clears Friday.', createdAt: iso(subDays(NOW, 1)), created_at: iso(subDays(NOW, 1)), author: 'Lena Park — Bay Cabinet Co.', authorRole: 'sub' },
  ],
};

// ── Activity event stream ────────────────────────────────────────────
// What ProjectActivityFeed + MultiProjectActivityFeed render. Every entry
// MUST carry an `actorName` (real human or business) — the empty fallback
// "Someone" reads as a bug. eventType keys map to icons in the feed widget.
function activityEvent(opts: {
  id: string;
  projectId: string;
  eventType: string;
  actorName: string;
  summary: string;
  daysAgo: number;
  hoursAgo?: number;
  metadata?: any;
}) {
  const date = opts.hoursAgo
    ? new Date(NOW.getTime() - (opts.daysAgo * 86400000) - (opts.hoursAgo * 3600000))
    : subDays(NOW, opts.daysAgo);
  return {
    id: opts.id,
    gcProjectId: opts.projectId,
    gc_project_id: opts.projectId,
    eventType: opts.eventType,
    event_type: opts.eventType,
    actorName: opts.actorName,
    actor_name: opts.actorName,
    summary: opts.summary,
    metadata: opts.metadata || null,
    createdAt: iso(date),
    created_at: iso(date),
  };
}

const GC_PROJECT_ACTIVITY: Record<string, any[]> = {
  'demo-proj-1': [
    activityEvent({ id: 'act-1-1', projectId: 'demo-proj-1', eventType: 'task_completed', actorName: 'Mike Reyes — Rivera Plumbing', summary: 'Completed "Relocate gas line" on Plumbing', daysAgo: 9 }),
    activityEvent({ id: 'act-1-2', projectId: 'demo-proj-1', eventType: 'photo_uploaded', actorName: 'Carlos Vargas — Carlos Electric', summary: 'Uploaded 4 photos to Electrical rough-in', daysAgo: 7 }),
    activityEvent({ id: 'act-1-3', projectId: 'demo-proj-1', eventType: 'hours_logged', actorName: 'Mike Reyes — Rivera Plumbing', summary: 'Logged 6.5 hrs on Plumbing rough-in', daysAgo: 6 }),
    activityEvent({ id: 'act-1-4', projectId: 'demo-proj-1', eventType: 'task_completed', actorName: 'Lena Park — Bay Cabinet Co.', summary: 'Completed "Cabinet delivery + staging"', daysAgo: 4 }),
    activityEvent({ id: 'act-1-5', projectId: 'demo-proj-1', eventType: 'note_added', actorName: 'Mike Reyes — Rivera Plumbing', summary: 'Note: "Pot filler back-ordered. Expected Thursday."', daysAgo: 1 }),
    activityEvent({ id: 'act-1-6', projectId: 'demo-proj-1', eventType: 'task_completed', actorName: 'Carlos Vargas — Carlos Electric', summary: 'Completed "Run dedicated circuits (6)"', daysAgo: 0, hoursAgo: 18 }),
    activityEvent({ id: 'act-1-7', projectId: 'demo-proj-1', eventType: 'photo_uploaded', actorName: 'Marcos Riley — Riverside Construction', summary: 'Uploaded daily progress photo (kitchen)', daysAgo: 0, hoursAgo: 4 }),
    activityEvent({ id: 'act-1-8', projectId: 'demo-proj-1', eventType: 'sub_invited', actorName: 'Marcos Riley — Riverside Construction', summary: 'Invited Apex Drywall to "Drywall"', daysAgo: 0, hoursAgo: 2 }),
  ],
  'demo-proj-2': [
    activityEvent({ id: 'act-2-1', projectId: 'demo-proj-2', eventType: 'task_completed', actorName: 'Tomás Riley — In-house lead', summary: 'Completed "Frame interior walls"', daysAgo: 5 }),
    activityEvent({ id: 'act-2-2', projectId: 'demo-proj-2', eventType: 'task_completed', actorName: 'Tomás Riley — In-house lead', summary: 'Completed "Frame closet + bath"', daysAgo: 3 }),
    activityEvent({ id: 'act-2-3', projectId: 'demo-proj-2', eventType: 'photo_uploaded', actorName: 'Marcos Riley — Riverside Construction', summary: 'Uploaded 3 photos: framing progress', daysAgo: 2 }),
    activityEvent({ id: 'act-2-4', projectId: 'demo-proj-2', eventType: 'sub_accepted', actorName: 'Mike Reyes — Rivera Plumbing', summary: 'Accepted invite to "Plumbing"', daysAgo: 1 }),
    activityEvent({ id: 'act-2-5', projectId: 'demo-proj-2', eventType: 'note_added', actorName: 'Marcos Riley — Riverside Construction', summary: 'Note: "Header for kitchenette is in — clear for Mon."', daysAgo: 0, hoursAgo: 6 }),
  ],
  'demo-proj-3': [
    activityEvent({ id: 'act-3-1', projectId: 'demo-proj-3', eventType: 'task_completed', actorName: 'Tomás Riley — In-house lead', summary: 'Completed "Demo tile + tub surround"', daysAgo: 3 }),
    activityEvent({ id: 'act-3-2', projectId: 'demo-proj-3', eventType: 'trade_completed', actorName: 'Mike Reyes — Rivera Plumbing', summary: 'Marked Plumbing as complete — passed inspection', daysAgo: 2 }),
    activityEvent({ id: 'act-3-3', projectId: 'demo-proj-3', eventType: 'photo_uploaded', actorName: 'Mike Reyes — Rivera Plumbing', summary: 'Uploaded 6 photos: rough-in + pressure test', daysAgo: 2 }),
    activityEvent({ id: 'act-3-4', projectId: 'demo-proj-3', eventType: 'task_completed', actorName: 'Carlos Vargas — Carlos Electric', summary: 'Completed "Run circuit for heated floor"', daysAgo: 2 }),
    activityEvent({ id: 'act-3-5', projectId: 'demo-proj-3', eventType: 'task_completed', actorName: 'Tasha Lin — Stone & Tile SF', summary: 'Completed "Schluter Kerdi membrane (walls)"', daysAgo: 1 }),
    activityEvent({ id: 'act-3-6', projectId: 'demo-proj-3', eventType: 'note_added', actorName: 'Marcos Riley — Riverside Construction', summary: 'Note: "Karen requested niche move 4" left."', daysAgo: 0, hoursAgo: 10 }),
    activityEvent({ id: 'act-3-7', projectId: 'demo-proj-3', eventType: 'photo_uploaded', actorName: 'Tasha Lin — Stone & Tile SF', summary: 'Uploaded 2 photos: pre-formed pan + flood test', daysAgo: 0, hoursAgo: 3 }),
  ],
  'demo-proj-4': [
    activityEvent({ id: 'act-4-1', projectId: 'demo-proj-4', eventType: 'trade_completed', actorName: 'Mike Reyes — Rivera Plumbing', summary: 'Marked Plumbing as complete', daysAgo: 78 }),
    activityEvent({ id: 'act-4-2', projectId: 'demo-proj-4', eventType: 'trade_completed', actorName: 'Carlos Vargas — Carlos Electric', summary: 'Marked Electrical as complete', daysAgo: 76 }),
    activityEvent({ id: 'act-4-3', projectId: 'demo-proj-4', eventType: 'photo_uploaded', actorName: 'Marcos Riley — Riverside Construction', summary: 'Uploaded 12 photos: final walkthrough', daysAgo: 71 }),
    activityEvent({ id: 'act-4-4', projectId: 'demo-proj-4', eventType: 'invoice_sent', actorName: 'Marcos Riley — Riverside Construction', summary: 'Sent INV-1030 — Phase 1 close-out ($88,500)', daysAgo: 88 }),
    activityEvent({ id: 'act-4-5', projectId: 'demo-proj-4', eventType: 'invoice_paid', actorName: 'Robert Henderson', summary: 'Paid INV-1030 ($88,500)', daysAgo: 78 }),
    activityEvent({ id: 'act-4-6', projectId: 'demo-proj-4', eventType: 'note_added', actorName: 'Marcos Riley — Riverside Construction', summary: 'Note: "Phase 1 closed. Phase 2 scope discussion next month."', daysAgo: 70 }),
  ],
  'demo-proj-5': [
    activityEvent({ id: 'act-5-1', projectId: 'demo-proj-5', eventType: 'note_added', actorName: 'Marcos Riley — Riverside Construction', summary: 'Note: "Plans submitted to Oakland city — review window 3 wks."', daysAgo: 28 }),
    activityEvent({ id: 'act-5-2', projectId: 'demo-proj-5', eventType: 'sub_invited', actorName: 'Marcos Riley — Riverside Construction', summary: 'Invited Foundation First to "Concrete"', daysAgo: 12 }),
    activityEvent({ id: 'act-5-3', projectId: 'demo-proj-5', eventType: 'sub_accepted', actorName: 'Reggie Park — Foundation First', summary: 'Accepted invite to "Concrete"', daysAgo: 11 }),
    activityEvent({ id: 'act-5-4', projectId: 'demo-proj-5', eventType: 'note_added', actorName: 'Emma Foster', summary: 'Note: "Confirmed — go ahead with the 18th start."', daysAgo: 4 }),
    activityEvent({ id: 'act-5-5', projectId: 'demo-proj-5', eventType: 'note_added', actorName: 'Marcos Riley — Riverside Construction', summary: 'Note: "Permit picked up — kicking off site prep on the 18th."', daysAgo: 2 }),
  ],
  'demo-proj-6': [
    activityEvent({ id: 'act-6-1', projectId: 'demo-proj-6', eventType: 'trade_completed', actorName: 'Mateo Sierra — Sierra Excavation', summary: 'Marked Site Prep as complete', daysAgo: 50 }),
    activityEvent({ id: 'act-6-2', projectId: 'demo-proj-6', eventType: 'trade_completed', actorName: 'Reggie Park — Foundation First', summary: 'Marked Concrete as complete', daysAgo: 38 }),
    activityEvent({ id: 'act-6-3', projectId: 'demo-proj-6', eventType: 'trade_completed', actorName: 'Tomás Riley — In-house lead', summary: 'Marked Framing as complete', daysAgo: 14 }),
    activityEvent({ id: 'act-6-4', projectId: 'demo-proj-6', eventType: 'trade_completed', actorName: 'Jay Liu — Modern Roofing Co.', summary: 'Marked Roofing as complete', daysAgo: 10 }),
    activityEvent({ id: 'act-6-5', projectId: 'demo-proj-6', eventType: 'photo_uploaded', actorName: 'Jay Liu — Modern Roofing Co.', summary: 'Uploaded 8 photos: standing-seam install', daysAgo: 10 }),
    activityEvent({ id: 'act-6-6', projectId: 'demo-proj-6', eventType: 'task_completed', actorName: 'Mike Reyes — Rivera Plumbing', summary: 'Completed "DWV rough — 2nd floor" on Plumbing', daysAgo: 6 }),
    activityEvent({ id: 'act-6-7', projectId: 'demo-proj-6', eventType: 'hours_logged', actorName: 'Mike Reyes — Rivera Plumbing', summary: 'Logged 14.5 hrs on Plumbing this week', daysAgo: 5 }),
    activityEvent({ id: 'act-6-8', projectId: 'demo-proj-6', eventType: 'task_completed', actorName: 'Carlos Vargas — Carlos Electric', summary: 'Completed "1st floor rough" on Electrical', daysAgo: 5 }),
    activityEvent({ id: 'act-6-9', projectId: 'demo-proj-6', eventType: 'invoice_sent', actorName: 'Marcos Riley — Riverside Construction', summary: 'Sent INV-1052 — Draw 4 ($186,400)', daysAgo: 4 }),
    activityEvent({ id: 'act-6-10', projectId: 'demo-proj-6', eventType: 'note_added', actorName: 'Mike Reyes — Rivera Plumbing', summary: 'Note: "Master tub valve moved 6" right per owner."', daysAgo: 4 }),
    activityEvent({ id: 'act-6-11', projectId: 'demo-proj-6', eventType: 'invoice_paid', actorName: 'Daniel Cunningham', summary: 'Paid INV-1052 ($186,400)', daysAgo: 2 }),
    activityEvent({ id: 'act-6-12', projectId: 'demo-proj-6', eventType: 'photo_uploaded', actorName: 'Tomás Riley — In-house lead', summary: 'Uploaded 9 photos: weekly progress walk', daysAgo: 2 }),
    activityEvent({ id: 'act-6-13', projectId: 'demo-proj-6', eventType: 'task_completed', actorName: 'Carlos Vargas — Carlos Electric', summary: 'Completed "Two 200A subpanels" on Electrical', daysAgo: 1 }),
    activityEvent({ id: 'act-6-14', projectId: 'demo-proj-6', eventType: 'sub_invited', actorName: 'Marcos Riley — Riverside Construction', summary: 'Invited Coastal Insulation to "Insulation"', daysAgo: 0, hoursAgo: 8 }),
    activityEvent({ id: 'act-6-15', projectId: 'demo-proj-6', eventType: 'note_added', actorName: 'Lena Park — Bay Cabinet Co.', summary: 'Note: "Shop drawings v2 attached — lead now 14 wks."', daysAgo: 0, hoursAgo: 3 }),
  ],
};

// Sub directory shape for `getGCSubDirectory`. The per-sub aggregate the My
// Subs tab + SubCard read. Each sub carries a real lead-name so the demo
// never has a faceless avatar — this is the relationship side of the GC
// product, and faceless ruins it.
const GC_SUB_DIRECTORY = [
  {
    userId: 'demo-sub-rivera',
    businessName: 'Rivera Plumbing',
    contactName: 'Mike Reyes',
    tradePrimary: 'Plumbing',
    trades: ['Plumbing'],
    phone: '(415) 555-0701',
    email: 'mike@rivera-demo.com',
    isPlaceholder: false,
    score: 4.9,
    totalRatings: 11,
    projectCount: 4,
    projects: [
      { id: 'demo-proj-1', name: 'Mitchell Kitchen Renovation' },
      { id: 'demo-proj-2', name: 'Rodriguez Garage Conversion' },
      { id: 'demo-proj-3', name: 'Chen Bathroom Remodel' },
      { id: 'demo-proj-6', name: 'Cunningham — Whole-House Build' },
    ],
  },
  {
    userId: 'demo-sub-carlos',
    businessName: 'Carlos Electric',
    contactName: 'Carlos Vargas',
    tradePrimary: 'Electrical',
    trades: ['Electrical'],
    phone: '(415) 555-0823',
    email: 'carlos@cee-demo.com',
    isPlaceholder: false,
    score: 4.8,
    totalRatings: 9,
    projectCount: 4,
    projects: [
      { id: 'demo-proj-1', name: 'Mitchell Kitchen Renovation' },
      { id: 'demo-proj-2', name: 'Rodriguez Garage Conversion' },
      { id: 'demo-proj-3', name: 'Chen Bathroom Remodel' },
      { id: 'demo-proj-6', name: 'Cunningham — Whole-House Build' },
    ],
  },
  {
    userId: 'demo-sub-baycab',
    businessName: 'Bay Cabinet Co.',
    contactName: 'Lena Park',
    tradePrimary: 'Cabinetry',
    trades: ['Cabinetry', 'Flooring'],
    phone: '(415) 555-0944',
    email: 'lena@baycabs-demo.com',
    isPlaceholder: false,
    score: 4.7,
    totalRatings: 6,
    projectCount: 3,
    projects: [
      { id: 'demo-proj-1', name: 'Mitchell Kitchen Renovation' },
      { id: 'demo-proj-2', name: 'Rodriguez Garage Conversion' },
      { id: 'demo-proj-6', name: 'Cunningham — Whole-House Build' },
    ],
  },
  {
    userId: 'demo-sub-tile',
    businessName: 'Stone & Tile SF',
    contactName: 'Tasha Lin',
    tradePrimary: 'Tile',
    trades: ['Tile', 'Flooring', 'Countertops'],
    phone: '(415) 555-1052',
    email: 'tasha@stonetile-demo.com',
    isPlaceholder: false,
    score: 4.6,
    totalRatings: 5,
    projectCount: 2,
    projects: [
      { id: 'demo-proj-3', name: 'Chen Bathroom Remodel' },
      { id: 'demo-proj-6', name: 'Cunningham — Whole-House Build' },
    ],
  },
  {
    userId: 'demo-sub-roofing',
    businessName: 'Modern Roofing Co.',
    contactName: 'Jay Liu',
    tradePrimary: 'Roofing',
    trades: ['Roofing', 'Exterior Siding'],
    phone: '(415) 555-1163',
    email: 'jay@modernroofing-demo.com',
    isPlaceholder: false,
    score: 4.8,
    totalRatings: 7,
    projectCount: 2,
    projects: [
      { id: 'demo-proj-5', name: 'Foster Backyard ADU' },
      { id: 'demo-proj-6', name: 'Cunningham — Whole-House Build' },
    ],
  },
  {
    userId: 'demo-sub-hvac',
    businessName: 'Bay Climate Pros',
    contactName: 'Priya Iyer',
    tradePrimary: 'HVAC',
    trades: ['HVAC'],
    phone: '(415) 555-1274',
    email: 'priya@bayclimate-demo.com',
    isPlaceholder: false,
    score: 4.7,
    totalRatings: 5,
    projectCount: 3,
    projects: [
      { id: 'demo-proj-1', name: 'Mitchell Kitchen Renovation' },
      { id: 'demo-proj-2', name: 'Rodriguez Garage Conversion' },
      { id: 'demo-proj-6', name: 'Cunningham — Whole-House Build' },
    ],
  },
  {
    userId: 'demo-sub-drywall',
    businessName: 'Apex Drywall',
    contactName: 'Ricky Trent',
    tradePrimary: 'Drywall',
    trades: ['Drywall'],
    phone: '(415) 555-1385',
    email: 'ricky@apexdrywall-demo.com',
    isPlaceholder: false,
    score: 4.5,
    totalRatings: 4,
    projectCount: 3,
    projects: [
      { id: 'demo-proj-1', name: 'Mitchell Kitchen Renovation' },
      { id: 'demo-proj-2', name: 'Rodriguez Garage Conversion' },
      { id: 'demo-proj-6', name: 'Cunningham — Whole-House Build' },
    ],
  },
  {
    userId: 'demo-sub-foundation',
    businessName: 'Foundation First',
    contactName: 'Reggie Park',
    tradePrimary: 'Concrete',
    trades: ['Concrete', 'Site Prep'],
    phone: '(415) 555-1496',
    email: 'reggie@foundationfirst-demo.com',
    isPlaceholder: false,
    score: 4.9,
    totalRatings: 6,
    projectCount: 2,
    projects: [
      { id: 'demo-proj-5', name: 'Foster Backyard ADU' },
      { id: 'demo-proj-6', name: 'Cunningham — Whole-House Build' },
    ],
  },
  {
    userId: 'demo-sub-paint',
    businessName: 'Premium Painting Co.',
    contactName: 'Aaron Gilroy',
    tradePrimary: 'Painting',
    trades: ['Painting'],
    phone: '(415) 555-1507',
    email: 'aaron@premiumpaint-demo.com',
    isPlaceholder: false,
    score: 4.6,
    totalRatings: 5,
    projectCount: 2,
    projects: [
      { id: 'demo-proj-4', name: 'Henderson Estate — Phase 1' },
      { id: 'demo-proj-6', name: 'Cunningham — Whole-House Build' },
    ],
  },
  // Placeholder — open seat. The "Invite Sub" demo target.
  {
    userId: null,
    businessName: 'Open seat — Landscape',
    contactName: null,
    tradePrimary: 'Landscape',
    trades: ['Landscape'],
    phone: null,
    email: null,
    isPlaceholder: true,
    score: null,
    totalRatings: 0,
    projectCount: 1,
    projects: [{ id: 'demo-proj-6', name: 'Cunningham — Whole-House Build' }],
  },
];

// Sub ratings — drives `getSubPerformance`. Every entry has named raters
// (the GC who rated and the project they rated on). 1-5 scale per axis.
function rating(opts: {
  id: string;
  subUserId: string;
  projectId: string;
  ratedBy: string;
  raterName: string;
  daysAgo: number;
  quality: number;
  timeliness: number;
  budget: number;
  communication: number;
  overall: number;
  notes?: string;
}) {
  return {
    id: opts.id,
    sub_user_id: opts.subUserId, subUserId: opts.subUserId,
    gc_project_id: opts.projectId, gcProjectId: opts.projectId,
    rated_by: opts.ratedBy, ratedBy: opts.ratedBy,
    rater_name: opts.raterName, raterName: opts.raterName,
    quality: opts.quality, timeliness: opts.timeliness,
    budget_adherence: opts.budget, budgetAdherence: opts.budget,
    communication: opts.communication,
    overall: opts.overall,
    notes: opts.notes || null,
    created_at: iso(subDays(NOW, opts.daysAgo)), createdAt: iso(subDays(NOW, opts.daysAgo)),
  };
}

const GC_RATINGS: Record<string, any[]> = {
  'demo-sub-rivera': [
    rating({ id: 'rt-r-1', subUserId: 'demo-sub-rivera', projectId: 'demo-proj-4', ratedBy: GC_USER_ID, raterName: 'Marcos Riley — Riverside Construction', daysAgo: 70, quality: 5, timeliness: 5, budget: 5, communication: 5, overall: 5, notes: 'Mike runs a tight ship. Pressure tests pass first time, every time.' }),
    rating({ id: 'rt-r-2', subUserId: 'demo-sub-rivera', projectId: 'demo-proj-3', ratedBy: GC_USER_ID, raterName: 'Marcos Riley — Riverside Construction', daysAgo: 35, quality: 5, timeliness: 5, budget: 4, communication: 5, overall: 5, notes: 'Caught a slab offset before tile went down. Saved us a tear-out.' }),
    rating({ id: 'rt-r-3', subUserId: 'demo-sub-rivera', projectId: 'demo-proj-6', ratedBy: GC_USER_ID, raterName: 'Marcos Riley — Riverside Construction', daysAgo: 14, quality: 5, timeliness: 5, budget: 5, communication: 5, overall: 5, notes: 'Whole-house DWV in two weeks. Crew is professional, clean.' }),
    rating({ id: 'rt-r-4', subUserId: 'demo-sub-rivera', projectId: 'demo-proj-1', ratedBy: GC_USER_ID, raterName: 'Marcos Riley — Riverside Construction', daysAgo: 6, quality: 5, timeliness: 4, budget: 5, communication: 5, overall: 5, notes: 'Good comms on the back-ordered pot filler. No surprises.' }),
  ],
  'demo-sub-carlos': [
    rating({ id: 'rt-c-1', subUserId: 'demo-sub-carlos', projectId: 'demo-proj-4', ratedBy: GC_USER_ID, raterName: 'Marcos Riley — Riverside Construction', daysAgo: 75, quality: 5, timeliness: 5, budget: 5, communication: 5, overall: 5, notes: 'Smart-home rough was flawless. Henderson loves the Lutron.' }),
    rating({ id: 'rt-c-2', subUserId: 'demo-sub-carlos', projectId: 'demo-proj-3', ratedBy: GC_USER_ID, raterName: 'Marcos Riley — Riverside Construction', daysAgo: 30, quality: 5, timeliness: 4, budget: 5, communication: 5, overall: 5, notes: 'Heated-floor circuit clean, no callback.' }),
    rating({ id: 'rt-c-3', subUserId: 'demo-sub-carlos', projectId: 'demo-proj-6', ratedBy: GC_USER_ID, raterName: 'Marcos Riley — Riverside Construction', daysAgo: 12, quality: 5, timeliness: 4, budget: 4, communication: 5, overall: 5, notes: '400A service set + 2 subpanels. Inspector signed off without comment.' }),
  ],
  'demo-sub-baycab': [
    rating({ id: 'rt-bc-1', subUserId: 'demo-sub-baycab', projectId: 'demo-proj-4', ratedBy: GC_USER_ID, raterName: 'Marcos Riley — Riverside Construction', daysAgo: 73, quality: 5, timeliness: 4, budget: 4, communication: 5, overall: 5, notes: 'Built-in pantry millwork is showpiece-grade.' }),
    rating({ id: 'rt-bc-2', subUserId: 'demo-sub-baycab', projectId: 'demo-proj-1', ratedBy: GC_USER_ID, raterName: 'Marcos Riley — Riverside Construction', daysAgo: 5, quality: 5, timeliness: 5, budget: 4, communication: 4, overall: 5, notes: 'Cabinets staged ahead of schedule. Lena is responsive.' }),
  ],
  'demo-sub-tile': [
    rating({ id: 'rt-t-1', subUserId: 'demo-sub-tile', projectId: 'demo-proj-3', ratedBy: GC_USER_ID, raterName: 'Marcos Riley — Riverside Construction', daysAgo: 1, quality: 5, timeliness: 5, budget: 5, communication: 5, overall: 5, notes: 'Tasha pre-cuts on her own time when a change comes in. Class act.' }),
  ],
  'demo-sub-roofing': [
    rating({ id: 'rt-rf-1', subUserId: 'demo-sub-roofing', projectId: 'demo-proj-6', ratedBy: GC_USER_ID, raterName: 'Marcos Riley — Riverside Construction', daysAgo: 9, quality: 5, timeliness: 4, budget: 5, communication: 5, overall: 5, notes: 'Standing-seam came out tight. Owner walked it twice — happy.' }),
  ],
  'demo-sub-hvac': [
    rating({ id: 'rt-h-1', subUserId: 'demo-sub-hvac', projectId: 'demo-proj-4', ratedBy: GC_USER_ID, raterName: 'Marcos Riley — Riverside Construction', daysAgo: 76, quality: 5, timeliness: 4, budget: 4, communication: 5, overall: 5, notes: 'Zoned damper install solved the master suite hot-spot.' }),
  ],
  'demo-sub-drywall': [
    rating({ id: 'rt-dw-1', subUserId: 'demo-sub-drywall', projectId: 'demo-proj-4', ratedBy: GC_USER_ID, raterName: 'Marcos Riley — Riverside Construction', daysAgo: 72, quality: 4, timeliness: 5, budget: 5, communication: 4, overall: 4, notes: 'L5 in living was strong. Knockdown match took 2 attempts.' }),
  ],
  'demo-sub-foundation': [
    rating({ id: 'rt-fd-1', subUserId: 'demo-sub-foundation', projectId: 'demo-proj-6', ratedBy: GC_USER_ID, raterName: 'Marcos Riley — Riverside Construction', daysAgo: 36, quality: 5, timeliness: 5, budget: 5, communication: 5, overall: 5, notes: 'Reggie\'s crew strips the forms before I have to ask.' }),
  ],
  'demo-sub-paint': [
    rating({ id: 'rt-pt-1', subUserId: 'demo-sub-paint', projectId: 'demo-proj-4', ratedBy: GC_USER_ID, raterName: 'Marcos Riley — Riverside Construction', daysAgo: 71, quality: 5, timeliness: 4, budget: 4, communication: 5, overall: 5, notes: 'Limewash accent in the living room is photo-worthy.' }),
  ],
};

const GC_CONTRACTORS = [
  { id: 'demo-sub-rivera', name: 'Rivera Plumbing', contactName: 'Mike Reyes', trade: 'plumbing', email: 'mike@rivera-demo.com', phone: '(415) 555-0701', rating: 4.9, jobs_completed: 11, total_paid: 64850 },
  { id: 'demo-sub-carlos', name: 'Carlos Electric', contactName: 'Carlos Vargas', trade: 'electrical', email: 'carlos@cee-demo.com', phone: '(415) 555-0823', rating: 4.8, jobs_completed: 9, total_paid: 48200 },
  { id: 'demo-sub-baycab', name: 'Bay Cabinet Co.', contactName: 'Lena Park', trade: 'cabinetry', email: 'lena@baycabs-demo.com', phone: '(415) 555-0944', rating: 4.7, jobs_completed: 6, total_paid: 71200 },
  { id: 'demo-sub-tile', name: 'Stone & Tile SF', contactName: 'Tasha Lin', trade: 'tile', email: 'tasha@stonetile-demo.com', phone: '(415) 555-1052', rating: 4.6, jobs_completed: 5, total_paid: 28400 },
  { id: 'demo-sub-roofing', name: 'Modern Roofing Co.', contactName: 'Jay Liu', trade: 'roofing', email: 'jay@modernroofing-demo.com', phone: '(415) 555-1163', rating: 4.8, jobs_completed: 7, total_paid: 51600 },
  { id: 'demo-sub-hvac', name: 'Bay Climate Pros', contactName: 'Priya Iyer', trade: 'hvac', email: 'priya@bayclimate-demo.com', phone: '(415) 555-1274', rating: 4.7, jobs_completed: 5, total_paid: 38400 },
  { id: 'demo-sub-drywall', name: 'Apex Drywall', contactName: 'Ricky Trent', trade: 'drywall', email: 'ricky@apexdrywall-demo.com', phone: '(415) 555-1385', rating: 4.5, jobs_completed: 4, total_paid: 18900 },
  { id: 'demo-sub-foundation', name: 'Foundation First', contactName: 'Reggie Park', trade: 'concrete', email: 'reggie@foundationfirst-demo.com', phone: '(415) 555-1496', rating: 4.9, jobs_completed: 6, total_paid: 92400 },
  { id: 'demo-sub-paint', name: 'Premium Painting Co.', contactName: 'Aaron Gilroy', trade: 'painting', email: 'aaron@premiumpaint-demo.com', phone: '(415) 555-1507', rating: 4.6, jobs_completed: 5, total_paid: 21800 },
];

function expense(id: string, vendor: string, category: string, amount: number, description: string, daysAgo: number) {
  const d = iso(subDays(NOW, daysAgo));
  return { id, vendor, category, amount, description, date: d, created_at: d, createdAt: d };
}

const GC_EXPENSES = [
  // Recent month
  expense('demo-exp-1', 'Home Depot', 'materials', 1240, 'Lumber for Mitchell project', 6),
  expense('demo-exp-2', 'Ferguson', 'materials', 890, 'Plumbing fixtures — Chen bath', 9),
  expense('demo-exp-3', 'Verizon', 'utilities', 145, 'Business phone', 14),
  expense('demo-exp-4', 'Chevron', 'fuel', 78, 'Gas — site visits', 2),
  expense('demo-exp-5', 'Home Depot', 'materials', 482, 'Drywall + screws', 4),
  expense('demo-exp-6', 'Lowe\'s', 'materials', 318, 'Framing nails + Tyvek', 11),
  expense('demo-exp-7', 'State Farm', 'insurance', 1850, 'Liability insurance — quarterly', 12),
  expense('demo-exp-8', 'AT&T', 'utilities', 98, 'Cell — crew lead', 18),
  expense('demo-exp-9', 'Costco', 'office', 215, 'Office supplies', 22),

  // 1-2 months back
  expense('demo-exp-10', 'Home Depot', 'materials', 2890, 'Bathroom remodel materials — Wright', 60),
  expense('demo-exp-11', 'Ferguson', 'materials', 4200, 'Plumbing fixtures — Park kitchen', 105),
  expense('demo-exp-12', 'Sherwin-Williams', 'materials', 612, 'Paint — Wright job', 58),
  expense('demo-exp-13', 'Sherwin-Williams', 'materials', 1240, 'Paint — Wright whole house', 56),
  expense('demo-exp-14', 'Chevron', 'fuel', 142, 'Gas — week of site visits', 35),
  expense('demo-exp-15', 'Chevron', 'fuel', 168, 'Gas — Henderson Phase 1', 78),
  expense('demo-exp-16', 'Pacific Gas & Electric', 'utilities', 312, 'Yard utilities', 42),

  // 3-6 months back
  expense('demo-exp-17', 'Home Depot', 'materials', 8400, 'Henderson Phase 1 — framing lumber', 86),
  expense('demo-exp-18', 'Discount Roofing Supply', 'materials', 12200, 'Foster — shingles + underlayment', 130),
  expense('demo-exp-19', 'Build Supply Co', 'materials', 6850, 'Reyes kitchen — cabinetry', 144),
  expense('demo-exp-20', 'Build Supply Co', 'materials', 5200, 'Klein kitchen — cabinetry', 89),
  expense('demo-exp-21', 'Lumber Liquidators', 'materials', 4150, 'Park — flooring', 108),
  expense('demo-exp-22', 'Permit Office', 'permits', 850, 'Henderson Phase 1 permit', 92),
  expense('demo-exp-23', 'Permit Office', 'permits', 420, 'Park kitchen permit', 112),
  expense('demo-exp-24', 'Permit Office', 'permits', 380, 'Foster roof permit', 132),
  expense('demo-exp-25', 'Permit Office', 'permits', 510, 'Reyes kitchen permit', 148),
  expense('demo-exp-26', 'Tool Rental Co', 'equipment', 685, 'Concrete saw rental', 95),
  expense('demo-exp-27', 'Tool Rental Co', 'equipment', 420, 'Lift rental — Foster roof', 128),
  expense('demo-exp-28', 'Workman\'s Comp', 'insurance', 2400, 'Workman\'s comp — quarterly', 100),
  expense('demo-exp-29', 'Pacific Gas & Electric', 'utilities', 290, 'Yard utilities', 96),
  expense('demo-exp-30', 'Verizon', 'utilities', 145, 'Business phone', 44),
  expense('demo-exp-31', 'Verizon', 'utilities', 145, 'Business phone', 74),
  expense('demo-exp-32', 'Chevron', 'fuel', 192, 'Gas — busy week', 65),
  expense('demo-exp-33', 'Chevron', 'fuel', 158, 'Gas', 100),
  expense('demo-exp-34', 'Home Depot', 'materials', 740, 'Misc supplies', 30),
  expense('demo-exp-35', 'Home Depot', 'materials', 612, 'Misc supplies', 70),
  expense('demo-exp-36', 'Office Depot', 'office', 145, 'Printer ink + paper', 50),
  expense('demo-exp-37', 'QuickBooks', 'software', 80, 'Accounting software', 30),
  expense('demo-exp-38', 'QuickBooks', 'software', 80, 'Accounting software', 60),
  expense('demo-exp-39', 'QuickBooks', 'software', 80, 'Accounting software', 90),
  expense('demo-exp-40', 'QuickBooks', 'software', 80, 'Accounting software', 120),
  expense('demo-exp-41', 'Stripe', 'fees', 245, 'Payment processing fees', 40),
  expense('demo-exp-42', 'Stripe', 'fees', 312, 'Payment processing fees', 70),
  expense('demo-exp-43', 'Stripe', 'fees', 198, 'Payment processing fees', 100),
  expense('demo-exp-44', 'Build Supply Co', 'materials', 3200, 'Foster kitchen — countertops', 168),
];

// ── SUB PERSONA: Carlos Mendoza, Carlos Electric ──────────────────
const SUB_USER_ID = 'demo-sub-user-0001';

const SUB_PROFILE = {
  id: SUB_USER_ID,
  email: 'carlos@carloselectric-demo.com',
  business_name: 'Carlos Electric',
  trade: 'electrical',
  team_size: 'solo',
  business_role: 'sub',
  priorities: ['Invoicing & payments', 'Scheduling & dispatch', 'Building my reputation'],
  phone: '(415) 555-0823',
  zip: '94117',
  subscription_status: 'active',
  subscription_tier: 'sub_pro',
  subscription_provider: 'stripe',
  stripe_account_id: 'acct_demo_carlos',
  stripe_onboarding_complete: true,
  created_at: iso(subDays(NOW, 91)),
  businessName: 'Carlos Electric',
  businessRole: 'sub',
  teamSize: 'solo',
  subscriptionStatus: 'active',
  subscriptionTier: 'sub_pro',
  subscriptionProvider: 'stripe',
  stripeAccountId: 'acct_demo_carlos',
  stripeOnboardingComplete: true,
  createdAt: iso(subDays(NOW, 91)),
};

const SUB_CUSTOMERS = [
  customer('demo-sub-cust-1', 'Linda Watanabe', 'lwatanabe@example.com', '(415) 555-0612', '88 Pine St, SF, CA', '94104'),
  customer('demo-sub-cust-2', 'Greg Sullivan', 'gsullivan@example.com', '(415) 555-0715', '4421 Mission St, SF, CA', '94112'),
  customer('demo-sub-cust-3', 'Marisol Vega', 'mvega@example.com', '(415) 555-0834', '1230 Valencia St, SF, CA', '94110'),
  customer('demo-sub-cust-4', 'Tariq Ahmed', 'tahmed@example.com', '(415) 555-0945', '88 Polk St, SF, CA', '94109'),
  customer('demo-sub-cust-5', 'Olivia Brennan', 'obrennan@example.com', '(415) 555-1056', '512 Cole St, SF, CA', '94117'),
  customer('demo-sub-cust-6', 'Hiro Yamada', 'hyamada@example.com', '(415) 555-1167', '2210 Geary Blvd, SF, CA', '94115'),
  customer('demo-sub-cust-7', 'Rachel Kim', 'rkim@example.com', '(415) 555-1278', '4019 24th St, SF, CA', '94114'),
  customer('demo-sub-cust-8', 'Ben Caldwell', 'bcaldwell@example.com', '(415) 555-1389', '88 Castro St, SF, CA', '94114'),
  customer('demo-sub-cust-9', 'Sandra Mendoza', 'smendoza@example.com', '(415) 555-1490', '2100 Market St, SF, CA', '94114'),
  customer('demo-sub-cust-10', 'Kevin O\'Brien', 'kobrien@example.com', '(415) 555-1501', '512 Divisadero St, SF, CA', '94117'),
];

const SUB_JOBS = [
  // Today
  job({ id: 'demo-job-sub-1', customerId: 'demo-sub-cust-1', customer: SUB_CUSTOMERS[0], userId: SUB_USER_ID,
    title: 'Panel upgrade — 100A → 200A', description: 'Panel upgrade', status: 'IN_PROGRESS',
    start: TODAY_9AM, end: addHours(TODAY_9AM, 6), estimatedDurationMin: 360 }),
  job({ id: 'demo-job-sub-2', customerId: 'demo-sub-cust-2', customer: SUB_CUSTOMERS[1], userId: SUB_USER_ID,
    title: 'EV charger install — Tesla Wall Connector', description: 'EV charger install', status: 'SCHEDULED',
    start: addHours(TODAY_9AM, 7), end: addHours(TODAY_9AM, 10), estimatedDurationMin: 180 }),

  // This week
  job({ id: 'demo-job-sub-3', customerId: 'demo-sub-cust-4', customer: SUB_CUSTOMERS[3], userId: SUB_USER_ID,
    title: 'Recessed lighting install — kitchen', description: 'Recessed lighting', status: 'SCHEDULED',
    start: addHours(addDays(TODAY_9AM, 1), 0), end: addHours(addDays(TODAY_9AM, 1), 6) }),
  job({ id: 'demo-job-sub-4', customerId: 'demo-sub-cust-5', customer: SUB_CUSTOMERS[4], userId: SUB_USER_ID,
    title: 'Service call — outlet repair', description: 'Service call', status: 'SCHEDULED',
    start: addHours(addDays(TODAY_9AM, 2), 0), end: addHours(addDays(TODAY_9AM, 2), 2) }),

  // Historical (last 6 months)
  job({ id: 'demo-job-sub-h1', customerId: 'demo-sub-cust-1', customer: SUB_CUSTOMERS[0], userId: SUB_USER_ID,
    title: 'Watanabe — initial service call', description: 'Service call', status: 'COMPLETED',
    start: subDays(NOW, 18), end: addHours(subDays(NOW, 18), 1) }),
  job({ id: 'demo-job-sub-h2', customerId: 'demo-sub-cust-3', customer: SUB_CUSTOMERS[2], userId: SUB_USER_ID,
    title: 'Vega — outlet replacement (whole house)', description: 'Outlet replacement', status: 'COMPLETED',
    start: subDays(NOW, 25), end: addHours(subDays(NOW, 25), 4) }),
  job({ id: 'demo-job-sub-h3', customerId: 'demo-sub-cust-6', customer: SUB_CUSTOMERS[5], userId: SUB_USER_ID,
    title: 'Yamada — panel upgrade', description: 'Panel upgrade', status: 'COMPLETED',
    start: subDays(NOW, 35), end: addHours(subDays(NOW, 35), 6) }),
  job({ id: 'demo-job-sub-h4', customerId: 'demo-sub-cust-7', customer: SUB_CUSTOMERS[6], userId: SUB_USER_ID,
    title: 'Kim — recessed lighting (8 fixtures)', description: 'Recessed lighting', status: 'COMPLETED',
    start: subDays(NOW, 42), end: addHours(subDays(NOW, 42), 5) }),
  job({ id: 'demo-job-sub-h5', customerId: 'demo-sub-cust-8', customer: SUB_CUSTOMERS[7], userId: SUB_USER_ID,
    title: 'Caldwell — EV charger install', description: 'EV charger install', status: 'COMPLETED',
    start: subDays(NOW, 50), end: addHours(subDays(NOW, 50), 4) }),
  job({ id: 'demo-job-sub-h6', customerId: 'demo-sub-cust-9', customer: SUB_CUSTOMERS[8], userId: SUB_USER_ID,
    title: 'Mendoza — service call', description: 'Service call', status: 'COMPLETED',
    start: subDays(NOW, 60), end: addHours(subDays(NOW, 60), 2) }),
  job({ id: 'demo-job-sub-h7', customerId: 'demo-sub-cust-10', customer: SUB_CUSTOMERS[9], userId: SUB_USER_ID,
    title: 'O\'Brien — panel upgrade', description: 'Panel upgrade', status: 'COMPLETED',
    start: subDays(NOW, 70), end: addHours(subDays(NOW, 70), 6) }),
  job({ id: 'demo-job-sub-h8', customerId: 'demo-sub-cust-4', customer: SUB_CUSTOMERS[3], userId: SUB_USER_ID,
    title: 'Ahmed — recessed lighting', description: 'Recessed lighting', status: 'COMPLETED',
    start: subDays(NOW, 85), end: addHours(subDays(NOW, 85), 5) }),
  job({ id: 'demo-job-sub-h9', customerId: 'demo-sub-cust-5', customer: SUB_CUSTOMERS[4], userId: SUB_USER_ID,
    title: 'Brennan — outlet replacement', description: 'Outlet replacement', status: 'COMPLETED',
    start: subDays(NOW, 96), end: addHours(subDays(NOW, 96), 3) }),
  job({ id: 'demo-job-sub-h10', customerId: 'demo-sub-cust-6', customer: SUB_CUSTOMERS[5], userId: SUB_USER_ID,
    title: 'Yamada — EV charger install', description: 'EV charger install', status: 'COMPLETED',
    start: subDays(NOW, 110), end: addHours(subDays(NOW, 110), 4) }),
  job({ id: 'demo-job-sub-h11', customerId: 'demo-sub-cust-7', customer: SUB_CUSTOMERS[6], userId: SUB_USER_ID,
    title: 'Kim — service call', description: 'Service call', status: 'COMPLETED',
    start: subDays(NOW, 130), end: addHours(subDays(NOW, 130), 1) }),
  job({ id: 'demo-job-sub-h12', customerId: 'demo-sub-cust-8', customer: SUB_CUSTOMERS[7], userId: SUB_USER_ID,
    title: 'Caldwell — panel upgrade', description: 'Panel upgrade', status: 'COMPLETED',
    start: subDays(NOW, 150), end: addHours(subDays(NOW, 150), 6) }),
  job({ id: 'demo-job-sub-h13', customerId: 'demo-sub-cust-9', customer: SUB_CUSTOMERS[8], userId: SUB_USER_ID,
    title: 'Mendoza — recessed lighting', description: 'Recessed lighting', status: 'COMPLETED',
    start: subDays(NOW, 165), end: addHours(subDays(NOW, 165), 5) }),
];

const SUB_INVOICES = [
  // Open / overdue
  invoice({ id: 'demo-inv-sub-1', number: 'INV-204', customerId: 'demo-sub-cust-3', customer: SUB_CUSTOMERS[2], status: 'overdue', createdDaysAgo: 19, dueDaysFromNow: -4, jobId: 'demo-job-sub-h2', lines: [
    { desc: 'Outlet replacement (whole house)', qty: 12, unitPrice: 95 },
    { desc: 'Service call fee', qty: 1, unitPrice: 145 },
  ]}),
  invoice({ id: 'demo-inv-sub-4', number: 'INV-207', customerId: 'demo-sub-cust-4', customer: SUB_CUSTOMERS[3], status: 'sent', createdDaysAgo: 6, dueDaysFromNow: 24, lines: [
    { desc: 'Deposit — recessed lighting', qty: 1, unitPrice: 1200 },
  ]}),

  // Paid
  invoice({ id: 'demo-inv-sub-2', number: 'INV-205', customerId: 'demo-sub-cust-1', customer: SUB_CUSTOMERS[0], status: 'paid', createdDaysAgo: 12, paidDaysAgo: 2, jobId: 'demo-job-sub-h1', lines: [
    { desc: 'Service call + diagnostic', qty: 1, unitPrice: 145 },
    { desc: 'Breaker replacements (3)', qty: 3, unitPrice: 220 },
    { desc: 'Outlet upgrades (5 GFCI)', qty: 5, unitPrice: 185 },
    { desc: 'Travel + materials', qty: 1, unitPrice: 2105 },
  ]}),
  invoice({ id: 'demo-inv-sub-3', number: 'INV-206', customerId: 'demo-sub-cust-2', customer: SUB_CUSTOMERS[1], status: 'paid', createdDaysAgo: 22, paidDaysAgo: 8, lines: [
    { desc: 'Misc service work', qty: 1, unitPrice: 920 },
  ]}),
  invoice({ id: 'demo-inv-sub-5', number: 'INV-198', customerId: 'demo-sub-cust-6', customer: SUB_CUSTOMERS[5], status: 'paid', createdDaysAgo: 35, paidDaysAgo: 28, jobId: 'demo-job-sub-h3', lines: [
    { desc: 'Panel upgrade — 100A → 200A', qty: 1, unitPrice: 3850 },
  ]}),
  invoice({ id: 'demo-inv-sub-6', number: 'INV-200', customerId: 'demo-sub-cust-7', customer: SUB_CUSTOMERS[6], status: 'paid', createdDaysAgo: 42, paidDaysAgo: 35, jobId: 'demo-job-sub-h4', lines: [
    { desc: 'Recessed lighting install (8 fixtures)', qty: 8, unitPrice: 165 },
    { desc: 'Switch upgrade (smart)', qty: 1, unitPrice: 280 },
  ]}),
  invoice({ id: 'demo-inv-sub-7', number: 'INV-201', customerId: 'demo-sub-cust-8', customer: SUB_CUSTOMERS[7], status: 'paid', createdDaysAgo: 50, paidDaysAgo: 42, jobId: 'demo-job-sub-h5', lines: [
    { desc: 'EV charger install (60A circuit)', qty: 1, unitPrice: 1850 },
  ]}),
  invoice({ id: 'demo-inv-sub-8', number: 'INV-202', customerId: 'demo-sub-cust-9', customer: SUB_CUSTOMERS[8], status: 'paid', createdDaysAgo: 60, paidDaysAgo: 55, jobId: 'demo-job-sub-h6', lines: [
    { desc: 'Service call + circuit fix', qty: 1, unitPrice: 320 },
  ]}),
  invoice({ id: 'demo-inv-sub-9', number: 'INV-203', customerId: 'demo-sub-cust-10', customer: SUB_CUSTOMERS[9], status: 'paid', createdDaysAgo: 70, paidDaysAgo: 62, jobId: 'demo-job-sub-h7', lines: [
    { desc: 'Panel upgrade — 200A', qty: 1, unitPrice: 3850 },
  ]}),
  invoice({ id: 'demo-inv-sub-10', number: 'INV-191', customerId: 'demo-sub-cust-4', customer: SUB_CUSTOMERS[3], status: 'paid', createdDaysAgo: 85, paidDaysAgo: 78, jobId: 'demo-job-sub-h8', lines: [
    { desc: 'Recessed lighting install (12 fixtures)', qty: 12, unitPrice: 165 },
  ]}),
  invoice({ id: 'demo-inv-sub-11', number: 'INV-188', customerId: 'demo-sub-cust-5', customer: SUB_CUSTOMERS[4], status: 'paid', createdDaysAgo: 96, paidDaysAgo: 90, jobId: 'demo-job-sub-h9', lines: [
    { desc: 'Outlet replacement (8)', qty: 8, unitPrice: 95 },
  ]}),
  invoice({ id: 'demo-inv-sub-12', number: 'INV-184', customerId: 'demo-sub-cust-6', customer: SUB_CUSTOMERS[5], status: 'paid', createdDaysAgo: 110, paidDaysAgo: 102, jobId: 'demo-job-sub-h10', lines: [
    { desc: 'EV charger install', qty: 1, unitPrice: 1850 },
  ]}),
  invoice({ id: 'demo-inv-sub-13', number: 'INV-180', customerId: 'demo-sub-cust-7', customer: SUB_CUSTOMERS[6], status: 'paid', createdDaysAgo: 130, paidDaysAgo: 122, jobId: 'demo-job-sub-h11', lines: [
    { desc: 'Service call', qty: 1, unitPrice: 145 },
  ]}),
  invoice({ id: 'demo-inv-sub-14', number: 'INV-176', customerId: 'demo-sub-cust-8', customer: SUB_CUSTOMERS[7], status: 'paid', createdDaysAgo: 150, paidDaysAgo: 142, jobId: 'demo-job-sub-h12', lines: [
    { desc: 'Panel upgrade', qty: 1, unitPrice: 3850 },
  ]}),
  invoice({ id: 'demo-inv-sub-15', number: 'INV-172', customerId: 'demo-sub-cust-9', customer: SUB_CUSTOMERS[8], status: 'paid', createdDaysAgo: 165, paidDaysAgo: 158, jobId: 'demo-job-sub-h13', lines: [
    { desc: 'Recessed lighting install', qty: 8, unitPrice: 165 },
  ]}),
];

// Sub gets invited to one of the GC's projects — central to the marketplace narrative.
const SUB_INVITED_PROJECTS = [
  {
    id: 'demo-proj-1',
    name: 'Mitchell Kitchen Renovation',
    address: '142 Oak Lane, San Francisco, CA',
    gc_company: 'Riverside Construction',
    gcCompany: 'Riverside Construction',
    assigned_trade: { id: 'demo-trade-1b', name: 'Electrical', status: 'NOT_STARTED', labor_hours: 16, labor_rate: 155, materials_budget: 2800 },
    assignedTrade: { id: 'demo-trade-1b', name: 'Electrical', status: 'NOT_STARTED', laborHours: 16, laborRate: 155, materialsBudget: 2800 },
    messages: [],
    start_date: iso(subDays(NOW, 14)),
    target_end_date: iso(addDays(NOW, 28)),
  },
];

const SUB_EXPENSES = [
  expense('demo-sub-exp-1', 'Graybar', 'materials', 412, 'Wire + breakers — Watanabe panel', 1),
  expense('demo-sub-exp-2', 'Home Depot', 'materials', 198, 'Conduit, fittings', 5),
  expense('demo-sub-exp-3', 'Graybar', 'materials', 320, 'Recessed lighting fixtures (Kim)', 42),
  expense('demo-sub-exp-4', 'Home Depot', 'materials', 145, 'Misc supplies', 8),
  expense('demo-sub-exp-5', 'Tesla', 'materials', 720, 'Wall Connector — Caldwell', 50),
  expense('demo-sub-exp-6', 'Chevron', 'fuel', 92, 'Gas — week of service calls', 7),
  expense('demo-sub-exp-7', 'Chevron', 'fuel', 84, 'Gas', 21),
  expense('demo-sub-exp-8', 'Verizon', 'utilities', 78, 'Cell phone', 14),
  expense('demo-sub-exp-9', 'Verizon', 'utilities', 78, 'Cell phone', 44),
  expense('demo-sub-exp-10', 'State Farm', 'insurance', 380, 'Liability insurance — quarterly', 90),
  expense('demo-sub-exp-11', 'Graybar', 'materials', 280, 'Panel + breakers — Yamada', 35),
  expense('demo-sub-exp-12', 'Home Depot', 'materials', 218, 'Conduit + fittings — O\'Brien', 70),
  expense('demo-sub-exp-13', 'Permit Office', 'permits', 240, 'Service upgrade permit', 36),
  expense('demo-sub-exp-14', 'Permit Office', 'permits', 240, 'Service upgrade permit', 71),
  expense('demo-sub-exp-15', 'QuickBooks', 'software', 30, 'Accounting software', 30),
  expense('demo-sub-exp-16', 'QuickBooks', 'software', 30, 'Accounting software', 60),
  expense('demo-sub-exp-17', 'QuickBooks', 'software', 30, 'Accounting software', 90),
  expense('demo-sub-exp-18', 'Stripe', 'fees', 65, 'Payment processing fees', 30),
  expense('demo-sub-exp-19', 'Stripe', 'fees', 88, 'Payment processing fees', 60),
  expense('demo-sub-exp-20', 'Stripe', 'fees', 52, 'Payment processing fees', 90),
];

const PRICEBOOK = [
  { id: 'pb-1', description: 'Standard service call', unit_price: 145, category: 'service' },
  { id: 'pb-2', description: 'Outlet replacement', unit_price: 185, category: 'electrical' },
  { id: 'pb-3', description: 'Breaker replacement (single-pole)', unit_price: 220, category: 'electrical' },
  { id: 'pb-4', description: 'Panel upgrade — 200A', unit_price: 3850, category: 'electrical' },
];

// ── Job-level enrichment ─────────────────────────────────────────────
// Job line items (JobDetailPage right rail) — keyed by job id. Most
// completed jobs already have an invoice with line items; these are a
// superset, mirroring what would be tracked on the job itself before
// invoicing. Demo names match invoice line items where they overlap so
// the cross-reference looks consistent.
function jobLine(id: string, desc: string, qty: number, unitPrice: number) {
  return {
    id, description: desc,
    quantity: qty, qty,
    unit_price: unitPrice, unitPrice,
    total: qty * unitPrice, amount: qty * unitPrice,
  };
}

const GC_JOB_LINE_ITEMS: Record<string, any[]> = {
  'demo-job-gc-1': [
    jobLine('jli-1-1', 'Demo + framing — kitchen', 32, 85),
    jobLine('jli-1-2', 'LVL beam install (load-bearing)', 1, 1450),
    jobLine('jli-1-3', 'Disposal + dumpster', 1, 480),
  ],
  'demo-job-gc-2': [
    jobLine('jli-2-1', 'Site walkthrough + scope notes', 1, 350),
    jobLine('jli-2-2', 'Pre-design sketch package', 1, 850),
  ],
  'demo-job-gc-h2': [
    jobLine('jli-h2-1', 'Bathroom remodel — labor', 56, 145),
    jobLine('jli-h2-2', 'Tile and fixtures', 1, 4380),
    jobLine('jli-h2-3', 'Disposal', 1, 320),
  ],
  'demo-job-gc-h3': [
    jobLine('jli-h3-1', 'Kitchen renovation — labor', 28, 145),
    jobLine('jli-h3-2', 'Cabinet hardware + finish work', 1, 890),
  ],
  'demo-job-gc-h4': [
    jobLine('jli-h4-1', 'Whole-house demo + framing — Phase 1', 1, 88500),
  ],
  'demo-job-gc-h5': [
    jobLine('jli-h5-1', 'Deck rebuild — labor', 64, 95),
    jobLine('jli-h5-2', 'Lumber and hardware', 1, 4800),
  ],
  'demo-job-gc-h6': [jobLine('jli-h6-1', 'Garage conversion — full', 1, 38500)],
  'demo-job-gc-h7': [
    jobLine('jli-h7-1', 'Kitchen renovation — labor', 120, 145),
    jobLine('jli-h7-2', 'Cabinetry, counters, appliances', 1, 42000),
  ],
};

// Job photos — keyed by job id. The JobDetailPage gallery reads these.
// Real Unsplash links so the demo looks like the real thing instead of
// gray boxes; keep the count modest so the page paints fast.
function jobPhoto(id: string, jobId: string, url: string, caption: string, daysAgo: number) {
  const created = iso(subDays(NOW, daysAgo));
  return {
    id, job_id: jobId, jobId,
    url, photo_url: url, photoUrl: url,
    caption, description: caption,
    created_at: created, createdAt: created,
  };
}

const GC_JOB_PHOTOS: Record<string, any[]> = {
  'demo-job-gc-1': [
    jobPhoto('jph-1-1', 'demo-job-gc-1', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=70', 'Day 1 — demo done, ready to frame', 0),
    jobPhoto('jph-1-2', 'demo-job-gc-1', 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=1200&q=70', 'Cabinets staged in garage', 1),
    jobPhoto('jph-1-3', 'demo-job-gc-1', 'https://images.unsplash.com/photo-1580244599416-aaa6c0a16f70?w=1200&q=70', 'LVL beam dropped in', 2),
  ],
  'demo-job-gc-h2': [
    jobPhoto('jph-h2-1', 'demo-job-gc-h2', 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=70', 'Master bath — finished', 30),
    jobPhoto('jph-h2-2', 'demo-job-gc-h2', 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1200&q=70', 'Curbless shower glass set', 31),
  ],
  'demo-job-gc-h4': [
    jobPhoto('jph-h4-1', 'demo-job-gc-h4', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=70', 'Phase 1 complete — exterior', 72),
    jobPhoto('jph-h4-2', 'demo-job-gc-h4', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=70', 'Living room — open concept', 73),
    jobPhoto('jph-h4-3', 'demo-job-gc-h4', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=70', 'Master suite — final', 73),
    jobPhoto('jph-h4-4', 'demo-job-gc-h4', 'https://images.unsplash.com/photo-1600566753051-6057f1a6121a?w=1200&q=70', 'Master bath — freestanding tub', 74),
  ],
  'demo-job-gc-h5': [
    jobPhoto('jph-h5-1', 'demo-job-gc-h5', 'https://images.unsplash.com/photo-1597040663338-1f0a4ab74344?w=1200&q=70', 'Deck framing complete', 64),
  ],
  'demo-job-gc-h7': [
    jobPhoto('jph-h7-1', 'demo-job-gc-h7', 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=1200&q=70', 'Park kitchen — final', 88),
  ],
};

const SUB_JOB_LINE_ITEMS: Record<string, any[]> = {
  'demo-job-sub-1': [
    jobLine('sjli-1-1', 'Panel upgrade — 100A → 200A (labor)', 6, 165),
    jobLine('sjli-1-2', '200A panel + main breaker', 1, 1450),
    jobLine('sjli-1-3', 'Permit pull + utility coordination', 1, 240),
  ],
  'demo-job-sub-2': [
    jobLine('sjli-2-1', 'Tesla Wall Connector install — 60A circuit', 1, 1850),
  ],
  'demo-job-sub-h1': [
    jobLine('sjli-h1-1', 'Service call + diagnostic', 1, 145),
    jobLine('sjli-h1-2', 'Breaker replacements (3)', 3, 220),
    jobLine('sjli-h1-3', 'Outlet upgrades (5 GFCI)', 5, 185),
  ],
};

const SUB_JOB_PHOTOS: Record<string, any[]> = {
  'demo-job-sub-1': [
    jobPhoto('sjph-1-1', 'demo-job-sub-1', 'https://images.unsplash.com/photo-1580974928064-f0aeef70895a?w=1200&q=70', 'Panel before — 100A Federal Pacific', 0),
    jobPhoto('sjph-1-2', 'demo-job-sub-1', 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&q=70', 'Panel after — 200A Square D', 0),
  ],
};

export const PERSONAS: Record<DemoPersona, DemoSeed> = {
  gc: {
    profile: GC_PROFILE,
    customers: GC_CUSTOMERS,
    jobs: GC_JOBS,
    invoices: GC_INVOICES,
    gcProjects: GC_PROJECTS,
    gcProjectMessages: GC_PROJECT_MESSAGES,
    gcProjectActivity: GC_PROJECT_ACTIVITY,
    gcSubDirectory: GC_SUB_DIRECTORY,
    gcRatings: GC_RATINGS,
    jobLineItems: GC_JOB_LINE_ITEMS,
    jobPhotos: GC_JOB_PHOTOS,
    invitedProjects: [],
    contractors: GC_CONTRACTORS,
    expenses: GC_EXPENSES,
    pricebook: PRICEBOOK,
    organization: { id: 'demo-org-gc', name: 'Riverside Construction', type: 'gc' },
  },
  sub: {
    profile: SUB_PROFILE,
    customers: SUB_CUSTOMERS,
    jobs: SUB_JOBS,
    invoices: SUB_INVOICES,
    gcProjects: [],
    gcProjectMessages: {},
    gcProjectActivity: {},
    gcSubDirectory: [],
    gcRatings: {},
    jobLineItems: SUB_JOB_LINE_ITEMS,
    jobPhotos: SUB_JOB_PHOTOS,
    invitedProjects: SUB_INVITED_PROJECTS,
    contractors: [],
    expenses: SUB_EXPENSES,
    pricebook: PRICEBOOK,
    organization: { id: 'demo-org-sub', name: 'Carlos Electric', type: 'sub' },
  },
};

export const DEMO_USER_ID: Record<DemoPersona, string> = {
  gc: GC_USER_ID,
  sub: SUB_USER_ID,
};
