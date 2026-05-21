import { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { router } from "../routes/AppRoutes";
import { PermissionsProvider } from "../hooks/usePermissions";
import { ThemeProvider } from "../hooks/useTheme";
import { ToastProvider } from "../components/ui/ToastProvider";
import { SecurityRestrictions } from "../components/security/SecurityRestrictions";

export default function App() {
  // Bypass the 3.5s cinematic intro video if the user is visiting an administrative path (starting with /admin)
  const isAdminPath = window.location.pathname.includes("/admin");
  const [showLoader, setShowLoader] = useState(!isAdminPath);

  return (
    <ThemeProvider defaultTheme="light" storageKey="orphan-care-theme">
      <ToastProvider>
        <PermissionsProvider>
          <SecurityRestrictions />
          {showLoader && <LoadingScreen onComplete={() => setShowLoader(false)} />}
          <RouterProvider router={router} />
        </PermissionsProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
