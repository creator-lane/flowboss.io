/**
 * First-time onboarding overlay for an invited sub on a GC project.
 * Mirrors the GC's OnboardingOverlay pattern (5-step modal, dismiss
 * persisted in localStorage). Purple-accented because the entire sub
 * project surface lives in the project / template purple lane.
 *
 * The five steps walk through the four distinct affordances on the
 * sub's project page that aren't obvious:
 *   1. Welcome — "you're here for free, this is your job"
 *   2. Use a starter template — the killer onboarding moment
 *   3. Build / customize your work plan — phases, tasks, materials
 *   4. Update the GC inline
 *   5. Mark complete — close out the trade when you're done
 *
 * Fires only the first time, only when the sub is actually on a GC
 * project (not on a self-managed mobile-style project). Skip-tour and
 * "Get started" both persist `fb_sub_onboarding_done = '1'`.
 */

import { useState, useEffect } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ClipboardCheck,
  Megaphone,
  CheckCircle2,
  HardHat,
} from 'lucide-react';

const STORAGE_KEY = 'fb_sub_onboarding_done';

type Step = {
  Icon: typeof Sparkles;
  title: string;
  description: string;
};

const STEPS: Step[] = [
  {
    Icon: HardHat,
    title: 'You’re on the project',
    description:
      'You’re running this trade. The GC owns the schedule and budget; you own the plan, the tasks, the materials, and the daily progress. Free for as long as the invite lasts.',
  },
  {
    Icon: Sparkles,
    title: 'Start from a template',
    description:
      'Tap “Use a starter template” to load a full phase‑by‑phase scope (Bathroom Remodel, Panel Upgrade, Tankless Install…). Toggle off anything you don’t need before applying. You can also build a plan from scratch — your call.',
  },
  {
    Icon: ClipboardCheck,
    title: 'Run your day from the work plan',
    description:
      'Phases collapse so you can focus on what’s actually happening today. Click any task name to rename, the trash to remove, or the bottom row to type a new step. Materials live below the phases — check them off as you buy them.',
  },
  {
    Icon: Megaphone,
    title: 'Update the GC inline',
    description:
      '“Rough‑in passed inspection.” “Waiting on the panel — ETA Friday.” The composer at the top of the page posts straight into the project chat — the GC sees it instantly. No app‑switch, no phone tag.',
  },
  {
    Icon: CheckCircle2,
    title: 'Close it out',
    description:
      'When every line is checked, a green “Mark complete” button appears. Tap it and the GC sees your trade go to done in real time. They can rate your work; you keep the score on your FlowBoss profile across every job.',
  },
];

export function SubOnboardingOverlay({ onDismiss }: { onDismiss?: () => void }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Defer just enough that the project page has time to paint
      // first — popping the overlay before content renders feels
      // jarring on a slow connection.
      const t = setTimeout(() => setVisible(true), 250);
      return () => clearTimeout(t);
    }
  }, []);

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = current.Icon;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
    onDismiss?.();
  };

  return (
    <div className="fixed inset-0 z-[10000]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 dark:bg-gray-900 dark:border dark:border-white/10">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step progress dots — purple to match project surface */}
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full flex-1 transition-colors ${
                i <= step ? 'bg-purple-500' : 'bg-gray-200 dark:bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Hero icon */}
        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4 dark:bg-purple-500/15">
          <Icon className="w-6 h-6 text-purple-600 dark:text-purple-300" />
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2 dark:text-white">{current.title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-8 dark:text-gray-400">{current.description}</p>

        <div className="flex items-center justify-between">
          <button
            onClick={() => (step > 0 ? setStep(step - 1) : dismiss())}
            className="text-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            {step > 0 ? (
              <span className="flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Back</span>
            ) : (
              'Skip tour'
            )}
          </button>
          <button
            onClick={() => (isLast ? dismiss() : setStep(step + 1))}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-br from-purple-500 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-purple-500 hover:to-purple-500 shadow-lg shadow-purple-500/30 transition-all"
          >
            {isLast ? 'Get started' : 'Next'}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
