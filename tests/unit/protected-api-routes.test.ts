import assert from "node:assert/strict";
import test from "node:test";
import type { Role } from "@prisma/client";
import { hasPermission } from "../../src/lib/permission-policy";
import type { Permission } from "../../src/lib/permission-policy";

type SessionUser = { id: string; role: Role } | null;

test("protected ticket APIs authenticate users and enforce ticket scopes", async (t) => {
  let sessionUser: SessionUser = null;
  let denyPermission = false;
  let reportScopes: unknown[] = [];
  const reportFilters: unknown[] = [];
  let attachmentQuery:
    | { attachmentId: number; ticketId: number; scope: unknown }
    | undefined;
  let attachmentReadCalls = 0;

  const sourceUrl = (path: string) =>
    new URL(`../../src/${path}`, import.meta.url).href;

  class MockAuthenticationRequiredError extends Error {}
  class MockAuthorizationError extends Error {}

  t.mock.module(sourceUrl("lib/permissions.ts"), {
    namedExports: {
      AuthenticationRequiredError: MockAuthenticationRequiredError,
      AuthorizationError: MockAuthorizationError,
      requireAuthenticatedUser: async () => {
        if (!sessionUser) throw new MockAuthenticationRequiredError();
        return sessionUser;
      },
      requirePermission: async (permission: Permission) => {
        if (
          !sessionUser ||
          denyPermission ||
          !hasPermission(sessionUser.role, permission)
        ) {
          throw new MockAuthorizationError();
        }
        return sessionUser;
      },
    },
  });
  t.mock.module(
    sourceUrl("features/dashboard/services/ticket-report-csv.service.ts"),
    {
      namedExports: {
        streamTicketReportCsv: async function* (scope: unknown, filters: unknown) {
          reportScopes.push(scope);
          reportFilters.push(filters);
          yield '"Ticket ID","Title"\n';
          yield '"1","Scoped ticket"\n';
        },
      },
    },
  );
  t.mock.module(
    sourceUrl("features/attachments/repositories/attachment.repository.ts"),
    {
      namedExports: {
        findAttachmentForDownload: async (
          attachmentId: number,
          ticketId: number,
          scope: unknown,
        ) => {
          attachmentQuery = { attachmentId, ticketId, scope };
          return null;
        },
      },
    },
  );
  t.mock.module(
    sourceUrl("features/attachments/services/attachment-storage.ts"),
    {
      namedExports: {
        AttachmentStorageError: class AttachmentStorageError extends Error {},
        readStoredAttachment: async () => {
          attachmentReadCalls += 1;
          return Buffer.from("attachment");
        },
      },
    },
  );

  const { GET: exportTickets } = await import(
    "../../src/app/api/reports/tickets/route"
  );
  const { GET: downloadAttachment } = await import(
    "../../src/app/api/tickets/[id]/attachments/[attachmentId]/route"
  );
  const attachmentRequest = new Request(
    "http://localhost/api/tickets/81/attachments/12",
  );
  const attachmentParams = {
    params: Promise.resolve({ id: "81", attachmentId: "12" }),
  };

  const unauthenticatedReport = await exportTickets(
    new Request("http://localhost/api/reports/tickets"),
  );
  const unauthenticatedAttachment = await downloadAttachment(
    attachmentRequest,
    attachmentParams,
  );
  assert.equal(unauthenticatedReport.status, 401);
  assert.equal(unauthenticatedAttachment.status, 401);

  sessionUser = { id: "202", role: "AGENT" };
  denyPermission = true;
  const deniedReport = await exportTickets(
    new Request("http://localhost/api/reports/tickets"),
  );
  const deniedAttachment = await downloadAttachment(
    attachmentRequest,
    attachmentParams,
  );
  assert.equal(deniedReport.status, 403);
  assert.equal(deniedAttachment.status, 403);
  assert.equal(attachmentQuery, undefined);

  denyPermission = false;
  reportScopes = [];
  const report = await exportTickets(
    new Request("http://localhost/api/reports/tickets"),
  );
  assert.equal(report.status, 200);
  assert.equal(await report.text(), '"Ticket ID","Title"\n"1","Scoped ticket"\n');
  assert.deepEqual(reportScopes, [{ kind: "assigned-to", userId: 202 }]);

  const forbiddenAssigneeFilter = await exportTickets(
    new Request("http://localhost/api/reports/tickets?assigneeId=303"),
  );
  assert.equal(forbiddenAssigneeFilter.status, 200);
  await forbiddenAssigneeFilter.text();
  assert.deepEqual(reportScopes, [
    { kind: "assigned-to", userId: 202 },
    { kind: "assigned-to", userId: 202 },
  ]);
  assert.deepEqual(reportFilters[1], { page: 1 });

  const outOfScopeAttachment = await downloadAttachment(
    attachmentRequest,
    attachmentParams,
  );
  assert.equal(outOfScopeAttachment.status, 404);
  assert.deepEqual(attachmentQuery, {
    attachmentId: 12,
    ticketId: 81,
    scope: { kind: "assigned-to", userId: 202 },
  });
  assert.equal(attachmentReadCalls, 0);
});
