-- FlowBoss GC/Sub System — Run in Supabase SQL Editor
-- This adds tables for the GC macro project management system.
-- These are NEW tables — no existing tables are modified.

-- Organizations (account grouping)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL DEFAULT 'individual',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own orgs" ON organizations
  FOR ALL USING (owner_id = auth.uid());

-- Organization members
CREATE TABLE IF NOT EXISTS org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'invited',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ,
  UNIQUE(org_id, user_id)
);
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can see their orgs" ON org_members
  FOR SELECT USING (user_id = auth.uid() OR org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));
CREATE POLICY "Org owners can manage members" ON org_members
  FOR ALL USING (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- GC Projects (the macro project)
CREATE TABLE IF NOT EXISTS gc_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning',
  customer_name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  budget NUMERIC,
  start_date DATE,
  target_end_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE gc_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "GC project access" ON gc_projects
  FOR ALL USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active')
    OR created_by = auth.uid()
  );

-- GC Project Trades (each trade/sub assigned)
CREATE TABLE IF NOT EXISTS gc_project_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gc_project_id UUID REFERENCES gc_projects(id) ON DELETE CASCADE NOT NULL,
  trade TEXT NOT NULL,
  assigned_org_id UUID REFERENCES organizations(id),
  assigned_user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'not_started',
  budget NUMERIC,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE
);
ALTER TABLE gc_project_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trade access for GC members" ON gc_project_trades
  FOR ALL USING (
    gc_project_id IN (SELECT id FROM gc_projects WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
    OR assigned_user_id = auth.uid()
  );

-- GC Project Tasks
CREATE TABLE IF NOT EXISTS gc_project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES gc_project_trades(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  done BOOLEAN DEFAULT false,
  assigned_to UUID REFERENCES auth.users(id),
  due_date DATE,
  sort_order INTEGER DEFAULT 0
);
ALTER TABLE gc_project_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Task access via trade" ON gc_project_tasks
  FOR ALL USING (
    trade_id IN (
      SELECT id FROM gc_project_trades WHERE
        gc_project_id IN (SELECT id FROM gc_projects WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
        OR assigned_user_id = auth.uid()
    )
  );

-- GC Project Messages
CREATE TABLE IF NOT EXISTS gc_project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gc_project_id UUID REFERENCES gc_projects(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  trade_id UUID REFERENCES gc_project_trades(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE gc_project_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Message access for project members" ON gc_project_messages
  FOR ALL USING (
    gc_project_id IN (SELECT id FROM gc_projects WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
    OR sender_id = auth.uid()
  );

-- Also add subscription fields to profiles (for web billing)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_provider TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;
