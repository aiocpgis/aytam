-- =========================================================================
-- Supabase Migration: Fix RBAC Select Policies for Roles and Permissions
-- =========================================================================

-- Allow all authenticated users to read roles, permissions, and role_permissions.
-- This ensures that non-admin users (like data entry and viewers) can load their own permissions.

DROP POLICY IF EXISTS "Roles Select Policy" ON public.roles;
CREATE POLICY "Roles Select Policy" ON public.roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Permissions Select Policy" ON public.permissions;
CREATE POLICY "Permissions Select Policy" ON public.permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Role_Permissions Select Policy" ON public.role_permissions;
CREATE POLICY "Role_Permissions Select Policy" ON public.role_permissions FOR SELECT TO authenticated USING (true);
