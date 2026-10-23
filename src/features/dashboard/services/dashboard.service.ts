import type { Role } from "@prisma/client";
import { getTicketReadScope } from "@/features/tickets/access";
import { getDashboardTicketData } from "../repositories/dashboard.repository";
import type { OperationalDashboardData } from "../types/dashboard";

export async function getOperationalDashboard(
  userId: number,
  userName: string,
  role: Role,
): Promise<OperationalDashboardData> {
  const includeAssignedSection = role === "ADMIN" || role === "AGENT";

  const data = await getDashboardTicketData(
    getTicketReadScope(role, userId),
    userId,
    includeAssignedSection,
  );

  return { ...data, userName, role };
}
