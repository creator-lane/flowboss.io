-- Project cover image: stored in a public bucket, referenced on gc_projects.
-- Public bucket because covers are hero images shown on the (authenticated)
-- dashboard and the (authenticated) sub view — we don't need signed URLs,
-- and public reads keep the dashboard snappy on slow connections.

-- 1. Column on gc_projects.
ALTER TABLE gc_projects
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- 2. Storage bucket (idempotent). 5 MB limit keeps phone-camera uploads sane
--    without forcing a client-side resize step for the MVP. We restrict MIME
--    types to common image formats so nobody accidentally uploads a HEIC the
--    browser can't render.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-covers',
  'project-covers',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. RLS policies on storage.objects for this bucket.
--    Pattern: objects are stored under `<organization_id>/<project_id>/<filename>`.
--    We key auth on the top-level prefix being the uploader's organization.

-- Drop existing policies first so this migration is re-runnable.
DROP POLICY IF EXISTS "project-covers read public" ON storage.objects;
DROP POLICY IF EXISTS "project-covers insert own org" ON storage.objects;
DROP POLICY IF EXISTS "project-covers update own org" ON storage.objects;
DROP POLICY IF EXISTS "project-covers delete own org" ON storage.objects;

-- Public read so <img src> works without auth headers (bucket is public).
CREATE POLICY "project-covers read public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-covers');

-- Insert: only members of the org in the first path segment.
CREATE POLICY "project-covers insert own org"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-covers'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT organization_id::TEXT
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Update: same org.
CREATE POLICY "project-covers update own org"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'project-covers'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT organization_id::TEXT
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Delete: same org.
CREATE POLICY "project-covers delete own org"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-covers'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT organization_id::TEXT
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
