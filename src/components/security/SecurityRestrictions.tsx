import { useEffect } from "react";
import { usePermissions } from "../../hooks/usePermissions";
import { supabase } from "../../lib/supabase";
import { useState } from "react";

export function SecurityRestrictions() {
  const { hasPermission, isLoading } = usePermissions();
  const [userInfo, setUserInfo] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserInfo({
          email: data.user.email || "",
          name: data.user.user_metadata?.full_name || "مستخدم",
        });
      }
    });
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const disableCopy = hasPermission("security.disable_copy");
    
    if (disableCopy) {
      const handleContextMenu = (e: MouseEvent) => e.preventDefault();
      const handleCopy = (e: ClipboardEvent) => e.preventDefault();
      const handleSelectStart = (e: Event) => e.preventDefault();
      const handleDragStart = (e: DragEvent) => e.preventDefault();

      document.addEventListener("contextmenu", handleContextMenu);
      document.addEventListener("copy", handleCopy);
      document.addEventListener("selectstart", handleSelectStart);
      document.addEventListener("dragstart", handleDragStart);

      // Disable selection via CSS
      document.body.style.userSelect = "none";
      document.body.style.webkitUserSelect = "none";

      return () => {
        document.removeEventListener("contextmenu", handleContextMenu);
        document.removeEventListener("copy", handleCopy);
        document.removeEventListener("selectstart", handleSelectStart);
        document.removeEventListener("dragstart", handleDragStart);
        document.body.style.userSelect = "";
        document.body.style.webkitUserSelect = "";
      };
    }
  }, [hasPermission, isLoading]);

  if (isLoading || !userInfo) return null;

  const showWatermark = hasPermission("security.enable_watermark");

  return (
    <>
      {/* 
        Note: Front-end restrictions like preventing screenshot, copy, or print 
        are only deterrents and can be bypassed by technical users.
        Real protection comes from RLS and permissions.
      */}
      {hasPermission("security.disable_print") && (
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { display: none !important; }
          }
        `}} />
      )}

      {showWatermark && (
        <div 
          className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden opacity-5"
          aria-hidden="true"
        >
          <div className="absolute inset-[-100%] flex flex-wrap justify-center items-center gap-20 rotate-[-30deg]">
            {Array.from({ length: 50 }).map((_, i) => (
              <div key={i} className="text-slate-900 font-bold text-2xl whitespace-nowrap">
                {userInfo.name} • {userInfo.email} • {new Date().toLocaleDateString('ar-EG')}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
