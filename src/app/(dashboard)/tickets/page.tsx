import { redirect } from "next/navigation";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requireAuthenticatedUser,
  requirePermission,
} from "@/lib/permissions";
import { TicketsTable } from "@/features/tickets/components/tickets-table";
import { TicketsFilters } from "@/features/tickets/components/tickets-filters";
import { TicketsPagination } from "@/features/tickets/components/tickets-pagination";
import {
  listTicketCategories,
  listTicketDepartments,
  listTicketFilterAssignees,
  listTickets,
} from "@/features/tickets/repositories/ticket.repository";
import { parseTicketListFilters } from "@/features/tickets/schemas/ticket.schema";
import {
  getTicketReadPermission,
  getTicketQueueScope,
} from "@/features/tickets/access";
import Link from "next/link";

type TicketsPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    status?: string | string[];
    priority?: string | string[];
    departmentId?: string | string[];
    categoryId?: string | string[];
    assigneeId?: string | string[];
    page?: string | string[];
    queue?: string | string[];
  }>;
};

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
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

  const query = await searchParams;
  const filters = parseTicketListFilters(query);
  const requestedQueue = Array.isArray(query.queue) ? query.queue[0] : query.queue;
  const queue = requestedQueue === "assigned" ? "assigned" : "all";
  const scope = getTicketQueueScope(user.role, userId, queue);
  const [ticketPage, departments, categories, assignees] = await Promise.all([
    listTickets(scope, filters),
    listTicketDepartments(),
    listTicketCategories(),
    listTicketFilterAssignees(),
  ]);
  const {
    tickets,
    totalCount,
    totalAvailable,
    totalPages,
    page,
    pageSize,
  } = ticketPage;
  const hasFilters = Boolean(
    filters.search ||
      filters.status ||
      filters.priority ||
      filters.departmentId ||
      filters.categoryId ||
      filters.assigneeId,
  );

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="border-b border-slate-200 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Tickets</h1>
            <p className="mt-1 text-sm text-slate-600">
              Review tickets available to your account.
            </p>
          </div>
          {user.role !== "AGENT" && (
            <Link
              href="/tickets/new"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Create Ticket
            </Link>
          )}
        </div>
      </header>
      <TicketsFilters
        filters={filters}
        queue={queue}
        userRole={user.role}
        departments={departments}
        categories={categories}
        assignees={assignees}
      />
      <TicketsTable
        tickets={tickets}
        hasFilters={hasFilters}
        totalAvailable={totalAvailable}
      />
      <TicketsPagination
        filters={filters}
        queue={queue}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
      />
    </main>
  );
}