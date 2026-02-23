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
