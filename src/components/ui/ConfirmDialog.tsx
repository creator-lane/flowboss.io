import { AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', variant = 'default', onConfirm, onCancel, loading }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-gray-900 dark:border dark:border-white/10 rounded-2xl shadow-2xl dark:shadow-black/50 w-full max-w-sm mx-4 p-6">
        {variant === 'danger' && (
          <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 dark:border dark:border-red-500/30 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-300" />
          </div>
        )}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white dark:shadow-lg dark:shadow-red-500/20' : 'bg-brand-500 hover:bg-brand-600 text-white dark:shadow-lg dark:shadow-blue-500/20'}`}>
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
