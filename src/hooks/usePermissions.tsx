import React, { useEffect, useState, createContext, useContext } from "react";
import { getCurrentUserPermissions, checkIsSuperAdmin } from "../features/users/permissions.service";
import { supabase } from "../lib/supabase";

interface PermissionsContextType {
  permissions: string[];
  isSuperAdmin: boolean;
  isLoading: boolean;
  hasPermission: (key: string) => boolean;
  hasAnyPermission: (keys: string[]) => boolean;
  hasAllPermissions: (keys: string[]) => boolean;
  refreshPermissions: () => Promise<void>;
}

const defaultContext: PermissionsContextType = {
  permissions: [],
  isSuperAdmin: false,
  isLoading: true,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  refreshPermissions: async () => {},
};

export const PermissionsContext = createContext<PermissionsContextType>(defaultContext);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }
      
      const [superAdmin, perms] = await Promise.all([
        checkIsSuperAdmin(),
        getCurrentUserPermissions(),
      ]);
      setIsSuperAdmin(superAdmin);
      setPermissions(perms);
    } catch (err) {
      console.error("Error fetching permissions", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchPermissions();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const hasPermission = (key: string) => isSuperAdmin || permissions.includes(key);
  const hasAnyPermission = (keys: string[]) => isSuperAdmin || keys.some(k => permissions.includes(k));
  const hasAllPermissions = (keys: string[]) => isSuperAdmin || keys.every(k => permissions.includes(k));

  return (
    <PermissionsContext.Provider value={{
      permissions,
      isSuperAdmin,
      isLoading,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      refreshPermissions: fetchPermissions
    }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}
