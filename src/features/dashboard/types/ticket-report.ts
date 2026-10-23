import type { Priority, TicketStatus } from "@prisma/client";

export type TicketReportFilters = {
  from?: string;
  to?: string;
  status?: TicketStatus;
  priority?: Priority;
  categoryId?: number;
  departmentId?: number;
  assigneeId?: number;
  range?: "7d" | "30d" | "year" | "custom";
  page: number;
};

export type TicketReportRow = {
  id: number;
  title: string;
  status: TicketStatus;
  priority: Priority;
  createdAt: Date;
  creator: { name: string };
  assignee: { name: string } | null;
  category: { name: string };
  department: { name: string };
};

export type TicketReportAnalytics = {
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  priorityCount: number;
  statusCounts: { status: TicketReportRow["status"]; count: number }[];
  priorityCounts: { priority: TicketReportRow["priority"]; count: number }[];
  departmentCounts: { name: string; count: number }[];
};

export type TicketReportPage = {
  tickets: TicketReportRow[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
  analytics: TicketReportAnalytics;
};

export type TicketReportOption = {
  id: number;
  name: string;
};
