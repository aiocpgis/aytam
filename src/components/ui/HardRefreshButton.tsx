import { RefreshCw } from "lucide-react";
import { useState } from "react";

export function HardRefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleHardRefresh = () => {
    setIsRefreshing(true);
    // Clear localStorage and sessionStorage if needed
    // localStorage.clear(); // Careful: this clears auth too. 
    // We will just force reload the window ignoring cache
    window.location.reload();
  };

  return (
    <button
      onClick={handleHardRefresh}
      disabled={isRefreshing}
      className="p-2 rounded-xl bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-2"
      title="تحديث النظام القوي (Hard Refresh)"
    >
      <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
      <span className="hidden md:inline text-xs font-black">تحديث قوي</span>
    </button>
  );
}
