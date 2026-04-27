-- Template Library Migration
--
-- Moves the project-template catalog (Bathroom Remodel, Whole-House Repipe,
-- Panel Upgrade 200A, etc.) out of duplicated TypeScript files in apps/mobile
-- and src/lib and into Supabase as a single source of truth.
--
-- Both surfaces (web sub view, mobile create-project flow) now fetch from
-- these tables at runtime, so adding/editing a template anywhere takes
-- effect everywhere — no app rebuild, no version drift.
--
-- The TS files (apps/mobile/lib/projectTemplates.ts and
-- src/lib/projectTemplates.ts) become the "authoring format": when an
-- engineer adds a template, they edit the TS, then run the seed script
-- (scripts/seed-template-library.ts) which idempotently upserts every row
-- in this schema.
--
-- All four tables use TEXT primary keys (slugged template ids like
-- 'bathroom_remodel') instead of UUIDs so the TS authoring format and
-- the Supabase storage stay 1:1 readable. Phase/task/material rows use
-- composite-style ids derived from their parent so re-seeds are
-- deterministic.

-- ── 1. project_templates ───────────────────────────────────────────────
-- Top-level catalog row. One per template (Bathroom Remodel, etc).

CREATE TABLE IF NOT EXISTS project_templates (
  id TEXT PRIMARY KEY,                    -- e.g. 'bathroom_remodel'
  name TEXT NOT NULL,                     -- 'Bathroom Remodel'
  icon TEXT,                              -- Ionicons name; web ignores
  category TEXT,                          -- 'Remodel' / 'Replace' / 'Install'
  trade TEXT NOT NULL,                    -- 'plumbing' | 'hvac' | 'electrical'
  description TEXT,
  estimated_days INTEGER DEFAULT 0,
  estimated_budget_low NUMERIC DEFAULT 0,
  estimated_budget_high NUMERIC DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_templates_trade_idx ON project_templates(trade);

-- ── 2. template_phases ─────────────────────────────────────────────────
-- Each template has 1+ phases (Demo & Rough-In, Tile Installation, etc).

CREATE TABLE IF NOT EXISTS template_phases (
  id TEXT PRIMARY KEY,                    -- '<template_id>__<sort_order>' e.g. 'bathroom_remodel__1'
  template_id TEXT REFERENCES project_templates(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  estimated_days INTEGER DEFAULT 0,
  description TEXT,
  inspection_required TEXT                -- nullable
);

CREATE INDEX IF NOT EXISTS template_phases_template_idx ON template_phases(template_id, sort_order);

-- ── 3. template_tasks ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS template_tasks (
  id TEXT PRIMARY KEY,                    -- '<phase_id>__<task_sort_order>'
  phase_id TEXT REFERENCES template_phases(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  optional BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS template_tasks_phase_idx ON template_tasks(phase_id, sort_order);

-- ── 4. template_materials ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS template_materials (
  id TEXT PRIMARY KEY,                    -- '<phase_id>__m<sort_order>'
  phase_id TEXT REFERENCES template_phases(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  estimated_cost NUMERIC DEFAULT 0,
  category TEXT,
  optional BOOLEAN DEFAULT false,
  sort_order INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS template_materials_phase_idx ON template_materials(phase_id, sort_order);

-- ── RLS ────────────────────────────────────────────────────────────────
--
-- The catalog is read-only for everyone authenticated. The seed script
-- (run with the service-role key, which bypasses RLS) is the only writer.
-- We keep policies permissive on read because templates aren't sensitive
-- — they're a public product catalog, just gated behind a login.

ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "templates readable by authed users" ON project_templates;
CREATE POLICY "templates readable by authed users" ON project_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "template phases readable by authed users" ON template_phases;
CREATE POLICY "template phases readable by authed users" ON template_phases
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "template tasks readable by authed users" ON template_tasks;
CREATE POLICY "template tasks readable by authed users" ON template_tasks
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "template materials readable by authed users" ON template_materials;
CREATE POLICY "template materials readable by authed users" ON template_materials
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ── updated_at trigger on project_templates ────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at_project_templates()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS project_templates_updated_at ON project_templates;
CREATE TRIGGER project_templates_updated_at
  BEFORE UPDATE ON project_templates
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_project_templates();
