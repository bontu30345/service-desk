import { notFound, redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  hasPermission,
  requireAuthenticatedUser,
  requirePermission,
} from "@/lib/permissions";
import {
  getTicketReadPermission,
  getTicketReadScope,
  getTicketCommentPermission,
  getTicketUpdateScope,
} from "@/features/tickets/access";
import { TicketDetails } from "@/features/tickets/components/ticket-details";
import { TicketWorkflowControls } from "@/features/tickets/components/ticket-workflow-controls";
import { TicketSLAControl } from "@/features/tickets/components/ticket-sla-control";
import { TicketComments } from "@/features/comments/components/ticket-comments";
import { TicketAttachments } from "@/features/attachments/components/ticket-attachments";
import { listTicketComments } from "@/features/comments/repositories/comment.repository";
import { listTicketAttachments } from "@/features/attachments/repositories/attachment.repository";
import {
  findTicketById,
  listActiveTicketAssignees,
  listActiveTicketSLAs,
} from "@/features/tickets/repositories/ticket.repository";
import { ticketIdSchema } from "@/features/tickets/schemas/ticket.schema";

export default async function TicketDetailsPage({
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

  try {
    await requirePermission(getTicketReadPermission(user.role));
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

  const userId = Number(user.id);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    throw new Error("The authenticated account identifier is invalid.");
  }

  const ticket = await findTicketById(
    idResult.data,
    getTicketReadScope(user.role, userId),
  );
  if (!ticket) {
    notFound();
  }

  const updateScope = getTicketUpdateScope(user.role, userId);
  const canAssign = hasPermission(user.role, "ticket:assign");
  const [assignees, activeSLAs, comments, attachmentResult] = await Promise.all([
    canAssign ? listActiveTicketAssignees() : Promise.resolve([]),
    updateScope ? listActiveTicketSLAs() : Promise.resolve([]),
    listTicketComments(idResult.data),
    listTicketAttachments(idResult.data)
      .then((attachments) => ({ attachments, hasError: false }))
      .catch((error: unknown) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          return { attachments: [], hasError: true };
        }
        throw error;
      }),
  ]);
  const canComment = hasPermission(
    user.role,
    getTicketCommentPermission(user.role),
  );

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      <TicketDetails
        ticket={ticket}
        canEdit={Boolean(updateScope)}
        workflowControls={
          canAssign || updateScope ? (
            <TicketWorkflowControls
              ticket={ticket}
              assignees={assignees}
              canAssign={canAssign}
              canChangeStatus={Boolean(updateScope)}
            />
          ) : undefined
        }
        slaControl={
          updateScope ? <TicketSLAControl ticket={ticket} policies={activeSLAs} /> : undefined
        }
        conversation={<TicketComments ticketId={ticket.id} comments={comments} canComment={canComment} />}
        attachments={
          <TicketAttachments
            ticketId={ticket.id}
            attachments={attachmentResult.attachments}
            canUpload={canComment}
            hasError={attachmentResult.hasError}
          />
        }
      />
    </main>
  );
}
