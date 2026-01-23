import { useAuth, AppRole } from '@/contexts/AuthContext';

interface Permissions {
  canViewDashboard: boolean;
  canViewProjects: boolean;
  canCreateProject: boolean;
  canUpdateProject: boolean;
  canDeleteProject: boolean;
  canViewPages: boolean;
  canCreatePage: boolean;
  canUpdatePageStatus: boolean;
  canApprovePage: boolean;
  canUnlockPage: boolean;
  canDeletePage: boolean;
  canViewTickets: boolean;
  canCreateTicket: boolean;
  canResolveTicket: boolean;
  canViewTeam: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  canAccessAdminPanel: boolean;
}

export function usePermissions(): Permissions {
  const { role } = useAuth();

  const hasRole = (allowedRoles: AppRole[]): boolean => {
    if (!role) return false;
    return allowedRoles.includes(role);
  };

  return {
    // Dashboard - everyone can view
    canViewDashboard: hasRole(['user', 'admin']),

    // Projects
    canViewProjects: hasRole(['user', 'admin']),
    canCreateProject: hasRole(['user', 'admin']),
    canUpdateProject: hasRole(['admin']), // Assuming users use a different flow or only draft updates which isn't fully captured here. Or restricted update.
    canDeleteProject: hasRole(['user', 'admin']),

    // Pages
    canViewPages: hasRole(['user', 'admin']),
    canCreatePage: hasRole(['user', 'admin']),
    canUpdatePageStatus: hasRole(['user', 'admin']), // Developers/Users update status
    canApprovePage: hasRole(['admin']),
    canUnlockPage: hasRole(['admin']),
    canDeletePage: hasRole(['user', 'admin']),

    // Tickets
    canViewTickets: hasRole(['user', 'admin']),
    canCreateTicket: hasRole(['user', 'admin']),
    canResolveTicket: hasRole(['user', 'admin']),

    // Team
    canViewTeam: hasRole(['admin']),

    // User Management (Tech Admin only)
    canManageUsers: hasRole(['admin']),
    canManageSettings: hasRole(['admin']),
    canAccessAdminPanel: hasRole(['admin']),
  };
}
