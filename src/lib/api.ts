import { supabase } from './supabase';

// Domain types live in `src/types/database.ts`. `camelify<T>()` below accepts
// a generic so call sites can opt into typing. The api.ts endpoints return
// `{ data }` with implicit types on purpose — tightening api.ts's public
// surface cascades into 40+ consumer files that rely on dual camelCase +
// snake_case access. New code should prefer `camelify<Foo>(row)` at the
// consumer boundary, which gives IDE autocomplete without forcing every
// existing reader to migrate.

// Normalize Supabase snake_case to camelCase for UI consumption.
// The generic `T` defaults to `any` so existing callers keep working, but new
// callers can annotate the expected shape: `camelify<Job>(row)` gives typed
// access without changing the runtime transform.
function camelify<T = any>(obj: any): T {
  if (!obj || typeof obj !== 'object') return obj as T;
  if (Array.isArray(obj)) return obj.map((item) => camelify<T>(item)) as unknown as T;
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = (v && typeof v === 'object') ? camelify(v) : v;
    // Also keep original key for backwards compat
    if (camel !== k) out[k] = out[camel];
  }
  return out as T;
}

// Convert camelCase keys to snake_case for Supabase writes
function snakeify(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(snakeify);
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue; // strip undefined
    const snake = k.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
    out[snake] = (v && typeof v === 'object' && !(v instanceof Date)) ? snakeify(v) : v;
  }
  return out;
}

async function getUserId(): Promise<string> {
  // Try getSession first (reads from memory/storage)
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) return session.user.id;

  // Fallback: getUser() does a fresh token check with Supabase
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id) return user.id;

  throw new Error('You must be signed in to do that. Please log in and try again.');
}

const SUPABASE_FN_URL = 'https://besbtasjpqmfqjkudmgu.supabase.co/functions/v1';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlc2J0YXNqcHFtZnFqa3VkbWd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2OTA1MTAsImV4cCI6MjA4OTI2NjUxMH0.0AJitLQfphKvlV-xveWkZAhd-CBslFgxt9-38QX8GT8';

export const api = {
  // -- Jobs ------------------------------------------------------------------
  getTodaysJobs: async (_technicianId?: string, range?: 'today' | 'tomorrow' | 'week' | 'month' | 'all', specificDate?: string) => {
    // "all" range: no date filter — return everything sorted newest first
    if (range === 'all') {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, customer:customers(*), property:properties(*)')
        .order('scheduled_start', { ascending: false });
      if (error) throw new Error(error.message);
      return { data: camelify(data || []) };
    }

    const start = specificDate ? new Date(specificDate + 'T00:00:00') : new Date();
    start.setHours(0, 0, 0, 0);
    if (!specificDate && range === 'tomorrow') start.setDate(start.getDate() + 1);

    const end = new Date(start);
    if (range === 'month') {
      // Full current month: 1st of this month to 1st of next month
      start.setDate(1);
      end.setFullYear(start.getFullYear(), start.getMonth() + 1, 1);
    } else if (range === 'week') {
      end.setDate(end.getDate() + 7);
    } else {
      end.setDate(end.getDate() + 1);
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*, customer:customers(*), property:properties(*)')
      .gte('scheduled_start', start.toISOString())
      .lt('scheduled_start', end.toISOString())
      .order('scheduled_start', { ascending: true });

    if (error) throw new Error(error.message);
    return { data: camelify(data || []) };
  },

  getJob: async (id: string) => {
    // maybeSingle() not single(): the UI routes on :id from URLs that can be
    // stale (notifications, bookmarks, deleted jobs). .single() throws on 0
    // rows and the detail page shows a scary red error; .maybeSingle() lets
    // the caller render a clean "not found" state instead.
    const { data, error } = await supabase
      .from('jobs')
      .select('*, customer:customers(*), property:properties(*), lineItems:job_line_items(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Job not found');
    return { data: camelify(data) };
  },

  createJob: async (jobData: any) => {
    const userId = await getUserId();
    const clean = snakeify({ ...jobData, userId });
    const { data, error } = await supabase
      .from('jobs')
      .insert(clean)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { data: camelify(data) };
  },

  updateJob: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('jobs')
      .update(snakeify(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { data: camelify(data) };
  },

  deleteJob: async (id: string) => {
    const userId = await getUserId();
    // Delete child line items first
    await supabase.from('job_line_items').delete().eq('job_id', id);

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  },

  addLineItem: async (jobId: string, item: any) => {
    const { data, error } = await supabase
      .from('job_line_items')
      .insert({ ...item, job_id: jobId })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { data };
  },

  saveJobLineItems: async (jobId: string, items: { description: string; quantity: number; unitPrice: number }[]) => {
    // Delete existing line items and replace with new set
    await supabase.from('job_line_items').delete().eq('job_id', jobId);

    if (items.length === 0) return { data: [] };

    const rows = items.map(li => ({
      job_id: jobId,
      description: li.description,
      quantity: li.quantity,
      unit_price: li.unitPrice,
    }));

    const { data, error } = await supabase
      .from('job_line_items')
      .insert(rows)
      .select();

    if (error) throw new Error(error.message);
    return { data };
  },

  // -- Job History + Intelligence --------------------------------------------

  getCompletedJobs: async (params?: { search?: string; customerId?: string; limit?: number; offset?: number }) => {
    const userId = await getUserId();
    let query = supabase
      .from('jobs')
      .select('*, customer:customers(id, first_name, last_name, phone), lineItems:job_line_items(*)')
      .eq('user_id', userId)
      .eq('status', 'COMPLETED')
      .order('completed_at', { ascending: false, nullsFirst: false })
      .order('scheduled_start', { ascending: false });

    if (params?.search) {
      query = query.ilike('description', `%${params.search}%`);
    }
    if (params?.customerId) {
      query = query.eq('customer_id', params.customerId);
    }
    const limit = params?.limit || 50;
    const offset = params?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { data: camelify(data || []) };
  },

  getJobIntelligenceData: async () => {
    const userId = await getUserId();
    const [jobsRes, invoicesRes] = await Promise.all([
      supabase
        .from('jobs')
        .select('*, lineItems:job_line_items(*)')
        .eq('user_id', userId)
        .eq('status', 'COMPLETED'),
      supabase
        .from('invoices')
        .select('*, lineItems:invoice_line_items(*)')
        .eq('user_id', userId)
        .not('job_id', 'is', null),
    ]);
    return {
      data: {
        jobs: camelify(jobsRes.data || []),
        invoices: camelify(invoicesRes.data || []),
      },
    };
  },

  duplicateJob: async (sourceJob: any) => {
    const userId = await getUserId();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        user_id: userId,
        customer_id: sourceJob.customerId || sourceJob.customer_id,
        property_id: sourceJob.propertyId || sourceJob.property_id,
        description: sourceJob.description,
        notes: sourceJob.notes,
        priority: 'NORMAL',
        status: 'SCHEDULED',
        estimated_duration: sourceJob.estimatedDuration || sourceJob.estimated_duration,
        scheduled_start: tomorrow.toISOString(),
        scheduled_end: new Date(tomorrow.getTime() + 2 * 3600000).toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Copy line items from source job
    const sourceItems = sourceJob.lineItems || sourceJob.line_items || [];
    if (sourceItems.length > 0 && data) {
      const rows = sourceItems.map((li: any) => ({
        job_id: data.id,
        description: li.description,
        quantity: li.quantity,
        unit_price: li.unitPrice || li.unit_price,
      }));
      await supabase.from('job_line_items').insert(rows);
    }

    return { data: camelify(data) };
  },

  // -- Customers -------------------------------------------------------------
  getCustomers: async (params?: Record<string, string>) => {
    let query = supabase
      .from('customers')
      .select('*, properties(*), invoices(id, total, status, balance_due)')
      .order('created_at', { ascending: false });

    if (params?.search) {
      query = query.or(
        `first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,phone.ilike.%${params.search}%,email.ilike.%${params.search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { data: camelify(data || []) };
  },

  getCustomer: async (id: string) => {
    // maybeSingle: customer detail pages are reached from stale bookmarks,
    // deleted records, or team members whose RLS blocks the row. Show a
    // proper "not found" instead of a Postgrest coerce error.
    const { data, error } = await supabase
      .from('customers')
      .select('*, properties(*), jobs(*), invoices(*), projects(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Customer not found');
    return { data: camelify(data) };
  },

  createCustomer: async (customerData: any) => {
    const userId = await getUserId();
    const { property, ...customer } = customerData;

    // Strip undefined values -- PostgREST rejects them
    const clean = Object.fromEntries(
      Object.entries({ ...customer, user_id: userId }).filter(([_, v]) => v !== undefined)
    );

    const { data, error } = await supabase
      .from('customers')
      .insert(clean)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // If property data provided, create it
    if (property && data) {
      const cleanProp = Object.fromEntries(
        Object.entries({ ...property, customer_id: data.id }).filter(([_, v]) => v !== undefined)
      );
      await supabase
        .from('properties')
        .insert(cleanProp);
    }

    return { data };
  },

  updateCustomer: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { data };
  },

  // -- Pricebook -------------------------------------------------------------
  getPricebook: async (params?: Record<string, string>) => {
    let query = supabase
      .from('pricebook_items')
      .select('*')
      .order('use_count', { ascending: false, nullsFirst: false });

    // Secondary sort by name for items with same use_count
    query = query.order('name');

    if (params?.search) {
      query = query.ilike('name', `%${params.search}%`);
    }
    if (params?.category) {
      query = query.eq('category', params.category);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { data: data || [] };
  },

  getSmartPricebook: async (search?: string) => {
    // Returns pricebook items sorted by frequency (most used first)
    // with price intelligence data
    let query = supabase
      .from('pricebook_items')
      .select('*')
      .order('use_count', { ascending: false, nullsFirst: false })
      .order('name');

    if (search && search.trim()) {
      query = query.ilike('name', `%${search.trim()}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { data: data || [] };
  },

  createPricebookItem: async (item: {
    name: string;
    default_price: number;
    category?: string;
    description?: string;
    unit?: string;
  }) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('pricebook_items')
      .insert({ ...item, user_id: userId })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { data };
  },

  updatePricebookItem: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('pricebook_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { data };
  },

  deletePricebookItem: async (id: string) => {
    const userId = await getUserId();
    const { error } = await supabase
      .from('pricebook_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return { success: true };
  },

  // Record prices used on an invoice/estimate/job -- builds the adaptive pricebook
  recordPriceUsage: async (lineItems: { description: string; unitPrice: number; quantity: number }[], source: 'invoice' | 'estimate' | 'job', sourceId?: string) => {
    const userId = await getUserId();
    if (!userId) return;

    // Call learn_price for each line item
    for (const item of lineItems) {
      if (!item.description.trim()) continue;
      await supabase.rpc('learn_price', {
        p_user_id: userId,
        p_item_name: item.description,
        p_price: item.unitPrice,
        p_quantity: item.quantity,
        p_source: source,
        p_source_id: sourceId || null,
        p_category: null,
      });
    }
  },

  getPriceHistory: async (pricebookItemId: string) => {
    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('pricebook_item_id', pricebookItemId)
      .order('used_at', { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    return { data: data || [] };
  },

  getStaleItems: async () => {
    // Items not used in 6+ months -- candidates for price increase nudges
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data, error } = await supabase
      .from('pricebook_items')
      .select('*')
      .gt('use_count', 0)
      .lt('last_used_at', sixMonthsAgo.toISOString())
      .order('use_count', { ascending: false });

    if (error) throw new Error(error.message);
    return { data: data || [] };
  },

  seedDefaultPricebook: async (trade: string = 'plumbing') => {
    const userId = await getUserId();
    if (!userId) return;

    // Check if user already has items
    const { data: existing } = await supabase
      .from('pricebook_items')
      .select('id')
      .limit(1);

    if (existing && existing.length > 0) return; // Already has items

    const TRADE_PRICEBOOKS: Record<string, { name: string; default_price: number; category: string; unit: string }[]> = {
      plumbing: [
        { name: 'Service Call / Diagnostic', default_price: 89, category: 'General', unit: 'ea' },
        { name: 'Kitchen Drain - Snake', default_price: 175, category: 'Drain Clearing', unit: 'ea' },
        { name: 'Bathroom Drain - Snake', default_price: 150, category: 'Drain Clearing', unit: 'ea' },
        { name: 'Main Line - Cable Machine', default_price: 350, category: 'Drain Clearing', unit: 'ea' },
        { name: 'Camera Inspection', default_price: 225, category: 'Drain Clearing', unit: 'ea' },
        { name: 'Hydro Jetting', default_price: 550, category: 'Drain Clearing', unit: 'ea' },
        { name: '40 Gal Tank Install', default_price: 1800, category: 'Water Heaters', unit: 'ea' },
        { name: '50 Gal Tank Install', default_price: 2100, category: 'Water Heaters', unit: 'ea' },
        { name: 'Tankless Install', default_price: 3500, category: 'Water Heaters', unit: 'ea' },
        { name: 'Water Heater Repair', default_price: 350, category: 'Water Heaters', unit: 'ea' },
        { name: 'Tank Flush Service', default_price: 150, category: 'Water Heaters', unit: 'ea' },
        { name: 'Faucet Install - Kitchen', default_price: 285, category: 'Fixtures', unit: 'ea' },
        { name: 'Faucet Install - Bath', default_price: 245, category: 'Fixtures', unit: 'ea' },
        { name: 'Toilet Install', default_price: 375, category: 'Fixtures', unit: 'ea' },
        { name: 'Garbage Disposal Install', default_price: 325, category: 'Fixtures', unit: 'ea' },
        { name: 'Shower Valve Replace', default_price: 450, category: 'Fixtures', unit: 'ea' },
        { name: 'Leak Repair - Accessible', default_price: 250, category: 'Pipe & Repair', unit: 'ea' },
        { name: 'Pipe Burst Repair', default_price: 450, category: 'Pipe & Repair', unit: 'ea' },
        { name: 'Repipe Section', default_price: 45, category: 'Pipe & Repair', unit: 'ft' },
        { name: 'Slab Leak Repair', default_price: 2200, category: 'Pipe & Repair', unit: 'ea' },
        { name: 'Gas Line Repair', default_price: 400, category: 'Pipe & Repair', unit: 'ea' },
        { name: 'After-Hours Surcharge', default_price: 150, category: 'General', unit: 'ea' },
        { name: 'Permit Fee', default_price: 200, category: 'General', unit: 'ea' },
        { name: 'Labor', default_price: 95, category: 'General', unit: 'hr' },
      ],
      hvac: [
        { name: 'Service Call / Diagnostic', default_price: 89, category: 'General', unit: 'ea' },
        { name: 'AC Tune-Up', default_price: 150, category: 'Maintenance', unit: 'ea' },
        { name: 'Furnace Tune-Up', default_price: 150, category: 'Maintenance', unit: 'ea' },
        { name: 'Filter Replacement', default_price: 45, category: 'Maintenance', unit: 'ea' },
        { name: 'Duct Cleaning (per vent)', default_price: 35, category: 'Maintenance', unit: 'ea' },
        { name: 'Refrigerant Recharge (R-410A)', default_price: 350, category: 'Repair', unit: 'ea' },
        { name: 'Capacitor Replace', default_price: 225, category: 'Repair', unit: 'ea' },
        { name: 'Contactor Replace', default_price: 250, category: 'Repair', unit: 'ea' },
        { name: 'Blower Motor Replace', default_price: 650, category: 'Repair', unit: 'ea' },
        { name: 'Compressor Replace', default_price: 1800, category: 'Repair', unit: 'ea' },
        { name: 'Evaporator Coil Replace', default_price: 1500, category: 'Repair', unit: 'ea' },
        { name: 'Thermostat Install - Basic', default_price: 175, category: 'Install', unit: 'ea' },
        { name: 'Thermostat Install - Smart', default_price: 325, category: 'Install', unit: 'ea' },
        { name: 'Central AC Install (3 ton)', default_price: 5500, category: 'Install', unit: 'ea' },
        { name: 'Central AC Install (4 ton)', default_price: 6500, category: 'Install', unit: 'ea' },
        { name: 'Furnace Install - Gas', default_price: 4500, category: 'Install', unit: 'ea' },
        { name: 'Heat Pump Install', default_price: 7000, category: 'Install', unit: 'ea' },
        { name: 'Mini-Split Install (single zone)', default_price: 3500, category: 'Install', unit: 'ea' },
        { name: 'Ductwork Repair', default_price: 400, category: 'Repair', unit: 'ea' },
        { name: 'Ductwork Install (per linear ft)', default_price: 35, category: 'Install', unit: 'ft' },
        { name: 'UV Light Install', default_price: 450, category: 'IAQ', unit: 'ea' },
        { name: 'Whole-Home Dehumidifier', default_price: 1800, category: 'IAQ', unit: 'ea' },
        { name: 'After-Hours Surcharge', default_price: 150, category: 'General', unit: 'ea' },
        { name: 'Labor', default_price: 95, category: 'General', unit: 'hr' },
      ],
      electrical: [
        { name: 'Service Call / Diagnostic', default_price: 89, category: 'General', unit: 'ea' },
        { name: 'Outlet Install - Standard', default_price: 175, category: 'Outlets & Switches', unit: 'ea' },
        { name: 'Outlet Install - GFCI', default_price: 225, category: 'Outlets & Switches', unit: 'ea' },
        { name: 'Outlet Install - 240V', default_price: 350, category: 'Outlets & Switches', unit: 'ea' },
        { name: 'Switch Install - Standard', default_price: 150, category: 'Outlets & Switches', unit: 'ea' },
        { name: 'Switch Install - Dimmer', default_price: 200, category: 'Outlets & Switches', unit: 'ea' },
        { name: 'Light Fixture Install', default_price: 185, category: 'Lighting', unit: 'ea' },
        { name: 'Recessed Light Install', default_price: 225, category: 'Lighting', unit: 'ea' },
        { name: 'Ceiling Fan Install', default_price: 275, category: 'Lighting', unit: 'ea' },
        { name: 'Under-Cabinet LED Install', default_price: 350, category: 'Lighting', unit: 'ea' },
        { name: 'Landscape Lighting (per fixture)', default_price: 150, category: 'Lighting', unit: 'ea' },
        { name: 'Panel Upgrade - 200A', default_price: 2500, category: 'Panel & Wiring', unit: 'ea' },
        { name: 'Breaker Replace', default_price: 200, category: 'Panel & Wiring', unit: 'ea' },
        { name: 'Circuit Install - New', default_price: 450, category: 'Panel & Wiring', unit: 'ea' },
        { name: 'Whole-House Rewire', default_price: 12000, category: 'Panel & Wiring', unit: 'ea' },
        { name: 'EV Charger Install - Level 2', default_price: 1200, category: 'Specialty', unit: 'ea' },
        { name: 'Generator Install - Standby', default_price: 8500, category: 'Specialty', unit: 'ea' },
        { name: 'Generator Install - Portable Hookup', default_price: 1500, category: 'Specialty', unit: 'ea' },
        { name: 'Smoke Detector Install', default_price: 125, category: 'Safety', unit: 'ea' },
        { name: 'CO Detector Install', default_price: 125, category: 'Safety', unit: 'ea' },
        { name: 'Surge Protector - Whole House', default_price: 450, category: 'Safety', unit: 'ea' },
        { name: 'Troubleshooting (per hour)', default_price: 125, category: 'General', unit: 'hr' },
        { name: 'After-Hours Surcharge', default_price: 150, category: 'General', unit: 'ea' },
        { name: 'Labor', default_price: 95, category: 'General', unit: 'hr' },
      ],
      framing: [
        { name: 'Wall Framing - Standard', default_price: 8, category: 'Framing', unit: 'sqft' },
        { name: 'Wall Framing - Load Bearing', default_price: 12, category: 'Framing', unit: 'sqft' },
        { name: 'Interior Wall Partition', default_price: 6, category: 'Framing', unit: 'sqft' },
        { name: 'Door Opening - Rough', default_price: 175, category: 'Openings', unit: 'ea' },
        { name: 'Window Opening - Rough', default_price: 225, category: 'Openings', unit: 'ea' },
        { name: 'Header Install', default_price: 250, category: 'Openings', unit: 'ea' },
        { name: 'Floor Joist Install', default_price: 9, category: 'Structural', unit: 'sqft' },
        { name: 'Ceiling Joist Install', default_price: 8, category: 'Structural', unit: 'sqft' },
        { name: 'Roof Rafter Install', default_price: 10, category: 'Structural', unit: 'sqft' },
        { name: 'Subfloor Install', default_price: 4, category: 'Structural', unit: 'sqft' },
        { name: 'Stair Framing', default_price: 85, category: 'Structural', unit: 'ft' },
        { name: 'Beam Install - LVL', default_price: 45, category: 'Structural', unit: 'ft' },
        { name: 'Demo - Non-Load Wall', default_price: 5, category: 'Demolition', unit: 'sqft' },
        { name: 'Labor', default_price: 65, category: 'General', unit: 'hr' },
      ],
      drywall: [
        { name: 'Drywall Install - 1/2"', default_price: 2.5, category: 'Install', unit: 'sqft' },
        { name: 'Drywall Install - 5/8" (Ceiling/Fire)', default_price: 3.25, category: 'Install', unit: 'sqft' },
        { name: 'Moisture Resistant (Bath)', default_price: 3.5, category: 'Install', unit: 'sqft' },
        { name: 'Tape & Mud - Level 4', default_price: 1.75, category: 'Finishing', unit: 'sqft' },
        { name: 'Tape & Mud - Level 5 (Smooth)', default_price: 2.5, category: 'Finishing', unit: 'sqft' },
        { name: 'Corner Bead Install', default_price: 2.5, category: 'Finishing', unit: 'ft' },
        { name: 'Patch - Small (<12")', default_price: 95, category: 'Repair', unit: 'ea' },
        { name: 'Patch - Medium (12-36")', default_price: 185, category: 'Repair', unit: 'ea' },
        { name: 'Patch - Large Cut-In', default_price: 325, category: 'Repair', unit: 'ea' },
        { name: 'Texture - Knockdown', default_price: 1.25, category: 'Texture', unit: 'sqft' },
        { name: 'Texture - Orange Peel', default_price: 1, category: 'Texture', unit: 'sqft' },
        { name: 'Skim Coat', default_price: 1.5, category: 'Texture', unit: 'sqft' },
        { name: 'Labor', default_price: 55, category: 'General', unit: 'hr' },
      ],
      painting: [
        { name: 'Interior Wall - 1 Coat', default_price: 1.75, category: 'Interior', unit: 'sqft' },
        { name: 'Interior Wall - 2 Coat', default_price: 2.75, category: 'Interior', unit: 'sqft' },
        { name: 'Ceiling Paint', default_price: 2.25, category: 'Interior', unit: 'sqft' },
        { name: 'Trim / Baseboard Paint', default_price: 3.5, category: 'Interior', unit: 'ft' },
        { name: 'Door Paint - Interior', default_price: 85, category: 'Interior', unit: 'ea' },
        { name: 'Cabinet Refinish', default_price: 175, category: 'Interior', unit: 'ea' },
        { name: 'Exterior Siding', default_price: 2.5, category: 'Exterior', unit: 'sqft' },
        { name: 'Exterior Trim', default_price: 4, category: 'Exterior', unit: 'ft' },
        { name: 'Front Door Paint', default_price: 225, category: 'Exterior', unit: 'ea' },
        { name: 'Deck Stain', default_price: 3, category: 'Exterior', unit: 'sqft' },
        { name: 'Pressure Wash (Prep)', default_price: 0.5, category: 'Prep', unit: 'sqft' },
        { name: 'Drywall Repair Prep', default_price: 85, category: 'Prep', unit: 'ea' },
        { name: 'Labor', default_price: 50, category: 'General', unit: 'hr' },
      ],
      roofing: [
        { name: 'Asphalt Shingle Install', default_price: 4.5, category: 'Install', unit: 'sqft' },
        { name: 'Architectural Shingle Install', default_price: 5.75, category: 'Install', unit: 'sqft' },
        { name: 'Metal Roof Install', default_price: 10, category: 'Install', unit: 'sqft' },
        { name: 'Tile / Clay Roof Install', default_price: 12, category: 'Install', unit: 'sqft' },
        { name: 'Tear Off - Single Layer', default_price: 1.25, category: 'Tear Off', unit: 'sqft' },
        { name: 'Tear Off - Two Layer', default_price: 2.25, category: 'Tear Off', unit: 'sqft' },
        { name: 'Underlayment - Felt', default_price: 0.75, category: 'Underlayment', unit: 'sqft' },
        { name: 'Underlayment - Synthetic', default_price: 1.25, category: 'Underlayment', unit: 'sqft' },
        { name: 'Ice & Water Shield', default_price: 1.5, category: 'Underlayment', unit: 'sqft' },
        { name: 'Ridge Vent Install', default_price: 12, category: 'Ventilation', unit: 'ft' },
        { name: 'Roof Vent - Box', default_price: 175, category: 'Ventilation', unit: 'ea' },
        { name: 'Flashing Replace', default_price: 18, category: 'Flashing', unit: 'ft' },
        { name: 'Leak Repair', default_price: 450, category: 'Repair', unit: 'ea' },
        { name: 'Gutter Install', default_price: 9, category: 'Gutters', unit: 'ft' },
        { name: 'Labor', default_price: 70, category: 'General', unit: 'hr' },
      ],
      concrete: [
        { name: 'Slab - 4" Standard', default_price: 6.5, category: 'Slab', unit: 'sqft' },
        { name: 'Slab - 6" Reinforced', default_price: 9, category: 'Slab', unit: 'sqft' },
        { name: 'Driveway Pour', default_price: 8, category: 'Flatwork', unit: 'sqft' },
        { name: 'Sidewalk / Walkway', default_price: 7, category: 'Flatwork', unit: 'sqft' },
        { name: 'Patio Pour', default_price: 8.5, category: 'Flatwork', unit: 'sqft' },
        { name: 'Stamped Concrete Upcharge', default_price: 5, category: 'Decorative', unit: 'sqft' },
        { name: 'Footing - Perimeter', default_price: 14, category: 'Footings', unit: 'ft' },
        { name: 'Footing - Spot', default_price: 225, category: 'Footings', unit: 'ea' },
        { name: 'Foundation Wall - Poured', default_price: 32, category: 'Foundation', unit: 'ft' },
        { name: 'Crack Repair', default_price: 275, category: 'Repair', unit: 'ea' },
        { name: 'Demo & Haul - Slab', default_price: 4.5, category: 'Demo', unit: 'sqft' },
        { name: 'Rebar / Mesh Install', default_price: 0.85, category: 'Reinforcement', unit: 'sqft' },
        { name: 'Labor', default_price: 60, category: 'General', unit: 'hr' },
      ],
      flooring: [
        { name: 'LVP / Vinyl Plank Install', default_price: 3.5, category: 'Install', unit: 'sqft' },
        { name: 'Laminate Install', default_price: 3, category: 'Install', unit: 'sqft' },
        { name: 'Engineered Hardwood Install', default_price: 5.5, category: 'Install', unit: 'sqft' },
        { name: 'Solid Hardwood Install', default_price: 6.5, category: 'Install', unit: 'sqft' },
        { name: 'Carpet Install', default_price: 3.25, category: 'Install', unit: 'sqft' },
        { name: 'Tile Floor Install', default_price: 9, category: 'Install', unit: 'sqft' },
        { name: 'Underlayment / Pad', default_price: 0.75, category: 'Prep', unit: 'sqft' },
        { name: 'Floor Leveler / Self-Level', default_price: 3, category: 'Prep', unit: 'sqft' },
        { name: 'Demo & Haul - Carpet', default_price: 0.75, category: 'Demo', unit: 'sqft' },
        { name: 'Demo & Haul - Tile', default_price: 2.5, category: 'Demo', unit: 'sqft' },
        { name: 'Stair Tread Install', default_price: 65, category: 'Stairs', unit: 'ea' },
        { name: 'Transition Strip', default_price: 45, category: 'Trim', unit: 'ea' },
        { name: 'Baseboard Reinstall', default_price: 3, category: 'Trim', unit: 'ft' },
        { name: 'Labor', default_price: 60, category: 'General', unit: 'hr' },
      ],
      landscaping: [
        { name: 'Sod Install', default_price: 1.75, category: 'Lawn', unit: 'sqft' },
        { name: 'Seed + Topsoil', default_price: 0.65, category: 'Lawn', unit: 'sqft' },
        { name: 'Mulch Install', default_price: 2.25, category: 'Beds', unit: 'sqft' },
        { name: 'Edging Install', default_price: 6.5, category: 'Beds', unit: 'ft' },
        { name: 'Tree Planting - Small', default_price: 185, category: 'Planting', unit: 'ea' },
        { name: 'Tree Planting - Mature', default_price: 450, category: 'Planting', unit: 'ea' },
        { name: 'Shrub Planting', default_price: 85, category: 'Planting', unit: 'ea' },
        { name: 'Sprinkler Head Replace', default_price: 45, category: 'Irrigation', unit: 'ea' },
        { name: 'Sprinkler Zone Install', default_price: 650, category: 'Irrigation', unit: 'ea' },
        { name: 'Drip Line Install', default_price: 5.5, category: 'Irrigation', unit: 'ft' },
        { name: 'Paver Patio Install', default_price: 18, category: 'Hardscape', unit: 'sqft' },
        { name: 'Retaining Wall - Block', default_price: 45, category: 'Hardscape', unit: 'sqft' },
        { name: 'Demo / Haul Debris', default_price: 1.25, category: 'Demo', unit: 'sqft' },
        { name: 'Labor', default_price: 50, category: 'General', unit: 'hr' },
      ],
      tiling: [
        { name: 'Floor Tile Install - Standard', default_price: 9, category: 'Floor', unit: 'sqft' },
        { name: 'Floor Tile Install - Large Format', default_price: 12, category: 'Floor', unit: 'sqft' },
        { name: 'Wall Tile Install - Kitchen', default_price: 11, category: 'Wall', unit: 'sqft' },
        { name: 'Shower Wall Tile', default_price: 13, category: 'Wall', unit: 'sqft' },
        { name: 'Shower Pan - Mud Set', default_price: 650, category: 'Shower', unit: 'ea' },
        { name: 'Shower Niche', default_price: 275, category: 'Shower', unit: 'ea' },
        { name: 'Shower Curb', default_price: 225, category: 'Shower', unit: 'ea' },
        { name: 'Tub Surround Tile', default_price: 950, category: 'Wall', unit: 'ea' },
        { name: 'Backsplash Install', default_price: 14, category: 'Wall', unit: 'sqft' },
        { name: 'Grout & Seal', default_price: 1.5, category: 'Finishing', unit: 'sqft' },
        { name: 'Schluter / Edge Trim', default_price: 12, category: 'Finishing', unit: 'ft' },
        { name: 'Regrout Service', default_price: 4.5, category: 'Repair', unit: 'sqft' },
        { name: 'Tile Demo & Haul', default_price: 2.5, category: 'Demo', unit: 'sqft' },
        { name: 'Labor', default_price: 65, category: 'General', unit: 'hr' },
      ],
      siding: [
        { name: 'Vinyl Siding Install', default_price: 4.5, category: 'Install', unit: 'sqft' },
        { name: 'Fiber Cement (Hardie) Install', default_price: 7, category: 'Install', unit: 'sqft' },
        { name: 'Wood / Cedar Siding', default_price: 9, category: 'Install', unit: 'sqft' },
        { name: 'Engineered Wood (LP) Install', default_price: 6.5, category: 'Install', unit: 'sqft' },
        { name: 'Stone Veneer Install', default_price: 22, category: 'Install', unit: 'sqft' },
        { name: 'Stucco Install - 3-Coat', default_price: 9.5, category: 'Install', unit: 'sqft' },
        { name: 'Tear Off - Vinyl', default_price: 1, category: 'Tear Off', unit: 'sqft' },
        { name: 'Tear Off - Wood', default_price: 1.5, category: 'Tear Off', unit: 'sqft' },
        { name: 'House Wrap / Tyvek', default_price: 0.75, category: 'Wrap', unit: 'sqft' },
        { name: 'Trim - Corner Board', default_price: 6, category: 'Trim', unit: 'ft' },
        { name: 'Soffit Install', default_price: 7.5, category: 'Trim', unit: 'sqft' },
        { name: 'Fascia Install', default_price: 8, category: 'Trim', unit: 'ft' },
        { name: 'Caulk & Seal', default_price: 2.5, category: 'Finishing', unit: 'ft' },
        { name: 'Labor', default_price: 60, category: 'General', unit: 'hr' },
      ],
      insulation: [
        { name: 'Fiberglass Batt - R13 Walls', default_price: 1.5, category: 'Batt', unit: 'sqft' },
        { name: 'Fiberglass Batt - R19 Walls', default_price: 1.85, category: 'Batt', unit: 'sqft' },
        { name: 'Fiberglass Batt - R30 Ceiling', default_price: 2.25, category: 'Batt', unit: 'sqft' },
        { name: 'Blown-In Cellulose - Attic', default_price: 1.75, category: 'Blown-In', unit: 'sqft' },
        { name: 'Blown-In Fiberglass - Attic', default_price: 1.5, category: 'Blown-In', unit: 'sqft' },
        { name: 'Spray Foam - Open Cell', default_price: 1.85, category: 'Spray Foam', unit: 'bdft' },
        { name: 'Spray Foam - Closed Cell', default_price: 3.25, category: 'Spray Foam', unit: 'bdft' },
        { name: 'Rim Joist Foam', default_price: 7, category: 'Spray Foam', unit: 'ft' },
        { name: 'Attic Baffle Install', default_price: 25, category: 'Prep', unit: 'ea' },
        { name: 'Vapor Barrier', default_price: 0.85, category: 'Prep', unit: 'sqft' },
        { name: 'Air Seal - Attic Pen', default_price: 45, category: 'Air Seal', unit: 'ea' },
        { name: 'Rim Joist Air Seal', default_price: 6, category: 'Air Seal', unit: 'ft' },
        { name: 'Labor', default_price: 55, category: 'General', unit: 'hr' },
      ],
      cabinetry: [
        { name: 'Base Cabinet - Stock', default_price: 275, category: 'Cabinets', unit: 'ft' },
        { name: 'Base Cabinet - Semi-Custom', default_price: 450, category: 'Cabinets', unit: 'ft' },
        { name: 'Base Cabinet - Custom', default_price: 850, category: 'Cabinets', unit: 'ft' },
        { name: 'Wall Cabinet - Stock', default_price: 225, category: 'Cabinets', unit: 'ft' },
        { name: 'Wall Cabinet - Semi-Custom', default_price: 350, category: 'Cabinets', unit: 'ft' },
        { name: 'Pantry / Tall Cabinet', default_price: 650, category: 'Cabinets', unit: 'ea' },
        { name: 'Kitchen Island Install', default_price: 1800, category: 'Islands', unit: 'ea' },
        { name: 'Bath Vanity Install', default_price: 750, category: 'Vanity', unit: 'ea' },
        { name: 'Countertop - Laminate', default_price: 35, category: 'Countertops', unit: 'sqft' },
        { name: 'Countertop - Quartz', default_price: 85, category: 'Countertops', unit: 'sqft' },
        { name: 'Countertop - Granite', default_price: 75, category: 'Countertops', unit: 'sqft' },
        { name: 'Countertop Template / Cut', default_price: 225, category: 'Countertops', unit: 'ea' },
        { name: 'Crown Molding on Cabinets', default_price: 14, category: 'Trim', unit: 'ft' },
        { name: 'Soft-Close Hinge Upgrade', default_price: 12, category: 'Hardware', unit: 'ea' },
        { name: 'Cabinet Hardware Install', default_price: 8, category: 'Hardware', unit: 'ea' },
        { name: 'Labor', default_price: 70, category: 'General', unit: 'hr' },
      ],
    };

    // Trade keys are always lowercased before lookup; fall back to plumbing
    // if someone passes an unknown trade (legacy seed paths, etc).
    const defaults = TRADE_PRICEBOOKS[trade.toLowerCase()] || TRADE_PRICEBOOKS.plumbing;
    const items = defaults.map(d => ({ ...d, user_id: userId }));
    await supabase.from('pricebook_items').insert(items);
  },

  // -- Invoices --------------------------------------------------------------
  getInvoices: async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, customer:customers(id, first_name, last_name, phone, email), lineItems:invoice_line_items(*)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return { data: (data || []).map(camelify) };
  },

  getInvoice: async (id: string) => {
    // maybeSingle: invoice links get emailed to customers and lived forever
    // in inboxes. When the invoice is deleted or voided, single() throws a
    // confusing error; maybeSingle() + null check lets us show "not found".
    const { data, error } = await supabase
      .from('invoices')
      .select('*, customer:customers(*), lineItems:invoice_line_items(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Invoice not found');
    return { data: camelify(data) };
  },

  createInvoice: async (invoiceData: any) => {
    const userId = await getUserId();
    const { lineItems, ...invoice } = invoiceData;

    // Insert invoice (invoice_number auto-generated by trigger)
    const clean = snakeify({ ...invoice, userId });
    Object.keys(clean).forEach(k => clean[k] === undefined && delete clean[k]);
    clean.invoice_number = clean.invoice_number || '';
    const { data, error } = await supabase
      .from('invoices')
      .insert(clean)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Insert line items
    if (lineItems?.length && data) {
      const items = lineItems.map((li: any) => {
        const row = snakeify({ ...li, invoiceId: data.id });
        Object.keys(row).forEach(k => row[k] === undefined && delete row[k]);
        return row;
      });
      const { error: liError } = await supabase
        .from('invoice_line_items')
        .insert(items);
      if (liError) throw new Error(liError.message);
    }

    return { data };
  },

  updateInvoice: async (id: string, updates: any) => {
    const clean = snakeify(updates);
    const { data, error } = await supabase
      .from('invoices')
      .update(clean)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { data };
  },

  deleteInvoice: async (id: string) => {
    const userId = await getUserId();
    await supabase.from('invoice_line_items').delete().eq('invoice_id', id);
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
  },

  getInvoicesByCustomer: async (customerId: string) => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, customer:customers(id, first_name, last_name, phone, email), lineItems:invoice_line_items(*)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return { data: (data || []).map(camelify) };
  },

  getInvoicesByJob: async (jobId: string) => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, customer:customers(id, first_name, last_name, phone, email), lineItems:invoice_line_items(*)')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return { data: (data || []).map(camelify) };
  },

  // -- Edge Functions: Stripe & Email ----------------------------------------
  createPaymentLink: async (invoiceId: string, invoice?: any, companyName?: string) => {
    // Fetch the contractor's Stripe account ID -- required to route money correctly
    const userId = await getUserId();
    // maybeSingle: brand-new users may not have a profile row yet; the code
    // below already handles null-ish via optional chaining. .single() would
    // throw a Postgrest coerce error instead of our helpful "Connect Stripe"
    // message.
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', userId)
      .maybeSingle();

    if (!profile?.stripe_account_id || !profile?.stripe_onboarding_complete) {
      throw new Error('Connect your Stripe account first -- go to Settings -> Payment Processing.');
    }

    const body = {
      invoiceId,
      amount: Number(invoice?.total) || 0,
      customerName: invoice?.customer ? `${invoice.customer.firstName} ${invoice.customer.lastName}` : undefined,
      customerEmail: invoice?.customer?.email || undefined,
      customerPhone: invoice?.customer?.phone || undefined,
      description: invoice?.invoiceNumber ? `Invoice #${invoice.invoiceNumber}` : undefined,
      companyName: companyName || undefined,
      invoiceNumber: invoice?.invoiceNumber || invoice?.number || invoice?.invoice_number || undefined,
      dueDate: invoice?.dueDate || invoice?.due_date || undefined,
      lineItems: invoice?.lineItems?.map((li: any) => ({
        description: li.description,
        quantity: Number(li.quantity),
        unitPrice: Number(li.unitPrice),
      })) || undefined,
      stripeAccountId: profile.stripe_account_id, // routes money to contractor's account
    };

    const resp = await fetch(`${SUPABASE_FN_URL}/create-payment-link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[FlowBoss] Stripe error:', resp.status, errText);
      throw new Error(`Payment link failed (${resp.status}): ${errText}`);
    }

    const result = await resp.json();
    return { url: result.url as string, id: result.sessionId as string };
  },

  getStripeConnectUrl: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const resp = await fetch(`${SUPABASE_FN_URL}/stripe-connect-onboard`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Stripe Connect failed: ${errText}`);
    }
    return await resp.json() as { connected: boolean; url?: string; accountId?: string };
  },

  checkStripeConnectStatus: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const resp = await fetch(`${SUPABASE_FN_URL}/stripe-connect-status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Status check failed: ${errText}`);
    }
    return await resp.json() as { connected: boolean; accountId: string | null };
  },

  sendInvoiceEmail: async (invoice: any, payLink?: string, companyName?: string) => {
    const customer = invoice?.customer || {};
    const customerName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Customer';
    const customerEmail = customer.email;
    if (!customerEmail) {
      throw new Error('Customer has no email address on file');
    }

    const body = {
      customerEmail,
      customerName,
      companyName: companyName || 'FlowBoss',
      invoiceNumber: invoice?.invoiceNumber || invoice?.number || invoice?.invoice_number || invoice?.id?.slice(0, 8) || '',
      amount: Number(invoice?.total) || 0,
      subtotal: Number(invoice?.subtotal) || undefined,
      taxRate: Number(invoice?.taxRate || invoice?.tax_rate) || undefined,
      tax: Number(invoice?.tax) || undefined,
      dueDate: invoice?.dueDate || invoice?.due_date || undefined,
      notes: invoice?.notes || undefined,
      payLink: payLink || undefined,
      lineItems: (invoice?.lineItems || []).map((li: any) => ({
        description: li.description,
        quantity: Number(li.quantity),
        unitPrice: Number(li.unitPrice || li.unit_price),
      })),
    };

    const resp = await fetch(`${SUPABASE_FN_URL}/send-invoice-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[FlowBoss] Email send error:', resp.status, errText);
      throw new Error(`Email failed (${resp.status}): ${errText}`);
    }

    return resp.json();
  },

  sendInviteEmail: async (data: { email: string; subName?: string; projectName: string; tradeName: string; inviteUrl: string; gcCompanyName?: string }) => {
    try {
      // Use the caller's session token — the edge function verifies it, so
      // only authenticated FlowBoss users can trigger invite emails. The
      // anon key was sufficient for the old permissive check but that let
      // anyone who knew the URL spam FlowBoss-branded mail.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { success: false, error: 'You must be signed in to send an invite.' };
      }
      const resp = await fetch(`${SUPABASE_FN_URL}/send-invite-email`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!resp.ok) {
        // Edge function not deployed yet — silently succeed
        return { success: true, pending: true };
      }
      return await resp.json();
    } catch {
      // Edge function not deployed — silently succeed
      return { success: true, pending: true };
    }
  },

  // -- Project Activity Feed -------------------------------------------------
  getProjectActivity: async (projectId: string, limit = 20) => {
    const { data, error } = await supabase
      .from('project_activity')
      .select('*')
      .eq('gc_project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      // Table may not exist yet — return empty gracefully
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        return { data: [] };
      }
      throw new Error(error.message);
    }
    return { data: camelify(data || []) };
  },

  getRecentActivityAcrossProjects: async (limit = 15) => {
    const userId = await getUserId().catch(() => null);
    if (!userId) return { data: [] };
    const { data, error } = await supabase
      .from('project_activity')
      .select('*, project:gc_projects(id, name)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        return { data: [] };
      }
      throw new Error(error.message);
    }
    return { data: camelify(data || []) };
  },

  logActivity: async (
    projectId: string,
    eventType: string,
    summary: string,
    opts?: { tradeId?: string; zoneId?: string; metadata?: any }
  ) => {
    try {
      const userId = await getUserId().catch(() => null);
      let actorName: string | null = null;
      if (userId) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('business_name, email')
          .eq('id', userId)
          .maybeSingle();
        actorName = prof?.business_name || prof?.email || null;
      }
      const { error } = await supabase.from('project_activity').insert({
        gc_project_id: projectId,
        actor_user_id: userId,
        actor_name: actorName,
        event_type: eventType,
        summary,
        trade_id: opts?.tradeId || null,
        zone_id: opts?.zoneId || null,
        metadata: opts?.metadata || null,
      });
      if (error && !error.message.includes('does not exist')) {
        console.warn('[activity]', error.message);
      }
    } catch (e) {
      // Non-fatal — activity logging should never break caller
      console.warn('[activity]', e);
    }
  },

  // -- Expenses --------------------------------------------------------------
  getExpenses: async (params?: Record<string, string>) => {
    let query = supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (params?.category) {
      query = query.eq('category', params.category);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { data: data || [] };
  },

  createExpense: async (expenseData: any) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('expenses')
      .insert({ ...expenseData, user_id: userId })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { data };
  },

  // -- Financials (computed from jobs + invoices + expenses) ------------------
  getFinancials: async (period: string) => {
    const now = new Date();
    let startDate: Date;

    if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const start = startDate.toISOString();

    // Fetch in parallel
    const [invoicesRes, expensesRes, jobsRes] = await Promise.all([
      supabase.from('invoices').select('*, customer:customers(first_name, last_name)').gte('created_at', start),
      supabase.from('expenses').select('*').gte('date', start),
      supabase.from('jobs').select('*').eq('status', 'COMPLETED').gte('scheduled_start', start),
    ]);

    const invoices = invoicesRes.data || [];
    const expenses = expensesRes.data || [];
    const jobs = jobsRes.data || [];

    const revenue = invoices
      .filter((i: any) => i.status?.toUpperCase() === 'PAID')
      .reduce((sum: number, i: any) => sum + Number(i.total || 0), 0);
    const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
    const outstanding = invoices
      .filter((i: any) => i.status?.toUpperCase() !== 'PAID')
      .reduce((sum: number, i: any) => sum + Number(i.balance_due || 0), 0);

    const recentPayments = invoices
      .filter((i: any) => i.paid_at)
      .map((i: any) => ({
        id: i.id,
        customerName: [i.customer?.first_name, i.customer?.last_name].filter(Boolean).join(' ') || 'Customer',
        amount: Number(i.total || 0),
        date: i.paid_at,
      }))
      .slice(0, 5);

    const recentExpenses = expenses.slice(0, 5);

    return {
      data: {
        revenue,
        expenses: totalExpenses,
        outstanding,
        jobsCompleted: jobs.length,
        recentPayments,
        recentExpenses,
      },
    };
  },

  // -- Users / Settings ------------------------------------------------------
  getMe: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // maybeSingle: profile row is created on first signup via a trigger but
    // there's a race window where auth succeeds before the profile lands.
    // Return an empty-ish profile so callers can route to onboarding instead
    // of crashing the shell.
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return { data: { ...(data || { id: session.user.id }), email: session.user.email } };
  },

  getSettings: async () => {
    const userId = await getUserId();
    // maybeSingle: same rationale as getMe — profile may not exist yet.
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return { data: data || { id: userId } };
  },

  updateSettings: async (data: any) => {
    const userId = await getUserId();
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId);

    if (error) throw new Error(error.message);
    return { data };
  },

  // -- Insights (bulk fetch for analytics) -----------------------------------
  getInsightsData: async () => {
    const [jobsRes, invoicesRes, expensesRes, customersRes, pricebookRes] = await Promise.all([
      supabase.from('jobs').select('*, customer:customers(id, first_name, last_name, lead_source), property:properties(id, zip), lineItems:job_line_items(*)'),
      supabase.from('invoices').select('*, customer:customers(id, first_name, last_name, lead_source), lineItems:invoice_line_items(*)'),
      supabase.from('expenses').select('*'),
      supabase.from('customers').select('*, properties(zip)'),
      supabase.from('pricebook_items').select('*'),
    ]);

    return {
      data: {
        jobs: jobsRes.data || [],
        invoices: invoicesRes.data || [],
        expenses: expensesRes.data || [],
        customers: customersRes.data || [],
        pricebook: pricebookRes.data || [],
      },
    };
  },

  // -- QuickBooks Integration ------------------------------------------------
  quickbooks: {
    /** Get the OAuth authorization URL to start the connect flow */
    getAuthUrl: async (): Promise<string> => {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const resp = await fetch(`${SUPABASE_FN_URL}/quickbooks-auth`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!resp.ok) throw new Error('Failed to get QuickBooks auth URL');
      const data = await resp.json();
      return data.authUrl;
    },

    /** Call the sync function with an action */
    _call: async (body: any) => {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const resp = await fetch(`${SUPABASE_FN_URL}/quickbooks-sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(errText);
      }
      return await resp.json();
    },

    /** Get QB connection status */
    getStatus: async () => {
      try {
        return await api.quickbooks._call({ action: 'get_status' });
      } catch {
        return { connected: false };
      }
    },

    /** Update sync preferences (invoicingProvider, syncInvoices, etc.) */
    setPreferences: async (prefs: {
      invoicingProvider?: 'stripe' | 'quickbooks';
      syncInvoices?: boolean;
      syncCustomers?: boolean;
      syncExpenses?: boolean;
    }) => {
      return await api.quickbooks._call({ action: 'set_preferences', ...prefs });
    },

    /** Sync a single customer to QuickBooks */
    syncCustomer: async (customerId: string) => {
      return await api.quickbooks._call({ action: 'sync_customer', customerId });
    },

    /** Sync an invoice to QuickBooks */
    syncInvoice: async (invoiceId: string) => {
      return await api.quickbooks._call({ action: 'sync_invoice', invoiceId });
    },

    /** Send an invoice email via QuickBooks (instead of FlowBoss/Stripe) */
    sendInvoiceViaQB: async (invoiceId: string) => {
      return await api.quickbooks._call({ action: 'send_qb_invoice', invoiceId });
    },

    /** Sync an expense to QuickBooks */
    syncExpense: async (expenseId: string) => {
      return await api.quickbooks._call({ action: 'sync_expense', expenseId });
    },

    /** Check if a QB invoice has been paid (polls QB API) */
    checkPaymentStatus: async (invoiceId: string) => {
      return await api.quickbooks._call({ action: 'check_payment_status', invoiceId });
    },

    /** Disconnect QuickBooks */
    disconnect: async () => {
      return await api.quickbooks._call({ action: 'disconnect' });
    },
  },

  // -- Contractors (General Contractors) -------------------------------------
  getContractors: async (params?: { search?: string }) => {
    const userId = await getUserId();
    let query = supabase
      .from('contractors')
      .select('*')
      .eq('user_id', userId)
      .order('company_name', { ascending: true });

    if (params?.search) {
      query = query.or(
        `company_name.ilike.%${params.search}%,name.ilike.%${params.search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { data: camelify(data || []) };
  },

  getContractor: async (id: string) => {
    // maybeSingle: stale URLs / deleted contractors. Fail with a clean
    // "not found" instead of a Postgrest coerce error.
    const { data, error } = await supabase
      .from('contractors')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Contractor not found');
    return { data: camelify(data) };
  },

  createContractor: async (contractorData: any) => {
    const userId = await getUserId();
    const clean = Object.fromEntries(
      Object.entries(snakeify({ ...contractorData, userId })).filter(([_, v]) => v !== undefined)
    );

    const { data, error } = await supabase
      .from('contractors')
      .insert(clean)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { data: camelify(data) };
  },

  updateContractor: async (id: string, updates: any) => {
    const clean = snakeify(updates);
    const { data, error } = await supabase
      .from('contractors')
      .update({ ...clean, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { data: camelify(data) };
  },

  deleteContractor: async (id: string) => {
    const userId = await getUserId();
    const { error } = await supabase
      .from('contractors')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return { success: true };
  },

  getContractorStats: async (contractorId: string) => {
    const userId = await getUserId();
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*, lineItems:job_line_items(*)')
      .eq('user_id', userId)
      .eq('contractor_id', contractorId);

    if (error) throw new Error(error.message);

    const jobList = jobs || [];
    const totalRevenue = jobList.reduce((sum: number, j: any) => {
      const items = j.lineItems || j.line_items || [];
      return sum + items.reduce((s: number, li: any) =>
        s + (Number(li.unit_price || 0) * Number(li.quantity || 1)), 0);
    }, 0);

    return {
      data: {
        jobCount: jobList.length,
        totalRevenue,
      },
    };
  },

  getContractorsWithStats: async () => {
    const userId = await getUserId();

    const [contractorsRes, jobsRes] = await Promise.all([
      supabase
        .from('contractors')
        .select('*')
        .eq('user_id', userId)
        .order('company_name', { ascending: true }),
      supabase
        .from('jobs')
        .select('contractor_id, lineItems:job_line_items(unit_price, quantity)')
        .eq('user_id', userId)
        .not('contractor_id', 'is', null),
    ]);

    if (contractorsRes.error) throw new Error(contractorsRes.error.message);

    const contractors = camelify(contractorsRes.data || []);
    const jobs = jobsRes.data || [];

    // Aggregate stats per contractor
    const statsMap: Record<string, { jobCount: number; totalRevenue: number }> = {};
    for (const j of jobs) {
      const cid = j.contractor_id;
      if (!cid) continue;
      if (!statsMap[cid]) statsMap[cid] = { jobCount: 0, totalRevenue: 0 };
      statsMap[cid].jobCount++;
      const items = (j as any).lineItems || (j as any).line_items || [];
      for (const li of items) {
        statsMap[cid].totalRevenue += Number(li.unit_price || 0) * Number(li.quantity || 1);
      }
    }

    return {
      data: contractors.map((c: any) => ({
        ...c,
        jobCount: statsMap[c.id]?.jobCount || 0,
        totalRevenue: statsMap[c.id]?.totalRevenue || 0,
      })),
    };
  },

  // -- Team Members ----------------------------------------------------------
  getTeamMembers: async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return { data: data || [] };
  },

  inviteTeamMember: async (member: { name: string; email?: string; phone?: string; role: string }) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('team_members')
      .insert({ ...member, owner_id: userId, status: 'invited' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { data };
  },

  // -- Projects ---------------------------------------------------------------
  getProjects: async () => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        customer:customers(*),
        property:properties(*),
        phases:project_phases(
          *,
          tasks:phase_tasks(*),
          materials:phase_materials(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return { data: camelify(data || []) };
  },

  getProject: async (id: string) => {
    // maybeSingle: stale URLs / deleted projects.
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        customer:customers(*),
        property:properties(*),
        phases:project_phases(
          *,
          tasks:phase_tasks(*),
          materials:phase_materials(*)
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Project not found');
    return { data: camelify(data) };
  },

  createProject: async (projectData: any) => {
    const userId = await getUserId();
    const { phases, ...project } = projectData;

    const { data, error } = await supabase
      .from('projects')
      .insert({ ...snakeify(project), user_id: userId })
      .select()
      .single();

    if (error) throw new Error(error.message);

    if (phases?.length && data) {
      const phaseResults = await Promise.all(
        phases.map((phase: any, i: number) => {
          const { tasks: _t, materials: _m, ...phaseFields } = phase;
          return supabase
            .from('project_phases')
            .insert({ ...snakeify(phaseFields), project_id: data.id, sort_order: i })
            .select()
            .single();
        })
      );

      await Promise.all(
        phaseResults.map(({ data: phaseData }, i: number) => {
          if (!phaseData) return Promise.resolve();
          const { tasks, materials } = phases[i];
          const inserts: Promise<any>[] = [];

          if (tasks?.length) {
            inserts.push(
              Promise.resolve(supabase.from('phase_tasks').insert(
                tasks.map((t: any, ti: number) => ({
                  phase_id: phaseData.id,
                  name: t.name,
                  done: t.done || false,
                  sort_order: ti,
                }))
              ))
            );
          }

          if (materials?.length) {
            inserts.push(
              Promise.resolve(supabase.from('phase_materials').insert(
                materials.map((m: any) => ({
                  phase_id: phaseData.id,
                  name: m.name,
                  cost: m.cost || 0,
                  purchased: m.purchased || false,
                }))
              ))
            );
          }

          return Promise.all(inserts);
        })
      );
    }

    return { data: camelify(data) };
  },

  updateProject: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('projects')
      .update(snakeify(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { data: camelify(data) };
  },

  deleteProject: async (id: string) => {
    const userId = await getUserId();
    const { data: phases } = await supabase
      .from('project_phases')
      .select('id')
      .eq('project_id', id);

    if (phases?.length) {
      const phaseIds = phases.map(p => p.id);
      await supabase.from('phase_tasks').delete().in('phase_id', phaseIds);
      await supabase.from('phase_materials').delete().in('phase_id', phaseIds);
      await supabase.from('project_phases').delete().eq('project_id', id);
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  },

  duplicateProject: async (sourceProject: any) => {
    const userId = await getUserId();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        customer_id: sourceProject.customerId || sourceProject.customer_id,
        property_id: sourceProject.propertyId || sourceProject.property_id,
        name: `${sourceProject.name} (Copy)`,
        description: sourceProject.description,
        notes: sourceProject.notes,
        budget: sourceProject.budget,
        status: 'NOT_STARTED',
        start_date: tomorrow.toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const phases = sourceProject.phases || [];
    if (phases.length && data) {
      for (let i = 0; i < phases.length; i++) {
        const srcPhase = phases[i];
        const { data: phaseData, error: phaseError } = await supabase
          .from('project_phases')
          .insert({
            project_id: data.id,
            name: srcPhase.name,
            status: 'NOT_STARTED',
            sort_order: srcPhase.sortOrder ?? srcPhase.sort_order ?? i,
            labor_hours: 0,
            labor_rate: srcPhase.laborRate || srcPhase.labor_rate || 0,
          })
          .select()
          .single();

        if (phaseError) throw new Error(phaseError.message);

        const tasks = srcPhase.tasks || [];
        if (tasks.length && phaseData) {
          await supabase.from('phase_tasks').insert(
            tasks.map((t: any, ti: number) => ({
              phase_id: phaseData.id,
              name: t.name,
              done: false,
              sort_order: ti,
            }))
          );
        }

        const materials = srcPhase.materials || [];
        if (materials.length && phaseData) {
          await supabase.from('phase_materials').insert(
            materials.map((m: any) => ({
              phase_id: phaseData.id,
              name: m.name,
              cost: m.cost || 0,
              purchased: false,
            }))
          );
        }
      }
    }

    return { data: camelify(data) };
  },

  // Phase/Task/Material direct mutations
  addPhase: async (projectId: string, phase: { name: string; sortOrder?: number }) => {
    const { data, error } = await supabase
      .from('project_phases')
      .insert({ project_id: projectId, name: phase.name, status: 'NOT_STARTED', sort_order: phase.sortOrder || 0 })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { data: camelify(data) };
  },

  updatePhase: async (phaseId: string, updates: any) => {
    const { data, error } = await supabase
      .from('project_phases')
      .update(snakeify(updates))
      .eq('id', phaseId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { data: camelify(data) };
  },

  addTask: async (phaseId: string, task: { name: string; sortOrder?: number }) => {
    const { data, error } = await supabase
      .from('phase_tasks')
      .insert({ phase_id: phaseId, name: task.name, done: false, sort_order: task.sortOrder || 0 })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { data: camelify(data) };
  },

  updateTask: async (taskId: string, updates: any) => {
    const { data, error } = await supabase
      .from('phase_tasks')
      .update(snakeify(updates))
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { data: camelify(data) };
  },

  deleteTask: async (taskId: string) => {
    const { error } = await supabase
      .from('phase_tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw new Error(error.message);
  },

  addMaterial: async (phaseId: string, material: { name: string; cost?: number }) => {
    const { data, error } = await supabase
      .from('phase_materials')
      .insert({ phase_id: phaseId, name: material.name, cost: material.cost || 0, purchased: false })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { data: camelify(data) };
  },

  updateMaterial: async (materialId: string, updates: any) => {
    const { data, error } = await supabase
      .from('phase_materials')
      .update(snakeify(updates))
      .eq('id', materialId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { data: camelify(data) };
  },

  deleteMaterial: async (materialId: string) => {
    const { error } = await supabase
      .from('phase_materials')
      .delete()
      .eq('id', materialId);

    if (error) throw new Error(error.message);
  },

  // -- Job Photos (read-only on web) -----------------------------------------
  getJobPhotos: async (jobId: string) => {
    const { data, error } = await supabase
      .from('job_photos')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return { data: camelify(data || []) };
  },

  // ── GC System ──────────────────────────────────────────────────────────

  // Organizations
  getOrganization: async () => {
    const userId = await getUserId();
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*, members:org_members(*)')
        .eq('owner_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return { data: data ? camelify(data) : null };
    } catch {
      // Table may not exist yet — GC migration not run
      return { data: null };
    }
  },

  createOrganization: async (orgData: { name: string; type: string }) => {
    const userId = await getUserId();
    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert({ ...orgData, owner_id: userId })
        .select()
        .single();
      if (error) throw new Error(error.message);

      // Auto-add owner as active member
      await supabase.from('org_members').insert({
        org_id: data.id,
        user_id: userId,
        role: 'owner',
        status: 'active',
        invited_by: userId,
        joined_at: new Date().toISOString(),
      });

      return { data: camelify(data) };
    } catch {
      // Table may not exist yet — GC migration not run
      return { data: null };
    }
  },

  // GC Projects
  getGCProjects: async () => {
    try {
      const { data, error } = await supabase
        .from('gc_projects')
        .select('*, trades:gc_project_trades(*, tasks:gc_project_tasks(*))')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return { data: camelify(data || []) };
    } catch {
      // Table may not exist yet — GC migration not run
      return { data: [] };
    }
  },

  getGCProject: async (id: string) => {
    // maybeSingle: GC project detail is deep-linked from subs/invites; row
    // may be deleted or the user's org membership revoked. Clean "not found"
    // beats a Postgrest coerce error.
    const { data, error } = await supabase
      .from('gc_projects')
      .select('*, zones:gc_project_zones(*), trades:gc_project_trades(*, tasks:gc_project_tasks(*)), messages:gc_project_messages(*)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Project not found');
    return { data: camelify(data) };
  },

  createGCProject: async (projectData: any) => {
    const userId = await getUserId();

    // Get or create org. maybeSingle() not single(): first-time GCs have no
    // org row yet, and .single() throws on 0 rows — which made the `if (!org)`
    // fallback below unreachable. That was a silent "cannot create projects
    // until you manually create an org" bug for every new GC signup.
    let { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    if (!org) {
      // Auto-create org for this GC. profile may not exist yet either.
      const { data: settings } = await supabase.from('profiles').select('business_name').eq('id', userId).maybeSingle();
      const { data: newOrg } = await supabase
        .from('organizations')
        .insert({ name: settings?.business_name || 'My Company', owner_id: userId, type: 'gc' })
        .select().single();
      org = newOrg;

      // Add owner as member
      if (org) {
        await supabase.from('org_members').insert({
          org_id: org.id, user_id: userId, role: 'owner', status: 'active',
          invited_by: userId, joined_at: new Date().toISOString(),
        });
      }
    }

    if (!org) throw new Error('Could not create organization');

    const { trades, zones, structureType, sqFootage, bedrooms, bathrooms, stories, ...project } = projectData;
    const { data, error } = await supabase
      .from('gc_projects')
      .insert({
        ...snakeify(project),
        org_id: org.id,
        created_by: userId,
        structure_type: structureType || null,
        sq_footage: sqFootage || null,
        bedrooms: bedrooms || null,
        bathrooms: bathrooms || null,
        stories: stories || null,
      })
      .select().single();
    if (error) throw new Error(error.message);

    // Insert zones (with their trades) if provided
    if (zones?.length && data) {
      for (let zi = 0; zi < zones.length; zi++) {
        const { trades: zoneTrades, ...zoneFields } = zones[zi];
        const { data: zoneData } = await supabase
          .from('gc_project_zones')
          .insert({ gc_project_id: data.id, name: zoneFields.name, zone_type: zoneFields.zoneType || null, sort_order: zi })
          .select().single();

        if (zoneTrades?.length && zoneData) {
          for (let ti = 0; ti < zoneTrades.length; ti++) {
            const { tasks, ...tradeFields } = zoneTrades[ti];
            const { data: tradeData } = await supabase
              .from('gc_project_trades')
              .insert({ ...snakeify(tradeFields), gc_project_id: data.id, zone_id: zoneData.id, sort_order: ti })
              .select().single();

            if (tasks?.length && tradeData) {
              await supabase.from('gc_project_tasks').insert(
                tasks.map((t: any, tki: number) => ({
                  trade_id: tradeData.id, name: t.name, done: false, sort_order: tki,
                }))
              );
            }
          }
        }
      }
    }

    // Insert standalone trades (not in zones)
    if (trades?.length && data) {
      for (let i = 0; i < trades.length; i++) {
        const { tasks, ...tradeFields } = trades[i];
        const { data: tradeData } = await supabase
          .from('gc_project_trades')
          .insert({ ...snakeify(tradeFields), gc_project_id: data.id, sort_order: i })
          .select().single();

        if (tasks?.length && tradeData) {
          await supabase.from('gc_project_tasks').insert(
            tasks.map((t: any, ti: number) => ({
              trade_id: tradeData.id, name: t.name, done: false, sort_order: ti,
            }))
          );
        }
      }
    }

    return { data: camelify(data) };
  },

  updateGCProject: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('gc_projects')
      .update(snakeify(updates))
      .eq('id', id)
      .select().single();
    if (error) throw new Error(error.message);
    return { data: camelify(data) };
  },

  // Upload a cover image for a GC project. Stores at
  // `<org_id>/<project_id>/<timestamp>-<sanitized-filename>` so the storage
  // RLS policy can key auth on the top-level org folder. Returns the public
  // URL and writes it to gc_projects.cover_image_url in a single trip so the
  // UI only needs one mutation.
  uploadProjectCover: async (projectId: string, file: File) => {
    // Pull the project's org_id — we use it as the storage path prefix and
    // the RLS policy expects it to match the uploader's org membership.
    const { data: project, error: pErr } = await supabase
      .from('gc_projects')
      .select('org_id')
      .eq('id', projectId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!project?.org_id) throw new Error('Project or org not found');

    // Keep filenames storage-safe but preserve the extension for MIME
    // sniffing on download.
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${project.org_id}/${projectId}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('project-covers')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || `image/${ext}`,
      });
    if (upErr) throw new Error(upErr.message);

    const { data: pub } = supabase.storage.from('project-covers').getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    // Write the URL back to the project row in the same call — the UI expects
    // a single success/failure boundary per upload.
    const { data: updated, error: updErr } = await supabase
      .from('gc_projects')
      .update({ cover_image_url: publicUrl })
      .eq('id', projectId)
      .select()
      .single();
    if (updErr) throw new Error(updErr.message);

    // Log a cover-update activity so the GC's feed reflects it. Photo uploads
    // were silently invisible before — fixed in the demo→prod parity sweep.
    try {
      await api.logActivity(projectId, 'photo_uploaded', 'Updated project cover photo');
    } catch { /* ignore */ }

    return { data: camelify(updated), url: publicUrl };
  },

  // Remove a project's cover. Nulls the column; we leave the storage object
  // in place since uploads are cheap and deletes add RLS surface area. A
  // periodic cleanup can prune orphans if storage costs bite later.
  clearProjectCover: async (projectId: string) => {
    const { data, error } = await supabase
      .from('gc_projects')
      .update({ cover_image_url: null })
      .eq('id', projectId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { data: camelify(data) };
  },

  deleteGCProject: async (id: string) => {
    const { error } = await supabase.from('gc_projects').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // GC Project Trades
  updateGCTrade: async (tradeId: string, updates: any) => {
    // Capture the previous status so we only fire status-transition activity
    // events on real transitions (not on every save). Avoids the activity feed
    // exploding when a user edits notes or budget on an already-completed trade.
    let previousStatus: string | null = null;
    let projectId: string | null = null;
    let zoneId: string | null = null;
    let tradeName: string | null = null;
    if ('status' in updates) {
      try {
        const { data: prev } = await supabase
          .from('gc_project_trades')
          .select('status, gc_project_id, zone_id, trade')
          .eq('id', tradeId)
          .maybeSingle();
        previousStatus = (prev as any)?.status ?? null;
        projectId = (prev as any)?.gc_project_id ?? null;
        zoneId = (prev as any)?.zone_id ?? null;
        tradeName = (prev as any)?.trade ?? null;
      } catch { /* ignore */ }
    }

    const { data, error } = await supabase
      .from('gc_project_trades')
      .update(snakeify(updates))
      .eq('id', tradeId)
      .select().single();
    if (error) throw new Error(error.message);

    // Activity events on status transitions. Demo seeds these — without them,
    // the live activity feed sits empty in prod for weeks even on active jobs.
    if ('status' in updates && projectId && updates.status !== previousStatus) {
      const newStatus = updates.status;
      const t = tradeName || 'Trade';
      try {
        if (newStatus === 'in_progress') {
          await api.logActivity(projectId, 'trade_started', `${t} kicked off`, { tradeId, zoneId: zoneId || undefined });
        } else if (newStatus === 'complete' || newStatus === 'completed') {
          await api.logActivity(projectId, 'trade_completed', `Completed ${t}`, { tradeId, zoneId: zoneId || undefined });
        } else if (newStatus === 'blocked') {
          await api.logActivity(projectId, 'note_added', `${t} flagged as blocked`, { tradeId, zoneId: zoneId || undefined });
        }
      } catch { /* ignore */ }
    }

    return { data: camelify(data) };
  },

  addGCTrade: async (projectId: string, trade: any) => {
    const { tasks, ...tradeFields } = trade;
    const { data, error } = await supabase
      .from('gc_project_trades')
      .insert({ ...snakeify(tradeFields), gc_project_id: projectId })
      .select().single();
    if (error) throw new Error(error.message);

    if (tasks?.length && data) {
      await supabase.from('gc_project_tasks').insert(
        tasks.map((t: any, i: number) => ({ trade_id: data.id, name: t.name, done: false, sort_order: i }))
      );
    }
    return { data: camelify(data) };
  },

  // GC Tasks
  toggleGCTask: async (taskId: string, done: boolean) => {
    const { error } = await supabase
      .from('gc_project_tasks')
      .update({ done })
      .eq('id', taskId);
    if (error) throw new Error(error.message);

    // Log activity on completion
    if (done) {
      try {
        const { data: task } = await supabase
          .from('gc_project_tasks')
          .select('name, trade:gc_project_trades(id, trade, gc_project_id, zone_id)')
          .eq('id', taskId)
          .single();
        const trade: any = Array.isArray(task?.trade) ? task?.trade[0] : task?.trade;
        if (trade?.gc_project_id) {
          await api.logActivity(
            trade.gc_project_id,
            'task_completed',
            `${trade.trade}: ${task?.name || 'Task'} completed`,
            { tradeId: trade.id, zoneId: trade.zone_id }
          );
        }
      } catch { /* ignore */ }
    }
  },

  addGCTask: async (tradeId: string, name: string) => {
    const { data, error } = await supabase
      .from('gc_project_tasks')
      .insert({ trade_id: tradeId, name, done: false })
      .select().single();
    if (error) throw new Error(error.message);
    return { data };
  },

  deleteGCTask: async (taskId: string) => {
    const { error } = await supabase.from('gc_project_tasks').delete().eq('id', taskId);
    if (error) throw new Error(error.message);
  },

  // GC Trade Materials
  getGCTradeMaterials: async (tradeId: string) => {
    const { data, error } = await supabase
      .from('gc_trade_materials')
      .select('*')
      .eq('trade_id', tradeId)
      .order('sort_order');
    if (error && !error.message.includes('does not exist')) throw new Error(error.message);
    return { data: data || [] };
  },

  addGCTradeMaterial: async (tradeId: string, material: { name: string; quantity: number; unit: string; unit_cost: number; markup_percent?: number }) => {
    const total = material.quantity * material.unit_cost;
    const markup = material.markup_percent || 0;
    const customer_price = total * (1 + markup / 100);
    const { data, error } = await supabase
      .from('gc_trade_materials')
      .insert({ trade_id: tradeId, ...material, total_cost: total, customer_price })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { data };
  },

  updateGCTradeMaterial: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('gc_trade_materials')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { data };
  },

  deleteGCTradeMaterial: async (id: string) => {
    await supabase.from('gc_trade_materials').delete().eq('id', id);
  },

  // ── Zones ──
  getProjectZones: async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('gc_project_zones')
        .select('*')
        .eq('gc_project_id', projectId)
        .order('sort_order');
      if (error) throw new Error(error.message);
      return { data: camelify(data || []) };
    } catch { return { data: [] }; }
  },

  addZone: async (projectId: string, name: string, zoneType?: string) => {
    try {
      const { data, error } = await supabase
        .from('gc_project_zones')
        .insert({ gc_project_id: projectId, name, zone_type: zoneType || null })
        .select().single();
      if (error) throw new Error(error.message);
      return { data: camelify(data) };
    } catch { return { data: null }; }
  },

  updateZone: async (zoneId: string, updates: any) => {
    const { data, error } = await supabase
      .from('gc_project_zones')
      .update(snakeify(updates))
      .eq('id', zoneId)
      .select().single();
    if (error) throw new Error(error.message);
    return { data: camelify(data) };
  },

  deleteZone: async (zoneId: string) => {
    await supabase.from('gc_project_zones').delete().eq('id', zoneId);
  },

  assignTradeToZone: async (tradeId: string, zoneId: string | null) => {
    const { data, error } = await supabase
      .from('gc_project_trades')
      .update({ zone_id: zoneId })
      .eq('id', tradeId)
      .select().single();
    if (error) throw new Error(error.message);
    return { data: camelify(data) };
  },

  // GC Messages
  getGCMessages: async (projectId: string) => {
    const { data, error } = await supabase
      .from('gc_project_messages')
      .select('*, sender:profiles(business_name)')
      .eq('gc_project_id', projectId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return { data: camelify(data || []) };
  },

  sendGCMessage: async (projectId: string, message: string, tradeId?: string) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('gc_project_messages')
      .insert({ gc_project_id: projectId, sender_id: userId, trade_id: tradeId || null, message })
      .select().single();
    if (error) throw new Error(error.message);
    return { data };
  },

  // Invite sub to a trade
  inviteSubToTrade: async (_tradeId: string, email: string) => {
    // Placeholder — real invite flow needs an edge function
    return { data: { invited: true, email } };
  },

  // GC Sub Directory — all unique subs across all GC projects
  getGCSubDirectory: async () => {
    try {
      // Get all GC projects with their trades
      const { data: projects, error } = await supabase
        .from('gc_projects')
        .select('id, name, trades:gc_project_trades(id, trade, assigned_user_id, notes, status)');

      if (error) return { data: [] };

      // Collect unique assigned users (real subs)
      const subMap = new Map<string, { userId: string; trades: string[]; projectCount: number; projects: { id: string; name: string }[]; isPlaceholder?: boolean; phone?: string }>();

      // Also collect placeholder subs from notes
      const placeholderMap = new Map<string, { userId: string; trades: string[]; projectCount: number; projects: { id: string; name: string }[]; isPlaceholder: boolean; phone: string; businessName: string }>();

      for (const project of (projects || [])) {
        for (const trade of (project.trades || [])) {
          const uid = (trade as any).assigned_user_id;
          const notes = (trade as any).notes || '';
          const tradeName = (trade as any).trade;

          if (uid) {
            // Real sub
            const existing = subMap.get(uid) || { userId: uid, trades: [] as string[], projectCount: 0, projects: [] as { id: string; name: string }[] };
            if (!existing.trades.includes(tradeName)) existing.trades.push(tradeName);
            if (!existing.projects.find((p) => p.id === project.id)) {
              existing.projects.push({ id: project.id, name: project.name });
              existing.projectCount++;
            }
            subMap.set(uid, existing);
          } else {
            // Check for placeholder in notes
            const placeholderMatch = notes.match(/^Placeholder:\s*(.+?)(?:\s*\((.+?)\)|$)/);
            const invitedMatch = notes.match(/^Invited:\s*(.+?)(?:\s*\((.+?)\)|$)/);
            let name = '';
            let phone = '';

            if (placeholderMatch) {
              name = placeholderMatch[1].trim();
              phone = placeholderMatch[2]?.trim() || '';
            } else if (invitedMatch) {
              name = invitedMatch[2]?.trim() || invitedMatch[1].trim();
              phone = '';
            }

            if (name) {
              const existing = placeholderMap.get(name) || {
                userId: `placeholder-${encodeURIComponent(name)}`,
                trades: [] as string[],
                projectCount: 0,
                projects: [] as { id: string; name: string }[],
                isPlaceholder: true,
                phone: '',
                businessName: name,
              };
              if (!existing.trades.includes(tradeName)) existing.trades.push(tradeName);
              if (!existing.projects.find((p) => p.id === project.id)) {
                existing.projects.push({ id: project.id, name: project.name });
                existing.projectCount++;
              }
              if (phone && !existing.phone) existing.phone = phone;
              placeholderMap.set(name, existing);
            }
          }
        }
      }

      // Fetch profiles for real subs
      const userIds = Array.from(subMap.keys());
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('id, business_name, phone, trade')
          .in('id', userIds);
        profiles = data || [];
      }

      const realSubs = Array.from(subMap.values()).map(sub => {
        const profile = profiles.find((p: any) => p.id === sub.userId);
        return {
          ...sub,
          businessName: profile?.business_name || 'Unknown',
          phone: profile?.phone || '',
          tradePrimary: profile?.trade || sub.trades[0] || '',
          isPlaceholder: false,
        };
      });

      // Placeholder subs
      const placeholderSubs = Array.from(placeholderMap.values()).map(sub => ({
        ...sub,
        tradePrimary: sub.trades[0] || '',
      }));

      return { data: [...realSubs, ...placeholderSubs] };
    } catch {
      return { data: [] };
    }
  },

  rateTradePerformance: async (data: { tradeId: string; gcProjectId: string; subUserId?: string; timeliness: number; quality: number; communication: number; budgetAdherence: number; overall: number; notes?: string }) => {
    const userId = await getUserId();
    try {
      const { data: result, error } = await supabase
        .from('gc_trade_ratings')
        .insert({ trade_id: data.tradeId, gc_project_id: data.gcProjectId, sub_user_id: data.subUserId || null, rated_by: userId, timeliness: data.timeliness, quality: data.quality, communication: data.communication, budget_adherence: data.budgetAdherence, overall: data.overall, notes: data.notes || null })
        .select().single();
      if (error) throw new Error(error.message);

      // Log a rating event so the activity feed reflects it.
      // We pull the trade name + sub name lazily so the summary reads naturally.
      try {
        const { data: trade } = await supabase
          .from('gc_project_trades')
          .select('trade, zone_id')
          .eq('id', data.tradeId)
          .maybeSingle();
        let subName = 'sub';
        if (data.subUserId) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('business_name, email')
            .eq('id', data.subUserId)
            .maybeSingle();
          subName = (prof as any)?.business_name || (prof as any)?.email?.split('@')[0] || 'sub';
        }
        await api.logActivity(
          data.gcProjectId,
          'rating_added',
          `Rated ${subName} ${data.overall}/5 on ${(trade as any)?.trade || 'trade'}`,
          { tradeId: data.tradeId, zoneId: (trade as any)?.zone_id || undefined, metadata: { overall: data.overall } }
        );
      } catch { /* ignore */ }

      return { data: result };
    } catch { return { data: null }; }
  },

  getSubPerformance: async (subUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('gc_trade_ratings')
        .select('*')
        .eq('sub_user_id', subUserId)
        .order('created_at', { ascending: false });
      if (error) return { data: { ratings: [], score: null, breakdown: null, totalRatings: 0 } };
      const ratings = data || [];
      if (ratings.length === 0) return { data: { ratings: [], score: null, breakdown: null, totalRatings: 0 } };
      const avg = (field: string) => ratings.reduce((s: number, r: any) => s + (r[field] || 0), 0) / ratings.length;
      const q = avg('quality'), t = avg('timeliness'), b = avg('budget_adherence'), c = avg('communication');
      const score = (q * 0.35) + (t * 0.25) + (b * 0.25) + (c * 0.15);
      return { data: { ratings, score: Math.round(score * 10) / 10, breakdown: { quality: Math.round(q * 10) / 10, timeliness: Math.round(t * 10) / 10, budgetAdherence: Math.round(b * 10) / 10, communication: Math.round(c * 10) / 10 }, totalRatings: ratings.length } };
    } catch { return { data: { ratings: [], score: null, breakdown: null, totalRatings: 0 } }; }
  },

  getInvitedProjects: async () => {
    try {
      const userId = await getUserId();
      const { data: assignments } = await supabase
        .from('gc_project_trades')
        .select('gc_project_id')
        .eq('assigned_user_id', userId);
      if (!assignments?.length) return { data: [] };
      const projectIds = [...new Set(assignments.map((a: any) => a.gc_project_id))];
      const { data, error } = await supabase
        .from('gc_projects')
        .select('*, trades:gc_project_trades(*, tasks:gc_project_tasks(*)), messages:gc_project_messages(*)')
        .in('id', projectIds);
      if (error) return { data: [] };

      // Attach org name to each project
      const orgIds = [...new Set((data || []).map((p: any) => p.org_id).filter(Boolean))];
      let orgMap: Record<string, string> = {};
      if (orgIds.length > 0) {
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', orgIds);
        if (orgs) {
          orgMap = Object.fromEntries(orgs.map((o: any) => [o.id, o.name]));
        }
      }
      const enriched = (data || []).map((p: any) => ({
        ...p,
        gc_company_name: orgMap[p.org_id] || null,
      }));

      return { data: camelify(enriched) };
    } catch {
      return { data: [] };
    }
  },

  // ── Team ──
  getTeamMembersWeb: async () => {
    try {
      const userId = await getUserId();
      // Get user's org first. maybeSingle(): new users without an org should
      // see an empty team list, not a thrown Postgrest error. With .single()
      // the `if (!org)` branch was unreachable.
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle();
      if (!org) return { data: [] };

      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('org_id', org.id)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return { data: camelify(data || []) };
    } catch {
      return { data: [] };
    }
  },

  addTeamMember: async (member: { name: string; email?: string; phone?: string; role: string }) => {
    try {
      const userId = await getUserId();
      // maybeSingle: surfaces the "No organization found" message cleanly
      // for users who haven't set up an org yet. .single() would throw
      // "cannot coerce to single JSON object" instead.
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle();
      if (!org) throw new Error('No organization found');

      const { data, error } = await supabase
        .from('team_members')
        .insert({ ...member, org_id: org.id, invited_by: userId, status: 'invited' })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { data: camelify(data) };
    } catch (e: any) {
      throw new Error(e.message || 'Failed to add team member');
    }
  },

  updateTeamMember: async (id: string, updates: any) => {
    try {
      const clean = snakeify(updates);
      const { data, error } = await supabase
        .from('team_members')
        .update(clean)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { data: camelify(data) };
    } catch (e: any) {
      throw new Error(e.message || 'Failed to update');
    }
  },

  removeTeamMember: async (id: string) => {
    await supabase.from('team_members').delete().eq('id', id);
  },

  updateDigestPreferences: async (frequency: string, email?: string) => {
    const userId = await getUserId();
    const updates: any = { digest_frequency: frequency };
    if (email) updates.digest_email = email;
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) throw new Error(error.message);
  },

  // Assign an existing sub to a trade on a project.
  //
  // Uses .maybeSingle() not .single(): if the tradeId is stale (trade was
  // deleted, assignedUserId got claimed by someone else, RLS blocks this
  // user from the row, etc.) the UPDATE returns 0 rows and Postgrest's
  // .single() blows up with "cannot coerce the result to a single JSON
  // object" — an opaque error we've seen surface to subs accepting invites
  // on mobile web. maybeSingle() returns null for that case so we can throw
  // a readable message instead.
  assignSubToTrade: async (tradeId: string, userId: string) => {
    const { data, error } = await supabase
      .from('gc_project_trades')
      .update({ assigned_user_id: userId })
      .eq('id', tradeId)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      throw new Error(
        'This invite is no longer active. The trade may have been reassigned or removed. Ask the GC to send a fresh invite.'
      );
    }

    // Log the sub-acceptance to the project activity feed. This is the moment
    // the GC's project goes from "invited" to "the sub showed up" — the most
    // satisfying event in the GC's day, and the demo has been seeding it
    // forever while prod silently skipped writing it.
    const projectId = (data as any).gc_project_id;
    const tradeName = (data as any).trade;
    if (projectId) {
      try {
        // Pull the sub's business name so the feed reads naturally
        // ("Apex Drywall accepted Drywall") instead of "Someone".
        const { data: prof } = await supabase
          .from('profiles')
          .select('business_name, email')
          .eq('id', userId)
          .maybeSingle();
        const subName = (prof as any)?.business_name || (prof as any)?.email?.split('@')[0] || 'A sub';
        await api.logActivity(
          projectId,
          'sub_accepted',
          `${subName} accepted ${tradeName || 'the invite'}`,
          { tradeId, zoneId: (data as any).zone_id || undefined }
        );
      } catch { /* ignore */ }
    }

    return { data: camelify(data) };
  },
};
