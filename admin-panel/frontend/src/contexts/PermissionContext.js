import React, { createContext, useContext } from 'react';
import { useAdminAuth } from './AdminAuthContext';

const PermissionContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

export const PermissionProvider = ({ children }) => {
  const { admin } = useAdminAuth();

  // Permission constants (must match backend)
  const PERMISSIONS = {
    MANAGE_ADMINS: 'manage_admins',
    VIEW_USERS: 'view_users',
    EDIT_USERS: 'edit_users',
    DELETE_USERS: 'delete_users',
    VIEW_APPLICATIONS: 'view_applications',
    EDIT_APPLICATIONS: 'edit_applications',
    DELETE_APPLICATIONS: 'delete_applications',
    VIEW_PAYMENTS: 'view_payments',
    EDIT_PAYMENTS: 'edit_payments',
    VIEW_APPOINTMENTS: 'view_appointments',
    EDIT_APPOINTMENTS: 'edit_appointments',
    VIEW_FEEDBACK: 'view_feedback',
    EDIT_FEEDBACK: 'edit_feedback',
    VIEW_SUPPORT: 'view_support',
    EDIT_SUPPORT: 'edit_support',
    VIEW_DASHBOARD: 'view_dashboard',
  };

  // Role-to-permissions mapping (must match backend)
  const ROLE_PERMISSIONS = {
    super_admin: [
      PERMISSIONS.MANAGE_ADMINS,
      PERMISSIONS.VIEW_USERS,
      PERMISSIONS.EDIT_USERS,
      PERMISSIONS.DELETE_USERS,
      PERMISSIONS.VIEW_APPLICATIONS,
      PERMISSIONS.EDIT_APPLICATIONS,
      PERMISSIONS.DELETE_APPLICATIONS,
      PERMISSIONS.VIEW_PAYMENTS,
      PERMISSIONS.EDIT_PAYMENTS,
      PERMISSIONS.VIEW_APPOINTMENTS,
      PERMISSIONS.EDIT_APPOINTMENTS,
      PERMISSIONS.VIEW_FEEDBACK,
      PERMISSIONS.EDIT_FEEDBACK,
      PERMISSIONS.VIEW_SUPPORT,
      PERMISSIONS.EDIT_SUPPORT,
      PERMISSIONS.VIEW_DASHBOARD,
    ],
    admin: [
      PERMISSIONS.VIEW_USERS,
      PERMISSIONS.EDIT_USERS,
      PERMISSIONS.VIEW_APPLICATIONS,
      PERMISSIONS.EDIT_APPLICATIONS,
      PERMISSIONS.VIEW_PAYMENTS,
      PERMISSIONS.EDIT_PAYMENTS,
      PERMISSIONS.VIEW_APPOINTMENTS,
      PERMISSIONS.EDIT_APPOINTMENTS,
      PERMISSIONS.VIEW_FEEDBACK,
      PERMISSIONS.EDIT_FEEDBACK,
      PERMISSIONS.VIEW_SUPPORT,
      PERMISSIONS.EDIT_SUPPORT,
      PERMISSIONS.VIEW_DASHBOARD,
    ],
    viewer: [
      PERMISSIONS.VIEW_USERS,
      PERMISSIONS.VIEW_APPLICATIONS,
      PERMISSIONS.VIEW_PAYMENTS,
      PERMISSIONS.VIEW_APPOINTMENTS,
      PERMISSIONS.VIEW_FEEDBACK,
      PERMISSIONS.VIEW_SUPPORT,
      PERMISSIONS.VIEW_DASHBOARD,
    ],
  };

  // Get permissions for a role
  const getPermissionsForRole = (role) => {
    return ROLE_PERMISSIONS[role] || [];
  };

  // Map pages to permissions (must match backend)
  const PAGE_TO_PERMISSIONS = {
    'dashboard': [PERMISSIONS.VIEW_DASHBOARD],
    'users': [PERMISSIONS.VIEW_USERS, PERMISSIONS.EDIT_USERS, PERMISSIONS.DELETE_USERS],
    'applications': [PERMISSIONS.VIEW_APPLICATIONS, PERMISSIONS.EDIT_APPLICATIONS, PERMISSIONS.DELETE_APPLICATIONS],
    'payments': [PERMISSIONS.VIEW_PAYMENTS, PERMISSIONS.EDIT_PAYMENTS],
    'scheduled-calls': [PERMISSIONS.VIEW_APPOINTMENTS, PERMISSIONS.EDIT_APPOINTMENTS],
    'feedbacks': [PERMISSIONS.VIEW_FEEDBACK, PERMISSIONS.EDIT_FEEDBACK],
    'support-requests': [PERMISSIONS.VIEW_SUPPORT, PERMISSIONS.EDIT_SUPPORT],
    'admin-users': [PERMISSIONS.MANAGE_ADMINS]
  };

  // Get permissions from pages array
  const getPermissionsFromPages = (pages) => {
    if (!pages || !Array.isArray(pages)) {
      return [];
    }
    const permissions = new Set();
    pages.forEach(page => {
      if (PAGE_TO_PERMISSIONS[page]) {
        PAGE_TO_PERMISSIONS[page].forEach(perm => permissions.add(perm));
      }
    });
    return Array.from(permissions);
  };

  // Get current user's permissions (from admin.pages, admin.permissions, or calculated from role)
  const getUserPermissions = () => {
    if (!admin) {
      return [];
    }
    // If permissions are already set, use them
    if (admin.permissions && Array.isArray(admin.permissions) && admin.permissions.length > 0) {
      return admin.permissions;
    }
    // If pages are set, calculate permissions from pages
    if (admin.pages && Array.isArray(admin.pages) && admin.pages.length > 0) {
      return getPermissionsFromPages(admin.pages);
    }
    // Otherwise, calculate from role (backward compatibility)
    if (admin.role) {
      return getPermissionsForRole(admin.role);
    }
    // Fallback: if it's a legacy admin or unknown, treat as super_admin
    return getPermissionsForRole('super_admin');
  };

  // Helper function to check if user has permission
  const hasPermission = (permission) => {
    if (!admin) {
      return false;
    }
    const permissions = getUserPermissions();
    return permissions.includes(permission);
  };

  // Helper to check if user is super admin (has all pages including admin-users)
  const isSuperAdmin = () => {
    if (!admin) return false;
    // Check if user has admin-users page access (indicates super admin)
    if (admin.pages && Array.isArray(admin.pages)) {
      return admin.pages.includes('admin-users');
    }
    // Fallback to role check for backward compatibility
    return admin.role === 'super_admin';
  };

  // Helper to check if user has access to a specific page
  const hasPageAccess = (page) => {
    if (!admin) return false;
    if (admin.pages && Array.isArray(admin.pages)) {
      return admin.pages.includes(page);
    }
    // Fallback: check by role (backward compatibility)
    if (admin.role === 'super_admin') return true;
    if (admin.role === 'viewer' && page === 'admin-users') return false;
    return page !== 'admin-users'; // Only super_admin can access admin-users
  };

  // Helper to check if user has any of the provided permissions
  const hasAnyPermission = (permissions) => {
    if (!admin) {
      return false;
    }
    const userPerms = getUserPermissions();
    return permissions.some(permission => userPerms.includes(permission));
  };

  // Helper to check if user has all of the provided permissions
  const hasAllPermissions = (permissions) => {
    if (!admin) {
      return false;
    }
    const userPerms = getUserPermissions();
    return permissions.every(permission => userPerms.includes(permission));
  };

  const userPermissions = getUserPermissions();

  const value = {
    permissions: userPermissions,
    pages: admin?.pages || [],
    role: admin?.role || null,
    PERMISSIONS,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    hasPageAccess,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

