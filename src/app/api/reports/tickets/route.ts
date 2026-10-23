import { getTicketReadScope, getTicketReadPermission } from "@/features/tickets/access";
import {
  areTicketReportFiltersValid,
  parseTicketReportFilters,
} from "@/features/dashboard/schemas/ticket-report.schema";
import { streamTicketReportCsv } from "@/features/dashboard/services/ticket-report-csv.service";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requireAuthenticatedUser,
  requirePermission,
} from "@/lib/permissions";

export const runtime = "nodejs";

export async function GET(request: Request) {
  let user;
  try {
    user = await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }
    throw error;
  }

  try {
    await requirePermission(getTicketReadPermission(user.role));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return Response.json({ error: "Forbidden." }, { status: 403 });
    }
    throw error;
  }

  const userId = Number(user.id);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    return Response.json({ error: "Invalid authenticated account." }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const rawFilters = {
    from: searchParams.getAll("from"),
    to: searchParams.getAll("to"),
    status: searchParams.getAll("status"),
    priority: searchParams.getAll("priority"),
    categoryId: searchParams.getAll("categoryId"),
    departmentId: searchParams.getAll("departmentId"),
    assigneeId: searchParams.getAll("assigneeId"),
    range: searchParams.getAll("range"),
  };
  const canFilterAssignee = user.role === "ADMIN";
  if (
    !areTicketReportFiltersValid(rawFilters, {
      allowAssignee: canFilterAssignee,
    })
  ) {
    return Response.json(
      { error: "One or more report filters are invalid." },
      { status: 400 },
    );
  }
  const filters = parseTicketReportFilters(rawFilters, {
    allowAssignee: canFilterAssignee,
  });
  const scope = getTicketReadScope(user.role, userId);
  const encoder = new TextEncoder();
  const csv = streamTicketReportCsv(scope, filters);
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const next = await csv.next();
        if (next.done) {
          controller.close();
        } else {
          controller.enqueue(encoder.encode(next.value));
        }
      } catch (error) {
        controller.error(error);
      }
    },
    async cancel() {
      await csv.return(undefined);
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="service-desk-tickets-${today}.csv"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
