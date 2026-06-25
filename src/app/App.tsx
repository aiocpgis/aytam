import { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { router } from "../routes/AppRoutes";
import { PermissionsProvider } from "../hooks/usePermissions";
import { ThemeProvider } from "../hooks/useTheme";
import { ToastProvider } from "../components/ui/ToastProvider";
import { SecurityRestrictions } from "../components/security/SecurityRestrictions";

export default function App() {
  // Show the cinematic loader only once per browser-tab session.
  // sessionStorage persists across minimise/restore but is cleared when the tab closes.
  // This prevents Supabase TOKEN_REFRESHED events from re-triggering the loader.
  const isAdminPath = window.location.pathname.includes("/admin");
  const alreadyShown = sessionStorage.getItem("rifq_loader_shown") === "1";
  const [showLoader, setShowLoader] = useState(!isAdminPath && !alreadyShown);

  return (
    <ThemeProvider defaultTheme="light" storageKey="orphan-care-theme">
      <ToastProvider>
        <PermissionsProvider>
          <SecurityRestrictions />
          {showLoader && <LoadingScreen onComplete={() => {
            sessionStorage.setItem("rifq_loader_shown", "1");
            setShowLoader(false);
          }} />}
          <RouterProvider router={router} />
        </PermissionsProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
