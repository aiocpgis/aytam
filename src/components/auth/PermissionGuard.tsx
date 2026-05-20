import React from "react";
import { usePermissions } from "../../hooks/usePermissions";

interface PermissionGuardProps {
  permission?: string;
  permissionsAny?: string[];
  permissionsAll?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  permission,
  permissionsAny,
  permissionsAll,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissions();

  if (isLoading) {
    return null; // Or a very subtle loader if preferred
  }

  let isAllowed = true;

  if (permission) {
    isAllowed = isAllowed && hasPermission(permission);
  }
  if (permissionsAny && permissionsAny.length > 0) {
    isAllowed = isAllowed && hasAnyPermission(permissionsAny);
  }
  if (permissionsAll && permissionsAll.length > 0) {
    isAllowed = isAllowed && hasAllPermissions(permissionsAll);
  }

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
