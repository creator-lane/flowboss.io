/**
 * One-shot generator: read PROJECT_TEMPLATES from src/lib/projectTemplates.ts
 * and emit a single SQL file with TRUNCATE + INSERT statements for the
 * project_templates / template_phases / template_tasks / template_materials
 * tables.
 *
 * The output is then applied via Supabase Management API (no service role
 * key required — the management endpoint already runs with elevated
 * privileges):
 *
 *   npx tsx scripts/generate-template-seed-sql.ts > supabase/template-library-data.sql
 *   SUPABASE_ACCESS_TOKEN=... npx supabase db query --linked \\
 *     --file supabase/template-library-data.sql
 *
 * This is the "publish to Supabase" half of the authoring flow. Engineers
 * edit src/lib/projectTemplates.ts; this script syncs the change into
 * production. Idempotent — wipes and refills, so removed/renamed
 * templates take effect.
 */

import { PROJECT_TEMPLATES } from '../src/lib/projectTemplates';

function esc(s: unknown): string {
  if (s === null || s === undefined) return 'NULL';
  if (typeof s === 'number' || typeof s === 'boolean') return String(s);
  return `'${String(s).replace(/'/g, "''")}'`;
}

const lines: string[] = [];
lines.push('-- AUTO-GENERATED — do not edit by hand');
lines.push('-- Source: src/lib/projectTemplates.ts');
lines.push('-- Generator: scripts/generate-template-seed-sql.ts');
lines.push('-- Cascading delete from project_templates wipes phases/tasks/materials');
lines.push('-- in one shot, so re-runs apply edits and removals cleanly.');
lines.push('');
lines.push('BEGIN;');
lines.push('');
lines.push('DELETE FROM project_templates;');
lines.push('');

PROJECT_TEMPLATES.forEach((t, templateIdx) => {
  lines.push(`-- ${t.name} (${t.trade})`);
  lines.push(
    `INSERT INTO project_templates (id, name, icon, category, trade, description, estimated_days, estimated_budget_low, estimated_budget_high, sort_order) VALUES (`
    + [
      esc(t.id),
      esc(t.name),
      esc(t.icon),
      esc(t.category),
      esc(t.trade),
      esc(t.description),
      esc(t.estimatedDays),
      esc(t.estimatedBudgetLow),
      esc(t.estimatedBudgetHigh),
      esc(templateIdx),
    ].join(', ')
    + ');',
  );

  t.phases.forEach((phase, phaseIdx) => {
    const phaseId = `${t.id}__${phaseIdx + 1}`;
    lines.push(
      `INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES (`
      + [
        esc(phaseId),
        esc(t.id),
        esc(phase.name),
        esc(phaseIdx + 1),
        esc(phase.estimatedDays),
        esc(phase.description),
        esc(phase.inspectionRequired ?? null),
      ].join(', ')
      + ');',
    );

    if (phase.tasks.length > 0) {
      const values = phase.tasks
        .map((task, taskIdx) =>
          `(${esc(`${phaseId}__t${taskIdx + 1}`)}, ${esc(phaseId)}, ${esc(task.name)}, ${esc(taskIdx + 1)}, ${esc(!!task.optional)})`
        )
        .join(',\n  ');
      lines.push(
        `INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES\n  ${values};`,
      );
    }

    if (phase.materials.length > 0) {
      const values = phase.materials
        .map((mat, matIdx) =>
          `(${esc(`${phaseId}__m${matIdx + 1}`)}, ${esc(phaseId)}, ${esc(mat.name)}, ${esc(mat.estimatedCost)}, ${esc(mat.category)}, ${esc(!!mat.optional)}, ${esc(matIdx + 1)})`
        )
        .join(',\n  ');
      lines.push(
        `INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES\n  ${values};`,
      );
    }
  });
  lines.push('');
});

lines.push('COMMIT;');

process.stdout.write(lines.join('\n'));
