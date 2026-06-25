import { ReactNode, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { usePermissions } from "../../hooks/usePermissions";
import { MaintenanceScreen } from "../ui/MaintenanceScreen";
import { PageLoader } from "../ui/PageLoader";

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

  if (isMaintenance === null || permissionsLoading) {
    return <PageLoader text="جاري التحقق من حالة النظام..." />;
  }

  // Bypass maintenance mode if disabled, or if the user is authorized to assign permissions (admin)
  const isAuthorizedAdmin = hasPermission("users.assign_permissions");

  if (isMaintenance && !isAuthorizedAdmin) {
    return <MaintenanceScreen />;
  }

  return <>{children}</>;
}
