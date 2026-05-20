import { AlertTriangle, CheckCircle, HelpCircle, Info } from "lucide-react";

interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
  tone?: "danger" | "success" | "warning" | "info";
}

export function AlertDialog({
  isOpen,
  title,
  message,
  confirmText = "حسناً",
  onConfirm,
  tone = "info",
}: AlertDialogProps) {
  if (!isOpen) return null;

  const toneConfig = {
    danger: {
      bg: "bg-rose-50 border-rose-100 text-rose-700",
      btn: "bg-gradient-to-l from-rose-600 to-pink-500 hover:shadow-rose-100",
      icon: <AlertTriangle className="h-6 w-6 text-rose-600 animate-bounce" />,
    },
    success: {
      bg: "bg-emerald-50 border-emerald-100 text-emerald-700",
      btn: "bg-gradient-to-l from-emerald-600 to-teal-500 hover:shadow-emerald-100",
      icon: <CheckCircle className="h-6 w-6 text-emerald-600" />,
    },
    warning: {
      bg: "bg-amber-50 border-amber-100 text-amber-700",
      btn: "bg-gradient-to-l from-amber-500 to-orange-500 hover:shadow-amber-100",
      icon: <AlertTriangle className="h-6 w-6 text-amber-600 animate-pulse" />,
    },
    info: {
      bg: "bg-blue-50 border-blue-100 text-blue-700",
      btn: "bg-gradient-to-l from-blue-600 to-cyan-500 hover:shadow-blue-100",
      icon: <Info className="h-6 w-6 text-blue-600" />,
    },
  };

  const currentTone = toneConfig[tone];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xl transition-opacity duration-300"
        onClick={onConfirm}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md scale-100 transform rounded-3xl border border-white/60 dark:border-slate-700/60 bg-white/75 dark:bg-slate-900/75 backdrop-blur-2xl p-6 shadow-2xl transition-all duration-300 animate-in fade-in-50 zoom-in-95">
        <div className="flex gap-4">
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border ${currentTone.bg}`}>
            {currentTone.icon}
          </div>
          
          <div className="flex-1 text-right">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 font-bold text-slate-500 dark:text-slate-400">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition hover:-translate-y-0.5 ${currentTone.btn}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
