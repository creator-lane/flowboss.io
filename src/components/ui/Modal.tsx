import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  // Portal to document.body so the modal escapes any ancestor that has a
  // `transform`, `filter`, or `perspective` set — those CSS properties
  // create a new containing block for descendants with `position: fixed`,
  // breaking `inset-0` and pinning the modal inside whatever parent
  // happened to be transformed. (Symptom: modal rendered as a small
  // inline panel with the rest of the page bleeding through above and
  // below it.) Portaling sidesteps that entirely.
  const overlay = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm animate-backdrop-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative bg-white dark:bg-gray-900 dark:border dark:border-white/10 rounded-2xl shadow-2xl dark:shadow-black/50 w-full ${SIZE_MAP[size]} max-h-[90vh] flex flex-col animate-modal-fade-in`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-200 dark:hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
