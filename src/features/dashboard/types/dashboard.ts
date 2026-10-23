import type { Priority, SLAStatus, TicketStatus } from "@prisma/client";

export type DashboardStatusCount = {
  status: TicketStatus;
  count: number;
};

export type DashboardPriorityCount = {
  priority: Priority;
  count: number;
};

export type DashboardDepartmentCount = {
  departmentId: number;
  name: string;
  count: number;
};

export type DashboardTicket = {
  id: number;
  title: string;
  status: TicketStatus;
  priority: Priority;
  createdAt: Date;
  creator: { name: string };
  assignee: { name: string } | null;
  sla: {
    name: string;
    status: SLAStatus;
    resolutionTimeMinutes: number;
  } | null;
};

export type OperationalDashboardData = {
  userName: string;
  role: "ADMIN" | "AGENT" | "EMPLOYEE";
  totalUsers: number | null;
  activeUsers: number | null;
  totalTickets: number;
  statusCounts: DashboardStatusCount[];
  priorityCounts: DashboardPriorityCount[];
  departmentCounts: DashboardDepartmentCount[];
  recentTickets: DashboardTicket[];
  myAssignedTicketCount: number | null;
  myAssignedTickets: DashboardTicket[];
  priorityFocusTickets: DashboardTicket[];
  urgentTicketCount: number | null;
};
