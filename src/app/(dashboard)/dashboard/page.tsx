import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requireAuthenticatedUser,
  requirePermission,
} from "@/lib/permissions";
import { getTicketReadPermission } from "@/features/tickets/access";
import { getOperationalDashboard } from "@/features/dashboard/services/dashboard.service";
import { OperationalDashboard } from "@/features/dashboard/components/operational-dashboard";

export default async function DashboardPage() {
  await connection();

  let user;
  try {
    user = await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      redirect("/login");
    }
    throw error;
  }

  try {
    await requirePermission(getTicketReadPermission(user.role));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect("/dashboard");
    }
    throw error;
  }

  const userId = Number(user.id);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    throw new Error("The authenticated account identifier is invalid.");
  }

  const data = await getOperationalDashboard(
    userId,
    user.name ?? "there",
    user.role,
  );

  return <OperationalDashboard data={data} />;
}