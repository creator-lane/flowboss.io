-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'member',
  status TEXT DEFAULT 'invited',
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team access for org members" ON team_members
  FOR ALL USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
    OR org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
  );

-- Digest preferences on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS digest_frequency TEXT DEFAULT 'none';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS digest_email TEXT;
