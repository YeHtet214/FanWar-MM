import type { User } from '@supabase/supabase-js';

export function isModeratorUser(user: User) {
  const appRole = user.app_metadata?.role;
  const appRoles = user.app_metadata?.roles;
  const userRole = user.user_metadata?.role;

  return (
    appRole === 'moderator'
    || userRole === 'moderator'
    || (Array.isArray(appRoles) && appRoles.includes('moderator'))
  );
}

export function isAdminUser(user: User) {
  const appRole = user.app_metadata?.role;
  const appRoles = user.app_metadata?.roles;
  const appIsAdmin = user.app_metadata?.is_admin;

  return (
    appRole === 'admin'
    || appIsAdmin === true
    || (Array.isArray(appRoles) && appRoles.includes('admin'))
  );
}
