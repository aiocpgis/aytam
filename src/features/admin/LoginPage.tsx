import { FormEvent, useState } from "react";
import { LockKeyhole, ShieldCheck, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      setIsLoading(true);

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("No Supabase user returned after login.");

      const { data: adminUser, error: adminError } = await supabase
        .from("admin_users")
        .select("id, role")
        .eq("id", userId)
        .maybeSingle();

      if (adminError) throw adminError;

      if (!adminUser) {
        await supabase.auth.signOut();
        setError("الحساب صحيح، لكنه غير مضاف كمدير في جدول admin_users.");
        return;
      }

      navigate("/admin", { replace: true });
    } catch (loginError) {
      console.error(loginError);
      setError("فشل تسجيل الدخول. تحقق من البريد وكلمة المرور وصلاحية المستخدم.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center px-4 py-10 overflow-hidden">
      {/* Premium Glassmorphic Back Button */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="absolute top-6 right-6 md:top-8 md:right-8 z-30 flex items-center gap-2.5 rounded-2xl border border-white/70 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl px-5 py-2.5 text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 shadow-glass hover:shadow-[0_8px_30px_rgb(0,0,0,0.06),0_0_20px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.3),0_0_25px_rgba(59,130,246,0.15)] outline-none hover:bg-white/70 dark:hover:bg-slate-900/70 hover:border-blue-400/50 dark:hover:border-blue-500/30 hover:scale-[1.03] active:scale-95 transition-all duration-300 group"
      >
        <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform duration-300" />
        <span className="font-extrabold bg-gradient-to-l from-slate-950 via-blue-900 to-blue-700 dark:from-white dark:via-blue-100 dark:to-blue-300 bg-clip-text text-transparent">
          الرجوع للرئيسية
        </span>
      </button>

      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-200/20 blur-3xl" />
        <div className="absolute bottom-[-15%] left-[-8%] w-[400px] h-[400px] rounded-full bg-emerald-200/15 blur-3xl" />
        <div className="absolute top-[30%] left-[20%] w-[200px] h-[200px] rounded-full bg-amber-100/20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Top branding */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 relative">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-slate-800 to-slate-950 text-white shadow-2xl ring-4 ring-white/80">
              <ShieldCheck className="h-10 w-10" />
            </div>
            {/* Animated pulse ring */}
            <div className="absolute inset-0 mx-auto h-20 w-20 rounded-3xl bg-slate-900/20 animate-ping" style={{ animationDuration: '3s' }} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            منصة رفق
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-bold">
            بوابة دخول المشرفين والمدراء
          </p>
        </div>

        {/* Login Card */}
        <form onSubmit={handleLogin} className="rounded-3xl border border-white/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl shadow-2xl p-8 space-y-6">
          
          {/* Error popup */}
          {error && (
            <div className="rounded-2xl border border-rose-200 dark:border-rose-800/50 bg-rose-50/80 dark:bg-rose-900/20 backdrop-blur-lg px-4 py-3 text-sm font-bold text-rose-700 dark:text-rose-400 animate-in fade-in slide-in-from-top-2 duration-300">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-300">
                البريد الإلكتروني
              </label>
              <input
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-3 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400"
                type="email"
                placeholder="admin@rifq.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-300">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-3 pl-12 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <button 
            className="primary-btn w-full py-3.5 text-base font-black" 
            disabled={isLoading}
          >
            <LockKeyhole className="h-5 w-5" />
            {isLoading ? "جاري التحقق..." : "تسجيل الدخول"}
          </button>

          {/* Footer hint */}
          <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 font-bold pt-2">
            هذه البوابة مخصصة حصرياً للمشرفين المعتمدين.
            <br />
            جميع محاولات الدخول مسجلة ومراقبة.
          </p>
        </form>
      </div>
    </main>
  );
}
