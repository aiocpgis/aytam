import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex items-center gap-2 p-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
      title={theme === "dark" ? "العودة للون السابق (الوضع الفاتح)" : "الانتقال للون الجديد (الوضع الداكن)"}
    >
      {theme === "dark" ? (
        <>
          <Sun className="h-5 w-5 text-amber-500" />
          <span className="hidden md:inline text-xs font-black">الوضع الفاتح (السابق)</span>
        </>
      ) : (
        <>
          <Moon className="h-5 w-5 text-indigo-500" />
          <span className="hidden md:inline text-xs font-black">الوضع الداكن (الجديد)</span>
        </>
      )}
    </button>
  );
}
