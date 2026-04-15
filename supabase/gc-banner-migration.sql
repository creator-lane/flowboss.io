ALTER TABLE gc_projects ADD COLUMN IF NOT EXISTS banner_message TEXT;
ALTER TABLE gc_projects ADD COLUMN IF NOT EXISTS banner_type TEXT DEFAULT 'info';
ALTER TABLE gc_projects ADD COLUMN IF NOT EXISTS banner_updated_at TIMESTAMPTZ;
ALTER TABLE gc_projects ADD COLUMN IF NOT EXISTS banner_set_by UUID REFERENCES auth.users(id);
