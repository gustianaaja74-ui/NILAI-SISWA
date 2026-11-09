import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  confirmVariant?: 'danger' | 'primary' | 'success';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Ya, Hapus',
  cancelLabel = 'Batal',
  isDestructive = true,
  confirmVariant,
  onConfirm,
  onCancel,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    if (onCancel) onCancel();
    if (onClose) onClose();
  };

  const isDanger = confirmVariant ? confirmVariant === 'danger' : isDestructive;
  const isSuccess = confirmVariant === 'success';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`p-2.5 rounded-xl ${
              isDanger
                ? 'bg-rose-100 text-rose-600'
                : isSuccess
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">Konfirmasi Tindakan</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
          {message}
        </p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={async () => {
              await onConfirm();
              handleClose();
            }}
            className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm cursor-pointer transition-colors flex items-center gap-1.5 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700'
                : isSuccess
                ? 'bg-emerald-700 hover:bg-emerald-800'
                : 'bg-blue-700 hover:bg-blue-800'
            }`}
          >
            {isDanger && <Trash2 className="w-4 h-4" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
