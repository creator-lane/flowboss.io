/**
 * Demo Data Generator — creates realistic historical data for FlowBoss
 * 3 GC projects + 12 months of jobs, invoices, expenses, customers
 */
import { api } from './api';

/* ═══════════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════════ */

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function dateStr(daysBack: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().split('T')[0];
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ═══════════════════════════════════════════════════════════════════════════
   GC Project #2 — $2M Commercial Build
   ═══════════════════════════════════════════════════════════════════════════ */

export const DEMO_PROJECT_2M = {
  name: 'Lakewood Commons — Mixed-Use Build',
  customerName: 'Lakewood Development Group',
  address: '1800 Lakewood Blvd',
  city: 'Dallas',
  state: 'TX',
  zip: '75214',
  structureType: 'commercial',
  sqFootage: 22000,
  stories: 3,
  budget: 2150000,
  startDate: '2025-09-01',
  targetEndDate: '2026-12-31',
  status: 'active',
  zones: [
    {
      name: 'Ground Floor Retail',
      zoneType: 'commercial',
      trades: [
        { trade: 'Concrete', laborHours: 200, laborRate: 75, materialsBudget: 85000, status: 'completed', notes: 'Placeholder: Texas Concrete Co',
          tasks: [
            { name: 'Foundation pour — section A', done: true },
            { name: 'Foundation pour — section B', done: true },
            { name: 'Slab on grade — retail', done: true },
            { name: 'Polished concrete floors', done: true },
            { name: 'Loading dock pad', done: true },
          ]},
        { trade: 'Framing', laborHours: 280, laborRate: 80, materialsBudget: 95000, status: 'completed', notes: 'Placeholder: ABC Framing',
          tasks: [
            { name: 'Steel beam installation', done: true },
            { name: 'Frame storefront walls', done: true },
            { name: 'Frame interior tenant partitions', done: true },
            { name: 'Install metal studs', done: true },
            { name: 'Fire-rated assemblies', done: true },
            { name: 'Structural inspection', done: true },
          ]},
        { trade: 'Electrical', laborHours: 160, laborRate: 120, materialsBudget: 65000, status: 'in_progress', notes: 'Placeholder: Sparks Electric (512-555-0202)',
          tasks: [
            { name: '800A main service', done: true },
            { name: 'Tenant meter bank (6)', done: true },
            { name: 'Emergency lighting', done: true },
            { name: 'Fire alarm system', done: true },
            { name: 'Retail lighting rough-in', done: false },
            { name: 'Signage circuits', done: false },
          ]},
        { trade: 'Plumbing', laborHours: 120, laborRate: 115, materialsBudget: 45000, status: 'in_progress', notes: 'Placeholder: Mike\'s Plumbing (512-555-0101)',
          tasks: [
            { name: 'Underground rough-in', done: true },
            { name: 'Water main tap', done: true },
            { name: 'Sanitary sewer connection', done: true },
            { name: 'Restroom rough-in (4 sets)', done: false },
            { name: 'Grease trap install', done: false },
          ]},
        { trade: 'HVAC', laborHours: 200, laborRate: 115, materialsBudget: 120000, status: 'not_started', notes: 'Placeholder: CoolAir HVAC',
          tasks: [
            { name: 'Rooftop unit placement (6)', done: false },
            { name: 'Ductwork — ground floor', done: false },
            { name: 'VAV boxes and controls', done: false },
            { name: 'Kitchen exhaust system', done: false },
            { name: 'BAS integration', done: false },
          ]},
      ],
    },
    {
      name: '2nd Floor Office',
      zoneType: 'commercial',
      trades: [
        { trade: 'Framing', laborHours: 160, laborRate: 80, materialsBudget: 55000, status: 'in_progress', notes: 'Placeholder: ABC Framing',
          tasks: [
            { name: 'Metal stud partitions', done: true },
            { name: 'Conference room framing', done: true },
            { name: 'Server room enclosure', done: false },
            { name: 'Break room build-out', done: false },
          ]},
        { trade: 'Electrical', laborHours: 120, laborRate: 120, materialsBudget: 55000, status: 'not_started', notes: 'Placeholder: Sparks Electric',
          tasks: [
            { name: 'Office power distribution', done: false },
            { name: 'Data/voice cabling (Cat6A)', done: false },
            { name: 'Server room power (dedicated)', done: false },
            { name: 'LED office lighting', done: false },
          ]},
        { trade: 'Drywall', laborHours: 200, laborRate: 60, materialsBudget: 18000, status: 'not_started', notes: 'Placeholder: DFW Drywall',
          tasks: [
            { name: 'Hang and finish — offices', done: false },
            { name: 'Hang and finish — common areas', done: false },
            { name: 'Acoustic ceiling grid', done: false },
          ]},
      ],
    },
    {
      name: '3rd Floor Residential',
      zoneType: 'residential',
      trades: [
        { trade: 'Framing', laborHours: 200, laborRate: 80, materialsBudget: 70000, status: 'completed', notes: 'Placeholder: ABC Framing',
          tasks: [
            { name: 'Frame 8 unit partitions', done: true },
            { name: 'Frame kitchenettes (8)', done: true },
            { name: 'Frame bathrooms (8)', done: true },
            { name: 'Fire separation walls', done: true },
          ]},
        { trade: 'Plumbing', laborHours: 160, laborRate: 115, materialsBudget: 60000, status: 'in_progress', notes: 'Placeholder: Mike\'s Plumbing',
          tasks: [
            { name: 'Stack risers (8 units)', done: true },
            { name: 'Unit rough-in — plumbing', done: true },
            { name: 'Install fixtures — units 1-4', done: true },
            { name: 'Install fixtures — units 5-8', done: false },
            { name: 'Water heaters (tankless x8)', done: false },
          ]},
        { trade: 'Electrical', laborHours: 140, laborRate: 120, materialsBudget: 48000, status: 'not_started', notes: 'Placeholder: Sparks Electric',
          tasks: [
            { name: 'Unit panel installation (8)', done: false },
            { name: 'Kitchen circuits', done: false },
            { name: 'Bathroom circuits', done: false },
            { name: 'Smoke/CO detectors', done: false },
            { name: 'Common area lighting', done: false },
          ]},
        { trade: 'Flooring', laborHours: 120, laborRate: 70, materialsBudget: 55000, status: 'not_started', notes: 'Placeholder: Premier Floors',
          tasks: [
            { name: 'LVP — all units', done: false },
            { name: 'Tile — bathrooms (8)', done: false },
            { name: 'Common hallway carpet', done: false },
          ]},
      ],
    },
    {
      name: 'Exterior / Site',
      zoneType: 'exterior',
      trades: [
        { trade: 'Concrete', laborHours: 160, laborRate: 75, materialsBudget: 90000, status: 'completed', notes: 'Placeholder: Texas Concrete Co',
          tasks: [
            { name: 'Parking lot — grade and pour', done: true },
            { name: 'Sidewalks and ADA ramps', done: true },
            { name: 'Dumpster pad', done: true },
            { name: 'Striping and signage', done: true },
          ]},
        { trade: 'Roofing', laborHours: 120, laborRate: 85, materialsBudget: 75000, status: 'in_progress', notes: 'Placeholder: Summit Roofing',
          tasks: [
            { name: 'TPO membrane — flat sections', done: true },
            { name: 'Standing seam — decorative slope', done: true },
            { name: 'Parapet flashing', done: false },
            { name: 'Final inspection', done: false },
          ]},
        { trade: 'Landscaping', laborHours: 80, laborRate: 55, materialsBudget: 35000, status: 'not_started', notes: 'Placeholder: Green Valley Landscape',
          tasks: [
            { name: 'Irrigation system', done: false },
            { name: 'Parking lot trees (12)', done: false },
            { name: 'Front entrance landscaping', done: false },
            { name: 'Outdoor seating area', done: false },
          ]},
      ],
    },
  ],
};

export const DEMO_PROJECT_2M_MESSAGES = [
  { message: 'Concrete team finished parking lot ahead of schedule. Looks great.' },
  { message: 'Steel beams are up for ground floor. Structural engineer signed off today.' },
  { message: 'Heads up: Permit delay on 3rd floor electrical — inspector rescheduled to next week.' },
  { message: 'Roofing TPO membrane is down. Standing seam crew starts Monday.' },
  { message: 'Mike\'s Plumbing finished underground rough-in. Passed city inspection.' },
  { message: 'ABC Framing wrapping up 2nd floor office partitions this week.' },
  { message: 'Budget check: We\'re tracking 3% under budget. Keep it up team.' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   GC Project #3 — $310K Kitchen + Bath Remodel
   ═══════════════════════════════════════════════════════════════════════════ */

export const DEMO_PROJECT_300K = {
  name: 'Garcia Residence — Kitchen & Bath Remodel',
  customerName: 'Maria & Carlos Garcia',
  address: '782 Pecan Valley Dr',
  city: 'San Antonio',
  state: 'TX',
  zip: '78258',
  structureType: 'house',
  sqFootage: 2800,
  bedrooms: 4,
  bathrooms: 3,
  stories: 1,
  budget: 310000,
  startDate: '2026-02-10',
  targetEndDate: '2026-06-30',
  status: 'active',
  zones: [
    {
      name: 'Kitchen',
      zoneType: 'kitchen',
      trades: [
        { trade: 'Plumbing', laborHours: 32, laborRate: 100, materialsBudget: 8000, status: 'completed', notes: 'Placeholder: Alamo Plumbing (210-555-3300)',
          tasks: [
            { name: 'Demo existing plumbing', done: true },
            { name: 'Relocate island sink', done: true },
            { name: 'Install pot filler', done: true },
            { name: 'Connect dishwasher', done: true },
            { name: 'Gas line for range', done: true },
          ]},
        { trade: 'Electrical', laborHours: 40, laborRate: 105, materialsBudget: 9000, status: 'completed', notes: 'Placeholder: Sparks Electric',
          tasks: [
            { name: 'Dedicated appliance circuits (6)', done: true },
            { name: 'Recessed lighting (18)', done: true },
            { name: 'Island pendant wiring (3)', done: true },
            { name: 'Under-cabinet lighting', done: true },
          ]},
        { trade: 'Flooring', laborHours: 24, laborRate: 70, materialsBudget: 12000, status: 'in_progress', notes: 'Placeholder: Premier Floors',
          tasks: [
            { name: 'Remove existing tile', done: true },
            { name: 'Level subfloor', done: true },
            { name: 'Install large-format porcelain', done: false },
            { name: 'Grout and seal', done: false },
          ]},
        { trade: 'Painting', laborHours: 16, laborRate: 60, materialsBudget: 1500, status: 'not_started',
          tasks: [
            { name: 'Walls and ceiling', done: false },
            { name: 'Trim and molding', done: false },
          ]},
      ],
    },
    {
      name: 'Master Bathroom',
      zoneType: 'bathroom',
      trades: [
        { trade: 'Plumbing', laborHours: 36, laborRate: 100, materialsBudget: 12000, status: 'in_progress', notes: 'Placeholder: Alamo Plumbing (210-555-3300)',
          tasks: [
            { name: 'Demo and rough-in', done: true },
            { name: 'Install freestanding tub', done: true },
            { name: 'Install frameless shower', done: true },
            { name: 'Double vanity connections', done: false },
            { name: 'Final hookups', done: false },
          ]},
        { trade: 'Tiling', laborHours: 60, laborRate: 70, materialsBudget: 18000, status: 'in_progress', notes: 'Placeholder: Artisan Tile Co',
          tasks: [
            { name: 'Shower walls — herringbone', done: true },
            { name: 'Shower floor — pebble', done: true },
            { name: 'Bathroom floor — marble look', done: false },
            { name: 'Accent wall behind tub', done: false },
            { name: 'Grout and seal', done: false },
          ]},
        { trade: 'Electrical', laborHours: 12, laborRate: 105, materialsBudget: 2500, status: 'completed', notes: 'Placeholder: Sparks Electric',
          tasks: [
            { name: 'GFCI outlets', done: true },
            { name: 'LED mirror wiring', done: true },
            { name: 'Heated floor thermostat', done: true },
          ]},
      ],
    },
    {
      name: 'Guest Bathroom',
      zoneType: 'bathroom',
      trades: [
        { trade: 'Plumbing', laborHours: 20, laborRate: 100, materialsBudget: 5000, status: 'completed', notes: 'Placeholder: Alamo Plumbing',
          tasks: [
            { name: 'Rough-in', done: true },
            { name: 'Install fixtures', done: true },
          ]},
        { trade: 'Tiling', laborHours: 24, laborRate: 70, materialsBudget: 4500, status: 'completed', notes: 'Placeholder: Artisan Tile Co',
          tasks: [
            { name: 'Floor tile', done: true },
            { name: 'Shower tile', done: true },
            { name: 'Grout and seal', done: true },
          ]},
        { trade: 'Painting', laborHours: 8, laborRate: 60, materialsBudget: 400, status: 'completed',
          tasks: [
            { name: 'Walls and trim', done: true },
          ]},
      ],
    },
    {
      name: 'Exterior',
      zoneType: 'exterior',
      trades: [
        { trade: 'Painting', laborHours: 48, laborRate: 55, materialsBudget: 6000, status: 'not_started', notes: 'Placeholder: Pro Paint SA',
          tasks: [
            { name: 'Power wash exterior', done: false },
            { name: 'Scrape and prep', done: false },
            { name: 'Prime bare spots', done: false },
            { name: 'Two coats exterior paint', done: false },
            { name: 'Paint trim and shutters', done: false },
          ]},
        { trade: 'Landscaping', laborHours: 24, laborRate: 50, materialsBudget: 5000, status: 'not_started', notes: 'Placeholder: Green Valley Landscape',
          tasks: [
            { name: 'Refresh front beds', done: false },
            { name: 'Install pavers — back patio', done: false },
            { name: 'New sod — side yard', done: false },
          ]},
      ],
    },
  ],
};

export const DEMO_PROJECT_300K_MESSAGES = [
  { message: 'Kitchen plumbing is 100% done. Island sink relocated perfectly.' },
  { message: 'Guest bathroom is fully complete! First zone signed off.' },
  { message: 'Artisan Tile doing beautiful work on the master shower. Herringbone pattern looking sharp.' },
  { message: 'Flooring crew starts kitchen porcelain tomorrow morning.' },
  { message: 'Reminder: exterior paint is weather-dependent. Targeting late May start.' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Historical Business Data — Customers, Jobs, Invoices, Expenses
   12+ months of realistic plumbing/HVAC/electrical business data
   ═══════════════════════════════════════════════════════════════════════════ */

const CUSTOMER_DATA = [
  { first_name: 'James', last_name: 'Mitchell', phone: '512-555-1001', email: 'jmitchell@gmail.com' },
  { first_name: 'Sarah', last_name: 'Chen', phone: '512-555-1002', email: 'sarah.chen@yahoo.com' },
  { first_name: 'Robert', last_name: 'Williams', phone: '512-555-1003', email: 'rwilliams@outlook.com' },
  { first_name: 'Emily', last_name: 'Rodriguez', phone: '512-555-1004', email: 'emily.r@gmail.com' },
  { first_name: 'Michael', last_name: 'Thompson', phone: '512-555-1005', email: 'mthompson@gmail.com' },
  { first_name: 'Jessica', last_name: 'Davis', phone: '512-555-1006', email: 'jdavis22@yahoo.com' },
  { first_name: 'David', last_name: 'Martinez', phone: '512-555-1007', email: 'dmartinez@gmail.com' },
  { first_name: 'Amanda', last_name: 'Johnson', phone: '512-555-1008', email: 'amanda.j@outlook.com' },
  { first_name: 'Christopher', last_name: 'Brown', phone: '512-555-1009', email: 'cbrown@gmail.com' },
  { first_name: 'Ashley', last_name: 'Wilson', phone: '512-555-1010', email: 'awilson@yahoo.com' },
  { first_name: 'Daniel', last_name: 'Anderson', phone: '512-555-1011', email: 'danderson@gmail.com' },
  { first_name: 'Lauren', last_name: 'Taylor', phone: '512-555-1012', email: 'ltaylor@outlook.com' },
  { first_name: 'Matthew', last_name: 'Thomas', phone: '512-555-1013', email: 'mthomas@gmail.com' },
  { first_name: 'Stephanie', last_name: 'Jackson', phone: '512-555-1014', email: 'sjackson@yahoo.com' },
  { first_name: 'Andrew', last_name: 'White', phone: '512-555-1015', email: 'awhite@gmail.com' },
  { first_name: 'Nicole', last_name: 'Harris', phone: '512-555-1016', email: 'nharris@outlook.com' },
  { first_name: 'Joshua', last_name: 'Clark', phone: '512-555-1017', email: 'jclark@gmail.com' },
  { first_name: 'Rachel', last_name: 'Lewis', phone: '512-555-1018', email: 'rlewis@yahoo.com' },
  { first_name: 'Kevin', last_name: 'Robinson', phone: '512-555-1019', email: 'krobinson@gmail.com' },
  { first_name: 'Megan', last_name: 'Walker', phone: '512-555-1020', email: 'mwalker@outlook.com' },
  { first_name: 'Brian', last_name: 'Young', phone: '512-555-1021', email: 'byoung@gmail.com' },
  { first_name: 'Jennifer', last_name: 'King', phone: '512-555-1022', email: 'jking@yahoo.com' },
  { first_name: 'Ryan', last_name: 'Scott', phone: '512-555-1023', email: 'rscott@gmail.com' },
  { first_name: 'Heather', last_name: 'Green', phone: '512-555-1024', email: 'hgreen@outlook.com' },
  { first_name: 'Justin', last_name: 'Baker', phone: '512-555-1025', email: 'jbaker@gmail.com' },
  { first_name: 'Amber', last_name: 'Adams', phone: '512-555-1026', email: 'aadams@yahoo.com' },
  { first_name: 'Brandon', last_name: 'Nelson', phone: '512-555-1027', email: 'bnelson@gmail.com' },
  { first_name: 'Tiffany', last_name: 'Hill', phone: '512-555-1028', email: 'thill@outlook.com' },
  { first_name: 'Tyler', last_name: 'Ramirez', phone: '512-555-1029', email: 'tramirez@gmail.com' },
  { first_name: 'Samantha', last_name: 'Campbell', phone: '512-555-1030', email: 'scampbell@yahoo.com' },
];

// Realistic job templates with line items
const JOB_TEMPLATES = [
  { desc: 'Water heater replacement — 50 gal', items: [{ description: 'Water heater — 50 gal gas', quantity: 1, unit_price: 1200 }, { description: 'Installation labor', quantity: 4, unit_price: 125 }, { description: 'Parts and fittings', quantity: 1, unit_price: 185 }], dur: 4 },
  { desc: 'Tankless water heater install', items: [{ description: 'Rinnai RU199iN tankless unit', quantity: 1, unit_price: 2100 }, { description: 'Installation labor', quantity: 6, unit_price: 125 }, { description: 'Gas line modification', quantity: 1, unit_price: 350 }, { description: 'Venting kit', quantity: 1, unit_price: 275 }], dur: 6 },
  { desc: 'Whole-house repipe — copper to PEX', items: [{ description: 'PEX tubing and fittings', quantity: 1, unit_price: 2800 }, { description: 'Labor — repipe', quantity: 16, unit_price: 125 }, { description: 'Manifold system', quantity: 1, unit_price: 450 }, { description: 'Wall patching', quantity: 1, unit_price: 600 }], dur: 16 },
  { desc: 'Sewer line repair', items: [{ description: 'Excavation', quantity: 1, unit_price: 800 }, { description: 'PVC pipe and fittings', quantity: 1, unit_price: 350 }, { description: 'Labor', quantity: 8, unit_price: 125 }, { description: 'Backfill and compact', quantity: 1, unit_price: 400 }], dur: 8 },
  { desc: 'AC system replacement — 3.5 ton', items: [{ description: 'Carrier 3.5 ton condenser', quantity: 1, unit_price: 3200 }, { description: 'Evaporator coil', quantity: 1, unit_price: 1100 }, { description: 'Installation labor', quantity: 8, unit_price: 135 }, { description: 'Refrigerant charge', quantity: 1, unit_price: 350 }, { description: 'Thermostat', quantity: 1, unit_price: 275 }], dur: 8 },
  { desc: 'Furnace replacement', items: [{ description: 'Lennox 80K BTU furnace', quantity: 1, unit_price: 2400 }, { description: 'Installation labor', quantity: 6, unit_price: 135 }, { description: 'Ductwork modification', quantity: 1, unit_price: 450 }], dur: 6 },
  { desc: 'Ductwork cleaning and seal', items: [{ description: 'Duct cleaning — whole house', quantity: 1, unit_price: 450 }, { description: 'Duct sealing — Aeroseal', quantity: 1, unit_price: 1200 }, { description: 'Filter replacement', quantity: 1, unit_price: 85 }], dur: 5 },
  { desc: 'Main panel upgrade — 200A', items: [{ description: '200A panel and breakers', quantity: 1, unit_price: 1800 }, { description: 'Labor — panel swap', quantity: 8, unit_price: 130 }, { description: 'Permit and inspection', quantity: 1, unit_price: 350 }, { description: 'Grounding upgrade', quantity: 1, unit_price: 275 }], dur: 8 },
  { desc: 'EV charger installation — Level 2', items: [{ description: 'ChargePoint Level 2 charger', quantity: 1, unit_price: 750 }, { description: '60A circuit installation', quantity: 1, unit_price: 650 }, { description: 'Conduit and wire', quantity: 1, unit_price: 320 }, { description: 'Labor', quantity: 4, unit_price: 130 }], dur: 4 },
  { desc: 'Kitchen remodel — electrical rough-in', items: [{ description: 'Dedicated circuits (6)', quantity: 6, unit_price: 225 }, { description: 'Recessed lights (12)', quantity: 12, unit_price: 85 }, { description: 'Under-cabinet LED', quantity: 1, unit_price: 450 }, { description: 'Code inspection', quantity: 1, unit_price: 150 }], dur: 10 },
  { desc: 'Bathroom remodel — plumbing', items: [{ description: 'Demo and rough-in', quantity: 8, unit_price: 125 }, { description: 'Fixtures — toilet, vanity, tub', quantity: 1, unit_price: 2200 }, { description: 'Supply lines', quantity: 1, unit_price: 280 }, { description: 'Drain lines', quantity: 1, unit_price: 350 }], dur: 10 },
  { desc: 'Gas leak detection and repair', items: [{ description: 'Leak detection service', quantity: 1, unit_price: 200 }, { description: 'Gas line repair', quantity: 3, unit_price: 125 }, { description: 'Pressure test', quantity: 1, unit_price: 150 }], dur: 3 },
  { desc: 'Ceiling fan installation (3)', items: [{ description: 'Fan installation', quantity: 3, unit_price: 175 }, { description: 'Electrical boxes upgrade', quantity: 3, unit_price: 65 }], dur: 3 },
  { desc: 'Garbage disposal replacement', items: [{ description: 'InSinkErator 3/4 HP', quantity: 1, unit_price: 285 }, { description: 'Installation labor', quantity: 1.5, unit_price: 125 }], dur: 1.5 },
  { desc: 'Outdoor lighting installation', items: [{ description: 'Path lights (8)', quantity: 8, unit_price: 75 }, { description: 'Landscape spots (4)', quantity: 4, unit_price: 95 }, { description: 'Transformer', quantity: 1, unit_price: 200 }, { description: 'Wiring and labor', quantity: 6, unit_price: 125 }], dur: 6 },
  { desc: 'Sump pump installation', items: [{ description: 'Sump pump — 1/2 HP', quantity: 1, unit_price: 450 }, { description: 'Basin and check valve', quantity: 1, unit_price: 200 }, { description: 'Discharge line', quantity: 1, unit_price: 175 }, { description: 'Labor', quantity: 4, unit_price: 125 }], dur: 4 },
  { desc: 'Mini-split AC install — bedroom', items: [{ description: 'Mitsubishi 12K BTU mini-split', quantity: 1, unit_price: 1800 }, { description: 'Line set and installation', quantity: 1, unit_price: 900 }, { description: 'Electrical circuit', quantity: 1, unit_price: 350 }], dur: 5 },
  { desc: 'Whole-house generator install', items: [{ description: 'Generac 22kW generator', quantity: 1, unit_price: 6500 }, { description: 'Transfer switch', quantity: 1, unit_price: 900 }, { description: 'Gas line run', quantity: 1, unit_price: 650 }, { description: 'Concrete pad', quantity: 1, unit_price: 400 }, { description: 'Installation labor', quantity: 12, unit_price: 135 }], dur: 12 },
  { desc: 'Drain cleaning — main line', items: [{ description: 'Camera inspection', quantity: 1, unit_price: 250 }, { description: 'Hydro-jetting service', quantity: 1, unit_price: 550 }], dur: 2 },
  { desc: 'Smoke detector hardwire upgrade', items: [{ description: 'Hardwired smoke/CO detectors (6)', quantity: 6, unit_price: 75 }, { description: 'Wiring and interconnect', quantity: 4, unit_price: 125 }], dur: 4 },
];

const EXPENSE_CATEGORIES = ['Materials', 'Gas/Fuel', 'Tools', 'Insurance', 'Permits', 'Office', 'Marketing', 'Labor', 'Other'];

const EXPENSE_TEMPLATES = [
  { category: 'Materials', desc: 'PEX fittings — HD Supply', min: 150, max: 800 },
  { category: 'Materials', desc: 'Copper pipe and fittings', min: 200, max: 1200 },
  { category: 'Materials', desc: 'Electrical wire and boxes', min: 100, max: 600 },
  { category: 'Materials', desc: 'HVAC ductwork and supplies', min: 300, max: 1500 },
  { category: 'Materials', desc: 'PVC pipe and cement', min: 80, max: 400 },
  { category: 'Materials', desc: 'Fixtures — faucets and valves', min: 200, max: 2000 },
  { category: 'Gas/Fuel', desc: 'Fleet fuel — weekly', min: 180, max: 350 },
  { category: 'Gas/Fuel', desc: 'Fleet fuel — fill up', min: 75, max: 150 },
  { category: 'Tools', desc: 'Milwaukee M18 impact driver', min: 180, max: 350 },
  { category: 'Tools', desc: 'Ridgid press tool jaws', min: 200, max: 500 },
  { category: 'Tools', desc: 'Fluke multimeter', min: 150, max: 400 },
  { category: 'Tools', desc: 'Pipe wrenches and cutters', min: 60, max: 200 },
  { category: 'Insurance', desc: 'Monthly GL insurance', min: 450, max: 450 },
  { category: 'Insurance', desc: 'Workers comp — monthly', min: 680, max: 680 },
  { category: 'Insurance', desc: 'Vehicle insurance — monthly', min: 320, max: 320 },
  { category: 'Permits', desc: 'Plumbing permit', min: 75, max: 250 },
  { category: 'Permits', desc: 'Electrical permit', min: 100, max: 300 },
  { category: 'Permits', desc: 'HVAC permit', min: 100, max: 200 },
  { category: 'Office', desc: 'Office rent — monthly', min: 1800, max: 1800 },
  { category: 'Office', desc: 'QuickBooks subscription', min: 80, max: 80 },
  { category: 'Office', desc: 'Phone plan — business', min: 210, max: 210 },
  { category: 'Office', desc: 'Office supplies', min: 40, max: 150 },
  { category: 'Marketing', desc: 'Google Ads — monthly', min: 500, max: 1200 },
  { category: 'Marketing', desc: 'Yard signs (25)', min: 200, max: 400 },
  { category: 'Marketing', desc: 'Vehicle wrap payment', min: 350, max: 350 },
  { category: 'Labor', desc: 'Subcontractor payment — helper', min: 600, max: 2000 },
  { category: 'Labor', desc: 'Weekend overtime — crew', min: 800, max: 2500 },
  { category: 'Other', desc: 'Uniforms and PPE', min: 100, max: 400 },
  { category: 'Other', desc: 'Truck maintenance', min: 200, max: 800 },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Main Generator
   ═══════════════════════════════════════════════════════════════════════════ */

export async function loadAllDemoData(
  onProgress?: (msg: string) => void,
) {
  const log = (msg: string) => onProgress?.(msg);

  // ── 1. Create customers ──
  log('Creating 30 customers...');
  const customerIds: string[] = [];
  for (const c of CUSTOMER_DATA) {
    try {
      const res = await api.createCustomer(c);
      if (res?.data?.id) customerIds.push(res.data.id);
    } catch { /* skip duplicates */ }
  }
  log(`Created ${customerIds.length} customers`);

  // ── 2. Create jobs + invoices across 14 months ──
  log('Creating 14 months of jobs and invoices...');
  let jobCount = 0;
  let invoiceCount = 0;
  let paidCount = 0;
  let totalRevenue = 0;

  // Generate ~8-12 jobs per month for 14 months
  for (let monthsBack = 13; monthsBack >= 0; monthsBack--) {
    const jobsThisMonth = randomBetween(8, 14);

    for (let j = 0; j < jobsThisMonth; j++) {
      const template = pick(JOB_TEMPLATES);
      const customerId = pick(customerIds);
      if (!customerId) continue;

      const dayInMonth = randomBetween(1, 28);
      const scheduledDate = new Date();
      scheduledDate.setMonth(scheduledDate.getMonth() - monthsBack, dayInMonth);
      scheduledDate.setHours(randomBetween(7, 14), 0, 0, 0);

      const endDate = new Date(scheduledDate);
      endDate.setHours(endDate.getHours() + Math.ceil(template.dur));

      // Most past jobs are completed; recent/future jobs may be scheduled/in-progress
      const isCompleted = monthsBack > 0 || (monthsBack === 0 && dayInMonth < new Date().getDate() - 2);
      const status = isCompleted
        ? 'COMPLETED'
        : monthsBack === 0 ? pick(['SCHEDULED', 'IN_PROGRESS', 'SCHEDULED']) : 'COMPLETED';

      try {
        const jobRes = await api.createJob({
          customer_id: customerId,
          description: template.desc,
          priority: pick(['LOW', 'NORMAL', 'NORMAL', 'NORMAL', 'HIGH']),
          status,
          scheduled_start: scheduledDate.toISOString(),
          scheduled_end: endDate.toISOString(),
          estimated_duration: Math.ceil(template.dur * 60),
          ...(isCompleted ? { completed_at: endDate.toISOString() } : {}),
        });
        jobCount++;
        const jobId = jobRes?.data?.id;

        // Create invoice for completed jobs (90% get invoiced)
        if (isCompleted && jobId && Math.random() < 0.9) {
          const subtotal = template.items.reduce((s, li) => s + li.quantity * li.unit_price, 0);
          const taxRate = 8.25;
          const tax = Math.round(subtotal * taxRate) / 100;
          const total = subtotal + tax;

          // Most past invoices are paid
          const isPaid = monthsBack > 1 || (monthsBack === 1 && Math.random() < 0.85);
          const paidDate = new Date(endDate);
          paidDate.setDate(paidDate.getDate() + randomBetween(3, 21));

          const dueDate = new Date(endDate);
          dueDate.setDate(dueDate.getDate() + 30);

          try {
            await api.createInvoice({
              customer_id: customerId,
              job_id: jobId,
              subtotal,
              tax_rate: taxRate,
              tax,
              total,
              balance_due: isPaid ? 0 : total,
              due_date: dueDate.toISOString().split('T')[0],
              status: isPaid ? 'paid' : (monthsBack === 0 ? 'sent' : 'overdue'),
              ...(isPaid ? { paid_at: paidDate.toISOString() } : {}),
              lineItems: template.items,
            });
            invoiceCount++;
            if (isPaid) {
              paidCount++;
              totalRevenue += total;
            }
          } catch { /* skip */ }
        }
      } catch { /* skip */ }
    }
  }
  log(`Created ${jobCount} jobs, ${invoiceCount} invoices (${paidCount} paid = $${Math.round(totalRevenue).toLocaleString()})`);

  // ── 3. Create expenses across 14 months ──
  log('Creating 14 months of expenses...');
  let expenseCount = 0;
  let totalExpenses = 0;

  for (let monthsBack = 13; monthsBack >= 0; monthsBack--) {
    // Fixed monthly expenses
    const fixedMonthly = EXPENSE_TEMPLATES.filter(
      e => e.desc.includes('monthly') || e.desc.includes('Monthly')
    );
    for (const exp of fixedMonthly) {
      const d = new Date();
      d.setMonth(d.getMonth() - monthsBack, 1);
      try {
        const amt = randomBetween(exp.min, exp.max);
        await api.createExpense({
          amount: amt,
          category: exp.category,
          description: exp.desc,
          date: d.toISOString().split('T')[0],
        });
        expenseCount++;
        totalExpenses += amt;
      } catch {}
    }

    // Variable expenses — 8-15 per month
    const variableCount = randomBetween(8, 15);
    const variableExpenses = EXPENSE_TEMPLATES.filter(
      e => !e.desc.includes('monthly') && !e.desc.includes('Monthly')
    );
    for (let i = 0; i < variableCount; i++) {
      const exp = pick(variableExpenses);
      const day = randomBetween(1, 28);
      const d = new Date();
      d.setMonth(d.getMonth() - monthsBack, day);
      try {
        const amt = randomBetween(exp.min, exp.max);
        await api.createExpense({
          amount: amt,
          category: exp.category,
          description: exp.desc,
          date: d.toISOString().split('T')[0],
        });
        expenseCount++;
        totalExpenses += amt;
      } catch {}
    }
  }
  log(`Created ${expenseCount} expenses ($${Math.round(totalExpenses).toLocaleString()})`);

  // ── 4. Create the 2 additional GC projects ──
  log('Creating $2.15M Lakewood Commons project...');
  try {
    const r1 = await api.createGCProject(DEMO_PROJECT_2M);
    const p1Id = r1?.data?.id;
    if (p1Id) {
      for (const msg of DEMO_PROJECT_2M_MESSAGES) {
        try { await api.sendGCMessage(p1Id, msg.message); } catch {}
      }
    }
  } catch {}

  log('Creating $310K Garcia Residence project...');
  try {
    const r2 = await api.createGCProject(DEMO_PROJECT_300K);
    const p2Id = r2?.data?.id;
    if (p2Id) {
      for (const msg of DEMO_PROJECT_300K_MESSAGES) {
        try { await api.sendGCMessage(p2Id, msg.message); } catch {}
      }
    }
  } catch {}

  log('Demo data loaded!');

  return {
    customers: customerIds.length,
    jobs: jobCount,
    invoices: invoiceCount,
    expenses: expenseCount,
    totalRevenue: Math.round(totalRevenue),
    totalExpenses: Math.round(totalExpenses),
  };
}
