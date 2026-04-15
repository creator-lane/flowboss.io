import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

const STEPS = [
  {
    title: 'Welcome to Projects',
    description: 'This is your project command center. See every zone, trade, and sub at a glance.',
    target: null, // full page intro
  },
  {
    title: 'Zones = Areas of Your Build',
    description: 'Kitchen, Bathroom 1, Exterior — each zone groups the trades working in that area. Click one to see details.',
    target: '[data-tour="zone-card"]',
  },
  {
    title: 'Assign Subs to Trades',
    description: 'Click a trade inside a zone to assign a sub-contractor. Share an invite link or enter their email.',
    target: '[data-tour="invite-btn"]',
  },
  {
    title: 'Track Progress in Real-Time',
    description: 'The center ring shows overall weighted completion. Each zone shows its own progress. When subs mark tasks done, you see it here.',
    target: '[data-tour="progress-ring"]',
  },
  {
    title: 'Switch Views Anytime',
    description: 'Use Visual for the big picture, Board for trade details, and Timeline for scheduling.',
    target: '[data-tour="view-toggle"]',
  },
];

const STORAGE_KEY = 'fb_onboarding_projects_done';

export function OnboardingOverlay({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setVisible(true);
  }, []);

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Content card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 dark:bg-white/5 dark:backdrop-blur-sm">
        {/* Close */}
        <button onClick={dismiss} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
          <X className="w-5 h-5" />
        </button>

        {/* Step indicator */}
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 rounded-full flex-1 ${i <= step ? 'bg-brand-500' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* Step content */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 dark:text-white">{current.title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-8 dark:text-gray-400">{current.description}</p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : dismiss()}
            className="text-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            {step > 0 ? (
              <span className="flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Back</span>
            ) : 'Skip tour'}
          </button>
          <button
            onClick={() => isLast ? dismiss() : setStep(step + 1)}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors"
          >
            {isLast ? 'Get Started' : 'Next'}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
