import { ReactNode, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { usePermissions } from "../../hooks/usePermissions";
import { MaintenanceScreen } from "../ui/MaintenanceScreen";

interface MaintenanceGuardProps {
  children: ReactNode;
}

export function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const [isMaintenance, setIsMaintenance] = useState<boolean | null>(null);
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();

  useEffect(() => {
    let isMounted = true;
    let channel: any = null;

    async function fetchMaintenanceMode() {
      try {
        const { data, error } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "maintenance_mode")
          .maybeSingle();

        if (error) {
          console.warn("System settings table not available yet. Maintenance mode is inactive.", error.message);
          if (isMounted) setIsMaintenance(false);
          return;
        }

        if (isMounted && data) {
          const val = typeof data.value === "string" 
            ? data.value === "true" 
            : Boolean(data.value);
          setIsMaintenance(val);
        } else if (isMounted) {
          setIsMaintenance(false); // default fallback
        }

        // Subscribe to changes in real-time only if the table exists
        if (isMounted) {
          channel = supabase
            .channel("system_settings_realtime")
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "system_settings",
              },
              (payload) => {
                if (payload.new && (payload.new as any).key === "maintenance_mode") {
                  const val = typeof (payload.new as any).value === "string" 
                    ? (payload.new as any).value === "true" 
                    : Boolean((payload.new as any).value);
                  if (isMounted) {
                    setIsMaintenance(val);
                  }
                }
              }
            )
            .subscribe();
        }
      } catch (err) {
        console.error("Failed to read maintenance state", err);
        if (isMounted) setIsMaintenance(false);
      }
    }

    void fetchMaintenanceMode();

    return () => {
      isMounted = false;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, []);

  // Show an advanced, glassmorphic loading state while initial checking is in progress
  if (isMaintenance === null || permissionsLoading) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-gradient-to-br from-blue-50/40 via-white to-cyan-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4">
        {/* Glowing blue background ambient blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-500/10 dark:bg-blue-500/15 blur-[80px] pointer-events-none -z-10" />

        <div className="rounded-3xl border border-white/60 dark:border-white/10 bg-white/45 dark:bg-slate-900/45 shadow-glass backdrop-blur-2xl w-full max-w-md p-8 text-center relative overflow-hidden">
          {/* Subtle top border glow */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
          
          <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/10 border border-blue-100/80 dark:border-blue-900/30 shadow-inner">
            {/* Spinning glowing blue ring */}
            <div className="absolute inset-2 rounded-xl border-2 border-slate-100 dark:border-slate-800" />
            <div className="absolute inset-2 rounded-xl border-2 border-blue-500 border-t-transparent animate-spin" />
            <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>

          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">منصة رِفْق لرعاية الأيتام</h2>
          <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            جاري تأمين الاتصال والتحقق من حالة النظام...
          </p>

          {/* Dynamic pulsing blue loading dots */}
          <div className="mt-6 flex justify-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]" />
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-2.5 w-2.5 rounded-full bg-blue-400 animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  // Bypass maintenance mode if disabled, or if the user is authorized to assign permissions (admin)
  const isAuthorizedAdmin = hasPermission("users.assign_permissions");

  if (isMaintenance && !isAuthorizedAdmin) {
    return <MaintenanceScreen />;
  }

  return <>{children}</>;
}
