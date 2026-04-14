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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        {variant === 'danger' && (
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
        )}
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-brand-500 hover:bg-brand-600 text-white'}`}>
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
