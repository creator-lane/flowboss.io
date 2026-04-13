-- Materials tracking per GC project trade
CREATE TABLE IF NOT EXISTS gc_trade_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES gc_project_trades(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'ea',
  unit_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  markup_percent NUMERIC DEFAULT 0,
  customer_price NUMERIC DEFAULT 0,
  purchased BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE gc_trade_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Materials access via trade" ON gc_trade_materials
  FOR ALL USING (
    trade_id IN (
      SELECT id FROM gc_project_trades WHERE
        gc_project_id IN (SELECT id FROM gc_projects WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
        OR assigned_user_id = auth.uid()
    )
  );

-- Also add labor tracking columns to gc_project_trades if not exists
ALTER TABLE gc_project_trades ADD COLUMN IF NOT EXISTS labor_hours NUMERIC DEFAULT 0;
ALTER TABLE gc_project_trades ADD COLUMN IF NOT EXISTS labor_rate NUMERIC DEFAULT 0;
ALTER TABLE gc_project_trades ADD COLUMN IF NOT EXISTS materials_budget NUMERIC DEFAULT 0;
ALTER TABLE gc_project_trades ADD COLUMN IF NOT EXISTS overhead_percent NUMERIC DEFAULT 0;
