import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { PageLoader } from "../components/ui/PageLoader";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isReady, setIsReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        if (isMounted) {
          setIsAdmin(false);
          setIsReady(true);
        }
        return;
      }

      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (isMounted) {
        setIsAdmin(Boolean(adminUser));
        setIsReady(true);
      }
    }

    void checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      // Ignore TOKEN_REFRESHED (fired on tab switch) — only react to real auth changes
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void checkSession();
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!isReady) {
    return <PageLoader text="جاري التحقق من صلاحية الدخول..." />;
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
