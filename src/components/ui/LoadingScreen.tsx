import { Baby, HandCoins, Heart } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-4">
      <div className="glass-card w-full max-w-xl p-8 text-center">
        <div className="relative mx-auto mb-8 flex h-36 items-center justify-between px-3 sm:px-8">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-white/80 shadow-lg">
            <HandCoins className="h-9 w-9 text-blue-600" />
          </div>

          <div className="coin-track">
            <span className="coin coin-1">₪</span>
            <span className="coin coin-2">₪</span>
            <span className="coin coin-3">₪</span>
          </div>

          <div className="relative grid h-20 w-20 place-items-center rounded-full bg-white/80 shadow-lg">
            <Baby className="h-9 w-9 text-emerald-600" />
            <Heart className="heart-pop absolute -top-4 left-3 h-5 w-5 fill-rose-500 text-rose-500" />
            <Heart className="heart-pop-2 absolute -top-6 right-4 h-4 w-4 fill-rose-400 text-rose-400" />
          </div>
        </div>

        <h1 className="text-2xl font-black text-slate-900">منصة رِفْق لرعاية الأيتام</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          يتم تجهيز البيانات والواجهة لخدمة الحالات الإنسانية بخصوصية وتنظيم.
        </p>
      </div>
    </div>
  );
}
