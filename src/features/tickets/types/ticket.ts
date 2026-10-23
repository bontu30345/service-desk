import type { Priority, Prisma, TicketStatus } from "@prisma/client";

export const safeTicketSelect = {
  id: true,
  title: true,
  status: true,
  priority: true,
  createdAt: true,
  creator: {
    select: {
      name: true,
    },
  },
  assignee: {
    select: {
      name: true,
    },
  },
  department: {
    select: {
      name: true,
    },
  },
  category: {
    select: {
      name: true,
    },
  },
  sla: {
    select: {
      name: true,
      status: true,
    },
  },
} satisfies Prisma.TicketSelect;

export type SafeTicket = Prisma.TicketGetPayload<{
  select: typeof safeTicketSelect;
}>;

export const safeTicketDetailsSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
  closedAt: true,
  creator: {
    select: {
      id: true,
      name: true,
    },
  },
  assignee: {
    select: {
      id: true,
      name: true,
    },
  },
  department: {
    select: {
      id: true,
      name: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
    },
  },
  sla: {
    select: {
      id: true,
      name: true,
      responseTimeMinutes: true,
      resolutionTimeMinutes: true,
      status: true,
    },
  },
} satisfies Prisma.TicketSelect;

export type SafeTicketDetails = Prisma.TicketGetPayload<{
  select: typeof safeTicketDetailsSelect;
}>;

export type TicketUpdateInput = {
  title: string;
  description: string;
  priority: Priority;
  departmentId: number;
  categoryId: number;
};

export type TicketAssignmentScope =
  | { kind: "all" }
  | { kind: "assigned-to"; userId: number };

export type TicketUpdateScope =
  | { kind: "all" }
  | { kind: "assigned-to"; userId: number };

export type TicketListScope =
  | { kind: "all" }
  | { kind: "created-by"; userId: number }
  | { kind: "assigned-to"; userId: number };

export type TicketListQueryScope = TicketListScope | {
  kind: "created-by-and-assigned-to";
  userId: number;
};

export type TicketQueue = "all" | "assigned";

export type TicketListFilters = {
  search?: string;
  status?: TicketStatus;
  priority?: Priority;
  departmentId?: number;
  categoryId?: number;
  assigneeId?: number;
  page: number;
};

export type PaginatedTickets = {
  tickets: SafeTicket[];
  totalCount: number;
  totalAvailable: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

export type TicketRelationOption = {
  id: number;
  name: string;
};

export type TicketSLAOption = {
  id: number;
  name: string;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
};

export type TicketSlaAssignmentActionState = {
  success: boolean;
  message: string;
  fieldErrors?: {
    slaId?: string[];
  };
};

export type CreateTicketInput = {
  title: string;
  description: string;
  priority: Priority;
  departmentId: number;
  categoryId: number;
};

export type CreatedTicket = Pick<SafeTicket, "id" | "title">;
