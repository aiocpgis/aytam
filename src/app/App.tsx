import { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { router } from "../routes/AppRoutes";
import { PermissionsProvider } from "../hooks/usePermissions";
import { ThemeProvider } from "../hooks/useTheme";
import { ToastProvider } from "../components/ui/ToastProvider";
import { SecurityRestrictions } from "../components/security/SecurityRestrictions";

export default function App() {
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowLoader(false), 1300);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="orphan-care-theme">
      <ToastProvider>
        <PermissionsProvider>
          <SecurityRestrictions />
          {showLoader && <LoadingScreen />}
          <RouterProvider router={router} />
        </PermissionsProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
