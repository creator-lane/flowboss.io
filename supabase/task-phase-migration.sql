-- Add a real phase column to gc_project_tasks so the sub view can group
-- tasks by phase the way mobile does (collapsible accordion cards with
-- per-phase progress, materials, and labor cost).
--
-- Until now, templates encoded the phase in the task name as a prefix
-- ("Demo & Rough-In: Shut off water"). Workable but fragile, can't sort
-- or filter, can't show clean "Phase 2 of 5" UI. A nullable text column
-- keeps it cheap (no FK, no extra table) and matches the way phases are
-- already a denormalized concept tied to a single trade.
--
-- One-time backfill: every task whose name matches "<phase>: <name>"
-- where the prefix matches a phase from any project_templates.template_phases
-- gets the phase column populated and the prefix stripped. We anchor on
-- known phase names (rather than naive split-on-colon) so we don't
-- accidentally chop legitimate task names that happen to contain ": ".

ALTER TABLE gc_project_tasks ADD COLUMN IF NOT EXISTS phase TEXT;

CREATE INDEX IF NOT EXISTS gc_project_tasks_trade_phase_idx
  ON gc_project_tasks(trade_id, phase, sort_order);

-- Backfill: pull every distinct phase name we know about, then for each,
-- find tasks whose name starts with that phase + ": " and split it.
DO $$
DECLARE
  phase_name TEXT;
BEGIN
  FOR phase_name IN
    SELECT DISTINCT name FROM template_phases
  LOOP
    UPDATE gc_project_tasks
    SET phase = phase_name,
        name = substring(name FROM length(phase_name) + 3)  -- skip "Phase: "
    WHERE phase IS NULL
      AND name LIKE phase_name || ': %';
  END LOOP;
END $$;
