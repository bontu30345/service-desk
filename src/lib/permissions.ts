import type { Role } from "@prisma/client";
import { auth } from "@/features/auth/auth";
import { hasPermission } from "./permission-policy";
import type { Permission } from "./permission-policy";
export { hasPermission } from "./permission-policy";
export type { Permission } from "./permission-policy";

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication is required.");
    this.name = "AuthenticationRequiredError";
  }
}

export class AuthorizationError extends Error {
  constructor() {
    super("You are not authorized to perform this operation.");
    this.name = "AuthorizationError";
  }
}

export async function requireAuthenticatedUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new AuthenticationRequiredError();
  }

  return session.user;
}

export async function requireRole(role: Role) {
  const user = await requireAuthenticatedUser();

  if (user.role !== role) {
    throw new AuthorizationError();
  }

  return user;
}

export async function requireAnyRole(...roles: Role[]) {
  const user = await requireAuthenticatedUser();

  if (!roles.includes(user.role)) {
    throw new AuthorizationError();
  }

  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireAuthenticatedUser();

  if (!hasPermission(user.role, permission)) {
    throw new AuthorizationError();
  }

  return user;
}
