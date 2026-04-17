-- Task notes migration
-- Adds a `notes TEXT` column to `phase_tasks` so sub note-taking persists
-- server-side (and is visible to the GC) instead of living in the sub's
-- localStorage where it was invisible and easy to lose.
--
-- Idempotent: safe to re-run.

ALTER TABLE phase_tasks
  ADD COLUMN IF NOT EXISTS notes TEXT;
