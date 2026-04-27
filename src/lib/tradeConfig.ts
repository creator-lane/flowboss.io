/**
 * Central trade configuration — single source of truth for all trade-specific content.
 * Components use useTrade() hook to access the config for the current user's trade.
 */

export type TradeId = 'plumbing' | 'hvac' | 'electrical';

export interface TradeCategory {
  name: string;
  regex: RegExp;
  icon: string;   // Ionicons name
  color: string;
}

export interface TradeConfig {
  id: TradeId;
  label: string;
  tagline: string;
  socialProof: string;
  welcomeSubtitle: string;
  categories: TradeCategory[];
  jobPlaceholder: string;
  pricebookLabel: string;
  defaultCompanySuffix: string;
  checklistOverrides: {
    routeOptimize: string;
    createProject: string;
    pricebookDesc: string;
  };
  guidedJobExample: string;
}

export const TRADE_CONFIGS: Record<TradeId, TradeConfig> = {
  plumbing: {
    id: 'plumbing',
    label: 'Plumbing',
    tagline: 'Built for plumbers',
    socialProof: 'Trusted by 500+ plumbing companies',
    welcomeSubtitle: 'The average plumber loses $2,400/month to slow invoicing, bad routing, and missed calls. FlowBoss fixes all of it.',
    categories: [
      { name: 'Water Heaters', regex: /water\s*heater|tank(less)?(\s+install)?|tank\s+flush|anode\s+rod/i, icon: 'flame-outline', color: '#ef4444' },
      { name: 'Drain Clearing', regex: /drain|snake|camera|jetting|sewer|hydro/i, icon: 'water-outline', color: '#3b82f6' },
      { name: 'Fixtures', regex: /faucet|toilet|disposal|shower\s*valve|fixture/i, icon: 'construct-outline', color: '#8b5cf6' },
      { name: 'Pipe & Repair', regex: /leak|pipe|repipe|slab|gas\s*line|supply\s*line|burst|backflow/i, icon: 'build-outline', color: '#f59e0b' },
    ],
    jobPlaceholder: 'Water heater replacement, leaking faucet, etc.',
    pricebookLabel: '24 common plumbing items',
    defaultCompanySuffix: 'Plumbing',
    checklistOverrides: {
      routeOptimize: 'With 2+ jobs on your schedule, tap "Optimize Route" in the action menu to save drive time. Most plumbers save 45 min/day.',
      createProject: 'Remodels, repipes, installs — track every phase, task, and material. Pick from 7 templates with 200+ auto-tasks.',
      pricebookDesc: 'We pre-loaded 24 common plumbing items. Edit the prices to match YOUR rates — they auto-fill on invoices.',
    },
    guidedJobExample: 'Water heater install',
  },

  hvac: {
    id: 'hvac',
    label: 'HVAC',
    tagline: 'Built for HVAC pros',
    socialProof: 'Trusted by 500+ HVAC companies',
    welcomeSubtitle: 'The average HVAC tech loses $2,400/month to slow invoicing, bad routing, and missed calls. FlowBoss fixes all of it.',
    categories: [
      { name: 'Maintenance', regex: /tune.up|filter|clean|seasonal|maintenance|flush|inspect/i, icon: 'settings-outline', color: '#16a34a' },
      { name: 'Repair', regex: /refrigerant|capacitor|compressor|blower|motor|contactor|coil|leak|repair|diagnos/i, icon: 'build-outline', color: '#ef4444' },
      { name: 'Install', regex: /install|replace|upgrade|new\s+system|heat\s+pump|mini.split|furnace|ac\s+unit|ductwork|duct\s+work/i, icon: 'hammer-outline', color: '#3b82f6' },
      { name: 'IAQ', regex: /air\s+quality|uv\s+light|dehumidif|humidif|purif|duct\s+seal|iaq|air\s+clean/i, icon: 'leaf-outline', color: '#8b5cf6' },
    ],
    jobPlaceholder: 'AC tune-up, furnace repair, thermostat install, etc.',
    pricebookLabel: '24 common HVAC items',
    defaultCompanySuffix: 'HVAC',
    checklistOverrides: {
      routeOptimize: 'With 2+ jobs on your schedule, tap "Optimize Route" in the action menu to save drive time. Most HVAC techs save 45 min/day.',
      createProject: 'System installs, ductwork, heat pumps — track every phase, task, and material. Pick from templates with auto-tasks.',
      pricebookDesc: 'We pre-loaded 24 common HVAC items. Edit the prices to match YOUR rates — they auto-fill on invoices.',
    },
    guidedJobExample: 'AC tune-up',
  },

  electrical: {
    id: 'electrical',
    label: 'Electrical',
    tagline: 'Built for electricians',
    socialProof: 'Trusted by 500+ electrical companies',
    welcomeSubtitle: 'The average electrician loses $2,400/month to slow invoicing, bad routing, and missed calls. FlowBoss fixes all of it.',
    categories: [
      { name: 'Outlets & Switches', regex: /outlet|switch|gfci|dimmer|receptacle|plug|junction/i, icon: 'radio-button-on-outline', color: '#f59e0b' },
      { name: 'Lighting', regex: /light|fixture|fan|recessed|chandelier|sconce|led|landscape\s+light|under.cabinet/i, icon: 'bulb-outline', color: '#eab308' },
      { name: 'Panel & Wiring', regex: /panel|breaker|circuit|rewire|wire|conduit|sub.panel|200\s*a|amp\s+service/i, icon: 'flash-outline', color: '#ef4444' },
      { name: 'Safety', regex: /smoke|carbon|detector|surge|ground\s*fault|arc\s*fault|gfci|afci/i, icon: 'shield-checkmark-outline', color: '#16a34a' },
      { name: 'Specialty', regex: /ev\s*charger|generator|solar|smart\s*home|low\s*voltage|data|security|camera|audio/i, icon: 'hardware-chip-outline', color: '#8b5cf6' },
    ],
    jobPlaceholder: 'Panel upgrade, outlet install, ceiling fan, etc.',
    pricebookLabel: '24 common electrical items',
    defaultCompanySuffix: 'Electric',
    checklistOverrides: {
      routeOptimize: 'With 2+ jobs on your schedule, tap "Optimize Route" in the action menu to save drive time. Most electricians save 45 min/day.',
      createProject: 'Panel upgrades, rewires, EV chargers — track every phase, task, and material. Pick from templates with auto-tasks.',
      pricebookDesc: 'We pre-loaded 24 common electrical items. Edit the prices to match YOUR rates — they auto-fill on invoices.',
    },
    guidedJobExample: 'Panel upgrade',
  },
};

/** Get config for a trade, with plumbing fallback */
export function getTradeConfig(trade: string | undefined | null): TradeConfig {
  return TRADE_CONFIGS[(trade as TradeId)] || TRADE_CONFIGS.plumbing;
}

/**
 * Normalize a trade label coming from the GC side of the web (which stores
 * human-friendly strings like "Plumbing", "Electrical", "HVAC") to the
 * lowercase TradeId the templates library uses. Returns null when we can't
 * confidently map — caller should fall through to "no templates yet."
 *
 * Kept here next to TRADE_CONFIGS so future trades only need a single entry.
 */
export function normalizeTradeLabel(label: string | undefined | null): TradeId | null {
  if (!label) return null;
  const k = label.trim().toLowerCase();
  if (!k) return null;
  if (k.includes('plumb')) return 'plumbing';
  if (k.includes('electric')) return 'electrical';
  if (k === 'hvac' || k.includes('hvac') || k.includes('heat') || k.includes('cool') || k.includes('air condition') || k.includes('mechanical')) return 'hvac';
  // Trades the GC supports today that aren't yet templated. Drywall,
  // Framing, Tile, etc. fall through and the picker shows a friendly
  // "templates coming for <Trade>" empty state.
  return null;
}
