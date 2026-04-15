import { api } from './api';
import { supabase } from './supabase';
import { addDays, subDays, setHours, startOfDay, format } from 'date-fns';

// ---------------------------------------------------------------------------
// Trade-specific templates
// ---------------------------------------------------------------------------

interface LineItemTemplate {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface JobTemplate {
  description: string;
  estimatedDuration: number; // minutes
  lineItems: LineItemTemplate[];
}

interface TradeTemplate {
  jobs: JobTemplate[];
}

const TRADE_TEMPLATES: Record<string, TradeTemplate> = {
  Plumbing: {
    jobs: [
      {
        description: 'Water heater replacement',
        estimatedDuration: 240,
        lineItems: [
          { description: '50-gal gas water heater', quantity: 1, unitPrice: 1100 },
          { description: 'Water heater install labor', quantity: 4, unitPrice: 95 },
          { description: 'Fittings & connectors', quantity: 1, unitPrice: 65 },
        ],
      },
      {
        description: 'Kitchen faucet install',
        estimatedDuration: 90,
        lineItems: [
          { description: 'Kitchen faucet (customer-supplied)', quantity: 0, unitPrice: 0 },
          { description: 'Faucet install labor', quantity: 1.5, unitPrice: 95 },
          { description: 'Supply lines & hardware', quantity: 1, unitPrice: 28 },
        ],
      },
      {
        description: 'Bathroom rough-in — new construction',
        estimatedDuration: 360,
        lineItems: [
          { description: 'Rough-in labor', quantity: 6, unitPrice: 95 },
          { description: 'PEX piping & fittings', quantity: 1, unitPrice: 185 },
          { description: 'Drain assembly', quantity: 1, unitPrice: 75 },
        ],
      },
      {
        description: 'Sewer line camera inspection',
        estimatedDuration: 60,
        lineItems: [
          { description: 'Camera inspection', quantity: 1, unitPrice: 275 },
          { description: 'Service call fee', quantity: 1, unitPrice: 89 },
        ],
      },
      {
        description: 'Garbage disposal replacement',
        estimatedDuration: 75,
        lineItems: [
          { description: '3/4 HP garbage disposal', quantity: 1, unitPrice: 210 },
          { description: 'Disposal install labor', quantity: 1, unitPrice: 95 },
        ],
      },
    ],
  },
  Electrical: {
    jobs: [
      {
        description: 'Panel upgrade 100A to 200A',
        estimatedDuration: 480,
        lineItems: [
          { description: '200A main breaker panel', quantity: 1, unitPrice: 850 },
          { description: 'Panel upgrade labor', quantity: 8, unitPrice: 110 },
          { description: 'Permits & inspection fee', quantity: 1, unitPrice: 150 },
        ],
      },
      {
        description: 'Recessed lighting install — kitchen',
        estimatedDuration: 180,
        lineItems: [
          { description: '6" LED recessed light', quantity: 6, unitPrice: 45 },
          { description: 'Lighting install labor', quantity: 3, unitPrice: 110 },
          { description: 'Dimmer switch', quantity: 1, unitPrice: 38 },
        ],
      },
      {
        description: 'EV charger installation — Level 2',
        estimatedDuration: 240,
        lineItems: [
          { description: 'EV charger install labor', quantity: 4, unitPrice: 110 },
          { description: '40A dedicated circuit & wiring', quantity: 1, unitPrice: 320 },
        ],
      },
      {
        description: 'Whole-house surge protector',
        estimatedDuration: 90,
        lineItems: [
          { description: 'Whole-house surge protector', quantity: 1, unitPrice: 185 },
          { description: 'Install labor', quantity: 1, unitPrice: 110 },
        ],
      },
      {
        description: 'Outdoor landscape lighting',
        estimatedDuration: 300,
        lineItems: [
          { description: 'LED path light', quantity: 8, unitPrice: 32 },
          { description: 'Low-voltage transformer', quantity: 1, unitPrice: 120 },
          { description: 'Wiring & install labor', quantity: 5, unitPrice: 110 },
        ],
      },
    ],
  },
  HVAC: {
    jobs: [
      {
        description: 'AC condenser replacement',
        estimatedDuration: 360,
        lineItems: [
          { description: '3-ton AC condenser unit', quantity: 1, unitPrice: 2800 },
          { description: 'Install labor', quantity: 6, unitPrice: 105 },
          { description: 'Refrigerant charge (R-410A)', quantity: 1, unitPrice: 175 },
        ],
      },
      {
        description: 'Furnace tune-up & safety check',
        estimatedDuration: 90,
        lineItems: [
          { description: 'Annual furnace tune-up', quantity: 1, unitPrice: 149 },
          { description: 'Filter replacement', quantity: 1, unitPrice: 25 },
        ],
      },
      {
        description: 'Ductwork repair — attic',
        estimatedDuration: 240,
        lineItems: [
          { description: 'Duct sealing & repair labor', quantity: 4, unitPrice: 105 },
          { description: 'Insulated flex duct', quantity: 30, unitPrice: 8 },
        ],
      },
      {
        description: 'Smart thermostat installation',
        estimatedDuration: 60,
        lineItems: [
          { description: 'Smart thermostat (Ecobee)', quantity: 1, unitPrice: 220 },
          { description: 'Install & configure', quantity: 1, unitPrice: 95 },
        ],
      },
      {
        description: 'Mini-split install — garage',
        estimatedDuration: 480,
        lineItems: [
          { description: '12K BTU mini-split system', quantity: 1, unitPrice: 1650 },
          { description: 'Install labor', quantity: 8, unitPrice: 105 },
          { description: 'Line set & electrical', quantity: 1, unitPrice: 285 },
        ],
      },
    ],
  },
  'General Contractor': {
    jobs: [
      {
        description: 'Kitchen remodel — demo & framing',
        estimatedDuration: 480,
        lineItems: [
          { description: 'Demo labor', quantity: 8, unitPrice: 75 },
          { description: 'Framing lumber & materials', quantity: 1, unitPrice: 420 },
          { description: 'Dumpster rental', quantity: 1, unitPrice: 375 },
        ],
      },
      {
        description: 'Bathroom tile & finish work',
        estimatedDuration: 600,
        lineItems: [
          { description: 'Tile install labor', quantity: 10, unitPrice: 85 },
          { description: 'Porcelain tile (120 sq ft)', quantity: 120, unitPrice: 6.5 },
          { description: 'Thinset, grout & supplies', quantity: 1, unitPrice: 95 },
        ],
      },
      {
        description: 'Deck build — 12x16 pressure treated',
        estimatedDuration: 1440,
        lineItems: [
          { description: 'PT lumber package', quantity: 1, unitPrice: 1850 },
          { description: 'Build labor', quantity: 24, unitPrice: 75 },
          { description: 'Hardware & fasteners', quantity: 1, unitPrice: 210 },
        ],
      },
      {
        description: 'Drywall repair & paint — water damage',
        estimatedDuration: 240,
        lineItems: [
          { description: 'Drywall repair labor', quantity: 4, unitPrice: 85 },
          { description: 'Drywall sheets & compound', quantity: 1, unitPrice: 65 },
          { description: 'Paint & primer', quantity: 1, unitPrice: 85 },
        ],
      },
      {
        description: 'Fence install — 60 LF cedar',
        estimatedDuration: 480,
        lineItems: [
          { description: 'Cedar fence materials', quantity: 60, unitPrice: 28 },
          { description: 'Install labor', quantity: 8, unitPrice: 75 },
          { description: 'Post concrete & hardware', quantity: 1, unitPrice: 145 },
        ],
      },
    ],
  },
  Roofing: {
    jobs: [
      {
        description: 'Full roof replacement — architectural shingles',
        estimatedDuration: 960,
        lineItems: [
          { description: 'Architectural shingles (30 sq)', quantity: 30, unitPrice: 125 },
          { description: 'Tear-off & install labor', quantity: 16, unitPrice: 85 },
          { description: 'Underlayment & flashing', quantity: 1, unitPrice: 480 },
        ],
      },
      {
        description: 'Roof leak repair — valley flashing',
        estimatedDuration: 180,
        lineItems: [
          { description: 'Leak repair labor', quantity: 3, unitPrice: 95 },
          { description: 'Flashing & sealant', quantity: 1, unitPrice: 65 },
        ],
      },
      {
        description: 'Gutter install — 150 LF seamless aluminum',
        estimatedDuration: 360,
        lineItems: [
          { description: 'Seamless aluminum gutter', quantity: 150, unitPrice: 8 },
          { description: 'Install labor', quantity: 6, unitPrice: 85 },
          { description: 'Downspouts & hangers', quantity: 1, unitPrice: 185 },
        ],
      },
      {
        description: 'Skylight install',
        estimatedDuration: 300,
        lineItems: [
          { description: 'Velux skylight', quantity: 1, unitPrice: 650 },
          { description: 'Install & flashing labor', quantity: 5, unitPrice: 95 },
        ],
      },
      {
        description: 'Roof inspection & maintenance',
        estimatedDuration: 90,
        lineItems: [
          { description: 'Roof inspection', quantity: 1, unitPrice: 195 },
          { description: 'Minor sealant touch-ups', quantity: 1, unitPrice: 45 },
        ],
      },
    ],
  },
  Painting: {
    jobs: [
      {
        description: 'Interior paint — living room & hallway',
        estimatedDuration: 480,
        lineItems: [
          { description: 'Interior paint labor', quantity: 8, unitPrice: 65 },
          { description: 'Premium interior paint (5 gal)', quantity: 2, unitPrice: 185 },
          { description: 'Primer & supplies', quantity: 1, unitPrice: 75 },
        ],
      },
      {
        description: 'Exterior paint — full house',
        estimatedDuration: 1920,
        lineItems: [
          { description: 'Exterior paint labor', quantity: 32, unitPrice: 65 },
          { description: 'Exterior paint (15 gal)', quantity: 3, unitPrice: 210 },
          { description: 'Prep, caulk & primer', quantity: 1, unitPrice: 165 },
        ],
      },
      {
        description: 'Cabinet refinish — kitchen',
        estimatedDuration: 720,
        lineItems: [
          { description: 'Cabinet refinish labor', quantity: 12, unitPrice: 75 },
          { description: 'Cabinet paint & supplies', quantity: 1, unitPrice: 225 },
        ],
      },
      {
        description: 'Deck stain & seal — 200 sq ft',
        estimatedDuration: 300,
        lineItems: [
          { description: 'Deck stain labor', quantity: 5, unitPrice: 65 },
          { description: 'Deck stain (5 gal)', quantity: 1, unitPrice: 155 },
          { description: 'Pressure wash prep', quantity: 1, unitPrice: 125 },
        ],
      },
      {
        description: 'Accent wall & trim paint — master bedroom',
        estimatedDuration: 240,
        lineItems: [
          { description: 'Paint labor', quantity: 4, unitPrice: 65 },
          { description: 'Accent paint (1 gal)', quantity: 1, unitPrice: 65 },
        ],
      },
    ],
  },
  Landscaping: {
    jobs: [
      {
        description: 'Paver patio install — 300 sq ft',
        estimatedDuration: 960,
        lineItems: [
          { description: 'Paver materials', quantity: 300, unitPrice: 8 },
          { description: 'Install labor', quantity: 16, unitPrice: 65 },
          { description: 'Base gravel & sand', quantity: 1, unitPrice: 350 },
        ],
      },
      {
        description: 'Full yard cleanup & mulch',
        estimatedDuration: 360,
        lineItems: [
          { description: 'Cleanup labor', quantity: 6, unitPrice: 55 },
          { description: 'Mulch (8 yards)', quantity: 8, unitPrice: 45 },
        ],
      },
      {
        description: 'Sprinkler system install — front yard',
        estimatedDuration: 480,
        lineItems: [
          { description: 'Sprinkler install labor', quantity: 8, unitPrice: 65 },
          { description: 'Sprinkler heads & pipe', quantity: 1, unitPrice: 320 },
          { description: 'Controller & valves', quantity: 1, unitPrice: 185 },
        ],
      },
      {
        description: 'Retaining wall — 40 LF',
        estimatedDuration: 600,
        lineItems: [
          { description: 'Wall block materials', quantity: 40, unitPrice: 18 },
          { description: 'Build labor', quantity: 10, unitPrice: 65 },
          { description: 'Gravel & drainage', quantity: 1, unitPrice: 195 },
        ],
      },
      {
        description: 'Tree & shrub planting',
        estimatedDuration: 240,
        lineItems: [
          { description: 'Planting labor', quantity: 4, unitPrice: 55 },
          { description: 'Trees & shrubs (5 plants)', quantity: 5, unitPrice: 85 },
        ],
      },
    ],
  },
  Flooring: {
    jobs: [
      {
        description: 'Luxury vinyl plank — living room & kitchen',
        estimatedDuration: 480,
        lineItems: [
          { description: 'LVP flooring (500 sq ft)', quantity: 500, unitPrice: 4.5 },
          { description: 'Install labor', quantity: 8, unitPrice: 75 },
          { description: 'Underlayment & transitions', quantity: 1, unitPrice: 165 },
        ],
      },
      {
        description: 'Hardwood refinish — main level',
        estimatedDuration: 720,
        lineItems: [
          { description: 'Sand & refinish labor', quantity: 12, unitPrice: 75 },
          { description: 'Stain & polyurethane', quantity: 1, unitPrice: 285 },
        ],
      },
      {
        description: 'Tile install — bathroom floor',
        estimatedDuration: 360,
        lineItems: [
          { description: 'Tile install labor', quantity: 6, unitPrice: 85 },
          { description: 'Porcelain tile (80 sq ft)', quantity: 80, unitPrice: 6 },
          { description: 'Thinset, grout & supplies', quantity: 1, unitPrice: 75 },
        ],
      },
      {
        description: 'Carpet install — 3 bedrooms',
        estimatedDuration: 360,
        lineItems: [
          { description: 'Carpet & pad (450 sq ft)', quantity: 450, unitPrice: 5 },
          { description: 'Install labor', quantity: 6, unitPrice: 75 },
        ],
      },
      {
        description: 'Subfloor repair — water damage',
        estimatedDuration: 240,
        lineItems: [
          { description: 'Subfloor repair labor', quantity: 4, unitPrice: 85 },
          { description: 'Plywood & materials', quantity: 1, unitPrice: 120 },
        ],
      },
    ],
  },
  Concrete: {
    jobs: [
      {
        description: 'Driveway pour — 600 sq ft',
        estimatedDuration: 480,
        lineItems: [
          { description: 'Concrete (8 yards)', quantity: 8, unitPrice: 165 },
          { description: 'Pour & finish labor', quantity: 8, unitPrice: 85 },
          { description: 'Rebar & forms', quantity: 1, unitPrice: 380 },
        ],
      },
      {
        description: 'Sidewalk replacement — 80 LF',
        estimatedDuration: 360,
        lineItems: [
          { description: 'Demo & haul-off', quantity: 1, unitPrice: 450 },
          { description: 'Concrete (4 yards)', quantity: 4, unitPrice: 165 },
          { description: 'Form & pour labor', quantity: 6, unitPrice: 85 },
        ],
      },
      {
        description: 'Stamped patio — 200 sq ft',
        estimatedDuration: 600,
        lineItems: [
          { description: 'Concrete (5 yards)', quantity: 5, unitPrice: 165 },
          { description: 'Stamp & color labor', quantity: 10, unitPrice: 95 },
          { description: 'Stamp mats & release agent', quantity: 1, unitPrice: 220 },
        ],
      },
      {
        description: 'Foundation crack repair',
        estimatedDuration: 180,
        lineItems: [
          { description: 'Crack injection labor', quantity: 3, unitPrice: 95 },
          { description: 'Epoxy injection materials', quantity: 1, unitPrice: 145 },
        ],
      },
      {
        description: 'Garage floor epoxy coating',
        estimatedDuration: 360,
        lineItems: [
          { description: 'Floor prep & grind labor', quantity: 3, unitPrice: 85 },
          { description: 'Epoxy coating kit', quantity: 1, unitPrice: 395 },
          { description: 'Application labor', quantity: 3, unitPrice: 85 },
        ],
      },
    ],
  },
};

// Generic fallback for trades not in the templates
const GENERIC_TEMPLATE: TradeTemplate = {
  jobs: [
    {
      description: 'Service call — diagnostic & repair',
      estimatedDuration: 120,
      lineItems: [
        { description: 'Service call fee', quantity: 1, unitPrice: 89 },
        { description: 'Repair labor', quantity: 2, unitPrice: 85 },
      ],
    },
    {
      description: 'Equipment installation',
      estimatedDuration: 240,
      lineItems: [
        { description: 'Equipment', quantity: 1, unitPrice: 450 },
        { description: 'Install labor', quantity: 4, unitPrice: 85 },
      ],
    },
    {
      description: 'Preventive maintenance visit',
      estimatedDuration: 90,
      lineItems: [
        { description: 'Maintenance labor', quantity: 1.5, unitPrice: 85 },
        { description: 'Parts & supplies', quantity: 1, unitPrice: 45 },
      ],
    },
    {
      description: 'Full project — Phase 1',
      estimatedDuration: 480,
      lineItems: [
        { description: 'Materials', quantity: 1, unitPrice: 650 },
        { description: 'Labor', quantity: 8, unitPrice: 85 },
        { description: 'Disposal & cleanup', quantity: 1, unitPrice: 125 },
      ],
    },
    {
      description: 'Consultation & estimate',
      estimatedDuration: 60,
      lineItems: [
        { description: 'On-site consultation', quantity: 1, unitPrice: 0 },
        { description: 'Written estimate preparation', quantity: 1, unitPrice: 75 },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Demo customer data
// ---------------------------------------------------------------------------

const DEMO_CUSTOMERS = [
  {
    firstName: 'Sarah',
    lastName: 'Mitchell',
    phone: '(555) 234-5678',
    email: 'sarah.mitchell@email.com',
    property: { street: '142 Oak Lane', city: 'Austin', state: 'TX', zip: '78701' },
  },
  {
    firstName: 'Tom',
    lastName: 'Rodriguez',
    phone: '(555) 876-5432',
    email: 'tom.rodriguez@email.com',
    property: { street: '2281 Maple Dr', city: 'Denver', state: 'CO', zip: '80202' },
  },
  {
    firstName: 'Karen & Dave',
    lastName: 'Chen',
    phone: '(555) 345-6789',
    email: 'chen.family@email.com',
    property: { street: '509 Birch Court', city: 'Nashville', state: 'TN', zip: '37201' },
  },
];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function computeLineItemTotal(items: LineItemTemplate[]): number {
  return items.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function generateSeedData(trade: string): Promise<void> {
  try {
    const template = TRADE_TEMPLATES[trade] ?? GENERIC_TEMPLATE;
    const today = startOfDay(new Date());

    // Pick 5 jobs from template
    const jobTemplates = template.jobs.slice(0, 5);

    // ---- 1. Create customers ------------------------------------------------
    const customerIds: string[] = [];
    const propertyIds: string[] = [];

    for (const cust of DEMO_CUSTOMERS) {
      const { data } = await api.createCustomer({
        first_name: cust.firstName,
        last_name: cust.lastName,
        phone: cust.phone,
        email: cust.email,
        notes: 'Sample data — feel free to delete',
        property: cust.property,
      });

      const customerId = data.id;
      customerIds.push(customerId);

      // Fetch the property that was created alongside the customer
      const { data: propData } = await supabase
        .from('properties')
        .select('id')
        .eq('customer_id', customerId)
        .single();

      propertyIds.push(propData?.id);
    }

    // ---- 2. Create jobs -----------------------------------------------------
    // Schedule:
    //   Job 0 — COMPLETED, 3 days ago
    //   Job 1 — COMPLETED, 1 day ago
    //   Job 2 — IN_PROGRESS, today
    //   Job 3 — SCHEDULED, 2 days from now
    //   Job 4 — SCHEDULED, 5 days from now

    const jobSchedules: { status: string; dateOffset: number; priority: string }[] = [
      { status: 'COMPLETED', dateOffset: -3, priority: 'NORMAL' },
      { status: 'COMPLETED', dateOffset: -1, priority: 'NORMAL' },
      { status: 'IN_PROGRESS', dateOffset: 0, priority: 'HIGH' },
      { status: 'SCHEDULED', dateOffset: 2, priority: 'NORMAL' },
      { status: 'SCHEDULED', dateOffset: 5, priority: 'NORMAL' },
    ];

    // Spread jobs across customers: 0->cust0, 1->cust1, 2->cust2, 3->cust0, 4->cust1
    const customerAssignment = [0, 1, 2, 0, 1];

    const createdJobIds: string[] = [];

    for (let i = 0; i < 5; i++) {
      const jt = jobTemplates[i];
      const sched = jobSchedules[i];
      const custIdx = customerAssignment[i];

      const scheduledStart = setHours(addDays(today, sched.dateOffset), 9);
      const durationMs = jt.estimatedDuration * 60 * 1000;
      const scheduledEnd = new Date(scheduledStart.getTime() + durationMs);

      const { data: jobData } = await api.createJob({
        customerId: customerIds[custIdx],
        propertyId: propertyIds[custIdx],
        description: jt.description,
        status: sched.status,
        priority: sched.priority,
        scheduledStart: format(scheduledStart, "yyyy-MM-dd'T'HH:mm:ss"),
        scheduledEnd: format(scheduledEnd, "yyyy-MM-dd'T'HH:mm:ss"),
        estimatedDuration: jt.estimatedDuration,
        notes: 'Sample data — feel free to delete',
      });

      const jobId = jobData.id;
      createdJobIds.push(jobId);

      // Save line items for this job
      await api.saveJobLineItems(jobId, jt.lineItems);
    }

    // ---- 3. Create invoices -------------------------------------------------
    const TAX_RATE = 0.08;

    // Invoice 1 — paid, linked to completed job 0
    const paidLineItems = jobTemplates[0].lineItems;
    const paidSubtotal = computeLineItemTotal(paidLineItems);
    const paidTax = Math.round(paidSubtotal * TAX_RATE * 100) / 100;
    const paidTotal = Math.round((paidSubtotal + paidTax) * 100) / 100;
    const paidDate = subDays(today, 2);

    await api.createInvoice({
      customerId: customerIds[customerAssignment[0]],
      jobId: createdJobIds[0],
      status: 'paid',
      subtotal: paidSubtotal,
      taxRate: TAX_RATE,
      tax: paidTax,
      total: paidTotal,
      dueDate: format(paidDate, 'yyyy-MM-dd'),
      paidAt: format(paidDate, "yyyy-MM-dd'T'HH:mm:ss"),
      notes: 'Sample data — feel free to delete',
      lineItems: paidLineItems,
    });

    // Invoice 2 — sent/outstanding, linked to completed job 1
    const sentLineItems = jobTemplates[1].lineItems;
    const sentSubtotal = computeLineItemTotal(sentLineItems);
    const sentTax = Math.round(sentSubtotal * TAX_RATE * 100) / 100;
    const sentTotal = Math.round((sentSubtotal + sentTax) * 100) / 100;
    const dueDate = addDays(today, 14);

    await api.createInvoice({
      customerId: customerIds[customerAssignment[1]],
      jobId: createdJobIds[1],
      status: 'sent',
      subtotal: sentSubtotal,
      taxRate: TAX_RATE,
      tax: sentTax,
      total: sentTotal,
      dueDate: format(dueDate, 'yyyy-MM-dd'),
      notes: 'Sample data — feel free to delete',
      lineItems: sentLineItems,
    });
  } catch (err) {
    console.warn('[FlowBoss] Seed data generation failed — user can still proceed:', err);
  }
}
