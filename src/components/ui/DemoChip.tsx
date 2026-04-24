import { Sparkles } from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────
// DemoChip — small pill that labels sample/seed data so users don't
// confuse it with their real records.
//
// Detection is tolerant: records are considered demo if they either
//   (a) have an is_demo === true column, OR
//   (b) have notes starting with "Sample data" (the seed script's marker).
// That way the chip works before the is_demo migration runs as well as
// after.
// ──────────────────────────────────────────────────────────────────────

export function isDemoRecord(rec: unknown): boolean {
  if (!rec || typeof rec !== 'object') return false;
  const r = rec as Record<string, unknown>;
  if (r.is_demo === true || r.isDemo === true) return true;
  const notes = r.notes;
  if (typeof notes === 'string' && /^sample data/i.test(notes.trim())) {
    return true;
  }
  return false;
}

interface DemoChipProps {
  className?: string;
  /** When set, only render if this record looks like demo data. */
  record?: unknown;
  compact?: boolean;
}

export function DemoChip({ className = '', record, compact = false }: DemoChipProps) {
  if (record !== undefined && !isDemoRecord(record)) return null;

  return (
    <span
      title="Sample data — safe to delete from Settings → Sample Data"
      className={`inline-flex items-center gap-1 ${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'} rounded-full font-semibold bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/30 ${className}`}
    >
      <Sparkles className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      Sample
    </span>
  );
}
