import { useEffect, useMemo, useState } from "react";
import { LogOut, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { ThemeToggle } from "../ThemeToggle";
import { HardRefreshButton } from "../ui/HardRefreshButton";

type AdminWelcomeInfo = {
  fullName: string;
  roleLabel: string;
};

const rolePriority = ["مدير النظام", "مدخل بيانات", "مشاهد"];

function pickPrimaryRole(labels: string[]) {
  for (const role of rolePriority) {
    if (labels.includes(role)) return role;
  }
  return labels[0] || "مشرف";
}

export function AdminLayout() {
  const navigate = useNavigate();
  const [welcomeInfo, setWelcomeInfo] = useState<AdminWelcomeInfo | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadWelcomeInfo() {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) return;

      const [{ data: profile }, { data: roleRows }] = await Promise.all([
        supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("roles(label)").eq("user_id", user.id),
      ]);

      const roleLabels = (roleRows ?? [])
        .map((row: any) => row.roles?.label)
        .filter(Boolean);

      const fullName = profile?.full_name || profile?.email || user.email || "مستخدم";
      const roleLabel = pickPrimaryRole(roleLabels);

      if (isMounted) {
        setWelcomeInfo({ fullName, roleLabel });
      }
    }

    void loadWelcomeInfo();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void loadWelcomeInfo();
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const greetingName = useMemo(() => welcomeInfo?.fullName?.trim() || "مستخدم", [welcomeInfo]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="min-h-screen px-4 py-5">
      <header className="mx-auto mb-6 flex flex-col md:flex-row max-w-7xl items-center justify-between gap-4 rounded-3xl border border-white/60 bg-white/55 p-4 shadow-soft backdrop-blur-xl">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-900 text-white">
            <UsersRound className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-black text-slate-900">منصة رِفْق</h1>
            <p className="text-[10px] md:text-xs font-bold text-slate-500">إدارة كفالات الأيتام</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full justify-end md:w-auto">
          <HardRefreshButton />
          <ThemeToggle />
          <button type="button" onClick={handleLogout} className="secondary-btn">
            <LogOut className="h-4 w-4" />
            خروج
          </button>
        </div>
      </header>

      <section className="mx-auto mb-6 max-w-7xl rounded-3xl border border-white/70 bg-white/60 p-5 shadow-soft backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
              <UserRound className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400">بطاقة الدخول</p>
              <h2 className="mt-1 text-lg font-black text-slate-900 md:text-xl">
                أهلاً وسهلاً بك {greetingName}
              </h2>
            </div>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            {welcomeInfo?.roleLabel || "جاري تحميل الدور..."}
          </div>
        </div>
      </section>

      <Outlet />
    </div>
  );
}
