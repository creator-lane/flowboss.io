/**
 * Project Templates — Auto-populated checklists for common multi-day jobs.
 *
 * When a contractor selects "Bathroom Remodel", they get phases, tasks, and a
 * suggested materials list pre-filled. They can add/remove/edit anything.
 * This is the differentiator — no other app does this.
 */

import { TradeId } from './tradeConfig';

export type TemplateTask = {
  name: string;
  optional?: boolean; // grayed out, unchecked by default
};

export type TemplateMaterial = {
  name: string;
  estimatedCost: number;
  category: string;
  optional?: boolean;
};

export type TemplatePhase = {
  name: string;
  estimatedDays: number;
  description: string;
  tasks: TemplateTask[];
  materials: TemplateMaterial[];
  inspectionRequired?: string; // e.g. "Rough-in inspection"
};

export type ProjectTemplate = {
  id: string;
  name: string;
  icon: string; // Ionicons name
  category: string;
  trade: TradeId;
  description: string;
  estimatedDays: number;
  estimatedBudgetLow: number;
  estimatedBudgetHigh: number;
  phases: TemplatePhase[];
};

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  // ── BATHROOM REMODEL ───────────────────────────────────────────────
  {
    id: 'bathroom_remodel',
    name: 'Bathroom Remodel',
    icon: 'water',
    category: 'Remodel',
    trade: 'plumbing',
    description: 'Full or partial bathroom gut and remodel including fixtures, tile, and plumbing.',
    estimatedDays: 10,
    estimatedBudgetLow: 8000,
    estimatedBudgetHigh: 18000,
    phases: [
      {
        name: 'Demo & Rough-In',
        estimatedDays: 2,
        description: 'Remove existing fixtures, tile, vanity. Rough in new drain and supply lines.',
        inspectionRequired: 'Rough-in plumbing inspection',
        tasks: [
          { name: 'Shut off water, drain lines' },
          { name: 'Remove toilet' },
          { name: 'Remove vanity & sink' },
          { name: 'Remove tub/shower' },
          { name: 'Demo tile (floor & walls)' },
          { name: 'Remove old drain lines' },
          { name: 'Rough-in new drain lines' },
          { name: 'Rough-in new supply lines (PEX)' },
          { name: 'Install new shut-off valves' },
          { name: 'Pressure test new lines' },
          { name: 'Call for rough-in inspection' },
        ],
        materials: [
          { name: 'PEX pipe 1/2" (50ft roll)', estimatedCost: 45, category: 'Pipe' },
          { name: 'PEX pipe 3/4" (25ft roll)', estimatedCost: 35, category: 'Pipe' },
          { name: 'SharkBite fittings assorted', estimatedCost: 90, category: 'Fittings' },
          { name: 'ABS drain pipe & fittings', estimatedCost: 65, category: 'Drain' },
          { name: 'Shut-off valves (4)', estimatedCost: 56, category: 'Valves' },
          { name: 'Linear shower drain', estimatedCost: 185, category: 'Drain', optional: true },
          { name: 'Demolition disposal', estimatedCost: 200, category: 'Labor' },
        ],
      },
      {
        name: 'Shower Pan & Waterproofing',
        estimatedDays: 2,
        description: 'Build shower curb, install mud bed, waterproof membrane, flood test.',
        tasks: [
          { name: 'Build shower curb' },
          { name: 'Install pre-slope / mud bed' },
          { name: 'Apply waterproof membrane (Kerdi/RedGard)' },
          { name: 'Seal all seams and corners' },
          { name: 'Install drain assembly' },
          { name: 'Flood test (24 hours)' },
          { name: 'Take photos of waterproofing' },
        ],
        materials: [
          { name: 'Kerdi membrane (roll)', estimatedCost: 145, category: 'Waterproofing' },
          { name: 'Kerdi-Band / seam tape', estimatedCost: 32, category: 'Waterproofing' },
          { name: 'Deck mud (5 bags)', estimatedCost: 45, category: 'Masonry' },
          { name: 'Concrete blocks (curb)', estimatedCost: 18, category: 'Masonry' },
          { name: 'RedGard (1 gal)', estimatedCost: 35, category: 'Waterproofing', optional: true },
        ],
      },
      {
        name: 'Tile Installation',
        estimatedDays: 3,
        description: 'Floor tile, shower wall tile, niche, accent details, grout and seal.',
        tasks: [
          { name: 'Layout floor tile pattern (dry fit)' },
          { name: 'Install floor tile' },
          { name: 'Install shower wall tile (day 1)' },
          { name: 'Install shower wall tile (day 2)' },
          { name: 'Install shower niche' },
          { name: 'Install accent strip / border', optional: true },
          { name: 'Let thinset cure (overnight)' },
          { name: 'Grout all tile' },
          { name: 'Seal grout' },
          { name: 'Clean up tile dust' },
        ],
        materials: [
          { name: 'Floor tile', estimatedCost: 400, category: 'Tile' },
          { name: 'Wall tile (shower)', estimatedCost: 250, category: 'Tile' },
          { name: 'Tile niche (prefab)', estimatedCost: 65, category: 'Tile' },
          { name: 'Thinset mortar (4 bags)', estimatedCost: 64, category: 'Adhesive' },
          { name: 'Grout (sanded, 2 bags)', estimatedCost: 28, category: 'Grout' },
          { name: 'Tile spacers & levelers', estimatedCost: 35, category: 'Tools' },
          { name: 'Accent strip / mosaic', estimatedCost: 85, category: 'Tile', optional: true },
        ],
      },
      {
        name: 'Fixture Installation',
        estimatedDays: 2,
        description: 'Set toilet, install vanity, shower fixtures, accessories. Final connections.',
        inspectionRequired: 'Final plumbing inspection',
        tasks: [
          { name: 'Install vanity & countertop' },
          { name: 'Install vanity faucet & P-trap' },
          { name: 'Set toilet (wax ring, bolts, supply)' },
          { name: 'Install shower valve trim kit' },
          { name: 'Install shower head / rain head' },
          { name: 'Install handheld shower', optional: true },
          { name: 'Install glass shower door' },
          { name: 'Install mirror' },
          { name: 'Install towel bars, hooks, TP holder' },
          { name: 'Caulk all fixtures (silicone)' },
          { name: 'Test all fixtures — no leaks' },
          { name: 'Call for final inspection' },
        ],
        materials: [
          { name: 'Vanity w/ countertop', estimatedCost: 800, category: 'Fixtures' },
          { name: 'Vanity faucet', estimatedCost: 165, category: 'Fixtures' },
          { name: 'Toilet', estimatedCost: 280, category: 'Fixtures' },
          { name: 'Shower valve (rough + trim)', estimatedCost: 250, category: 'Fixtures' },
          { name: 'Shower head', estimatedCost: 120, category: 'Fixtures' },
          { name: 'Glass shower door', estimatedCost: 650, category: 'Fixtures' },
          { name: 'Mirror', estimatedCost: 120, category: 'Fixtures' },
          { name: 'Accessory set (towel bar, hooks)', estimatedCost: 85, category: 'Fixtures' },
          { name: 'Wax ring, supply lines, caulk', estimatedCost: 35, category: 'Supplies' },
        ],
      },
      {
        name: 'Punch List & Cleanup',
        estimatedDays: 1,
        description: 'Customer walkthrough, fix punch list items, final cleanup, sign-off.',
        tasks: [
          { name: 'Walk bathroom with customer' },
          { name: 'Note any punch list items' },
          { name: 'Fix punch list items' },
          { name: 'Touch-up caulk where needed' },
          { name: 'Final cleanup' },
          { name: 'Take completion photos (before/after)' },
          { name: 'Get customer sign-off' },
          { name: 'Leave maintenance instructions' },
        ],
        materials: [],
      },
    ],
  },

  // ── WHOLE-HOUSE REPIPE ─────────────────────────────────────────────
  {
    id: 'whole_house_repipe',
    name: 'Whole-House Repipe',
    icon: 'git-network',
    category: 'Repipe',
    trade: 'plumbing',
    description: 'Replace all supply lines (copper/galvanized to PEX). Typical for older homes.',
    estimatedDays: 5,
    estimatedBudgetLow: 5000,
    estimatedBudgetHigh: 12000,
    phases: [
      {
        name: 'Assessment & Prep',
        estimatedDays: 1,
        description: 'Map existing pipes, plan new routing, mark access points, protect surfaces.',
        tasks: [
          { name: 'Walk entire house — map all fixtures' },
          { name: 'Check water pressure (gauge reading)' },
          { name: 'Identify pipe material (copper/galv/poly)' },
          { name: 'Plan new PEX routing (manifold vs trunk)' },
          { name: 'Mark wall/ceiling access points' },
          { name: 'Lay drop cloths, protect flooring' },
          { name: 'Shut off main water supply' },
          { name: 'Drain all lines' },
        ],
        materials: [
          { name: 'PEX manifold (hot + cold)', estimatedCost: 120, category: 'Manifold' },
          { name: 'Drop cloths', estimatedCost: 30, category: 'Protection' },
          { name: 'Pipe labels / tags', estimatedCost: 15, category: 'Supplies' },
        ],
      },
      {
        name: 'Demolition & Access',
        estimatedDays: 1,
        description: 'Open walls/ceilings as needed, remove old pipe runs.',
        tasks: [
          { name: 'Cut access holes in drywall' },
          { name: 'Remove old supply lines (hot)' },
          { name: 'Remove old supply lines (cold)' },
          { name: 'Remove old shut-off valves' },
          { name: 'Cap any open drains (protect from debris)' },
          { name: 'Haul out old pipe' },
        ],
        materials: [
          { name: 'Drywall saw / oscillating tool blades', estimatedCost: 25, category: 'Tools' },
          { name: 'Pipe caps (assorted)', estimatedCost: 15, category: 'Fittings' },
        ],
      },
      {
        name: 'New PEX Installation',
        estimatedDays: 2,
        description: 'Run all new PEX supply lines from manifold to every fixture.',
        inspectionRequired: 'Rough-in plumbing inspection',
        tasks: [
          { name: 'Mount manifold (mechanical room / utility)' },
          { name: 'Run cold lines to all fixtures' },
          { name: 'Run hot lines to all fixtures' },
          { name: 'Install new shut-off valves at each fixture' },
          { name: 'Install new hose bibbs (exterior)' },
          { name: 'Support / strap all PEX runs' },
          { name: 'Pressure test entire system (100 PSI, 30 min)' },
          { name: 'Take photos of all runs before closing walls' },
          { name: 'Call for rough-in inspection' },
        ],
        materials: [
          { name: 'PEX 1/2" red (500ft)', estimatedCost: 180, category: 'Pipe' },
          { name: 'PEX 1/2" blue (500ft)', estimatedCost: 180, category: 'Pipe' },
          { name: 'PEX 3/4" (100ft)', estimatedCost: 75, category: 'Pipe' },
          { name: 'PEX fittings assorted (crimp/SharkBite)', estimatedCost: 150, category: 'Fittings' },
          { name: 'Shut-off valves (12-15)', estimatedCost: 120, category: 'Valves' },
          { name: 'Pipe straps & supports', estimatedCost: 40, category: 'Supports' },
          { name: 'Hose bibbs (2)', estimatedCost: 35, category: 'Valves' },
        ],
      },
      {
        name: 'Connect & Test',
        estimatedDays: 1,
        description: 'Connect all fixtures, test every faucet/toilet/appliance, check for leaks.',
        tasks: [
          { name: 'Connect kitchen sink' },
          { name: 'Connect dishwasher' },
          { name: 'Connect all bathroom sinks' },
          { name: 'Connect all toilets' },
          { name: 'Connect all showers/tubs' },
          { name: 'Connect washing machine' },
          { name: 'Connect water heater' },
          { name: 'Connect ice maker / fridge', optional: true },
          { name: 'Turn on main — check for leaks at every joint' },
          { name: 'Run every fixture — check pressure & flow' },
          { name: 'Check water heater — hot to all fixtures' },
          { name: 'Call for final inspection' },
        ],
        materials: [
          { name: 'Supply lines (braided, assorted)', estimatedCost: 60, category: 'Supplies' },
          { name: 'Teflon tape / pipe dope', estimatedCost: 10, category: 'Supplies' },
        ],
      },
      {
        name: 'Patch & Finish',
        estimatedDays: 1,
        description: 'Patch drywall, cleanup, customer walkthrough.',
        tasks: [
          { name: 'Patch all drywall access holes' },
          { name: 'Mud, tape, sand patches (or schedule drywall crew)' },
          { name: 'Final leak check (24hr)' },
          { name: 'Clean up all work areas' },
          { name: 'Walk house with customer — demo all fixtures' },
          { name: 'Show customer manifold & shut-offs' },
          { name: 'Take completion photos' },
          { name: 'Get customer sign-off' },
        ],
        materials: [
          { name: 'Drywall patches', estimatedCost: 25, category: 'Drywall' },
          { name: 'Joint compound & tape', estimatedCost: 20, category: 'Drywall' },
        ],
      },
    ],
  },

  // ── WATER HEATER REPLACEMENT ───────────────────────────────────────
  {
    id: 'water_heater_replace',
    name: 'Water Heater Replacement',
    icon: 'flame',
    category: 'Water Heater',
    trade: 'plumbing',
    description: 'Remove old tank water heater, install new unit. Gas or electric.',
    estimatedDays: 1,
    estimatedBudgetLow: 1200,
    estimatedBudgetHigh: 2500,
    phases: [
      {
        name: 'Removal & Prep',
        estimatedDays: 1,
        description: 'Disconnect and remove old water heater, prep for new unit.',
        tasks: [
          { name: 'Shut off gas/electric to unit' },
          { name: 'Shut off water supply to heater' },
          { name: 'Connect hose, drain tank completely' },
          { name: 'Disconnect gas line / electrical' },
          { name: 'Disconnect water lines (hot & cold)' },
          { name: 'Disconnect T&P relief valve drain' },
          { name: 'Remove old unit (dolly)' },
          { name: 'Inspect flue / venting', optional: true },
          { name: 'Clean area, check drain pan' },
        ],
        materials: [
          { name: 'Garden hose (for drain)', estimatedCost: 0, category: 'Tools' },
        ],
      },
      {
        name: 'Installation',
        estimatedDays: 1,
        description: 'Set new water heater, connect all lines, test.',
        inspectionRequired: 'Water heater permit inspection',
        tasks: [
          { name: 'Position new water heater in drain pan' },
          { name: 'Install new expansion tank' },
          { name: 'Connect cold water supply' },
          { name: 'Connect hot water outlet' },
          { name: 'Install new gas flex connector / wire electric' },
          { name: 'Install new T&P relief valve + drain line' },
          { name: 'Connect flue / venting' },
          { name: 'Fill tank — open hot faucet to bleed air' },
          { name: 'Check all connections for leaks' },
          { name: 'Light pilot / turn on power' },
          { name: 'Set temperature (120°F)' },
          { name: 'Test hot water at nearest fixture' },
          { name: 'Show customer controls & safety' },
          { name: 'Take completion photo' },
        ],
        materials: [
          { name: 'Water heater (40 or 50 gal)', estimatedCost: 550, category: 'Equipment' },
          { name: 'Expansion tank', estimatedCost: 45, category: 'Parts' },
          { name: 'Gas flex connector', estimatedCost: 35, category: 'Parts' },
          { name: 'Water heater connectors (braided)', estimatedCost: 24, category: 'Parts' },
          { name: 'T&P relief valve', estimatedCost: 15, category: 'Parts' },
          { name: 'Drain pan', estimatedCost: 12, category: 'Parts' },
          { name: 'Teflon tape, pipe dope', estimatedCost: 8, category: 'Supplies' },
          { name: 'Permit fee', estimatedCost: 75, category: 'Permits', optional: true },
        ],
      },
    ],
  },

  // ── TANKLESS WATER HEATER ──────────────────────────────────────────
  {
    id: 'tankless_install',
    name: 'Tankless Water Heater Install',
    icon: 'flash',
    category: 'Water Heater',
    trade: 'plumbing',
    description: 'Install tankless (on-demand) water heater. May require gas line upgrade.',
    estimatedDays: 2,
    estimatedBudgetLow: 3000,
    estimatedBudgetHigh: 6000,
    phases: [
      {
        name: 'Remove Old & Prep',
        estimatedDays: 1,
        description: 'Remove existing tank heater, prep mounting location, assess gas line.',
        tasks: [
          { name: 'Shut off gas & water to old unit' },
          { name: 'Drain and remove old tank heater' },
          { name: 'Assess gas line size (3/4" min for tankless)' },
          { name: 'Plan venting route (direct vent/power vent)' },
          { name: 'Check electrical (needs dedicated outlet)' },
          { name: 'Mark mounting location' },
        ],
        materials: [
          { name: 'Tankless water heater unit', estimatedCost: 1200, category: 'Equipment' },
        ],
      },
      {
        name: 'Gas & Venting',
        estimatedDays: 1,
        description: 'Upgrade gas line if needed, install venting.',
        inspectionRequired: 'Gas line inspection',
        tasks: [
          { name: 'Upgrade gas line to 3/4" (if needed)' },
          { name: 'Install gas shut-off valve' },
          { name: 'Run stainless steel venting to exterior' },
          { name: 'Install vent termination (exterior wall)' },
          { name: 'Seal all penetrations' },
          { name: 'Pressure test gas line' },
        ],
        materials: [
          { name: 'Gas pipe 3/4" (black iron)', estimatedCost: 80, category: 'Gas' },
          { name: 'Gas fittings', estimatedCost: 45, category: 'Gas' },
          { name: 'Stainless vent kit', estimatedCost: 180, category: 'Venting' },
          { name: 'Vent termination', estimatedCost: 35, category: 'Venting' },
        ],
      },
      {
        name: 'Mount & Connect',
        estimatedDays: 1,
        description: 'Mount unit, connect water, gas, electric. Commission and test.',
        tasks: [
          { name: 'Mount unit to wall (blocking if needed)' },
          { name: 'Connect cold water inlet' },
          { name: 'Connect hot water outlet' },
          { name: 'Connect gas line' },
          { name: 'Connect condensate drain' },
          { name: 'Connect electrical (120V outlet)' },
          { name: 'Turn on water — purge air' },
          { name: 'Turn on gas — test for leaks' },
          { name: 'Commission unit — set temp (120°F)' },
          { name: 'Test hot water at multiple fixtures' },
          { name: 'Verify flow rate & activation' },
          { name: 'Install recirculation pump', optional: true },
        ],
        materials: [
          { name: 'Isolation valves kit', estimatedCost: 65, category: 'Valves' },
          { name: 'Water connectors (braided)', estimatedCost: 24, category: 'Parts' },
          { name: 'Gas flex connector', estimatedCost: 35, category: 'Parts' },
          { name: 'Condensate drain line', estimatedCost: 15, category: 'Drain' },
          { name: 'Recirculation pump', estimatedCost: 200, category: 'Equipment', optional: true },
          { name: 'Permit fee', estimatedCost: 100, category: 'Permits' },
        ],
      },
      {
        name: 'Cleanup & Walkthrough',
        estimatedDays: 1,
        description: 'Final testing, customer education, cleanup.',
        tasks: [
          { name: 'Final leak check everywhere' },
          { name: 'Show customer how to adjust temperature' },
          { name: 'Explain maintenance (descale every 1-2 years)' },
          { name: 'Show customer shut-off locations' },
          { name: 'Register warranty' },
          { name: 'Clean up work area' },
          { name: 'Take before/after photos' },
          { name: 'Get customer sign-off' },
        ],
        materials: [],
      },
    ],
  },

  // ── SEWER LINE REPLACEMENT ─────────────────────────────────────────
  {
    id: 'sewer_line_replace',
    name: 'Sewer Line Replacement',
    icon: 'construct',
    category: 'Sewer',
    trade: 'plumbing',
    description: 'Excavate and replace main sewer line. Traditional dig or trenchless.',
    estimatedDays: 4,
    estimatedBudgetLow: 6000,
    estimatedBudgetHigh: 15000,
    phases: [
      {
        name: 'Camera Inspection & Planning',
        estimatedDays: 1,
        description: 'Camera the existing line, locate problem areas, plan repair method.',
        tasks: [
          { name: 'Camera inspect existing sewer line' },
          { name: 'Record video & photos of damage' },
          { name: 'Locate line with transmitter' },
          { name: 'Mark line path on surface' },
          { name: 'Determine repair method (dig vs trenchless)' },
          { name: 'Call 811 (utility locate)' },
          { name: 'Pull permits' },
          { name: 'Discuss options & pricing with customer' },
        ],
        materials: [
          { name: 'Locator transmitter', estimatedCost: 0, category: 'Tools' },
          { name: 'Marking paint', estimatedCost: 8, category: 'Supplies' },
          { name: 'Permit fee', estimatedCost: 150, category: 'Permits' },
        ],
      },
      {
        name: 'Excavation',
        estimatedDays: 1,
        description: 'Dig trench to expose sewer line. Protect landscaping where possible.',
        tasks: [
          { name: 'Set up work zone (barriers, signs)' },
          { name: 'Protect landscaping / hardscape' },
          { name: 'Excavate trench to sewer line' },
          { name: 'Expose entire damaged section' },
          { name: 'Shore trench if deeper than 4ft' },
          { name: 'Dewater trench if needed' },
        ],
        materials: [
          { name: 'Mini excavator rental (1 day)', estimatedCost: 350, category: 'Equipment' },
          { name: 'Trench safety equipment', estimatedCost: 0, category: 'Safety' },
          { name: 'Sump pump (dewater)', estimatedCost: 0, category: 'Tools' },
        ],
      },
      {
        name: 'Pipe Replacement',
        estimatedDays: 1.5,
        description: 'Remove old pipe, install new sewer line, connect to main and house.',
        inspectionRequired: 'Sewer line inspection (before backfill)',
        tasks: [
          { name: 'Remove damaged pipe section' },
          { name: 'Install new sewer pipe (PVC / SDR-35)' },
          { name: 'Ensure proper slope (1/4" per foot min)' },
          { name: 'Connect to city main / cleanout' },
          { name: 'Connect to house stub' },
          { name: 'Install new cleanout (if none exists)' },
          { name: 'Glue all joints — let cure' },
          { name: 'Camera inspect new line' },
          { name: 'Water test (fill & hold)' },
          { name: 'Call for inspection before backfill' },
          { name: 'Take photos for inspection' },
        ],
        materials: [
          { name: 'PVC sewer pipe SDR-35 (per 10ft)', estimatedCost: 45, category: 'Pipe' },
          { name: 'PVC fittings (wyes, bends, couplings)', estimatedCost: 80, category: 'Fittings' },
          { name: 'Cleanout assembly', estimatedCost: 35, category: 'Fittings' },
          { name: 'PVC cement & primer', estimatedCost: 20, category: 'Supplies' },
          { name: 'Gravel bedding (1 yard)', estimatedCost: 45, category: 'Fill' },
        ],
      },
      {
        name: 'Backfill & Restore',
        estimatedDays: 1,
        description: 'Backfill trench, compact, restore surface (sod/concrete/asphalt).',
        tasks: [
          { name: 'Backfill trench in lifts (compact each)' },
          { name: 'Top off with clean fill' },
          { name: 'Replace sod / landscaping' },
          { name: 'Repair concrete / asphalt (if applicable)' },
          { name: 'Final camera inspection' },
          { name: 'Run water — verify flow & no leaks' },
          { name: 'Clean up site completely' },
          { name: 'Walk property with customer' },
          { name: 'Take completion photos' },
          { name: 'Get customer sign-off' },
        ],
        materials: [
          { name: 'Clean fill / topsoil (2 yards)', estimatedCost: 80, category: 'Fill' },
          { name: 'Sod (patches)', estimatedCost: 60, category: 'Landscape' },
          { name: 'Concrete patch', estimatedCost: 45, category: 'Surface', optional: true },
        ],
      },
    ],
  },

  // ── KITCHEN PLUMBING ROUGH-IN ──────────────────────────────────────
  {
    id: 'kitchen_rough_in',
    name: 'Kitchen Remodel (Plumbing)',
    icon: 'restaurant',
    category: 'Remodel',
    trade: 'plumbing',
    description: 'Rough-in and finish plumbing for kitchen remodel — sink, dishwasher, ice maker, gas.',
    estimatedDays: 3,
    estimatedBudgetLow: 2000,
    estimatedBudgetHigh: 5000,
    phases: [
      {
        name: 'Demo & Rough-In',
        estimatedDays: 1,
        description: 'Remove existing fixtures, rough in new supply and drain lines.',
        inspectionRequired: 'Rough-in plumbing inspection',
        tasks: [
          { name: 'Shut off water & gas' },
          { name: 'Disconnect & remove old sink' },
          { name: 'Disconnect dishwasher' },
          { name: 'Disconnect gas line (if relocating range)' },
          { name: 'Remove old supply & drain lines' },
          { name: 'Rough-in new supply lines to new sink location' },
          { name: 'Rough-in new drain (if relocating)' },
          { name: 'Install new gas line (if relocating range)', optional: true },
          { name: 'Pressure test all new lines' },
          { name: 'Call for inspection' },
        ],
        materials: [
          { name: 'PEX pipe assorted', estimatedCost: 60, category: 'Pipe' },
          { name: 'PEX fittings', estimatedCost: 45, category: 'Fittings' },
          { name: 'ABS drain pipe & fittings', estimatedCost: 40, category: 'Drain' },
          { name: 'Gas pipe & fittings', estimatedCost: 55, category: 'Gas', optional: true },
        ],
      },
      {
        name: 'Fixture Installation',
        estimatedDays: 1.5,
        description: 'Install sink, faucet, disposal, dishwasher, ice maker line.',
        tasks: [
          { name: 'Install new kitchen sink' },
          { name: 'Install faucet & sprayer' },
          { name: 'Install garbage disposal' },
          { name: 'Connect P-trap & drain' },
          { name: 'Install dishwasher drain & supply' },
          { name: 'Install dishwasher air gap' },
          { name: 'Install ice maker line (fridge)', optional: true },
          { name: 'Install pot filler', optional: true },
          { name: 'Connect gas range' },
          { name: 'Test all fixtures — no leaks' },
          { name: 'Run dishwasher test cycle' },
        ],
        materials: [
          { name: 'Kitchen faucet', estimatedCost: 185, category: 'Fixtures' },
          { name: 'Garbage disposal (3/4 HP)', estimatedCost: 180, category: 'Fixtures' },
          { name: 'P-trap & tailpiece', estimatedCost: 20, category: 'Drain' },
          { name: 'Dishwasher supply line', estimatedCost: 12, category: 'Parts' },
          { name: 'Ice maker supply kit', estimatedCost: 18, category: 'Parts', optional: true },
          { name: 'Gas flex connector', estimatedCost: 35, category: 'Parts' },
          { name: 'Supply lines (braided)', estimatedCost: 24, category: 'Parts' },
        ],
      },
      {
        name: 'Cleanup & Walkthrough',
        estimatedDays: 1,
        description: 'Final testing, cleanup, customer sign-off.',
        tasks: [
          { name: 'Final leak check all connections' },
          { name: 'Test hot/cold at sink' },
          { name: 'Run disposal — check for leaks under' },
          { name: 'Clean up all work areas' },
          { name: 'Walk kitchen with customer' },
          { name: 'Take completion photos' },
          { name: 'Get customer sign-off' },
        ],
        materials: [],
      },
    ],
  },

  // ── GAS LINE INSTALLATION ─────────────────────────────────────────
  {
    id: 'gas_line_install',
    name: 'Gas Line Installation',
    icon: 'bonfire',
    category: 'Gas',
    trade: 'plumbing',
    description: 'Run new gas line for appliance (grill, fire pit, pool heater, generator, dryer).',
    estimatedDays: 1,
    estimatedBudgetLow: 800,
    estimatedBudgetHigh: 2500,
    phases: [
      {
        name: 'Plan & Install',
        estimatedDays: 1,
        description: 'Plan route, run new gas line, connect appliance.',
        inspectionRequired: 'Gas line inspection',
        tasks: [
          { name: 'Survey route from meter/manifold to appliance' },
          { name: 'Calculate BTU load (ensure meter can handle)' },
          { name: 'Determine pipe size needed' },
          { name: 'Shut off gas at meter' },
          { name: 'Install tee at existing line' },
          { name: 'Run new gas line (black iron / CSST)' },
          { name: 'Install shut-off valve at appliance' },
          { name: 'Install drip leg at appliance' },
          { name: 'Pressure test (15 PSI, 15 min)' },
          { name: 'Check all joints with leak detector' },
          { name: 'Call for inspection' },
        ],
        materials: [
          { name: 'Gas pipe (black iron or CSST)', estimatedCost: 120, category: 'Pipe' },
          { name: 'Gas fittings assorted', estimatedCost: 45, category: 'Fittings' },
          { name: 'Gas shut-off valve', estimatedCost: 20, category: 'Valves' },
          { name: 'Pipe thread sealant', estimatedCost: 10, category: 'Supplies' },
          { name: 'Permit fee', estimatedCost: 75, category: 'Permits' },
        ],
      },
      {
        name: 'Connect & Test',
        estimatedDays: 1,
        description: 'Connect appliance, test operation, final inspection.',
        tasks: [
          { name: 'Connect gas flex to appliance' },
          { name: 'Turn on gas — test for leaks' },
          { name: 'Light appliance / test operation' },
          { name: 'Check CO levels in area' },
          { name: 'Clean up work area' },
          { name: 'Show customer shut-off valve location' },
          { name: 'Take photos of completed work' },
          { name: 'Get customer sign-off' },
        ],
        materials: [
          { name: 'Gas flex connector (appliance)', estimatedCost: 35, category: 'Parts' },
          { name: 'Leak detection solution', estimatedCost: 8, category: 'Supplies' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // HVAC TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════

  // ── AC SYSTEM INSTALL ────────────────────────────────────────────────
  {
    id: 'ac_system_install',
    name: 'AC System Install',
    icon: 'snow-outline',
    category: 'Cooling',
    trade: 'hvac',
    description: 'Remove old AC system and install new condensing unit, evaporator coil, and thermostat.',
    estimatedDays: 3,
    estimatedBudgetLow: 5500,
    estimatedBudgetHigh: 7500,
    phases: [
      {
        name: 'Equipment Selection & Prep',
        estimatedDays: 1,
        description: 'Perform load calculation, select equipment, and prep the work site.',
        tasks: [
          { name: 'Perform Manual J load calculation' },
          { name: 'Select equipment (size & SEER rating)' },
          { name: 'Verify electrical circuit & breaker capacity' },
          { name: 'Inspect existing ductwork condition' },
          { name: 'Protect floors and landscaping' },
        ],
        materials: [
          { name: 'Condensing unit', estimatedCost: 2200, category: 'Equipment' },
          { name: 'Evaporator coil', estimatedCost: 800, category: 'Equipment' },
          { name: 'Concrete pad', estimatedCost: 45, category: 'Supplies' },
        ],
      },
      {
        name: 'Old System Removal',
        estimatedDays: 1,
        description: 'Recover refrigerant and remove the old condenser, coil, and line set.',
        tasks: [
          { name: 'Recover refrigerant (EPA compliant)' },
          { name: 'Disconnect electrical to old condenser' },
          { name: 'Remove old condensing unit' },
          { name: 'Remove old evaporator coil' },
          { name: 'Remove old refrigerant lines' },
          { name: 'Clean up old pad area' },
        ],
        materials: [
          { name: 'Refrigerant recovery tank', estimatedCost: 0, category: 'Tools' },
        ],
      },
      {
        name: 'New System Install',
        estimatedDays: 1,
        description: 'Set new condenser pad, install condenser and evaporator coil.',
        tasks: [
          { name: 'Level and set new concrete pad' },
          { name: 'Set new condensing unit on pad' },
          { name: 'Install new evaporator coil in plenum' },
          { name: 'Seal plenum around coil' },
          { name: 'Install condensate drain line' },
        ],
        materials: [
          { name: 'Refrigerant lines (line set)', estimatedCost: 120, category: 'Refrigerant' },
          { name: 'Thermostat wire (50ft)', estimatedCost: 25, category: 'Electrical' },
          { name: 'Disconnect box', estimatedCost: 35, category: 'Electrical' },
        ],
      },
      {
        name: 'Ductwork Connection & Testing',
        estimatedDays: 1,
        description: 'Run refrigerant lines, connect thermostat, and pressure test the system.',
        inspectionRequired: 'Mechanical inspection',
        tasks: [
          { name: 'Braze refrigerant lines' },
          { name: 'Pressure test with nitrogen (500 PSI)' },
          { name: 'Pull vacuum on line set (500 microns)' },
          { name: 'Install new disconnect & whip' },
          { name: 'Run and connect thermostat wire' },
          { name: 'Connect condensate drain to P-trap' },
        ],
        materials: [
          { name: 'R-410A refrigerant', estimatedCost: 85, category: 'Refrigerant' },
          { name: 'Nitrogen tank rental', estimatedCost: 0, category: 'Tools' },
          { name: 'Condensate P-trap & fittings', estimatedCost: 15, category: 'Drain' },
        ],
      },
      {
        name: 'Cleanup & Commissioning',
        estimatedDays: 1,
        description: 'Charge system, test all modes, customer walkthrough.',
        tasks: [
          { name: 'Charge system with refrigerant (weigh in)' },
          { name: 'Install and program thermostat' },
          { name: 'Test cooling mode — check supply/return temps' },
          { name: 'Test heating mode (heat pump) or fan only', optional: true },
          { name: 'Check amp draw vs nameplate' },
          { name: 'Clean up work area' },
          { name: 'Walk customer through thermostat & filter' },
          { name: 'Register warranty' },
        ],
        materials: [
          { name: 'Programmable thermostat', estimatedCost: 85, category: 'Controls' },
          { name: 'Air filter', estimatedCost: 15, category: 'Supplies' },
        ],
      },
    ],
  },

  // ── FURNACE INSTALL ──────────────────────────────────────────────────
  {
    id: 'furnace_install',
    name: 'Furnace Install',
    icon: 'flame-outline',
    category: 'Heating',
    trade: 'hvac',
    description: 'Remove old furnace and install new high-efficiency gas furnace with venting.',
    estimatedDays: 2,
    estimatedBudgetLow: 4000,
    estimatedBudgetHigh: 6000,
    phases: [
      {
        name: 'Assessment & Prep',
        estimatedDays: 1,
        description: 'Measure gas line, verify venting, plan installation.',
        tasks: [
          { name: 'Measure gas line size (verify adequate)' },
          { name: 'Check existing venting type & condition' },
          { name: 'Verify electrical (115V circuit)' },
          { name: 'Confirm furnace sizing for home' },
          { name: 'Protect work area & flooring' },
        ],
        materials: [
          { name: 'Gas furnace (80K-100K BTU)', estimatedCost: 1800, category: 'Equipment' },
          { name: 'Drop cloths', estimatedCost: 20, category: 'Protection' },
        ],
      },
      {
        name: 'Old Furnace Removal',
        estimatedDays: 1,
        description: 'Disconnect and remove old furnace, clean installation area.',
        tasks: [
          { name: 'Shut off gas at furnace valve' },
          { name: 'Disconnect electrical power' },
          { name: 'Disconnect gas line' },
          { name: 'Disconnect flue pipe from furnace' },
          { name: 'Disconnect supply & return plenums' },
          { name: 'Remove old furnace unit' },
          { name: 'Clean installation area' },
        ],
        materials: [
          { name: 'Pipe caps (temporary)', estimatedCost: 10, category: 'Fittings' },
        ],
      },
      {
        name: 'New Furnace Install',
        estimatedDays: 1,
        description: 'Set new furnace, connect to ductwork, align plenums.',
        tasks: [
          { name: 'Position new furnace on platform/pad' },
          { name: 'Connect supply plenum' },
          { name: 'Connect return plenum' },
          { name: 'Seal all plenum connections with mastic' },
          { name: 'Install new filter rack' },
          { name: 'Connect condensate drain (high-efficiency)', optional: true },
        ],
        materials: [
          { name: 'Plenum transitions / adapters', estimatedCost: 65, category: 'Ductwork' },
          { name: 'Duct mastic & foil tape', estimatedCost: 25, category: 'Supplies' },
          { name: 'Filter rack', estimatedCost: 30, category: 'Parts' },
        ],
      },
      {
        name: 'Venting & Electrical',
        estimatedDays: 0.25,
        description: 'Run flue pipe, connect gas line, wire thermostat.',
        inspectionRequired: 'Mechanical / gas inspection',
        tasks: [
          { name: 'Run new flue pipe to chimney or exterior' },
          { name: 'Seal all flue joints with screws & tape' },
          { name: 'Connect gas line with new flex connector' },
          { name: 'Leak test gas connection (soap bubbles)' },
          { name: 'Wire thermostat to new furnace' },
          { name: 'Connect electrical power' },
        ],
        materials: [
          { name: 'Flue pipe (B-vent or PVC)', estimatedCost: 80, category: 'Venting' },
          { name: 'Gas flex connector', estimatedCost: 35, category: 'Gas' },
          { name: 'Thermostat', estimatedCost: 85, category: 'Controls' },
        ],
      },
      {
        name: 'Testing & Startup',
        estimatedDays: 0.25,
        description: 'Combustion analysis, system test, customer walkthrough.',
        tasks: [
          { name: 'Perform combustion analysis' },
          { name: 'Check gas pressure (manifold)' },
          { name: 'Verify temperature rise across furnace' },
          { name: 'Test all thermostat modes' },
          { name: 'Check for CO at register closest to furnace' },
          { name: 'Install new filter' },
          { name: 'Clean up work area' },
          { name: 'Show customer filter location & thermostat' },
          { name: 'Register warranty' },
        ],
        materials: [
          { name: 'Air filter', estimatedCost: 15, category: 'Supplies' },
          { name: 'Permit fee', estimatedCost: 75, category: 'Permits', optional: true },
        ],
      },
    ],
  },

  // ── DUCTWORK INSTALL ─────────────────────────────────────────────────
  {
    id: 'ductwork_install',
    name: 'Ductwork Install',
    icon: 'git-branch-outline',
    category: 'Ductwork',
    trade: 'hvac',
    description: 'Design and install new ductwork system including trunk lines, branches, and registers.',
    estimatedDays: 4,
    estimatedBudgetLow: 4000,
    estimatedBudgetHigh: 8000,
    phases: [
      {
        name: 'Design & Layout',
        estimatedDays: 1,
        description: 'Design duct layout, calculate CFM per room, mark routing.',
        tasks: [
          { name: 'Calculate room-by-room CFM requirements' },
          { name: 'Design trunk & branch layout' },
          { name: 'Determine duct sizes per run' },
          { name: 'Mark routing through joists/framing' },
          { name: 'Identify any framing modifications needed' },
        ],
        materials: [
          { name: 'Sheet metal (assorted sizes)', estimatedCost: 600, category: 'Ductwork' },
          { name: 'Flex duct (6" & 8" dia)', estimatedCost: 250, category: 'Ductwork' },
        ],
      },
      {
        name: 'Trunk Line Install',
        estimatedDays: 1,
        description: 'Install main trunk lines from furnace/air handler.',
        tasks: [
          { name: 'Install supply trunk from furnace plenum' },
          { name: 'Install return trunk to furnace' },
          { name: 'Hang trunk lines with strapping' },
          { name: 'Install trunk-line takeoffs for branches' },
          { name: 'Seal all trunk joints with mastic' },
        ],
        materials: [
          { name: 'Duct hangers & strapping', estimatedCost: 45, category: 'Supports' },
          { name: 'Duct mastic (1 gal)', estimatedCost: 20, category: 'Sealant' },
          { name: 'Sheet metal screws', estimatedCost: 12, category: 'Fasteners' },
        ],
      },
      {
        name: 'Branch Runs',
        estimatedDays: 1.5,
        description: 'Run individual branch ducts from trunk to each room.',
        inspectionRequired: 'Duct rough-in inspection',
        tasks: [
          { name: 'Run branch ducts to each room' },
          { name: 'Install boot fittings at register locations' },
          { name: 'Cut subfloor / wall openings for registers' },
          { name: 'Secure all branch connections to trunk' },
          { name: 'Install dampers at each takeoff' },
          { name: 'Seal all branch connections with mastic' },
        ],
        materials: [
          { name: 'Register boots (assorted)', estimatedCost: 80, category: 'Fittings' },
          { name: 'Volume dampers', estimatedCost: 60, category: 'Controls' },
          { name: 'Foil tape', estimatedCost: 18, category: 'Sealant' },
        ],
      },
      {
        name: 'Sealing & Insulation',
        estimatedDays: 1,
        description: 'Seal all joints and insulate ductwork in unconditioned spaces.',
        tasks: [
          { name: 'Mastic-seal every joint and seam' },
          { name: 'Wrap ducts in unconditioned spaces with insulation' },
          { name: 'Insulate any exposed boots in exterior walls' },
          { name: 'Verify no air leaks with smoke test' },
        ],
        materials: [
          { name: 'Duct insulation (R-8 wrap)', estimatedCost: 120, category: 'Insulation' },
          { name: 'Insulation tape', estimatedCost: 15, category: 'Supplies' },
          { name: 'Additional mastic', estimatedCost: 20, category: 'Sealant' },
        ],
      },
      {
        name: 'Register & Grille Install',
        estimatedDays: 1,
        description: 'Install all registers, return grilles, balance airflow.',
        tasks: [
          { name: 'Install supply registers in each room' },
          { name: 'Install return air grilles' },
          { name: 'Turn on system — check airflow at each register' },
          { name: 'Balance dampers for even airflow' },
          { name: 'Check temperature differential (supply vs return)' },
          { name: 'Clean up all work areas' },
          { name: 'Walk customer through system' },
        ],
        materials: [
          { name: 'Supply registers (assorted)', estimatedCost: 120, category: 'Registers' },
          { name: 'Return air grilles (2-3)', estimatedCost: 60, category: 'Registers' },
          { name: 'Filter grille (return)', estimatedCost: 35, category: 'Registers' },
        ],
      },
    ],
  },

  // ── HEAT PUMP INSTALL ────────────────────────────────────────────────
  {
    id: 'heat_pump_install',
    name: 'Heat Pump Install',
    icon: 'thermometer-outline',
    category: 'Heating & Cooling',
    trade: 'hvac',
    description: 'Install a heat pump system with outdoor unit and indoor air handler for year-round comfort.',
    estimatedDays: 3,
    estimatedBudgetLow: 6000,
    estimatedBudgetHigh: 9000,
    phases: [
      {
        name: 'Site Prep',
        estimatedDays: 1,
        description: 'Prepare indoor and outdoor installation locations.',
        tasks: [
          { name: 'Perform load calculation' },
          { name: 'Select equipment (tonnage & SEER/HSPF)' },
          { name: 'Level and pour/set outdoor pad' },
          { name: 'Verify electrical panel capacity' },
          { name: 'Plan refrigerant line routing' },
        ],
        materials: [
          { name: 'Heat pump outdoor unit', estimatedCost: 2800, category: 'Equipment' },
          { name: 'Concrete pad', estimatedCost: 45, category: 'Supplies' },
        ],
      },
      {
        name: 'Outdoor Unit Install',
        estimatedDays: 1,
        description: 'Set outdoor heat pump unit, run electrical.',
        tasks: [
          { name: 'Set heat pump on pad (vibration pads)' },
          { name: 'Install electrical disconnect' },
          { name: 'Run electrical whip from disconnect to unit' },
          { name: 'Connect breaker in main panel' },
          { name: 'Secure unit with anchor brackets', optional: true },
        ],
        materials: [
          { name: 'Disconnect box (60A)', estimatedCost: 40, category: 'Electrical' },
          { name: 'Electrical whip', estimatedCost: 25, category: 'Electrical' },
          { name: 'Vibration isolation pads', estimatedCost: 20, category: 'Supplies' },
        ],
      },
      {
        name: 'Indoor Air Handler',
        estimatedDays: 1,
        description: 'Install indoor air handler and connect to ductwork.',
        tasks: [
          { name: 'Position air handler in closet/utility' },
          { name: 'Connect supply & return plenums' },
          { name: 'Seal all plenum connections' },
          { name: 'Install condensate drain with P-trap' },
          { name: 'Install secondary drain pan with float switch' },
          { name: 'Install filter rack & filter' },
        ],
        materials: [
          { name: 'Air handler unit', estimatedCost: 1400, category: 'Equipment' },
          { name: 'Condensate drain fittings', estimatedCost: 25, category: 'Drain' },
          { name: 'Float switch (safety)', estimatedCost: 18, category: 'Safety' },
        ],
      },
      {
        name: 'Refrigerant Lines & Electrical',
        estimatedDays: 1,
        description: 'Run line set, vacuum and charge, connect thermostat.',
        inspectionRequired: 'Mechanical inspection',
        tasks: [
          { name: 'Run refrigerant line set (insulated)' },
          { name: 'Braze line connections' },
          { name: 'Pressure test with nitrogen' },
          { name: 'Pull vacuum (500 microns or lower)' },
          { name: 'Release factory charge / weigh in refrigerant' },
          { name: 'Run thermostat wire' },
          { name: 'Install and wire thermostat' },
        ],
        materials: [
          { name: 'Line set (insulated, 25-50ft)', estimatedCost: 150, category: 'Refrigerant' },
          { name: 'Thermostat (heat pump compatible)', estimatedCost: 95, category: 'Controls' },
          { name: 'R-410A refrigerant', estimatedCost: 85, category: 'Refrigerant' },
        ],
      },
      {
        name: 'Commissioning',
        estimatedDays: 1,
        description: 'System startup, test all modes, customer training.',
        tasks: [
          { name: 'Start system — test cooling mode' },
          { name: 'Test heating mode' },
          { name: 'Test emergency/auxiliary heat' },
          { name: 'Check superheat & subcooling' },
          { name: 'Verify defrost cycle operation' },
          { name: 'Check amp draws vs nameplate' },
          { name: 'Program thermostat schedule' },
          { name: 'Walk customer through operation' },
          { name: 'Register warranty' },
          { name: 'Clean up all work areas' },
        ],
        materials: [
          { name: 'Air filter', estimatedCost: 15, category: 'Supplies' },
          { name: 'Permit fee', estimatedCost: 100, category: 'Permits', optional: true },
        ],
      },
    ],
  },

  // ── MINI-SPLIT MULTI-ZONE ────────────────────────────────────────────
  {
    id: 'mini_split_multi_zone',
    name: 'Mini-Split Multi-Zone',
    icon: 'grid-outline',
    category: 'Heating & Cooling',
    trade: 'hvac',
    description: 'Install multi-zone ductless mini-split system with 3-4 indoor heads.',
    estimatedDays: 3,
    estimatedBudgetLow: 8000,
    estimatedBudgetHigh: 12000,
    phases: [
      {
        name: 'Planning & Mounting',
        estimatedDays: 1,
        description: 'Plan indoor head locations, outdoor unit placement, and line routing.',
        tasks: [
          { name: 'Determine zones and head locations' },
          { name: 'Select wall/ceiling mount positions' },
          { name: 'Plan line set routing for each zone' },
          { name: 'Verify electrical panel for dedicated circuit' },
          { name: 'Install mounting plates for indoor heads' },
        ],
        materials: [
          { name: 'Multi-zone outdoor unit', estimatedCost: 3200, category: 'Equipment' },
          { name: 'Wall brackets / mounting plates', estimatedCost: 60, category: 'Mounts' },
        ],
      },
      {
        name: 'Outdoor Unit',
        estimatedDays: 1,
        description: 'Set outdoor unit, run electrical disconnect and power.',
        tasks: [
          { name: 'Set outdoor unit on pad or wall bracket' },
          { name: 'Install electrical disconnect' },
          { name: 'Run power from panel to disconnect' },
          { name: 'Run power from disconnect to outdoor unit' },
          { name: 'Core drill wall penetrations for each zone' },
        ],
        materials: [
          { name: 'Concrete pad or wall mount bracket', estimatedCost: 55, category: 'Mounts' },
          { name: 'Disconnect box', estimatedCost: 35, category: 'Electrical' },
          { name: 'Electrical wire (10/2)', estimatedCost: 45, category: 'Electrical' },
        ],
      },
      {
        name: 'Indoor Head Install',
        estimatedDays: 1,
        description: 'Mount and connect each indoor head unit.',
        tasks: [
          { name: 'Mount indoor head #1 on plate' },
          { name: 'Mount indoor head #2 on plate' },
          { name: 'Mount indoor head #3 on plate' },
          { name: 'Mount indoor head #4 on plate', optional: true },
          { name: 'Connect communication wires to each head' },
          { name: 'Run condensate drains from each head' },
        ],
        materials: [
          { name: 'Indoor heads (3-4 units)', estimatedCost: 2400, category: 'Equipment' },
          { name: 'Condensate pump (if gravity drain not possible)', estimatedCost: 85, category: 'Drain', optional: true },
          { name: 'Line hide / cover (decorative)', estimatedCost: 120, category: 'Trim', optional: true },
        ],
      },
      {
        name: 'Line Sets & Drain',
        estimatedDays: 1,
        description: 'Run refrigerant lines for each zone, connect condensate drains.',
        inspectionRequired: 'Mechanical inspection',
        tasks: [
          { name: 'Run line set for zone 1' },
          { name: 'Run line set for zone 2' },
          { name: 'Run line set for zone 3' },
          { name: 'Run line set for zone 4', optional: true },
          { name: 'Flare all connections (torque to spec)' },
          { name: 'Pressure test all lines with nitrogen' },
          { name: 'Pull vacuum on entire system' },
          { name: 'Connect all condensate drains' },
        ],
        materials: [
          { name: 'Line sets (pre-charged or field, per zone)', estimatedCost: 360, category: 'Refrigerant' },
          { name: 'Condensate drain line & fittings', estimatedCost: 30, category: 'Drain' },
          { name: 'Wall sleeves & sealant', estimatedCost: 25, category: 'Supplies' },
        ],
      },
      {
        name: 'Startup & Programming',
        estimatedDays: 1,
        description: 'Charge system, configure zones, test all modes.',
        tasks: [
          { name: 'Release factory charge / add refrigerant' },
          { name: 'Power on system — run self-test' },
          { name: 'Test each zone independently (cool & heat)' },
          { name: 'Program remote controls for each zone' },
          { name: 'Set up Wi-Fi control app', optional: true },
          { name: 'Check amp draw on outdoor unit' },
          { name: 'Clean up all work areas' },
          { name: 'Train customer on remotes & filters' },
          { name: 'Register warranty' },
        ],
        materials: [
          { name: 'R-410A refrigerant (additional)', estimatedCost: 85, category: 'Refrigerant', optional: true },
          { name: 'Permit fee', estimatedCost: 100, category: 'Permits', optional: true },
        ],
      },
    ],
  },

  // ── WHOLE-SYSTEM REPLACE (HVAC) ──────────────────────────────────────
  {
    id: 'hvac_whole_system_replace',
    name: 'Whole-System Replace',
    icon: 'swap-horizontal-outline',
    category: 'Full System',
    trade: 'hvac',
    description: 'Complete HVAC system replacement — furnace, AC condenser, evaporator coil, thermostat, and ductwork modifications.',
    estimatedDays: 5,
    estimatedBudgetLow: 10000,
    estimatedBudgetHigh: 18000,
    phases: [
      {
        name: 'System Assessment',
        estimatedDays: 1,
        description: 'Full assessment of existing system, load calculation, and equipment selection.',
        tasks: [
          { name: 'Perform Manual J load calculation' },
          { name: 'Inspect existing ductwork (leaks, sizing)' },
          { name: 'Assess gas line capacity' },
          { name: 'Check electrical panel capacity' },
          { name: 'Select matched system (furnace + AC)' },
          { name: 'Pull permits' },
        ],
        materials: [
          { name: 'Gas furnace', estimatedCost: 1800, category: 'Equipment' },
          { name: 'AC condensing unit', estimatedCost: 2200, category: 'Equipment' },
          { name: 'Evaporator coil (matched)', estimatedCost: 800, category: 'Equipment' },
        ],
      },
      {
        name: 'Old Equipment Removal',
        estimatedDays: 1,
        description: 'Remove old furnace, condenser, coil, and outdated ductwork.',
        tasks: [
          { name: 'Recover refrigerant (EPA compliant)' },
          { name: 'Disconnect and remove old condenser' },
          { name: 'Disconnect and remove old furnace' },
          { name: 'Remove old evaporator coil' },
          { name: 'Remove old refrigerant lines' },
          { name: 'Remove damaged/undersized ductwork sections' },
          { name: 'Clean installation areas' },
        ],
        materials: [
          { name: 'Refrigerant recovery tank', estimatedCost: 0, category: 'Tools' },
          { name: 'Drop cloths', estimatedCost: 20, category: 'Protection' },
        ],
      },
      {
        name: 'New Equipment Install',
        estimatedDays: 1.5,
        description: 'Install new furnace, condenser, and evaporator coil.',
        inspectionRequired: 'Mechanical rough-in inspection',
        tasks: [
          { name: 'Set new furnace in position' },
          { name: 'Connect gas line to furnace' },
          { name: 'Install new flue/venting' },
          { name: 'Set condenser on new pad' },
          { name: 'Install new evaporator coil' },
          { name: 'Run new refrigerant line set' },
          { name: 'Braze all refrigerant connections' },
          { name: 'Install new disconnect & electrical' },
        ],
        materials: [
          { name: 'Thermostat (smart/programmable)', estimatedCost: 120, category: 'Controls' },
          { name: 'Line set (insulated)', estimatedCost: 150, category: 'Refrigerant' },
          { name: 'Flue pipe', estimatedCost: 80, category: 'Venting' },
          { name: 'Gas flex connector', estimatedCost: 35, category: 'Gas' },
        ],
      },
      {
        name: 'Ductwork Modifications',
        estimatedDays: 1,
        description: 'Modify, repair, or replace ductwork as needed for new system.',
        tasks: [
          { name: 'Connect supply plenum to new furnace' },
          { name: 'Connect return plenum to new furnace' },
          { name: 'Replace any undersized trunk lines' },
          { name: 'Repair or replace damaged branch runs' },
          { name: 'Seal all duct connections with mastic' },
          { name: 'Add insulation where needed' },
        ],
        materials: [
          { name: 'Sheet metal ductwork (modifications)', estimatedCost: 350, category: 'Ductwork' },
          { name: 'Duct mastic & foil tape', estimatedCost: 40, category: 'Sealant' },
          { name: 'Duct insulation', estimatedCost: 80, category: 'Insulation' },
        ],
      },
      {
        name: 'Commissioning & Training',
        estimatedDays: 1,
        description: 'Charge system, full testing, final inspection, customer training.',
        inspectionRequired: 'Final mechanical inspection',
        tasks: [
          { name: 'Pressure test refrigerant lines' },
          { name: 'Pull vacuum & charge system' },
          { name: 'Combustion analysis on furnace' },
          { name: 'Test cooling — check superheat/subcooling' },
          { name: 'Test heating — check temp rise' },
          { name: 'Check airflow at every register' },
          { name: 'Balance dampers' },
          { name: 'Program thermostat' },
          { name: 'Clean up entire work area' },
          { name: 'Full walkthrough with customer' },
          { name: 'Register all warranties' },
          { name: 'Get customer sign-off' },
        ],
        materials: [
          { name: 'R-410A refrigerant', estimatedCost: 120, category: 'Refrigerant' },
          { name: 'Air filters (2)', estimatedCost: 30, category: 'Supplies' },
          { name: 'Permit fee', estimatedCost: 150, category: 'Permits' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ELECTRICAL TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════

  // ── PANEL UPGRADE 200A ───────────────────────────────────────────────
  {
    id: 'panel_upgrade_200a',
    name: 'Panel Upgrade 200A',
    icon: 'flash-outline',
    category: 'Panel',
    trade: 'electrical',
    description: 'Upgrade main electrical panel to 200A service including meter socket and grounding.',
    estimatedDays: 2,
    estimatedBudgetLow: 2500,
    estimatedBudgetHigh: 4000,
    phases: [
      {
        name: 'Permit & Assessment',
        estimatedDays: 0.25,
        description: 'Assess existing panel, pull permits, coordinate with utility for disconnect.',
        tasks: [
          { name: 'Assess existing panel & service size' },
          { name: 'Count existing circuits & loads' },
          { name: 'Pull electrical permit' },
          { name: 'Schedule utility disconnect (if needed)' },
          { name: 'Select new 200A panel & breakers' },
        ],
        materials: [
          { name: '200A main breaker panel', estimatedCost: 350, category: 'Equipment' },
          { name: 'Breakers (assorted, 20-30)', estimatedCost: 300, category: 'Breakers' },
          { name: 'Permit fee', estimatedCost: 100, category: 'Permits' },
        ],
      },
      {
        name: 'Power Disconnect',
        estimatedDays: 0.25,
        description: 'Coordinate utility disconnect, de-energize existing panel.',
        tasks: [
          { name: 'Confirm utility has pulled meter' },
          { name: 'Verify panel is de-energized (test)' },
          { name: 'Label all existing circuits' },
          { name: 'Photograph existing wiring layout' },
        ],
        materials: [
          { name: 'Circuit labels / markers', estimatedCost: 10, category: 'Supplies' },
        ],
      },
      {
        name: 'Panel Swap',
        estimatedDays: 1,
        description: 'Remove old panel, install new 200A panel and meter socket.',
        tasks: [
          { name: 'Remove old panel cover and breakers' },
          { name: 'Disconnect all circuit wires' },
          { name: 'Remove old panel box' },
          { name: 'Install new meter socket (if required)' },
          { name: 'Mount new 200A panel' },
          { name: 'Install new grounding rod & conductor' },
          { name: 'Connect grounding / bonding' },
        ],
        materials: [
          { name: 'Meter socket (200A)', estimatedCost: 180, category: 'Equipment', optional: true },
          { name: 'Grounding rod (8ft)', estimatedCost: 25, category: 'Grounding' },
          { name: '#4 copper ground wire (25ft)', estimatedCost: 45, category: 'Wire' },
        ],
      },
      {
        name: 'Circuit Transfer',
        estimatedDays: 1,
        description: 'Transfer all existing circuits to new panel, add new circuits if needed.',
        tasks: [
          { name: 'Install breakers in new panel' },
          { name: 'Terminate each circuit wire to breaker' },
          { name: 'Torque all connections to spec' },
          { name: 'Connect neutral & ground bars' },
          { name: 'Install AFCI/GFCI breakers where required' },
          { name: 'Add any new circuits', optional: true },
        ],
        materials: [
          { name: 'AFCI breakers (bedrooms)', estimatedCost: 120, category: 'Breakers' },
          { name: 'Wire nuts & connectors', estimatedCost: 15, category: 'Supplies' },
          { name: 'Cable staples & ties', estimatedCost: 10, category: 'Supplies' },
        ],
      },
      {
        name: 'Inspection & Energize',
        estimatedDays: 1,
        description: 'Final inspection, utility re-connect, test all circuits.',
        inspectionRequired: 'Electrical final inspection',
        tasks: [
          { name: 'Double-check all connections & torques' },
          { name: 'Install panel cover & circuit directory' },
          { name: 'Call for electrical inspection' },
          { name: 'Coordinate utility to set meter' },
          { name: 'Energize panel — test each circuit' },
          { name: 'Verify voltage at panel (240V/120V)' },
          { name: 'Test all GFCI/AFCI breakers' },
          { name: 'Walk customer through new panel' },
          { name: 'Clean up work area' },
        ],
        materials: [
          { name: 'Panel cover & directory card', estimatedCost: 0, category: 'Included' },
        ],
      },
    ],
  },

  // ── WHOLE-HOUSE REWIRE ───────────────────────────────────────────────
  {
    id: 'whole_house_rewire',
    name: 'Whole-House Rewire',
    icon: 'git-network-outline',
    category: 'Rewire',
    trade: 'electrical',
    description: 'Complete rewire of home — replace old wiring (knob & tube, aluminum) with modern NM-B.',
    estimatedDays: 7,
    estimatedBudgetLow: 10000,
    estimatedBudgetHigh: 15000,
    phases: [
      {
        name: 'Planning & Permit',
        estimatedDays: 1,
        description: 'Map existing circuits, plan new layout, pull permits.',
        tasks: [
          { name: 'Map all existing circuits & outlets' },
          { name: 'Plan new circuit layout (NEC compliant)' },
          { name: 'Determine dedicated circuits (kitchen, bath, laundry)' },
          { name: 'Pull electrical permit' },
          { name: 'Order materials' },
        ],
        materials: [
          { name: 'NM-B 14/2 wire (1000ft)', estimatedCost: 180, category: 'Wire' },
          { name: 'NM-B 12/2 wire (1000ft)', estimatedCost: 250, category: 'Wire' },
          { name: 'NM-B 10/2 wire (100ft)', estimatedCost: 65, category: 'Wire' },
          { name: 'Permit fee', estimatedCost: 150, category: 'Permits' },
        ],
      },
      {
        name: 'Demo & Access',
        estimatedDays: 1,
        description: 'Cut access holes, remove old devices, prep for new wire runs.',
        tasks: [
          { name: 'Cut access holes in walls/ceilings' },
          { name: 'Remove old outlets, switches, & cover plates' },
          { name: 'Remove old junction boxes' },
          { name: 'Identify & mark joist/stud locations' },
          { name: 'Drill pathways through framing' },
        ],
        materials: [
          { name: 'New work boxes (30-40)', estimatedCost: 80, category: 'Boxes' },
          { name: 'Old work (remodel) boxes (10-15)', estimatedCost: 45, category: 'Boxes' },
          { name: 'Drywall saw / oscillating blades', estimatedCost: 25, category: 'Tools' },
        ],
      },
      {
        name: 'New Wire Runs',
        estimatedDays: 3,
        description: 'Pull all new circuits from panel to each box location.',
        inspectionRequired: 'Rough-in electrical inspection',
        tasks: [
          { name: 'Run kitchen circuits (2x 20A small appliance)' },
          { name: 'Run bathroom circuits (20A GFCI each)' },
          { name: 'Run bedroom circuits (15A AFCI)' },
          { name: 'Run living/dining circuits' },
          { name: 'Run laundry circuit (20A dedicated)' },
          { name: 'Run garage/outdoor circuits' },
          { name: 'Staple & secure all wire runs' },
          { name: 'Call for rough-in inspection' },
        ],
        materials: [
          { name: 'Wire staples (box)', estimatedCost: 15, category: 'Fasteners' },
          { name: 'Cable connectors / clamps', estimatedCost: 20, category: 'Fittings' },
          { name: 'Drill bits (installer / flex bits)', estimatedCost: 35, category: 'Tools' },
        ],
      },
      {
        name: 'Device Install',
        estimatedDays: 1,
        description: 'Install all outlets, switches, and cover plates.',
        tasks: [
          { name: 'Install standard outlets throughout' },
          { name: 'Install GFCI outlets (kitchen, bath, garage, outdoor)' },
          { name: 'Install switches (single, 3-way, dimmer)' },
          { name: 'Install cover plates' },
          { name: 'Install smoke/CO detectors (hardwired)' },
        ],
        materials: [
          { name: 'Outlets (tamper-resistant, 30-40)', estimatedCost: 80, category: 'Devices' },
          { name: 'GFCI outlets (8-10)', estimatedCost: 120, category: 'Devices' },
          { name: 'Switches (assorted, 15-20)', estimatedCost: 60, category: 'Devices' },
          { name: 'Cover plates', estimatedCost: 40, category: 'Trim' },
          { name: 'Wire nuts (assorted)', estimatedCost: 15, category: 'Supplies' },
        ],
      },
      {
        name: 'Panel Termination',
        estimatedDays: 1,
        description: 'Terminate all new circuits at the panel.',
        tasks: [
          { name: 'Route wires into panel' },
          { name: 'Strip & terminate each circuit' },
          { name: 'Install appropriate breakers' },
          { name: 'Torque all connections' },
          { name: 'Label circuit directory' },
        ],
        materials: [
          { name: 'AFCI breakers (bedrooms)', estimatedCost: 160, category: 'Breakers' },
          { name: 'Standard breakers (assorted)', estimatedCost: 100, category: 'Breakers' },
        ],
      },
      {
        name: 'Patch & Inspection',
        estimatedDays: 1,
        description: 'Patch access holes, final inspection, test every circuit.',
        inspectionRequired: 'Final electrical inspection',
        tasks: [
          { name: 'Patch all drywall access holes' },
          { name: 'Mud, tape, sand patches' },
          { name: 'Test every outlet (polarity, ground)' },
          { name: 'Test all GFCI trips' },
          { name: 'Test all AFCI breakers' },
          { name: 'Call for final inspection' },
          { name: 'Clean up all work areas' },
          { name: 'Walk customer through new panel & circuits' },
          { name: 'Get customer sign-off' },
        ],
        materials: [
          { name: 'Drywall patches & compound', estimatedCost: 40, category: 'Drywall' },
          { name: 'Outlet tester', estimatedCost: 0, category: 'Tools' },
        ],
      },
    ],
  },

  // ── EV CHARGER INSTALL ───────────────────────────────────────────────
  {
    id: 'ev_charger_install',
    name: 'EV Charger Install',
    icon: 'car-outline',
    category: 'EV',
    trade: 'electrical',
    description: 'Install Level 2 EV charger with dedicated 50A circuit from panel to garage.',
    estimatedDays: 1,
    estimatedBudgetLow: 1000,
    estimatedBudgetHigh: 2000,
    phases: [
      {
        name: 'Site Assessment',
        estimatedDays: 0.25,
        description: 'Assess panel capacity, plan circuit route, verify charger location.',
        tasks: [
          { name: 'Check panel for available space & capacity' },
          { name: 'Plan wire route from panel to charger location' },
          { name: 'Measure wire run distance' },
          { name: 'Determine conduit vs NM-B routing' },
          { name: 'Verify charger mounting location with customer' },
        ],
        materials: [
          { name: 'Level 2 EV charger (40A)', estimatedCost: 450, category: 'Equipment', optional: true },
          { name: '6/3 NM-B wire or THHN in conduit', estimatedCost: 180, category: 'Wire' },
        ],
      },
      {
        name: 'Circuit Run',
        estimatedDays: 0.25,
        description: 'Run dedicated 50A circuit from panel to charger location.',
        tasks: [
          { name: 'Install 50A double-pole breaker in panel' },
          { name: 'Run wire/conduit from panel to garage' },
          { name: 'Secure wire with staples or mount conduit' },
          { name: 'Drill through walls/framing as needed' },
          { name: 'Pull wire through conduit (if applicable)' },
        ],
        materials: [
          { name: '50A double-pole breaker', estimatedCost: 25, category: 'Breakers' },
          { name: 'Conduit & fittings (if required)', estimatedCost: 60, category: 'Conduit', optional: true },
          { name: 'Cable staples / straps', estimatedCost: 10, category: 'Fasteners' },
        ],
      },
      {
        name: 'Charger Mounting',
        estimatedDays: 0.25,
        description: 'Mount charger or outlet on wall.',
        tasks: [
          { name: 'Mount charger bracket to wall' },
          { name: 'Install NEMA 14-50 outlet (if plug-in charger)' },
          { name: 'Hardwire charger (if hardwired model)', optional: true },
          { name: 'Secure charger unit to bracket' },
        ],
        materials: [
          { name: 'NEMA 14-50 outlet & cover', estimatedCost: 25, category: 'Devices' },
          { name: 'Mounting hardware (lag bolts)', estimatedCost: 10, category: 'Hardware' },
        ],
      },
      {
        name: 'Connection & Test',
        estimatedDays: 0.25,
        description: 'Wire charger, energize circuit, test charging.',
        inspectionRequired: 'Electrical inspection',
        tasks: [
          { name: 'Terminate wires at charger/outlet' },
          { name: 'Terminate wires at panel breaker' },
          { name: 'Energize circuit — verify voltage (240V)' },
          { name: 'Plug in charger — verify indicator lights' },
          { name: 'Test charge with vehicle (if available)' },
          { name: 'Call for inspection' },
          { name: 'Clean up work area' },
          { name: 'Walk customer through charger operation' },
        ],
        materials: [
          { name: 'Wire nuts / connectors', estimatedCost: 5, category: 'Supplies' },
          { name: 'Permit fee', estimatedCost: 75, category: 'Permits', optional: true },
        ],
      },
    ],
  },

  // ── GENERATOR INSTALL ────────────────────────────────────────────────
  {
    id: 'generator_install',
    name: 'Generator Install',
    icon: 'power-outline',
    category: 'Generator',
    trade: 'electrical',
    description: 'Install whole-home standby generator with automatic transfer switch and gas line.',
    estimatedDays: 2,
    estimatedBudgetLow: 7000,
    estimatedBudgetHigh: 12000,
    phases: [
      {
        name: 'Site Prep & Pad',
        estimatedDays: 1,
        description: 'Pour or set concrete pad, determine placement per code clearances.',
        tasks: [
          { name: 'Verify placement meets code clearances (5ft from openings)' },
          { name: 'Level ground for pad' },
          { name: 'Pour or set concrete pad' },
          { name: 'Allow pad to cure (or use prefab)' },
          { name: 'Pull permits (electrical + gas)' },
        ],
        materials: [
          { name: 'Standby generator (14-22kW)', estimatedCost: 4500, category: 'Equipment' },
          { name: 'Concrete pad (prefab or poured)', estimatedCost: 120, category: 'Foundation' },
          { name: 'Permit fees (electrical + gas)', estimatedCost: 200, category: 'Permits' },
        ],
      },
      {
        name: 'Gas Line Run',
        estimatedDays: 1,
        description: 'Run dedicated gas line from meter to generator.',
        inspectionRequired: 'Gas line inspection',
        tasks: [
          { name: 'Determine gas line size per BTU rating' },
          { name: 'Tap into gas supply near meter' },
          { name: 'Run gas line to generator location' },
          { name: 'Install gas shut-off valve at generator' },
          { name: 'Pressure test gas line' },
          { name: 'Check all joints with leak detector' },
        ],
        materials: [
          { name: 'Gas pipe (black iron or CSST)', estimatedCost: 180, category: 'Gas' },
          { name: 'Gas fittings & shut-off valve', estimatedCost: 55, category: 'Gas' },
          { name: 'Pipe thread sealant', estimatedCost: 10, category: 'Supplies' },
        ],
      },
      {
        name: 'Electrical Connection',
        estimatedDays: 1,
        description: 'Run power cable from generator to transfer switch location.',
        tasks: [
          { name: 'Run conduit from generator to house' },
          { name: 'Pull power wires through conduit' },
          { name: 'Connect wires at generator junction box' },
          { name: 'Set generator on pad' },
          { name: 'Connect gas line to generator' },
        ],
        materials: [
          { name: 'Conduit & fittings (outdoor rated)', estimatedCost: 85, category: 'Conduit' },
          { name: 'THHN wire (per run)', estimatedCost: 120, category: 'Wire' },
          { name: 'Weatherproof connectors', estimatedCost: 20, category: 'Fittings' },
        ],
      },
      {
        name: 'Transfer Switch Install',
        estimatedDays: 0.25,
        description: 'Install automatic transfer switch adjacent to main panel.',
        inspectionRequired: 'Electrical inspection',
        tasks: [
          { name: 'Mount transfer switch next to main panel' },
          { name: 'Connect utility power feed through transfer switch' },
          { name: 'Connect generator feed to transfer switch' },
          { name: 'Connect load wires to selected circuits' },
          { name: 'Torque all connections to spec' },
        ],
        materials: [
          { name: 'Automatic transfer switch (200A)', estimatedCost: 900, category: 'Equipment' },
          { name: 'Breakers for transfer switch', estimatedCost: 80, category: 'Breakers' },
        ],
      },
      {
        name: 'Startup & Programming',
        estimatedDays: 0.25,
        description: 'Commission generator, program transfer switch, test automatic operation.',
        tasks: [
          { name: 'Start generator — verify operation' },
          { name: 'Program transfer switch (delay, exercise schedule)' },
          { name: 'Simulate power outage — test automatic transfer' },
          { name: 'Verify all selected circuits receive power' },
          { name: 'Test transfer back to utility power' },
          { name: 'Set weekly exercise schedule' },
          { name: 'Register warranty' },
          { name: 'Train customer on operation & maintenance' },
          { name: 'Clean up work area' },
        ],
        materials: [
          { name: 'Battery (if not included)', estimatedCost: 45, category: 'Parts', optional: true },
        ],
      },
    ],
  },

  // ── LIGHTING OVERHAUL ────────────────────────────────────────────────
  {
    id: 'lighting_overhaul',
    name: 'Lighting Overhaul',
    icon: 'bulb-outline',
    category: 'Lighting',
    trade: 'electrical',
    description: 'Complete lighting redesign — remove old fixtures, run new circuits, install recessed and LED lighting with dimmer controls.',
    estimatedDays: 3,
    estimatedBudgetLow: 3000,
    estimatedBudgetHigh: 6000,
    phases: [
      {
        name: 'Design & Layout',
        estimatedDays: 1,
        description: 'Design lighting layout, select fixtures, plan circuit requirements.',
        tasks: [
          { name: 'Walk rooms with customer — discuss needs' },
          { name: 'Design lighting layout (recessed, pendant, accent)' },
          { name: 'Mark fixture locations on ceiling' },
          { name: 'Plan switch locations & groupings' },
          { name: 'Calculate circuit loads' },
        ],
        materials: [
          { name: 'Recessed LED cans (12-20)', estimatedCost: 360, category: 'Fixtures' },
          { name: 'LED fixtures (pendant / flush mount)', estimatedCost: 400, category: 'Fixtures' },
        ],
      },
      {
        name: 'Old Fixture Removal',
        estimatedDays: 1,
        description: 'Remove existing fixtures, switches, and outdated wiring.',
        tasks: [
          { name: 'Turn off circuits at panel' },
          { name: 'Remove old ceiling fixtures' },
          { name: 'Remove old switches & dimmers' },
          { name: 'Cap existing wires safely' },
          { name: 'Remove any abandoned junction boxes' },
        ],
        materials: [
          { name: 'Wire nuts (assorted)', estimatedCost: 10, category: 'Supplies' },
          { name: 'Blank cover plates (for abandoned boxes)', estimatedCost: 8, category: 'Trim' },
        ],
      },
      {
        name: 'New Circuit Runs',
        estimatedDays: 1,
        description: 'Run new circuits for lighting zones.',
        inspectionRequired: 'Rough-in electrical inspection',
        tasks: [
          { name: 'Cut holes for recessed cans' },
          { name: 'Run new wire from panel for lighting circuits' },
          { name: 'Run switch legs to each lighting group' },
          { name: 'Install new junction boxes where needed' },
          { name: 'Pull wires to each fixture location' },
          { name: 'Call for rough-in inspection' },
        ],
        materials: [
          { name: 'NM-B 14/2 wire (250ft)', estimatedCost: 55, category: 'Wire' },
          { name: 'Junction boxes (assorted)', estimatedCost: 30, category: 'Boxes' },
          { name: 'Wire staples', estimatedCost: 10, category: 'Fasteners' },
        ],
      },
      {
        name: 'Fixture Install',
        estimatedDays: 1,
        description: 'Install all new fixtures, make connections.',
        tasks: [
          { name: 'Install recessed cans & LED modules' },
          { name: 'Install pendant / flush-mount fixtures' },
          { name: 'Install under-cabinet lighting', optional: true },
          { name: 'Wire all fixture connections' },
          { name: 'Install trim rings on recessed cans' },
        ],
        materials: [
          { name: 'Trim rings / baffles', estimatedCost: 60, category: 'Trim' },
          { name: 'Under-cabinet LED strips', estimatedCost: 80, category: 'Fixtures', optional: true },
          { name: 'Mounting hardware', estimatedCost: 15, category: 'Hardware' },
        ],
      },
      {
        name: 'Controls & Dimming',
        estimatedDays: 1,
        description: 'Install dimmers, smart switches, test all lighting zones.',
        tasks: [
          { name: 'Install dimmer switches' },
          { name: 'Install smart switches', optional: true },
          { name: 'Install cover plates (decorator style)' },
          { name: 'Test each lighting zone independently' },
          { name: 'Verify dimming range on all fixtures' },
          { name: 'Program smart switches / scenes', optional: true },
          { name: 'Clean up all work areas' },
          { name: 'Walk customer through switches & controls' },
        ],
        materials: [
          { name: 'Dimmer switches (6-10)', estimatedCost: 180, category: 'Controls' },
          { name: 'Decorator cover plates', estimatedCost: 35, category: 'Trim' },
          { name: 'Smart switches', estimatedCost: 120, category: 'Controls', optional: true },
        ],
      },
    ],
  },

  // ── SMART HOME WIRING ────────────────────────────────────────────────
  {
    id: 'smart_home_wiring',
    name: 'Smart Home Wiring',
    icon: 'wifi-outline',
    category: 'Low Voltage',
    trade: 'electrical',
    description: 'Structured wiring for smart home — Cat6, coax, HDMI, network cabinet, and smart device install.',
    estimatedDays: 4,
    estimatedBudgetLow: 4000,
    estimatedBudgetHigh: 8000,
    phases: [
      {
        name: 'Planning & Scope',
        estimatedDays: 1,
        description: 'Plan network layout, identify drop locations, design cable runs.',
        tasks: [
          { name: 'Walk home with customer — identify drop locations' },
          { name: 'Plan network cabinet location' },
          { name: 'Design cable topology (home runs to cabinet)' },
          { name: 'Identify smart device locations (switches, cameras)' },
          { name: 'Order materials & specialty cables' },
        ],
        materials: [
          { name: 'Cat6 cable (1000ft box)', estimatedCost: 180, category: 'Cable' },
          { name: 'RG6 coax cable (500ft)', estimatedCost: 80, category: 'Cable' },
        ],
      },
      {
        name: 'Low-Voltage Runs',
        estimatedDays: 1.5,
        description: 'Run all low-voltage cabling from cabinet to each location.',
        tasks: [
          { name: 'Cut low-voltage bracket openings' },
          { name: 'Run Cat6 to each network drop (2 per room)' },
          { name: 'Run Cat6 to each WAP (wireless access point) location' },
          { name: 'Run coax to TV locations' },
          { name: 'Run HDMI / conduit for media locations', optional: true },
          { name: 'Label every cable at both ends' },
          { name: 'Secure and support all cable runs' },
        ],
        materials: [
          { name: 'HDMI cables / conduit for media', estimatedCost: 60, category: 'Cable', optional: true },
          { name: 'Low-voltage brackets (20-30)', estimatedCost: 40, category: 'Boxes' },
          { name: 'Cable ties & velcro straps', estimatedCost: 20, category: 'Supplies' },
          { name: 'Cable labels / tags', estimatedCost: 15, category: 'Supplies' },
        ],
      },
      {
        name: 'Network Cabinet',
        estimatedDays: 1,
        description: 'Install structured media cabinet, patch panels, and switch.',
        tasks: [
          { name: 'Mount network rack / cabinet to wall' },
          { name: 'Install patch panel' },
          { name: 'Terminate all Cat6 cables at patch panel' },
          { name: 'Install network switch' },
          { name: 'Install coax splitter / MoCA adapter', optional: true },
          { name: 'Organize & dress cables neatly' },
        ],
        materials: [
          { name: 'Network rack (small wall-mount)', estimatedCost: 120, category: 'Equipment' },
          { name: 'Patch panel (24-port)', estimatedCost: 45, category: 'Network' },
          { name: 'Network switch (managed, 24-port)', estimatedCost: 150, category: 'Network' },
          { name: 'Patch cables (assorted)', estimatedCost: 30, category: 'Network' },
        ],
      },
      {
        name: 'Device Install',
        estimatedDays: 1,
        description: 'Install wall plates, smart switches, WAPs, and cameras.',
        tasks: [
          { name: 'Terminate Cat6 at wall plates (keystones)' },
          { name: 'Install wall plates at each location' },
          { name: 'Mount wireless access points' },
          { name: 'Install smart switches (Lutron, etc.)', optional: true },
          { name: 'Install smart hub / controller' },
          { name: 'Mount cameras (if included)', optional: true },
        ],
        materials: [
          { name: 'Keystone jacks (Cat6)', estimatedCost: 40, category: 'Network' },
          { name: 'Wall plates (1-4 port)', estimatedCost: 35, category: 'Trim' },
          { name: 'Smart switches / dimmers', estimatedCost: 300, category: 'Smart Home', optional: true },
          { name: 'Smart hub', estimatedCost: 100, category: 'Smart Home' },
        ],
      },
      {
        name: 'Programming & Testing',
        estimatedDays: 1,
        description: 'Test every cable run, configure network, program smart devices.',
        tasks: [
          { name: 'Certify / test every Cat6 run' },
          { name: 'Test every coax run' },
          { name: 'Configure network switch & VLANs', optional: true },
          { name: 'Configure wireless access points' },
          { name: 'Pair & program smart devices' },
          { name: 'Test smart home scenes / automations' },
          { name: 'Clean up all work areas' },
          { name: 'Train customer on system' },
          { name: 'Provide network documentation' },
        ],
        materials: [
          { name: 'Cable certifier / tester', estimatedCost: 0, category: 'Tools' },
          { name: 'Conduit (spare runs for future)', estimatedCost: 25, category: 'Conduit', optional: true },
        ],
      },
    ],
  },
];

/**
 * Convert a template into a project data structure ready for creation
 */
export function templateToProject(
  template: ProjectTemplate,
  customer: { id: string; firstName: string; lastName: string; phone?: string },
  property: { id: string; street: string; city: string; state: string; zip: string },
  options?: {
    budget?: number;
    startDate?: Date;
    notes?: string;
    removedTaskIds?: Set<string>;
  }
): any {
  const startDate = options?.startDate || new Date();
  let currentDate = new Date(startDate);

  const phases = template.phases.map((phase, phaseIdx) => {
    const phaseStart = new Date(currentDate);
    const phaseDays = Math.ceil(phase.estimatedDays);
    currentDate.setDate(currentDate.getDate() + phaseDays);
    const phaseEnd = new Date(currentDate);

    return {
      id: `phase_${phaseIdx + 1}`,
      name: phase.name,
      status: 'NOT_STARTED' as const,
      sortOrder: phaseIdx + 1,
      startDate: phaseStart.toISOString(),
      endDate: phaseEnd.toISOString(),
      estimatedDays: phase.estimatedDays,
      actualDays: null,
      description: phase.description,
      inspectionRequired: phase.inspectionRequired || null,
      tasks: phase.tasks.map((task, taskIdx) => ({
        id: `t${phaseIdx + 1}_${taskIdx + 1}`,
        name: task.name,
        done: false,
        optional: task.optional || false,
      })),
      materials: phase.materials.map((mat) => ({
        name: mat.name,
        cost: mat.estimatedCost,
        category: mat.category,
        purchased: false,
        optional: mat.optional || false,
      })),
      laborHours: 0,
      laborRate: 95,
    };
  });

  return {
    id: `proj_${Date.now()}`,
    name: `${template.name} — ${customer.lastName || (customer as any).last_name || ''}`,
    status: 'NOT_STARTED',
    templateId: template.id,
    customer,
    property,
    startDate: startDate.toISOString(),
    targetEndDate: currentDate.toISOString(),
    budget: options?.budget || Math.round((template.estimatedBudgetLow + template.estimatedBudgetHigh) / 2),
    totalSpent: 0,
    description: template.description,
    notes: options?.notes || '',
    phases,
  };
}

/**
 * Get all templates for a specific trade
 */
export function getTemplatesForTrade(trade: TradeId): ProjectTemplate[] {
  return PROJECT_TEMPLATES.filter(t => t.trade === trade);
}
