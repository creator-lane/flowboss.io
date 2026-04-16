import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { UpgradeModal } from './UpgradeModal';

/**
 * Global upgrade-gate provider.
 *
 * Any component in the dashboard can call `useUpgradeGate().openUpgrade('invoices')`
 * to pop the Sub Pro upgrade modal. The modal knows how to tailor copy per feature.
 *
 * Pair with `useSubscriptionTier` — check `isFreeSub` before gating an action. Example:
 *
 *   const { isFreeSub } = useSubscriptionTier();
 *   const { openUpgrade } = useUpgradeGate();
 *
 *   function handleCreateInvoice() {
 *     if (isFreeSub) { openUpgrade('invoices'); return; }
 *     // ... create invoice
 *   }
 */

type Feature = 'jobs' | 'customers' | 'invoices' | 'financials' | 'insights' | 'quickbooks' | 'marketplace' | 'generic';

interface UpgradeGateContext {
  openUpgrade: (feature?: Feature) => void;
}

const UpgradeGateCtx = createContext<UpgradeGateContext | null>(null);

export function UpgradeGateProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [feature, setFeature] = useState<Feature>('generic');

  const openUpgrade = useCallback((f: Feature = 'generic') => {
    setFeature(f);
    setOpen(true);
  }, []);

  return (
    <UpgradeGateCtx.Provider value={{ openUpgrade }}>
      {children}
      <UpgradeModal open={open} onClose={() => setOpen(false)} feature={feature} />
    </UpgradeGateCtx.Provider>
  );
}

export function useUpgradeGate() {
  const ctx = useContext(UpgradeGateCtx);
  if (!ctx) {
    throw new Error('useUpgradeGate must be used inside <UpgradeGateProvider>');
  }
  return ctx;
}
