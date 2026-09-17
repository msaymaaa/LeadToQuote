import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  detail?: string;
}

interface ToastContextType {
  success: (message: string, detail?: string) => void;
  error: (message: string, detail?: string) => void;
  info: (message: string, detail?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, message: string, detail?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, detail }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message: string, detail?: string) => addToast('success', message, detail), [addToast]);
  const error = useCallback((message: string, detail?: string) => addToast('error', message, detail), [addToast]);
  const info = useCallback((message: string, detail?: string) => addToast('info', message, detail), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, info, dismiss }}>
      {children}

      {/* Floating Toasts Viewport */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start space-x-3 p-3.5 rounded-xl border shadow-xl backdrop-blur transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 ${
                isSuccess
                  ? 'bg-[#101915]/95 border-emerald-600/50 text-[#e6f4ed]'
                  : isError
                  ? 'bg-[#1d1214]/95 border-rose-600/50 text-[#fcedee]'
                  : 'bg-[#151722]/95 border-[#2c3246] text-[#f4efe6]'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {isSuccess ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isError ? (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                ) : (
                  <Info className="w-4 h-4 text-[#d4af37]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold leading-tight">{toast.message}</p>
                {toast.detail && (
                  <p className="text-[11px] opacity-80 mt-1 leading-normal font-sans">
                    {toast.detail}
                  </p>
                )}
              </div>

              <button
                onClick={() => dismiss(toast.id)}
                className="text-xs opacity-60 hover:opacity-100 p-1 -mr-1 -mt-1 rounded transition"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
