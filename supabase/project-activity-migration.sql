-- Project Activity Feed
-- Logs activity-worthy events on GC projects for a realtime feed.

CREATE TABLE IF NOT EXISTS project_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gc_project_id UUID REFERENCES gc_projects(id) ON DELETE CASCADE NOT NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT,
  event_type TEXT NOT NULL,
  -- 'task_completed', 'photo_uploaded', 'hours_logged',
  -- 'invoice_sent', 'invoice_paid', 'sub_invited', 'sub_accepted',
  -- 'trade_completed', 'draw_requested', 'note_added'
  trade_id UUID REFERENCES gc_project_trades(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES gc_project_zones(id) ON DELETE SET NULL,
  summary TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_activity_project
  ON project_activity(gc_project_id, created_at DESC);

ALTER TABLE project_activity ENABLE ROW LEVEL SECURITY;

-- RLS: project owner + any assigned sub can read
DROP POLICY IF EXISTS "Project members can read activity" ON project_activity;
CREATE POLICY "Project members can read activity" ON project_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gc_projects p
      WHERE p.id = gc_project_id
        AND (
          p.org_id IN (
            SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'
          )
          OR p.created_by = auth.uid()
        )
    )
    OR EXISTS (
      SELECT 1 FROM gc_project_trades t
      WHERE t.gc_project_id = project_activity.gc_project_id
        AND t.assigned_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Project members can insert activity" ON project_activity;
CREATE POLICY "Project members can insert activity" ON project_activity
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM gc_projects p
      WHERE p.id = gc_project_id
        AND (
          p.org_id IN (
            SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'
          )
          OR p.created_by = auth.uid()
        )
    )
    OR EXISTS (
      SELECT 1 FROM gc_project_trades t
      WHERE t.gc_project_id = project_activity.gc_project_id
        AND t.assigned_user_id = auth.uid()
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE project_activity;
