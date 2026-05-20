import { Link, Outlet } from "react-router-dom";
import { ShieldCheck, LogIn, Heart, Phone, HelpCircle } from "lucide-react";

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      {/* Sticky Premium Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/40 bg-white/60 backdrop-blur-xl transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 text-slate-900 group">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-500 text-white shadow-soft transition-all duration-300 group-hover:scale-105 group-hover:rotate-3">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <span>
              <strong className="block text-lg font-black bg-gradient-to-l from-slate-900 to-slate-700 bg-clip-text text-transparent">
                منصة رِفْق لرعاية الأيتام
              </strong>
              <small className="text-[10px] font-extrabold tracking-wider text-slate-500 block -mt-1 uppercase">
                البوابة الإنسانية لتسجيل ورعاية الأيتام
              </small>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link 
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 hover:text-slate-950 active:scale-95" 
              to="/admin/login"
            >
              <LogIn className="h-4 w-4 text-emerald-600" />
              بوابة الإشراف
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-grow">
        <Outlet />
      </div>

      {/* Premium Footer */}
      <footer className="w-full border-t border-slate-200/50 bg-white/40 backdrop-blur-md py-10 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3 text-right">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
                <span className="font-black text-slate-900 text-base">رسالتنا الإنسانية</span>
              </div>
              <p className="text-xs leading-6 text-slate-500 font-medium">
                نسعى لتقديم يد العون وتسهيل إجراءات كفالة الأطفال الأيتام وضمان وصول الدعم للأسر الأكثر احتياجاً بكل شفافية وأمان وسرية تامة.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-500" />
                <span className="font-black text-slate-900 text-base">تعليمات هامة</span>
              </div>
              <ul className="text-xs space-y-2 text-slate-500 font-medium">
                <li>• يرجى إدخال اسم الطفل رباعياً كما هو في شهادة الميلاد.</li>
                <li>• تأكد من رفع صورة واضحة من الأوراق الثبوتية الداعمة للطلب.</li>
                <li>• سيتم التواصل معك عبر رقم الجوال المرفق فور مراجعة الطلب.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-emerald-500" />
                <span className="font-black text-slate-900 text-base">تواصل معنا</span>
              </div>
              <p className="text-xs leading-6 text-slate-500 font-medium">
                إذا كان لديك أي استفسار أو واجهت مشكلة أثناء تقديم الطلب، يسعدنا تواصلك مع قسم الدعم الفني والإرشاد الأسري.
              </p>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-200/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-400">
            <p>© {new Date().getFullYear()} منصة رِفْق لرعاية الأيتام. جميع الحقوق محفوظة.</p>
            <p className="flex items-center gap-1">
              صُنع بكل <Heart className="h-3 w-3 text-rose-500 fill-rose-500" /> لرعاية أطفالنا الأيتام وتمكينهم.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
