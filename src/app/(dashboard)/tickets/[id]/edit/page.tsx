import { notFound, redirect } from "next/navigation";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requireAuthenticatedUser,
  requirePermission,
} from "@/lib/permissions";
import {
  getTicketUpdatePermission,
  getTicketUpdateScope,
} from "@/features/tickets/access";
import { UpdateTicketForm } from "@/features/tickets/components/update-ticket-form";
import {
  findTicketById,
  listTicketCategories,
  listTicketDepartments,
} from "@/features/tickets/repositories/ticket.repository";
import { ticketIdSchema } from "@/features/tickets/schemas/ticket.schema";

export default async function EditTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let user;
  try {
    user = await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      redirect("/login");
    }

    throw error;
  }

  const permission = getTicketUpdatePermission(user.role);
  const userId = Number(user.id);
  const scope = getTicketUpdateScope(user.role, userId);
  if (!permission || !scope) {
    redirect("/dashboard");
  }

  try {
    await requirePermission(permission);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect("/dashboard");
    }

    throw error;
  }

  const idResult = ticketIdSchema.safeParse((await params).id);
  if (!idResult.success) {
    notFound();
  }

  if (scope.kind !== "all" && (!Number.isSafeInteger(userId) || userId < 1)) {
    throw new Error("The authenticated account identifier is invalid.");
  }

  const ticket = await findTicketById(idResult.data, scope);
  if (!ticket) {
    notFound();
  }

  const [departments, categories] = await Promise.all([
    listTicketDepartments(),
    listTicketCategories(),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-bold">Edit Ticket</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update ticket details and its Department or Category.
        </p>
      </header>
      <UpdateTicketForm
        ticket={ticket}
        departments={departments}
        categories={categories}
      />
    </main>
  );
}
