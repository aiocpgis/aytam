-- Migration: Remove watermark permission from the system
-- Since permission_id has ON DELETE CASCADE in role_permissions and user_permissions,
-- deleting the permission row itself is sufficient.

DELETE FROM public.permissions 
WHERE key = 'security.enable_watermark';
