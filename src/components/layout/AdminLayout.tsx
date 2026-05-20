import { LogOut, UsersRound } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { ThemeToggle } from "../ThemeToggle";
import { HardRefreshButton } from "../ui/HardRefreshButton";

export function AdminLayout() {
  const navigate = useNavigate();

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
      <Outlet />
    </div>
  );
}
