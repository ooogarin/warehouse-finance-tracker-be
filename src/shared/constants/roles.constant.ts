// User roles for role-based access control (RBAC)
export const USER_ROLES = {
  // Owner has full access to the merchant
  OWNER: 'owner',
  // Staff can manage inventory and view reports
  STAFF: 'staff',
} as const;

// Type for user roles
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// All valid roles as an array
export const ALL_ROLES: UserRole[] = [USER_ROLES.OWNER, USER_ROLES.STAFF];

// Check if a role is valid
export const isValidRole = (role: string): role is UserRole => {
  return ALL_ROLES.includes(role as UserRole);
};

// Role hierarchy (higher index = more permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [USER_ROLES.STAFF]: 1,
  [USER_ROLES.OWNER]: 2,
};

// Check if a role has permission level >= required role
export const hasMinimumRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};
