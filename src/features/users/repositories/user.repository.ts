import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/features/audit-logs/repositories/audit-log.repository";
import type { Role } from "@prisma/client";
import { safeUserSelect } from "../types/user";
import type { CreateUserInput } from "../schemas/user.schema";
import type { UpdateUserInput } from "../schemas/user.schema";
import type { PaginatedUsers, UserDeleteInfo, UserListFilters } from "../types/user";

export const USER_PAGE_SIZE = 10;

export class LastActiveAdminError extends Error {
  constructor() {
    super("The last active administrator cannot be deactivated.");
    this.name = "LastActiveAdminError";
  }
}

export class LastActiveAdminDeletionError extends Error {
  constructor() {
    super("The last active administrator cannot be deleted.");
    this.name = "LastActiveAdminDeletionError";
  }
}

export function shouldProtectLastActiveAdmin(
  role: Role,
  currentlyActive: boolean,
  desiredActive: boolean,
  activeAdminCount: number,
) {
  return (
    !desiredActive &&
    currentlyActive &&
    role === "ADMIN" &&
    activeAdminCount <= 1
  );
}

export async function listUsers(
  filters: UserListFilters = {},
): Promise<PaginatedUsers> {
  const where = {
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" as const } },
            { email: { contains: filters.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(filters.role ? { role: filters.role } : {}),
    ...(filters.departmentId !== undefined
      ? { departmentId: filters.departmentId }
      : {}),
    ...(filters.status
      ? { isActive: filters.status === "active" }
      : {}),
  };

  const totalCount = await prisma.user.count({ where });
  const totalPages = Math.ceil(totalCount / USER_PAGE_SIZE);
  const page = Math.min(filters.page ?? 1, Math.max(totalPages, 1));

  const usersWithPhotoKeys = await prisma.user.findMany({
    where,
    select: { ...safeUserSelect, profilePhotoKey: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * USER_PAGE_SIZE,
    take: USER_PAGE_SIZE,
  });
  const users = usersWithPhotoKeys.map(({ profilePhotoKey, ...user }) => ({
    ...user,
    hasProfilePhoto: profilePhotoKey !== null,
  }));

  return {
    users,
    totalCount,
    totalPages,
    page,
    pageSize: USER_PAGE_SIZE,
  };
}

export function findUserById(id: number) {
  return prisma.user.findUnique({
    where: { id },
    select: safeUserSelect,
  });
}

export async function deleteUserIfUnreferenced(id: number, actorId: number) {
  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({
      where: { id },
      select: { id: true, role: true, isActive: true },
    });
    if (!user) return { kind: "missing" as const };

    if (user.role === "ADMIN" && user.isActive) {
      const activeAdminCount = await transaction.user.count({
        where: { role: "ADMIN", isActive: true },
      });
      if (activeAdminCount <= 1) throw new LastActiveAdminDeletionError();
    }

    const result = await transaction.user.deleteMany({
      where: {
        id,
        createdTickets: { none: {} },
        assignedTickets: { none: {} },
        comments: { none: {} },
        attachments: { none: {} },
        notifications: { none: {} },
        notificationPreference: { is: null },
        auditLogs: { none: {} },
        oauthIdentities: { none: {} },
        passwordResetTokens: { none: {} },
      },
    });

    if (result.count !== 1) return { kind: "referenced" as const };
    await createAuditLog(transaction, {
      actorId,
      action: "User deleted",
      resource: "User",
      entityId: id,
    });
    return { kind: "deleted" as const };
  }, { isolationLevel: "Serializable" });
}

export async function findUserDeleteInfo(id: number): Promise<UserDeleteInfo | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      isActive: true,
      _count: {
        select: {
          createdTickets: true,
          assignedTickets: true,
          comments: true,
          attachments: true,
          notifications: true,
          auditLogs: true,
          oauthIdentities: true,
          passwordResetTokens: true,
        },
      },
      notificationPreference: { select: { id: true } },
    },
  });
  return user
    ? {
        id: user.id,
        role: user.role,
        isActive: user.isActive,
        ticketCount: user._count.createdTickets + user._count.assignedTickets,
        commentCount: user._count.comments,
        attachmentCount: user._count.attachments,
        notificationCount: user._count.notifications,
        auditLogCount: user._count.auditLogs,
        oauthIdentityCount: user._count.oauthIdentities,
        passwordResetTokenCount: user._count.passwordResetTokens,
        hasNotificationPreference: Boolean(user.notificationPreference),
      }
    : null;
}

export function listUserDepartments() {
  return prisma.department.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export function updateUser(id: number, input: UpdateUserInput, actorId: number) {
  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.update({
      where: { id },
      data: {
        name: input.name,
        email: input.email,
        role: input.role,
        departmentId: input.departmentId,
      },
      select: safeUserSelect,
    });
    await createAuditLog(transaction, {
      actorId,
      action: "User updated",
      resource: "User",
      entityId: user.id,
      changedFields: ["name", "email", "role", "departmentId"],
    });
    return user;
  });
}

export function departmentExists(id: number) {
  return prisma.department.findUnique({
    where: { id },
    select: { id: true },
  });
}

export function createUser(
  input: Omit<CreateUserInput, "password">,
  passwordHash: string,
  actorId: number,
) {
  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.create({
      data: {
        ...input,
        password: passwordHash,
      },
      select: safeUserSelect,
    });
    await createAuditLog(transaction, {
      actorId,
      action: "User created",
      resource: "User",
      entityId: user.id,
    });
    return user;
  });
}

export async function setUserActive(
  id: number,
  isActive: boolean,
  actorId: number,
) {
  return prisma.$transaction(
    async (transaction) => {
      const user = await transaction.user.findUnique({
        where: { id },
        select: {
          id: true,
          role: true,
          isActive: true,
        },
      });

      if (!user) {
        return null;
      }

      if (user.role === "ADMIN" && user.isActive && !isActive) {
        const activeAdminCount = await transaction.user.count({
          where: {
            role: "ADMIN",
            isActive: true,
          },
        });

        if (
          shouldProtectLastActiveAdmin(
            user.role,
            user.isActive,
            isActive,
            activeAdminCount,
          )
        ) {
          throw new LastActiveAdminError();
        }
      }

      if (user.isActive === isActive) {
        return transaction.user.findUnique({
          where: { id },
          select: safeUserSelect,
        });
      }

      const updatedUser = await transaction.user.update({
        where: { id },
        data: { isActive },
        select: safeUserSelect,
      });
      await createAuditLog(transaction, {
        actorId,
        action: isActive ? "User activated" : "User deactivated",
        resource: "User",
        entityId: updatedUser.id,
        changedFields: ["isActive"],
        previousValue: String(user.isActive),
        nextValue: String(isActive),
      });
      return updatedUser;
    },
    { isolationLevel: "Serializable" },
  );
}
