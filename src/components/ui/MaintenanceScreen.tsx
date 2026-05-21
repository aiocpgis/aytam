import { Hammer, Settings, Wrench, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

export function MaintenanceScreen() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 transition-colors duration-300">
      <div className="glass-card w-full max-w-xl p-8 sm:p-12 text-center border border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 shadow-glass backdrop-blur-xl animate-in fade-in zoom-in duration-500">
        
        {/* Glowing and Animated Icon Section */}
        <div className="relative mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-500/10 to-orange-500/20 text-amber-500 dark:text-amber-400 shadow-soft">
          <Settings className="h-14 w-14 animate-[spin_8s_linear_infinite]" />
          <Wrench className="absolute -bottom-2 -left-2 h-7 w-7 text-indigo-500 animate-bounce" />
          <Hammer className="absolute -top-2 -right-2 h-7 w-7 text-emerald-500 animate-pulse" />
        </div>

        {/* Maintenance Message */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 leading-tight">
          المنصة قيد الصيانة المؤقتة 🛠️
        </h1>
        
        <p className="mt-4 text-sm sm:text-base leading-7 text-slate-600 dark:text-slate-400 font-bold max-w-md mx-auto">
          نعمل حالياً على إجراء بعض التحديثات والتحسينات الفنية لضمان تقديم تجربة أسرع وأكثر أماناً لخدمة ورعاية أطفالنا الأيتام.
        </p>

        {/* Decorative micro-elements */}
        <div className="my-8 flex justify-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping"></span>
          <span className="h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-700"></span>
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping delay-300"></span>
        </div>

        <p className="text-xs font-black text-slate-400 dark:text-slate-500">
          شكراً لتفهمكم وصبركم الجميل. سنعود للعمل قريباً جداً إن شاء الله.
        </p>

        {/* Admin Login Gateway Bypass Link */}
        <div className="mt-10 border-t border-slate-200/50 dark:border-slate-800/50 pt-6 flex flex-col items-center justify-center gap-3">
          <Link 
            to="/admin/login" 
            className="secondary-btn text-xs font-black px-6 py-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ShieldAlert className="h-4 w-4 text-amber-500 animate-pulse" />
            بوابة الإشراف (خاص بمدير المنصة)
          </Link>
        </div>
      </div>
    </div>
  );
}
