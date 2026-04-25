import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, X, Lock } from 'lucide-react';

// Friendly, action-specific copy keyed off the api method that fired the paywall.
// Anything not catalogued falls through to a generic message.
const PAYWALL_COPY: Record<string, { title: string; body: string }> = {
  createJob: {
    title: 'Create your first job',
    body: 'Sign up to start scheduling jobs, dispatching crew, and tracking time.',
  },
  updateJob: {
    title: 'Edit jobs in real time',
    body: 'Sign up to update job status, reassign techs, and keep your crew in sync.',
  },
  createInvoice: {
    title: 'Send invoices that actually get paid',
    body: 'Sign up free — Stripe + QuickBooks built in. Money hits your account next day.',
  },
  sendInvoiceEmail: {
    title: 'Send this invoice for real',
    body: "Sign up to email invoices to your customers with one tap.",
  },
  createPaymentLink: {
    title: 'Get paid before you leave the driveway',
    body: 'Sign up to create instant pay links and accept cards on the spot.',
  },
  createCustomer: {
    title: 'Save customers to your book',
    body: 'Sign up to keep a permanent customer record with full job history.',
  },
  createGCProject: {
    title: 'Run your projects in one place',
    body: 'Sign up to plan, dispatch, and bill across multi-trade jobs.',
  },
  addGCTrade: {
    title: 'Bring your subs into the project',
    body: 'Sign up to invite trade partners and track them to the dollar.',
  },
  sendInviteEmail: {
    title: 'Invite your subs',
    body: 'Sign up to send sub invites — they get a free dashboard, you stay in control.',
  },
  createContractor: {
    title: 'Build your contractor roster',
    body: 'Sign up to track every sub, their work history, and their FlowBoss Score.',
  },
  createExpense: {
    title: 'Track expenses in seconds',
    body: 'Sign up to log materials, fuel, and tools — instantly visible on your P&L.',
  },
  createPricebookItem: {
    title: 'Build your pricebook',
    body: 'Sign up to save your standard prices and stop retyping line items.',
  },
  updateSettings: {
    title: 'Save your settings',
    body: "Sign up to keep your company profile, branding, and preferences.",
  },
  inviteTeamMember: {
    title: 'Invite your team',
    body: 'Sign up to add crew, dispatchers, and office staff — each with their own login.',
  },
  inviteSubToTrade: {
    title: 'Invite your subs',
    body: 'Sign up to send sub invites — they get a free dashboard, you stay in control.',
  },
  sendInvoiceViaQB: {
    title: 'Send through QuickBooks',
    body: 'Sign up to connect QuickBooks and send invoices straight from your books.',
  },
  upgrade: {
    title: 'Unlock the full platform',
    body: 'Sign up free to get jobs, customers, invoices, financials, and more — 14 days, no card.',
  },
};

const DEFAULT_COPY = {
  title: 'Sign up to keep going',
  body: "You're on the live demo. Create a free account to use this feature for real.",
};

interface PaywallState {
  open: boolean;
  method: string;
}

interface DemoPaywallContextValue {
  trigger: (method: string) => void;
  close: () => void;
  state: PaywallState;
}

const DemoPaywallContext = createContext<DemoPaywallContextValue | null>(null);

export function useDemoPaywall(): DemoPaywallContextValue {
  const ctx = useContext(DemoPaywallContext);
  if (!ctx) throw new Error('useDemoPaywall must be used inside DemoPaywallProvider');
  return ctx;
}

export function DemoPaywallProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PaywallState>({ open: false, method: '' });

  const trigger = useCallback((method: string) => {
    setState({ open: true, method });
  }, []);

  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  const value = useMemo<DemoPaywallContextValue>(
    () => ({ trigger, close, state }),
    [trigger, close, state],
  );

  const copy = PAYWALL_COPY[state.method] ?? DEFAULT_COPY;

  return (
    <DemoPaywallContext.Provider value={value}>
      {children}
      {state.open && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-brand-600 dark:text-brand-300" />
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-wider uppercase text-brand-600 dark:text-brand-400">Demo paywall</p>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                    {copy.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 -mr-1 -mt-1 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
              {copy.body}
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={close}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Keep exploring
              </button>
              <Link
                to="/signup"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-700 hover:to-violet-700 text-white text-sm font-bold transition-colors shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                Sign up free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-[11px] text-center text-gray-400 dark:text-gray-500 mt-4">
              14-day free trial · no credit card required
            </p>
          </div>
        </div>
      )}
    </DemoPaywallContext.Provider>
  );
}
