import type { Role } from "@prisma/client";
import type { TicketStatus } from "@prisma/client";
import type { Permission } from "@/lib/permissions";
import type {
  TicketQueue,
  TicketListQueryScope,
  TicketListScope,
  TicketUpdateScope,
} from "./types/ticket";

export function getTicketReadPermission(role: Role): Permission {
  switch (role) {
    case "ADMIN":
      return "ticket:manage";
    case "AGENT":
      return "ticket:read:work";
    case "EMPLOYEE":
      return "ticket:read:own";
  }
}

export function getTicketCommentPermission(role: Role): Permission {
  switch (role) {
    case "ADMIN":
      return "ticket:manage";
    case "AGENT":
      return "ticket:comment:work";
    case "EMPLOYEE":
      return "ticket:comment:own";
  }
}

export function getTicketReadScope(
  role: Role,
  userId: number,
): TicketListScope {
  switch (role) {
    case "ADMIN":
      return { kind: "all" };
    case "AGENT":
      return { kind: "assigned-to", userId };
    case "EMPLOYEE":
      return { kind: "created-by", userId };
  }
}

export function getTicketQueueScope(
  role: Role,
  userId: number,
  queue: TicketQueue,
): TicketListQueryScope {
  if (queue === "all") {
    return getTicketReadScope(role, userId);
  }

  switch (role) {
    case "ADMIN":
    case "AGENT":
      return { kind: "assigned-to", userId };
    case "EMPLOYEE":
      return { kind: "created-by-and-assigned-to", userId };
  }
}

export function getTicketUpdatePermission(role: Role): Permission | null {
  switch (role) {
    case "ADMIN":
      return "ticket:manage";
    case "AGENT":
      return "ticket:update:assigned";
    case "EMPLOYEE":
      return null;
  }
}

export function getTicketUpdateScope(
  role: Role,
  userId: number,
): TicketUpdateScope | null {
  switch (role) {
    case "ADMIN":
      return { kind: "all" };
    case "AGENT":
      return { kind: "assigned-to", userId };
    case "EMPLOYEE":
      return null;
  }
}

export function getTicketAssignmentScope(
  role: Role,
  userId: number,
): TicketUpdateScope | null {
  switch (role) {
    case "ADMIN":
      return { kind: "all" };
    case "AGENT":
      return { kind: "assigned-to", userId };
    case "EMPLOYEE":
      return null;
  }
}

const allowedStatusTransitions: Record<TicketStatus, readonly TicketStatus[]> =
  {
    OPEN: ["IN_PROGRESS"],
    IN_PROGRESS: ["RESOLVED"],
    RESOLVED: ["CLOSED"],
    CLOSED: [],
  };

export function getAllowedTicketStatusTransitions(
  current: TicketStatus,
): readonly TicketStatus[] {
  return allowedStatusTransitions[current];
}
