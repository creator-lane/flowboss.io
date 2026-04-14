-- Zones for GC projects (Kitchen, Bathroom 1, etc.)
CREATE TABLE IF NOT EXISTS gc_project_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gc_project_id UUID REFERENCES gc_projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  zone_type TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE gc_project_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Zone access via project" ON gc_project_zones
  FOR ALL USING (
    gc_project_id IN (
      SELECT id FROM gc_projects WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      ) OR created_by = auth.uid()
    )
  );

-- Link trades to zones
ALTER TABLE gc_project_trades ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES gc_project_zones(id);

-- Structure metadata on projects
ALTER TABLE gc_projects ADD COLUMN IF NOT EXISTS structure_type TEXT;
ALTER TABLE gc_projects ADD COLUMN IF NOT EXISTS sq_footage INTEGER;
ALTER TABLE gc_projects ADD COLUMN IF NOT EXISTS bedrooms INTEGER;
ALTER TABLE gc_projects ADD COLUMN IF NOT EXISTS bathrooms INTEGER;
ALTER TABLE gc_projects ADD COLUMN IF NOT EXISTS stories INTEGER;
