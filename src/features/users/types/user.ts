import type { Prisma, Role } from "@prisma/client";

export const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  departmentId: true,
  department: {
    select: {
      name: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type SafeUser = Prisma.UserGetPayload<{
  select: typeof safeUserSelect;
}>;

export type SafeUserListItem = SafeUser & { hasProfilePhoto: boolean };

export type UserListFilters = {
  search?: string;
  role?: Role;
  departmentId?: number;
  status?: "active" | "inactive";
  page?: number;
};

export type PaginatedUsers = {
  users: SafeUserListItem[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

export type UserActionState = {
  success: boolean;
  message: string;
  fieldErrors?: Partial<
    Record<
      "name" | "email" | "password" | "role" | "departmentId" | "status",
      string[]
    >
  >;
};

export type UserDeleteInfo = {
  id: number;
  role: Role;
  isActive: boolean;
  ticketCount: number;
  commentCount: number;
  attachmentCount: number;
  notificationCount: number;
  auditLogCount: number;
  oauthIdentityCount: number;
  passwordResetTokenCount: number;
  hasNotificationPreference: boolean;
};
