/**
 * Seed the project_templates / template_phases / template_tasks /
 * template_materials tables in Supabase from src/lib/projectTemplates.ts.
 *
 * Idempotent: every row uses a deterministic id derived from the template
 * id and sort order, so re-running the script applies any TS edits to
 * Supabase without creating duplicates. Stale rows are deleted explicitly
 * (via the foreign-key cascade on project_templates) when a template is
 * removed from TS.
 *
 * Usage (from web/):
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... npx tsx scripts/seed-template-library.ts
 *
 * The service role key bypasses RLS so this script is the only writer of
 * the template tables. Get it from the Supabase dashboard
 * (Settings → API → service_role / secret).
 */

import { createClient } from '@supabase/supabase-js';
import { PROJECT_TEMPLATES } from '../src/lib/projectTemplates';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://besbtasjpqmfqjkudmgu.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var.');
  console.error('Get it from Supabase dashboard → Settings → API → service_role.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log(`Seeding ${PROJECT_TEMPLATES.length} templates → ${SUPABASE_URL}`);

  // Build flat row arrays so we can bulk-upsert each table in one trip.
  const templateRows: any[] = [];
  const phaseRows: any[] = [];
  const taskRows: any[] = [];
  const materialRows: any[] = [];

  PROJECT_TEMPLATES.forEach((t, templateIdx) => {
    templateRows.push({
      id: t.id,
      name: t.name,
      icon: t.icon,
      category: t.category,
      trade: t.trade,
      description: t.description,
      estimated_days: t.estimatedDays,
      estimated_budget_low: t.estimatedBudgetLow,
      estimated_budget_high: t.estimatedBudgetHigh,
      sort_order: templateIdx,
    });

    t.phases.forEach((phase, phaseIdx) => {
      const phaseId = `${t.id}__${phaseIdx + 1}`;
      phaseRows.push({
        id: phaseId,
        template_id: t.id,
        name: phase.name,
        sort_order: phaseIdx + 1,
        estimated_days: phase.estimatedDays,
        description: phase.description,
        inspection_required: phase.inspectionRequired ?? null,
      });

      phase.tasks.forEach((task, taskIdx) => {
        taskRows.push({
          id: `${phaseId}__t${taskIdx + 1}`,
          phase_id: phaseId,
          name: task.name,
          sort_order: taskIdx + 1,
          optional: !!task.optional,
        });
      });

      phase.materials.forEach((mat, matIdx) => {
        materialRows.push({
          id: `${phaseId}__m${matIdx + 1}`,
          phase_id: phaseId,
          name: mat.name,
          estimated_cost: mat.estimatedCost,
          category: mat.category,
          optional: !!mat.optional,
          sort_order: matIdx + 1,
        });
      });
    });
  });

  console.log(`  → ${templateRows.length} templates, ${phaseRows.length} phases, ${taskRows.length} tasks, ${materialRows.length} materials`);

  // Order matters because of FKs: templates → phases → tasks/materials.
  // Wipe-then-fill is the simplest way to get strict consistency with the
  // TS file (handles deletions/renames). Cascading deletes from
  // project_templates take care of phases/tasks/materials in one shot.
  console.log('Wiping existing rows…');
  {
    const { error } = await supabase.from('project_templates').delete().neq('id', '___never___');
    if (error) throw error;
  }

  // Re-insert in dependency order.
  console.log('Inserting templates…');
  for (const chunk of chunks(templateRows, 100)) {
    const { error } = await supabase.from('project_templates').upsert(chunk);
    if (error) throw error;
  }

  console.log('Inserting phases…');
  for (const chunk of chunks(phaseRows, 200)) {
    const { error } = await supabase.from('template_phases').upsert(chunk);
    if (error) throw error;
  }

  console.log('Inserting tasks…');
  for (const chunk of chunks(taskRows, 500)) {
    const { error } = await supabase.from('template_tasks').upsert(chunk);
    if (error) throw error;
  }

  console.log('Inserting materials…');
  for (const chunk of chunks(materialRows, 500)) {
    const { error } = await supabase.from('template_materials').upsert(chunk);
    if (error) throw error;
  }

  console.log('Done. Verify counts in Supabase Studio.');
}

function chunks<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
