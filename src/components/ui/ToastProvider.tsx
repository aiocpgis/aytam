import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  isExiting: boolean;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, isExiting: false }]);

    // Start exit animation after 3.5s
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
      );
    }, 3500);

    // Remove from DOM after exit animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 400);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => {
          const typeStyles = {
            success: "border-emerald-200/50 dark:border-emerald-700/50",
            error: "border-rose-200/50 dark:border-rose-700/50",
            warning: "border-amber-200/50 dark:border-amber-700/50",
            info: "border-blue-200/50 dark:border-blue-700/50",
          };

          const iconBg = {
            success: "bg-emerald-100 dark:bg-emerald-900/40",
            error: "bg-rose-100 dark:bg-rose-900/40",
            warning: "bg-amber-100 dark:bg-amber-900/40",
            info: "bg-blue-100 dark:bg-blue-900/40",
          };

          const Icon = {
            success: CheckCircle,
            error: XCircle,
            warning: AlertCircle,
            info: Info,
          }[toast.type];

          const iconColors = {
            success: "text-emerald-500",
            error: "text-rose-500",
            warning: "text-amber-500",
            info: "text-blue-500",
          };

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 rounded-2xl border bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl p-4 shadow-2xl w-[320px] transition-all duration-500 ease-out ${typeStyles[toast.type]} ${
                toast.isExiting
                  ? "opacity-0 translate-x-8 scale-95"
                  : "opacity-100 translate-x-0 scale-100 animate-in slide-in-from-right-5 fade-in duration-500"
              }`}
            >
              <div className={`shrink-0 grid h-9 w-9 place-items-center rounded-xl ${iconBg[toast.type]}`}>
                <Icon className={`h-5 w-5 ${iconColors[toast.type]}`} />
              </div>
              <p className="flex-1 text-xs font-bold leading-relaxed text-slate-800 dark:text-slate-200">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 rounded-lg p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
