// Maps api.ts method names → seeded fixture data.
//
// The override module calls into here on every read. The map is loose: any
// method we don't explicitly handle returns an empty array (or `null` for
// detail fetches), which keeps the dashboard rendering instead of crashing
// when a feature isn't critical to the demo narrative.

import type { DemoPersona } from './personas';
import { PERSONAS } from './personas';

// Wrap into the `{ data: ... }` envelope the real api.ts returns.
function envelope<T>(data: T) {
  return { data };
}

export function resolveSeedRead(
  method: string,
  args: any[],
  persona: DemoPersona,
): any {
  const seed = PERSONAS[persona];

  switch (method) {
    // ── Profile / settings ────────────────────────────────────────
    case 'getMe':
    case 'getSettings':
      return envelope(seed.profile);
    case 'getOrganization':
      return envelope(seed.organization);

    // ── Jobs ──────────────────────────────────────────────────────
    case 'getTodaysJobs': {
      const range = args[1] as string | undefined;
      if (range === 'all') return envelope(seed.jobs);
      // Default: return today's jobs (everything we have is "today")
      return envelope(seed.jobs);
    }
    case 'getJob': {
      const id = args[0];
      const found = seed.jobs.find((j) => j.id === id);
      if (!found) throw new Error('Job not found');
      return envelope(found);
    }
    case 'getCompletedJobs':
      return envelope([]);
    case 'getJobIntelligenceData':
      return envelope({ jobs: seed.jobs, customers: seed.customers });
    case 'getJobPhotos':
      return envelope([]);

    // ── Customers ─────────────────────────────────────────────────
    case 'getCustomers':
      return envelope(seed.customers);
    case 'getCustomer': {
      const id = args[0];
      const found = seed.customers.find((c) => c.id === id);
      if (!found) throw new Error('Customer not found');
      return envelope(found);
    }

    // ── Invoices ──────────────────────────────────────────────────
    case 'getInvoices':
      return envelope(seed.invoices);
    case 'getInvoice': {
      const id = args[0];
      const found = seed.invoices.find((i) => i.id === id);
      if (!found) throw new Error('Invoice not found');
      return envelope(found);
    }
    case 'getInvoicesByCustomer': {
      const id = args[0];
      return envelope(seed.invoices.filter((i) => i.customer_id === id));
    }
    case 'getInvoicesByJob':
      return envelope([]);

    // ── Pricebook ─────────────────────────────────────────────────
    case 'getPricebook':
    case 'getSmartPricebook':
      return envelope(seed.pricebook);
    case 'getStaleItems':
    case 'getPriceHistory':
      return envelope([]);

    // ── Projects (legacy) ─────────────────────────────────────────
    case 'getProjects':
      return envelope([]);
    case 'getProject':
      throw new Error('Project not found');

    // ── GC Projects ───────────────────────────────────────────────
    case 'getGCProjects':
      return envelope(seed.gcProjects);
    case 'getGCProject': {
      const id = args[0];
      const found = seed.gcProjects.find((p: any) => p.id === id);
      if (!found) throw new Error('GC project not found');
      return envelope(found);
    }
    case 'getInvitedProjects':
      return envelope(seed.invitedProjects);
    case 'getProjectZones': {
      const id = args[0];
      const proj = seed.gcProjects.find((p: any) => p.id === id);
      return envelope(proj?.zones || []);
    }
    case 'getGCTradeMaterials':
      return envelope([]);
    case 'getGCSubDirectory':
      return envelope(seed.gcSubDirectory || []);
    case 'getSubPerformance': {
      const userId = args[0];
      const sub = (seed.gcSubDirectory || []).find((s: any) => s.userId === userId);
      return envelope({
        score: sub?.score ?? null,
        totalRatings: sub?.totalRatings ?? 0,
        ratings: [],
      });
    }
    case 'getGCMessages':
    case 'getProjectActivity': {
      const id = args[0];
      return envelope(seed.gcProjectMessages?.[id] || []);
    }
    case 'getRecentActivityAcrossProjects': {
      const all: any[] = [];
      for (const [projectId, msgs] of Object.entries(seed.gcProjectMessages || {})) {
        const project = seed.gcProjects.find((p: any) => p.id === projectId);
        for (const m of msgs) all.push({ ...m, projectId, projectName: project?.name });
      }
      return envelope(all.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
    }

    // ── Contractors ───────────────────────────────────────────────
    case 'getContractors':
    case 'getContractorsWithStats':
      return envelope(seed.contractors);
    case 'getContractor': {
      const id = args[0];
      const found = seed.contractors.find((c: any) => c.id === id);
      if (!found) throw new Error('Contractor not found');
      return envelope(found);
    }
    case 'getContractorStats':
      return envelope({ totalPaid: 0, jobsCompleted: 0, lastJobAt: null });
    case 'getTeamMembers':
      return envelope([]);

    // ── Expenses / financials ─────────────────────────────────────
    case 'getExpenses':
      return envelope(seed.expenses);
    case 'getFinancials': {
      const paid = seed.invoices.filter((i) => i.status === 'paid');
      const sent = seed.invoices.filter((i) => i.status === 'sent');
      const revenue = paid.reduce((s, i) => s + (i.total || 0), 0);
      const expenses = seed.expenses.reduce((s, e) => s + e.amount, 0);
      const outstanding = sent.reduce((s, i) => s + (i.total || 0), 0);
      const jobsCompleted = seed.jobs.filter((j) => j.status === 'COMPLETED').length;
      return envelope({
        revenue,
        expenses,
        outstanding,
        jobsCompleted,
        recentPayments: paid.slice(0, 5).map((i) => ({
          id: i.id,
          amount: i.total,
          customer: i.customer,
          paid_at: i.paid_at,
          invoice_number: i.invoice_number,
        })),
        recentExpenses: seed.expenses.slice(0, 5),
      });
    }
    case 'getInsightsData':
      return envelope({
        invoices: seed.invoices,
        expenses: seed.expenses,
        jobs: seed.jobs,
        customers: seed.customers,
      });

    // ── QuickBooks (always disconnected in demo) ──────────────────
    case 'qbo.getStatus':
      return envelope({ connected: false });

    // ── Stripe Connect (always "complete" in demo) ────────────────
    case 'getStripeConnectUrl':
      return { url: '#demo' };
    case 'checkStripeConnectStatus':
      return envelope({ connected: true, onboarding_complete: true });

    // ── Default empty: keep the UI from crashing on uncatalogued reads
    default:
      return envelope([]);
  }
}

// Methods that should NOT trigger paywall — these are reads or pure utilities
// even if they don't start with `get`.
export const READ_METHOD_PATTERNS = [
  /^get/,
  /^list/,
  /^check/,
  /^fetch/,
  /^search/,
];

export function isReadMethod(name: string): boolean {
  return READ_METHOD_PATTERNS.some((re) => re.test(name));
}

// The narrow set of mutations that trigger the paywall.
// Reserved for moments where signing up is the *only* sensible next step:
// real customer-facing email, real money flowing, real outbound invites.
// Everything else fake-succeeds so the demo feels like a working product.
export const PAYWALL_METHODS = new Set<string>([
  // Real customer email / SMS / outbound to actual people
  'sendInvoiceEmail',
  'sendInviteEmail',
  'inviteTeamMember',
  'inviteSubToTrade',
  'sendInvoiceViaQB',
  'qbo.sendInvoiceViaQB',
  'quickbooks.sendInvoiceViaQB',
  // Real money flows
  'createPaymentLink',
  'processPayment',
  'chargeCard',
]);

export function isPaywallMethod(name: string, args?: any[]): boolean {
  if (PAYWALL_METHODS.has(name)) return true;
  // The InviteSubModal funnels every "Add Placeholder" / "Send Email" action
  // through `updateGCTrade` with notes prefixed "Placeholder:" or "Invited:".
  // Both represent the user committing to invite a real sub — fire the paywall.
  if (name === 'updateGCTrade' && args && args[1] && typeof args[1].notes === 'string') {
    if (/^(Placeholder|Invited):/i.test(args[1].notes)) return true;
  }
  return false;
}

// When a method paywalls based on args (not just name), the override needs to
// know which copy key to surface — return it here. Default is the method name.
export function paywallCopyKeyFor(name: string, args?: any[]): string {
  if (name === 'updateGCTrade' && args && args[1] && typeof args[1].notes === 'string') {
    if (/^(Placeholder|Invited):/i.test(args[1].notes)) return 'inviteSubToTrade';
  }
  return name;
}

let demoIdCounter = 1000;
function nextId(prefix = 'demo'): string {
  demoIdCounter += 1;
  return `${prefix}-${demoIdCounter}`;
}

// Mutations: mutate the in-memory seed and return a plausible envelope.
// `args` is the args array passed to the api method; convention varies per
// method, but most creates take a single object and most updates take
// (id, updates).
export function resolveSeedWrite(
  method: string,
  args: any[],
  persona: DemoPersona,
): any {
  const seed = PERSONAS[persona];

  // ── Generic helpers ─────────────────────────────────────────────────
  const create = (collection: any[], extra: Record<string, any> = {}) => {
    const input = (args[0] && typeof args[0] === 'object') ? args[0] : {};
    const id = input.id || nextId(method.replace(/^create/i, '').toLowerCase() || 'item');
    const now = new Date().toISOString();
    const record = {
      id,
      created_at: now,
      createdAt: now,
      ...input,
      ...extra,
    };
    collection.unshift(record);
    return { data: record };
  };

  const updateById = (collection: any[]) => {
    const id = args[0];
    const updates = args[1] || {};
    const idx = collection.findIndex((r) => r.id === id);
    if (idx === -1) return { data: { id, ...updates } };
    collection[idx] = { ...collection[idx], ...updates };
    return { data: collection[idx] };
  };

  const removeById = (collection: any[]) => {
    const id = args[0];
    const idx = collection.findIndex((r) => r.id === id);
    if (idx !== -1) collection.splice(idx, 1);
    return { data: null };
  };

  switch (method) {
    // ── Jobs ──────────────────────────────────────────────────────
    case 'createJob': {
      const customerId = args[0]?.customer_id || args[0]?.customerId;
      const customer = seed.customers.find((c: any) => c.id === customerId);
      return create(seed.jobs, { status: args[0]?.status || 'SCHEDULED', customer });
    }
    case 'updateJob':
      return updateById(seed.jobs);
    case 'deleteJob':
      return removeById(seed.jobs);
    case 'duplicateJob': {
      const src = args[0] || {};
      return create(seed.jobs, { ...src, id: nextId('job'), status: 'SCHEDULED', customer: src.customer });
    }
    case 'addLineItem':
      return { data: { id: nextId('li'), ...(args[1] || {}) } };
    case 'saveJobLineItems':
      return { data: (args[1] || []).map((li: any) => ({ id: nextId('li'), ...li })) };

    // ── Customers ─────────────────────────────────────────────────
    case 'createCustomer': {
      const input = args[0] || {};
      const first = input.first_name || input.firstName || (input.name || '').split(' ')[0] || 'New';
      const last = input.last_name || input.lastName || (input.name || '').split(' ').slice(1).join(' ') || 'Customer';
      return create(seed.customers, {
        firstName: first, lastName: last, first_name: first, last_name: last,
        name: `${first} ${last}`.trim(),
      });
    }
    case 'updateCustomer':
      return updateById(seed.customers);

    // ── Invoices ──────────────────────────────────────────────────
    case 'createInvoice': {
      const input = args[0] || {};
      const customerId = input.customer_id || input.customerId;
      const customer = seed.customers.find((c: any) => c.id === customerId);
      const num = `INV-${1000 + seed.invoices.length + 1}`;
      return create(seed.invoices, {
        invoice_number: num, invoiceNumber: num,
        status: input.status || 'draft',
        total: Number(input.total) || 0,
        amount: Number(input.total) || 0,
        customer,
      });
    }
    case 'updateInvoice':
      return updateById(seed.invoices);
    case 'deleteInvoice':
      return removeById(seed.invoices);

    // ── Pricebook ─────────────────────────────────────────────────
    case 'createPricebookItem':
      return create(seed.pricebook);
    case 'updatePricebookItem':
      return updateById(seed.pricebook);
    case 'deletePricebookItem':
      return removeById(seed.pricebook);
    case 'recordPriceUsage':
      return { data: null };
    case 'seedDefaultPricebook':
      return { data: seed.pricebook };

    // ── Expenses ──────────────────────────────────────────────────
    case 'createExpense':
      return create(seed.expenses, {
        date: args[0]?.date || new Date().toISOString(),
      });

    // ── Contractors ───────────────────────────────────────────────
    case 'createContractor':
      return create(seed.contractors, { rating: 0, jobs_completed: 0, total_paid: 0 });
    case 'updateContractor':
      return updateById(seed.contractors);
    case 'deleteContractor':
      return removeById(seed.contractors);
    case 'inviteTeamMember':
      return { data: { id: nextId('team'), ...(args[0] || {}) } };

    // ── Settings / profile ────────────────────────────────────────
    case 'updateSettings': {
      Object.assign(seed.profile, args[0] || {});
      return { data: seed.profile };
    }

    // ── GC Projects ───────────────────────────────────────────────
    case 'createGCProject': {
      const input = args[0] || {};
      const projectId = input.id || nextId('proj');
      // Flatten incoming zones→trades into the demo's flat shape, generating
      // ids and defaulting tasks so the detail page works out of the box.
      const zones: any[] = [];
      const trades: any[] = [];
      const incomingZones: any[] = Array.isArray(input.zones) ? input.zones : [];
      incomingZones.forEach((z: any, zi: number) => {
        const zoneId = z.id || `${projectId}-zone-${zi + 1}`;
        zones.push({ id: zoneId, name: z.name, zoneType: z.zoneType });
        const incomingTrades: any[] = Array.isArray(z.trades) ? z.trades : [];
        incomingTrades.forEach((t: any, ti: number) => {
          const tradeId = t.id || `${zoneId}-trade-${ti + 1}`;
          trades.push({
            id: tradeId,
            zoneId,
            zone_id: zoneId,
            trade: t.trade,
            status: t.status || 'not_started',
            assignedUserId: t.assignedUserId || null,
            assignedOrgId: t.assignedOrgId || null,
            assignedBusinessName: t.assignedBusinessName || null,
            laborHours: t.laborHours || 0,
            laborRate: t.laborRate || 0,
            materialsBudget: t.materialsBudget || 0,
            budget: (t.laborHours || 0) * (t.laborRate || 0) + (t.materialsBudget || 0),
            actualLabor: 0,
            actualMaterials: 0,
            notes: t.notes || '',
            tasks: (t.tasks || []).map((tk: any, i: number) => ({
              id: `${tradeId}-task-${i + 1}`,
              name: tk.name,
              done: !!tk.done,
            })),
            labor_hours: t.laborHours || 0,
            labor_rate: t.laborRate || 0,
            materials_budget: t.materialsBudget || 0,
          });
        });
      });
      const now = new Date().toISOString();
      const project = {
        id: projectId,
        ...input,
        status: input.status || 'active',
        zones,
        trades,
        coverImageUrl: input.coverImageUrl || null,
        cover_url: input.coverImageUrl || null,
        createdAt: now,
        created_at: now,
      };
      seed.gcProjects.unshift(project);
      seed.gcProjectMessages[projectId] = [];
      return { data: project };
    }
    case 'updateGCProject':
      return updateById(seed.gcProjects);
    case 'deleteGCProject':
      return removeById(seed.gcProjects);
    case 'addGCTrade': {
      const projectId = args[0];
      const input = args[1] || {};
      const project = seed.gcProjects.find((p: any) => p.id === projectId);
      const tradeId = input.id || nextId('trade');
      const newTrade = {
        id: tradeId,
        zoneId: input.zoneId || null,
        zone_id: input.zoneId || null,
        trade: input.trade || 'Unnamed',
        status: input.status || 'not_started',
        assignedUserId: input.assignedUserId || null,
        assignedOrgId: input.assignedOrgId || null,
        assignedBusinessName: input.assignedBusinessName || null,
        laborHours: input.laborHours || 0,
        laborRate: input.laborRate || 0,
        materialsBudget: input.materialsBudget || 0,
        budget: (input.laborHours || 0) * (input.laborRate || 0) + (input.materialsBudget || 0),
        actualLabor: 0,
        actualMaterials: 0,
        notes: input.notes || '',
        tasks: [],
        labor_hours: input.laborHours || 0,
        labor_rate: input.laborRate || 0,
        materials_budget: input.materialsBudget || 0,
      };
      if (project) {
        project.trades = project.trades || [];
        project.trades.push(newTrade);
      }
      return { data: newTrade };
    }
    case 'updateGCTrade': {
      const tradeId = args[0];
      const updates = args[1] || {};
      for (const project of seed.gcProjects) {
        const t = (project.trades || []).find((x: any) => x.id === tradeId);
        if (t) {
          Object.assign(t, updates);
          return { data: t };
        }
      }
      return { data: null };
    }
    case 'removeGCTrade': {
      const tradeId = args[0];
      for (const project of seed.gcProjects) {
        const idx = (project.trades || []).findIndex((x: any) => x.id === tradeId);
        if (idx !== -1) {
          project.trades.splice(idx, 1);
          return { data: null };
        }
      }
      return { data: null };
    }
    case 'addGCTask': {
      const tradeId = args[0];
      const name = args[1];
      for (const project of seed.gcProjects) {
        const t = (project.trades || []).find((x: any) => x.id === tradeId);
        if (t) {
          const task = { id: nextId('task'), name, done: false };
          t.tasks = t.tasks || [];
          t.tasks.push(task);
          return { data: task };
        }
      }
      return { data: null };
    }
    case 'toggleGCTask': {
      const taskId = args[0];
      const done = !!args[1];
      for (const project of seed.gcProjects) {
        for (const t of project.trades || []) {
          const tk = (t.tasks || []).find((x: any) => x.id === taskId);
          if (tk) {
            tk.done = done;
            return { data: tk };
          }
        }
      }
      return { data: null };
    }
    case 'updateGCTask': {
      const taskId = args[0];
      const updates = args[1] || {};
      for (const project of seed.gcProjects) {
        for (const t of project.trades || []) {
          const tk = (t.tasks || []).find((x: any) => x.id === taskId);
          if (tk) {
            Object.assign(tk, updates);
            return { data: tk };
          }
        }
      }
      return { data: null };
    }
    case 'removeGCTask': {
      const taskId = args[0];
      for (const project of seed.gcProjects) {
        for (const t of project.trades || []) {
          const idx = (t.tasks || []).findIndex((x: any) => x.id === taskId);
          if (idx !== -1) {
            t.tasks.splice(idx, 1);
            return { data: null };
          }
        }
      }
      return { data: null };
    }
    case 'assignSubToTrade': {
      const tradeId = args[0];
      const userId = args[1];
      const sub = (seed.gcSubDirectory || []).find((s: any) => s.userId === userId);
      for (const project of seed.gcProjects) {
        const t = (project.trades || []).find((x: any) => x.id === tradeId);
        if (t) {
          t.assignedUserId = userId;
          t.assigned_user_id = userId;
          if (sub) {
            t.assignedBusinessName = sub.businessName;
            t.assigned_business_name = sub.businessName;
          }
          return { data: t };
        }
      }
      return { data: null };
    }
    case 'unassignSubFromTrade': {
      const tradeId = args[0];
      for (const project of seed.gcProjects) {
        const t = (project.trades || []).find((x: any) => x.id === tradeId);
        if (t) {
          t.assignedUserId = null;
          t.assigned_user_id = null;
          t.assignedBusinessName = null;
          t.assigned_business_name = null;
          return { data: t };
        }
      }
      return { data: null };
    }
    case 'uploadProjectCover': {
      const projectId = args[0];
      const file = args[1] as File | undefined;
      // Use an in-memory blob URL so the cover thumbnail actually shows up
      // for the rest of the session. URLs created via createObjectURL stay
      // valid until the page unloads.
      const url = file && typeof URL !== 'undefined' && URL.createObjectURL
        ? URL.createObjectURL(file)
        : null;
      const project = seed.gcProjects.find((p: any) => p.id === projectId);
      if (project && url) {
        project.coverImageUrl = url;
        project.cover_url = url;
      }
      return { data: { url } };
    }
    case 'clearProjectCover': {
      const projectId = args[0];
      const project = seed.gcProjects.find((p: any) => p.id === projectId);
      if (project) {
        project.coverImageUrl = null;
        project.cover_url = null;
      }
      return { data: null };
    }
    case 'addGCTradeMaterial':
    case 'updateGCTradeMaterial':
    case 'deleteGCTradeMaterial':
      return { data: args[0] && typeof args[0] === 'object' ? { id: nextId('mat'), ...args[0] } : null };

    case 'sendGCMessage': {
      const projectId = args[0];
      const message = args[1];
      const now = new Date().toISOString();
      const entry = {
        id: nextId('msg'),
        message,
        createdAt: now,
        created_at: now,
        author: seed.profile.businessName || 'You',
        authorRole: 'gc',
      };
      seed.gcProjectMessages[projectId] = seed.gcProjectMessages[projectId] || [];
      seed.gcProjectMessages[projectId].push(entry);
      return { data: entry };
    }

    // ── Activity (no-op) ──────────────────────────────────────────
    case 'logActivity':
      return { data: null };

    // ── Stripe / payments — these we DO want the real Connect URL flow
    //    not to fire, but they aren't in the paywall set; just no-op.
    // ── Default: silent fake-success ──────────────────────────────
    default:
      return { data: args[0] && typeof args[0] === 'object' ? { id: nextId(), ...args[0] } : null };
  }
}
