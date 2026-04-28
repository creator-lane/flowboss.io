/**
 * Activation progress for newly-paid contractors.
 *
 * Computes the 5 milestones that take a fresh contractor from
 * "I just paid" → "I'm collecting money on this app." This is the
 * single most important funnel in the product. Don't break it.
 *
 *   1. hasRealCustomer       — added a customer that isn't sample data
 *   2. hasRealJob            — created a job that isn't sample data
 *   3. hasStripeConnect      — completed Stripe Connect onboarding
 *   4. hasSentInvoice        — sent (or paid) ≥1 invoice
 *   5. hasReceivedPayment    — at least one invoice is in `paid` status
 *
 * Sample detection mirrors src/components/ui/DemoChip.tsx — anything
 * with `is_sample = true` OR notes starting with "Sample data" doesn't
 * count toward activation, because seeing sample data shouldn't make
 * the user think they're done.
 *
 * Each milestone is also persisted in the user's onboarding progress
 * (localStorage) the moment it transitions to true, so a user who
 * later deletes a customer doesn't accidentally regress out of the
 * checklist's "complete" state — once you've earned a step, it stays
 * earned.
 */

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useOnboardingProgress } from './useOnboardingProgress';

export interface ActivationStep {
  key: 'customer' | 'job' | 'stripe' | 'invoice' | 'paid';
  done: boolean;
}

function isSample(row: any): boolean {
  if (!row) return false;
  if (row.isSample === true || row.is_sample === true) return true;
  const notes = String(row.notes ?? '');
  return notes.toLowerCase().startsWith('sample data');
}

export interface ActivationProgress {
  customer: boolean;
  job: boolean;
  stripe: boolean;
  invoice: boolean;
  paid: boolean;
  totalDone: number;
  totalSteps: number;
  pct: number;
  isComplete: boolean;
  isLoading: boolean;
}

export function useActivationProgress(): ActivationProgress {
  const { hasCompleted, markCompleted } = useOnboardingProgress();

  // Each query is cheap enough to fire individually and cache; the
  // CommandCenterPage already pulls these so the React Query cache
  // dedupes — useActivationProgress just reads from the same keys.
  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.getCustomers(),
  });
  const { data: jobsData, isLoading: loadingJobs } = useQuery({
    queryKey: ['jobs', 'all'],
    queryFn: () => api.getTodaysJobs(undefined, 'all'),
  });
  const { data: invoicesData, isLoading: loadingInvoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.getInvoices(),
  });
  const { data: stripeData, isLoading: loadingStripe } = useQuery({
    queryKey: ['stripe-connect-status'],
    queryFn: () => api.checkStripeConnectStatus(),
    staleTime: 5 * 60 * 1000,
  });

  const customers: any[] = customersData?.data || [];
  const jobs: any[] = jobsData?.data || [];
  const invoices: any[] = invoicesData?.data || [];

  const computed = useMemo(() => {
    const customer = customers.some((c) => !isSample(c));
    const job = jobs.some((j) => !isSample(j));
    const stripe = !!(stripeData as any)?.connected || !!(stripeData as any)?.onboarding_complete;
    const invoice = invoices.some(
      (i) => !isSample(i) && ['sent', 'viewed', 'paid', 'partially_paid'].includes(String(i.status || '').toLowerCase()),
    );
    const paid = invoices.some(
      (i) => !isSample(i) && ['paid', 'partially_paid'].includes(String(i.status || '').toLowerCase()),
    );
    return { customer, job, stripe, invoice, paid };
  }, [customers, jobs, invoices, stripeData]);

  // Once a step is earned, persist it. If a user deletes their first
  // customer later, we don't want them to bounce out of "step 1 done"
  // and feel like they regressed — once earned, always earned.
  useEffect(() => {
    if (computed.customer && !hasCompleted('activation:customer')) markCompleted('activation:customer');
    if (computed.job && !hasCompleted('activation:job')) markCompleted('activation:job');
    if (computed.stripe && !hasCompleted('activation:stripe')) markCompleted('activation:stripe');
    if (computed.invoice && !hasCompleted('activation:invoice')) markCompleted('activation:invoice');
    if (computed.paid && !hasCompleted('activation:paid')) markCompleted('activation:paid');
  }, [computed, hasCompleted, markCompleted]);

  // Final boolean per step is "currently earned" OR "previously earned" —
  // the latter handles the regression case above.
  const customer = computed.customer || hasCompleted('activation:customer');
  const job = computed.job || hasCompleted('activation:job');
  const stripe = computed.stripe || hasCompleted('activation:stripe');
  const invoice = computed.invoice || hasCompleted('activation:invoice');
  const paid = computed.paid || hasCompleted('activation:paid');

  const totalDone = [customer, job, stripe, invoice, paid].filter(Boolean).length;
  const totalSteps = 5;
  const pct = Math.round((totalDone / totalSteps) * 100);

  return {
    customer,
    job,
    stripe,
    invoice,
    paid,
    totalDone,
    totalSteps,
    pct,
    isComplete: totalDone === totalSteps,
    isLoading: loadingCustomers || loadingJobs || loadingInvoices || loadingStripe,
  };
}
