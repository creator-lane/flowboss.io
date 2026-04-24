import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Trash2, Plus, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { generateSeedData } from '../../lib/seedData';
import { useToast } from '../ui/Toast';
import { isDemoRecord } from '../ui/DemoChip';

// ──────────────────────────────────────────────────────────────────────
// SampleDataPanel — user-facing controls for seed/demo data:
//   • See how many sample records currently live in the account
//   • Wipe them in one tap (DB RPC if migration is live, fallback to
//     per-record deletes by the "Sample data" notes marker)
//   • Load a fresh set of sample data tied to the current trade
//
// Designed so contractors who switched from another tool can explore
// FlowBoss with realistic data, then wipe it before bringing on real
// customers — without fear of a mixed dataset.
// ──────────────────────────────────────────────────────────────────────

export function SampleDataPanel() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [wiping, setWiping] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.getCustomers(),
  });
  const { data: jobsData } = useQuery({
    queryKey: ['jobs', 'all'],
    queryFn: () => api.getTodaysJobs(undefined, 'all'),
  });
  const { data: invoicesData } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.getInvoices(),
  });

  const customers = customersData?.data || [];
  const jobs = jobsData?.data || [];
  const invoices = invoicesData?.data || [];

  const demoCustomers = customers.filter(isDemoRecord);
  const demoJobs = jobs.filter(isDemoRecord);
  const demoInvoices = invoices.filter(isDemoRecord);
  const totalDemo = demoCustomers.length + demoJobs.length + demoInvoices.length;

  const trade = settingsData?.data?.trade || 'General Contractor';

  // Fallback wipe: walks known tables and deletes matching rows client-side.
  // Used when the wipe_sample_data RPC isn't deployed yet (pre-migration).
  async function fallbackWipe() {
    for (const inv of demoInvoices) {
      if (inv.id) await supabase.from('invoices').delete().eq('id', inv.id);
    }
    for (const j of demoJobs) {
      if (j.id) await supabase.from('jobs').delete().eq('id', j.id);
    }
    for (const c of demoCustomers) {
      if (c.id) await supabase.from('customers').delete().eq('id', c.id);
    }
  }

  async function handleWipe() {
    if (totalDemo === 0) {
      addToast('No sample data to wipe', 'info');
      return;
    }
    if (!confirm(`Delete ${totalDemo} sample record${totalDemo > 1 ? 's' : ''}? This cannot be undone.`)) {
      return;
    }
    setWiping(true);
    try {
      // Try the RPC first (fast, single round trip, includes properties).
      const { error } = await supabase.rpc('wipe_sample_data');
      if (error) {
        // RPC missing or failed → fall back to manual deletes so the
        // feature still works before the migration runs.
        await fallbackWipe();
      }
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      await queryClient.invalidateQueries({ queryKey: ['jobs'] });
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      addToast('Sample data cleared', 'success');
    } catch (err: any) {
      addToast(err?.message || 'Failed to wipe sample data', 'error');
    } finally {
      setWiping(false);
    }
  }

  async function handleLoad() {
    setLoading(true);
    try {
      await generateSeedData(trade);
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      await queryClient.invalidateQueries({ queryKey: ['jobs'] });
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      addToast('Sample data loaded', 'success');
    } catch (err: any) {
      addToast(err?.message || 'Failed to load sample data', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-50 border border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/30">
        <div className="w-9 h-9 rounded-lg bg-white dark:bg-white/10 ring-1 ring-violet-200 dark:ring-violet-400/30 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-300" />
        </div>
        <div className="flex-1 text-sm text-violet-900 dark:text-violet-100">
          <p className="font-semibold mb-0.5">Sample data</p>
          <p className="text-violet-800/80 dark:text-violet-200/80 text-xs">
            Realistic {trade.toLowerCase()} customers, jobs, and invoices so you can explore FlowBoss without typing a thing. Wipe it anytime — real customer data is never touched.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Customers" value={demoCustomers.length} />
        <StatCard label="Jobs" value={demoJobs.length} />
        <StatCard label="Invoices" value={demoInvoices.length} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleLoad}
          disabled={loading || wiping}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {totalDemo > 0 ? 'Add more sample data' : 'Load sample data'}
        </button>
        <button
          type="button"
          onClick={handleWipe}
          disabled={wiping || loading || totalDemo === 0}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white dark:bg-white/5 text-red-700 dark:text-red-300 text-sm font-semibold border border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {wiping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Wipe sample data
        </button>
      </div>

      {totalDemo > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/30 text-xs text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Sample records are labeled with a <span className="font-semibold">Sample</span> chip across the app. Delete them before inviting a crew or sharing your account.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 p-3">
      <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
      <p className="text-xs text-neutral-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
