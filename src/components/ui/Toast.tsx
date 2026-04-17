import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  /** Optional bold first line shown above the message body. */
  title?: string;
}

interface AddToastOptions {
  title?: string;
  /** Override auto-dismiss duration in ms. 0 = sticky until dismissed. */
  duration?: number;
}

const ToastContext = createContext<{
  addToast: (message: string, type?: ToastType, options?: AddToastOptions) => void;
}>({ addToast: () => {} });
export const useToast = () => useContext(ToastContext);

// Saturated per-type styles so each toast reads as its own signal.
// Previously everything was low-contrast small text that disappeared in 4s.
// Now: bold bg, white text, icon badge, colored shadow, slide-in animation,
// 6s default (7s for errors so the user has time to read).
const TOAST_STYLE: Record<ToastType, {
  bg: string;
  shadow: string;
  icon: React.ElementType;
  iconBg: string;
  defaultMs: number;
}> = {
  success: {
    bg: 'bg-emerald-600',
    shadow: 'shadow-emerald-600/40',
    icon: CheckCircle,
    iconBg: 'bg-emerald-700',
    defaultMs: 6000,
  },
  error: {
    bg: 'bg-red-600',
    shadow: 'shadow-red-600/40',
    icon: AlertCircle,
    iconBg: 'bg-red-700',
    defaultMs: 7000,
  },
  warning: {
    bg: 'bg-amber-600',
    shadow: 'shadow-amber-600/40',
    icon: AlertTriangle,
    iconBg: 'bg-amber-700',
    defaultMs: 6000,
  },
  info: {
    bg: 'bg-blue-600',
    shadow: 'shadow-blue-600/40',
    icon: Info,
    iconBg: 'bg-blue-700',
    defaultMs: 6000,
  },
};

interface InternalToast extends ToastItem {
  duration: number;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<InternalToast[]>([]);

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', options: AddToastOptions = {}) => {
      const id = Math.random().toString(36).slice(2);
      const duration = options.duration ?? TOAST_STYLE[type].defaultMs;
      setToasts((prev) => [...prev, { id, message, type, title: options.title, duration }]);
    },
    [],
  );

  const remove = useCallback(
    (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)),
    [],
  );

  // Each toast manages its own lifetime via the ToastCard component so a
  // stack of toasts doesn't share a single timer that dismisses them all
  // together (the old bug).
  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2.5 pointer-events-none max-w-[calc(100vw-2rem)] sm:max-w-sm">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: InternalToast; onDismiss: () => void }) {
  const style = TOAST_STYLE[toast.type];
  const Icon = style.icon;

  useEffect(() => {
    if (toast.duration <= 0) return; // sticky
    const timer = setTimeout(onDismiss, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration, onDismiss]);

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-xl shadow-xl ${style.shadow} text-white font-medium ${style.bg} animate-toast-in`}
    >
      {/* Icon badge — solid colored chip so the type is readable at a glance */}
      <div className={`${style.iconBg} rounded-lg p-1.5 shrink-0 mt-0.5`}>
        <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 pt-0.5">
        {toast.title && (
          <p className="text-sm font-bold leading-tight mb-0.5">{toast.title}</p>
        )}
        <p className="text-sm leading-snug">{toast.message}</p>
      </div>

      {/* Dismiss — big tap target */}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 -mr-1 -mt-1 p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
