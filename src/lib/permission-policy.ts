import type { Role } from "@prisma/client";

export type Permission =
  | "ticket:create"
  | "ticket:read:own"
  | "ticket:read:work"
  | "ticket:update:assigned"
  | "ticket:comment:own"
  | "ticket:comment:work"
  | "ticket:assign"
  | "ticket:manage"
  | "notification:read:own"
  | "notification:read:all"
  | "user:manage"
  | "department:manage"
  | "category:manage"
  | "sla:manage"
  | "dashboard:admin"
  | "audit-log:read";

const rolePermissions: Record<Role, readonly Permission[]> = {
  EMPLOYEE: [
    "ticket:create",
    "ticket:read:own",
    "ticket:comment:own",
    "notification:read:own",
  ],
  AGENT: [
    "ticket:read:work",
    "ticket:update:assigned",
    "ticket:comment:work",
    "ticket:assign",
    "notification:read:own",
  ],
  ADMIN: [
    "ticket:create",
    "ticket:read:own",
    "ticket:read:work",
    "ticket:update:assigned",
    "ticket:comment:own",
    "ticket:comment:work",
    "ticket:assign",
    "ticket:manage",
    "notification:read:own",
    "notification:read:all",
    "user:manage",
    "department:manage",
    "category:manage",
    "sla:manage",
    "dashboard:admin",
    "audit-log:read",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}
