import { redirect } from "next/navigation";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import { CreateTicketForm } from "@/features/tickets/components/create-ticket-form";
import {
  listTicketCategories,
  listTicketDepartments,
} from "@/features/tickets/repositories/ticket.repository";

export default async function NewTicketPage() {
  try {
    await requirePermission("ticket:create");
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      redirect("/login");
    }

    if (error instanceof AuthorizationError) {
      redirect("/dashboard");
    }

    throw error;
  }

  const [departments, categories] = await Promise.all([
    listTicketDepartments(),
    listTicketCategories(),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-bold">Create Ticket</h1>
        <p className="mt-1 text-sm text-gray-600">
          Describe the issue and select its department and category.
        </p>
      </header>
      <CreateTicketForm departments={departments} categories={categories} />
    </main>
  );
}
