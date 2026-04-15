import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useOnboardingProgress } from '../../hooks/useOnboardingProgress';

interface SpotlightTipProps {
  tipId: string;
  children: React.ReactNode;
  title: string;
  message: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  showOnce?: boolean;
}

const positionClasses: Record<string, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
  left: 'right-full top-1/2 -translate-y-1/2 mr-3',
  right: 'left-full top-1/2 -translate-y-1/2 ml-3',
};

const caretClasses: Record<string, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 -mt-1',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
  left: 'left-full top-1/2 -translate-y-1/2 -ml-1',
  right: 'right-full top-1/2 -translate-y-1/2 -mr-1',
};

export function SpotlightTip({
  tipId,
  children,
  title,
  message,
  position = 'bottom',
  delay = 500,
  showOnce = true,
}: SpotlightTipProps) {
  const { hasDismissedTip, dismissTip } = useOnboardingProgress();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [pulseActive, setPulseActive] = useState(true);
  const showTimer = useRef<ReturnType<typeof setTimeout>>();
  const autoDismissTimer = useRef<ReturnType<typeof setTimeout>>();
  const pulseTimer = useRef<ReturnType<typeof setTimeout>>();

  const alreadyDismissed = hasDismissedTip(tipId);

  // Show tooltip after delay
  useEffect(() => {
    if (alreadyDismissed) return;

    showTimer.current = setTimeout(() => {
      setVisible(true);
    }, delay);

    return () => {
      if (showTimer.current) clearTimeout(showTimer.current);
    };
  }, [alreadyDismissed, delay]);

  // Fade pulse ring after 3s
  useEffect(() => {
    if (!visible) return;

    pulseTimer.current = setTimeout(() => {
      setPulseActive(false);
    }, 3000);

    return () => {
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
    };
  }, [visible]);

  // Auto-dismiss after 8s if showOnce
  useEffect(() => {
    if (!visible || !showOnce) return;

    autoDismissTimer.current = setTimeout(() => {
      handleDismiss();
    }, 8000);

    return () => {
      if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, showOnce]);

  function handleDismiss() {
    setDismissed(true);
    // Wait for fade-out animation before persisting
    setTimeout(() => {
      dismissTip(tipId);
    }, 200);
  }

  if (alreadyDismissed) {
    return <>{children}</>;
  }

  const showTooltip = visible && !dismissed;

  return (
    <div className="relative inline-block">
      {/* Pulse ring */}
      <div
        className={`absolute inset-0 rounded-lg pointer-events-none transition-opacity duration-500 ${
          visible && pulseActive
            ? 'ring-2 ring-brand-400 animate-pulse opacity-100'
            : 'opacity-0'
        }`}
      />

      {children}

      {/* Tooltip */}
      {(visible || dismissed) && (
        <div
          className={`absolute z-50 ${positionClasses[position]} transition-opacity duration-200 ${
            showTooltip ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 px-4 py-3 max-w-xs">
            {/* Caret */}
            <div
              className={`absolute w-2.5 h-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rotate-45 ${caretClasses[position]}`}
              style={{
                // Hide the border edge facing the tooltip body
                clipPath:
                  position === 'top'
                    ? 'polygon(0 0, 100% 0, 100% 100%)'
                    : position === 'bottom'
                    ? 'polygon(0 0, 100% 0, 0 100%)'
                    : position === 'left'
                    ? 'polygon(0 0, 100% 0, 100% 100%)'
                    : 'polygon(0 0, 0 100%, 100% 100%)',
              }}
            />

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Dismiss tip"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Content */}
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 pr-4">
              {title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              {message}
            </p>

            {/* Dismiss action */}
            <button
              onClick={handleDismiss}
              className="mt-2 text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
