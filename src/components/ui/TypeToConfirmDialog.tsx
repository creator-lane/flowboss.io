import { useState, useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmWord?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function TypeToConfirmDialog({
  open,
  title,
  message,
  confirmWord = 'DELETE',
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  loading,
}: Props) {
  const [typed, setTyped] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const matches = typed.trim().toUpperCase() === confirmWord.toUpperCase();

  // Reset and focus when opened
  useEffect(() => {
    if (open) {
      setTyped('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-gray-900 dark:border dark:border-white/10 rounded-2xl shadow-2xl dark:shadow-black/50 w-full max-w-sm mx-4 p-6">
        <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 dark:border dark:border-red-500/30 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{message}</p>

        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Type <span className="font-bold text-red-600 dark:text-red-300">{confirmWord}</span> to confirm
          </label>
          <input
            ref={inputRef}
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && matches && !loading) onConfirm();
            }}
            placeholder={confirmWord}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent placeholder:text-gray-300 dark:placeholder:text-gray-600"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!matches || loading}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors dark:shadow-lg dark:shadow-red-500/20"
          >
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
