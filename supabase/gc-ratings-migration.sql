CREATE TABLE IF NOT EXISTS gc_trade_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES gc_project_trades(id) ON DELETE CASCADE NOT NULL,
  gc_project_id UUID REFERENCES gc_projects(id) ON DELETE CASCADE NOT NULL,
  sub_user_id UUID REFERENCES auth.users(id),
  rated_by UUID REFERENCES auth.users(id) NOT NULL,
  timeliness INTEGER CHECK (timeliness BETWEEN 1 AND 5) NOT NULL,
  quality INTEGER CHECK (quality BETWEEN 1 AND 5) NOT NULL,
  communication INTEGER CHECK (communication BETWEEN 1 AND 5) NOT NULL,
  budget_adherence INTEGER CHECK (budget_adherence BETWEEN 1 AND 5) NOT NULL,
  overall INTEGER CHECK (overall BETWEEN 1 AND 5) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE gc_trade_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rating access" ON gc_trade_ratings
  FOR ALL USING (
    rated_by = auth.uid()
    OR gc_project_id IN (SELECT id FROM gc_projects WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  );
