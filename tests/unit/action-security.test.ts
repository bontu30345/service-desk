import assert from "node:assert/strict";
import test from "node:test";
import { Prisma, Role } from "@prisma/client";
import { AuthError, CredentialsSignin } from "next-auth";

type SessionUser = { id: string; role: Role } | null;

test("server actions enforce identity, authorization, and record scopes", async (t) => {
  let sessionUser: SessionUser = null;
  let createdTicketActor: number | undefined;
  let foundTicketScope: unknown;
  let foundSLAScope: unknown;
  let uploadedAttachmentScope: unknown;
  let createdComment: { ticketId: number; authorId: number; scope: unknown } | undefined;
  let markedNotification: { notificationId: number; userId: number } | undefined;
  let markedAllNotificationOwner: number | undefined;
  let createdUserActor: number | undefined;
  let categoryDeleteResult = { count: 1 };
  let categoryDeleteInfo: { id: number; ticketCount: number } | null = null;
  let categoryDeleteError: Error | null = null;
  let categoryDeleteCalls = 0;
  let departmentDeleteResult = { count: 1 };
  let departmentDeleteInfo: { id: number; userCount: number; ticketCount: number } | null = null;
  let departmentDeleteError: Error | null = null;
  let departmentDeleteCalls = 0;
  let userMutationCalls = 0;
  let userDeleteResult: { kind: "deleted" | "missing" | "referenced" } = { kind: "deleted" };
  let userDeleteInfo: Record<string, unknown> | null = null;
  let userDeleteError: Error | null = null;
  let userDeleteCalls = 0;
  let userDeleteArgs: { id: number; actorId: number } | undefined;
  class LastActiveAdminDeletionErrorMock extends Error {}
  let restrictedMutationCalls = 0;
  let auditListCalls = 0;
  let signInBehavior:
    | "success"
    | "credentials"
    | "access-denied"
    | "unexpected" = "success";
  let signInCall:
    | { provider: string; options: Record<string, unknown> }
    | undefined;
  let signOutCall: Record<string, unknown> | undefined;

  const sourceUrl = (path: string) =>
    new URL(`../../src/${path}`, import.meta.url).href;

  t.mock.module(sourceUrl("features/auth/auth.ts"), {
    namedExports: {
      auth: async () => ({ user: sessionUser }),
      signIn: async (provider: string, options: Record<string, unknown>) => {
        signInCall = { provider, options };
        if (signInBehavior === "credentials") {
          throw new CredentialsSignin();
        }
        if (signInBehavior === "access-denied") {
          const error = new AuthError();
          error.type = "AccessDenied";
          throw error;
        }
        if (signInBehavior === "unexpected") {
          throw new Error("internal authentication detail");
        }
      },
      signOut: async (options: Record<string, unknown>) => {
        signOutCall = options;
        throw new Error(`redirect:${String(options.redirectTo)}`);
      },
    },
  });
  t.mock.module("next/cache", {
    namedExports: { revalidatePath: () => undefined },
  });
  t.mock.module("next/server", {
    namedExports: { connection: async () => undefined },
  });
  t.mock.module("next/navigation", {
    namedExports: {
      redirect: (destination: string) => {
        throw new Error(`redirect:${destination}`);
      },
    },
  });
  t.mock.module(sourceUrl("features/tickets/repositories/ticket.repository.ts"), {
    namedExports: {
      createTicket: async (actorId: number) => {
        createdTicketActor = actorId;
        return { id: 81 };
      },
      findTicketById: async (_id: number, scope: unknown) => {
        foundTicketScope = scope;
        return null;
      },
      findTicketCategoryById: async () => ({ id: 1 }),
      findTicketDepartmentById: async () => ({ id: 1 }),
      updateTicket: async () => {
        throw new Error("out-of-scope ticket must not be updated");
      },
      findActiveTicketAssignee: async () => null,
      updateTicketAssignment: async () => {
        throw new Error("out-of-scope ticket must not be assigned");
      },
      updateTicketSLA: async (_id: number, scope: unknown) => {
        foundSLAScope = scope;
        return "missing-ticket";
      },
      transitionTicketStatus: async () => {
        throw new Error("out-of-scope ticket status must not change");
      },
    },
  });
  t.mock.module(sourceUrl("features/comments/repositories/comment.repository.ts"), {
    namedExports: {
      createTicketComment: async (
        ticketId: number,
        authorId: number,
        scope: unknown,
      ) => {
        createdComment = { ticketId, authorId, scope };
        return null;
      },
    },
  });
  t.mock.module(sourceUrl("features/attachments/services/attachment.service.ts"), {
    namedExports: {
      createAttachmentFromUpload: async (
        _ticketId: number,
        _userId: number,
        scope: unknown,
      ) => {
        uploadedAttachmentScope = scope;
        return null;
      },
    },
  });
  t.mock.module(sourceUrl("features/attachments/services/attachment-validation.ts"), {
    namedExports: {
      validateAttachmentContents: () => ({
        success: true,
        fileType: "text/plain",
        extension: "txt",
      }),
    },
  });
  t.mock.module(sourceUrl("features/attachments/services/attachment-storage.ts"), {
    namedExports: { AttachmentStorageError: class AttachmentStorageError extends Error {} },
  });
  t.mock.module(
    sourceUrl("features/notifications/repositories/notification.repository.ts"),
    {
      namedExports: {
        markUserNotificationAsRead: async (
          notificationId: number,
          userId: number,
        ) => {
          markedNotification = { notificationId, userId };
          return "not-found";
        },
        markAllUserNotificationsAsRead: async (userId: number) => {
          markedAllNotificationOwner = userId;
          return { count: 2 };
        },
      },
    },
  );
  t.mock.module(sourceUrl("features/users/repositories/user.repository.ts"), {
    namedExports: {
      LastActiveAdminError: class LastActiveAdminError extends Error {},
      LastActiveAdminDeletionError: LastActiveAdminDeletionErrorMock,
      createUser: async (_input: unknown, _passwordHash: string, actorId: number) => {
        createdUserActor = actorId;
      },
      departmentExists: async () => true,
      findUserById: async () => {
        userMutationCalls += 1;
        return { id: 1 };
      },
      updateUser: async () => {
        userMutationCalls += 1;
      },
      setUserActive: async () => {
        userMutationCalls += 1;
        return { id: 1 };
      },
      deleteUserIfUnreferenced: async (id: number, actorId: number) => {
        userDeleteCalls += 1;
        userDeleteArgs = { id, actorId };
        if (userDeleteError) throw userDeleteError;
        return userDeleteResult;
      },
      findUserDeleteInfo: async () => userDeleteInfo,
    },
  });
  t.mock.module(sourceUrl("features/categories/repositories/category.repository.ts"), {
    namedExports: {
      createCategory: async () => { restrictedMutationCalls += 1; },
      updateCategory: async () => { restrictedMutationCalls += 1; },
      deleteCategoryIfUnused: async () => {
        restrictedMutationCalls += 1;
        categoryDeleteCalls += 1;
        if (categoryDeleteError) throw categoryDeleteError;
        return categoryDeleteResult;
      },
      findCategoryDeleteInfo: async () => categoryDeleteInfo,
    },
  });
  t.mock.module(sourceUrl("features/departments/repositories/department.repository.ts"), {
    namedExports: {
      createDepartment: async () => { restrictedMutationCalls += 1; },
      updateDepartment: async () => { restrictedMutationCalls += 1; },
      deleteDepartmentIfUnused: async () => {
        restrictedMutationCalls += 1;
        departmentDeleteCalls += 1;
        if (departmentDeleteError) throw departmentDeleteError;
        return departmentDeleteResult;
      },
      findDepartmentDeleteInfo: async () => departmentDeleteInfo,
    },
  });
  t.mock.module(sourceUrl("features/sla/repositories/sla.repository.ts"), {
    namedExports: {
      createSLAPolicy: async () => { restrictedMutationCalls += 1; },
      updateSLAPolicy: async () => { restrictedMutationCalls += 1; },
    },
  });
  t.mock.module(sourceUrl("features/audit-logs/repositories/audit-log.repository.ts"), {
    namedExports: {
      listAuditLogs: async () => {
        auditListCalls += 1;
        return {
          logs: [],
          totalCount: 0,
          totalPages: 0,
          page: 1,
          pageSize: 25,
        };
      },
    },
  });
  t.mock.module(sourceUrl("features/audit-logs/components/audit-log-list.tsx"), {
    namedExports: { AuditLogList: () => null },
  });

  const { createTicketAction } = await import(
    "../../src/features/tickets/actions/create-ticket"
  );
  const { assignTicketAction } = await import(
    "../../src/features/tickets/actions/assign-ticket"
  );
  const { updateTicketAction } = await import(
    "../../src/features/tickets/actions/update-ticket"
  );
  const { changeTicketStatusAction } = await import(
    "../../src/features/tickets/actions/change-ticket-status"
  );
  const { assignTicketSLAAction } = await import(
    "../../src/features/tickets/actions/assign-ticket-sla"
  );
  const { createCommentAction } = await import(
    "../../src/features/comments/actions/create-comment"
  );
  const { uploadTicketAttachmentAction } = await import(
    "../../src/features/attachments/actions/upload-ticket-attachment"
  );
  const { markAllNotificationsReadAction, markNotificationReadAction } = await import(
    "../../src/features/notifications/actions/mark-notification-read"
  );
  const { createUserAction } = await import(
    "../../src/features/users/actions/create-user"
  );
  const { updateUserAction } = await import(
    "../../src/features/users/actions/update-user"
  );
  const { setUserStatusAction } = await import(
    "../../src/features/users/actions/set-user-status"
  );
  const { deleteUserAction } = await import(
    "../../src/features/users/actions/delete-user"
  );
  const { createCategoryAction } = await import(
    "../../src/features/categories/actions/create-category"
  );
  const { updateCategoryAction } = await import(
    "../../src/features/categories/actions/update-category"
  );
  const { deleteCategoryAction } = await import(
    "../../src/features/categories/actions/delete-category"
  );
  const { createDepartmentAction } = await import(
    "../../src/features/departments/actions/create-department"
  );
  const { updateDepartmentAction } = await import(
    "../../src/features/departments/actions/update-department"
  );
  const { deleteDepartmentAction } = await import(
    "../../src/features/departments/actions/delete-department"
  );
  const { createSLAPolicyAction } = await import(
    "../../src/features/sla/actions/create-sla-policy"
  );
  const { updateSLAPolicyAction } = await import(
    "../../src/features/sla/actions/update-sla-policy"
  );
  const { loginAction } = await import("../../src/features/auth/actions/login");
  const { logoutAction } = await import("../../src/features/auth/actions/logout");
  const { oauthLoginAction } = await import(
    "../../src/features/auth/actions/oauth-login"
  );
  const { default: auditLogsPage } = await import(
    "../../src/app/(dashboard)/audit-logs/page"
  );
  const { default: dashboardLayout } = await import(
    "../../src/app/(dashboard)/layout"
  );

  const initialState = { success: false, message: "" };

  await t.test("login keeps the dashboard redirect and safely handles credential errors", async () => {
    const form = new FormData();
    form.set("email", "user@example.invalid");
    form.set("password", "incorrect-password");

    signInBehavior = "success";
    assert.deepEqual(await loginAction({ message: "" }, form), { message: "" });
    assert.deepEqual(signInCall, {
      provider: "credentials",
      options: {
        email: "user@example.invalid",
        password: "incorrect-password",
        redirectTo: "/dashboard",
      },
    });

    assert.deepEqual(
      await oauthLoginAction("google", { message: "" }),
      { message: "" },
    );
    assert.deepEqual(signInCall, {
      provider: "google",
      options: { redirectTo: "/dashboard" },
    });

    signInBehavior = "access-denied";
    const deniedOAuth = await oauthLoginAction("github", { message: "" });
    assert.equal(
      deniedOAuth.message,
      "This account is not provisioned for Service Desk access. Contact your administrator.",
    );

    signInBehavior = "credentials";
    const rejectedCredentials = await loginAction({ message: "" }, form);
    assert.equal(
      rejectedCredentials.message,
      "We couldn’t sign you in. Check your email and password and try again.",
    );
    assert(!rejectedCredentials.message.includes("credentials"));

    signInBehavior = "unexpected";
    await assert.rejects(
      loginAction({ message: "" }, form),
      /internal authentication detail/,
    );
    signInBehavior = "success";
  });

  await t.test("logout redirects to sign-in and unauthenticated dashboard access is rejected", async () => {
    await assert.rejects(logoutAction(), /redirect:\/login/);
    assert.deepEqual(signOutCall, { redirectTo: "/login" });

    sessionUser = null;
    await assert.rejects(
      dashboardLayout({ children: null }),
      /redirect:\/login/,
    );

    sessionUser = { id: "", role: Role.EMPLOYEE };
    await assert.rejects(
      dashboardLayout({ children: null }),
      /redirect:\/login/,
    );
  });

  const validTicketForm = () => {
    const form = new FormData();
    form.set("title", "Printer issue");
    form.set("description", "Cannot print");
    form.set("priority", "HIGH");
    form.set("departmentId", "1");
    form.set("categoryId", "1");
    return form;
  };

  await t.test("missing identity and forged form identity cannot create a ticket", async () => {
    const missingIdentity = await createTicketAction(initialState, validTicketForm());
    assert.equal(missingIdentity.success, false);
    assert.equal(createdTicketActor, undefined);

    sessionUser = { id: "1001", role: Role.EMPLOYEE };
    const forgedForm = validTicketForm();
    forgedForm.set("creatorId", "9999");
    const created = await createTicketAction(initialState, forgedForm);
    assert.equal(created.success, true);
    assert.equal(createdTicketActor, 1001);

    const invalidPayload = validTicketForm();
    invalidPayload.set("title", " ");
    const invalidCreate = await createTicketAction(initialState, invalidPayload);
    assert.equal(invalidCreate.success, false);
    assert.equal(createdTicketActor, 1001);

    sessionUser = { id: "0", role: Role.EMPLOYEE };
    const invalidSessionId = await createTicketAction(initialState, validTicketForm());
    assert.equal(invalidSessionId.success, false);
    assert.equal(createdTicketActor, 1001);
  });

  await t.test("ticket creation and assignment reject unauthorized roles and malformed input", async () => {
    sessionUser = { id: "1002", role: Role.AGENT };
    const deniedCreate = await createTicketAction(initialState, validTicketForm());
    assert.equal(deniedCreate.success, false);
    assert.equal(createdTicketActor, 1001);

    sessionUser = { id: "1003", role: Role.EMPLOYEE };
    const deniedAssignment = await assignTicketAction(81, initialState, new FormData());
    assert.equal(deniedAssignment.success, false);
    assert.equal(foundTicketScope, undefined);

    sessionUser = { id: "1005", role: Role.AGENT };
    const validAssignee = new FormData();
    validAssignee.set("assigneeId", "44");
    const outOfScopeAssignment = await assignTicketAction(
      81,
      initialState,
      validAssignee,
    );
    assert.equal(outOfScopeAssignment.success, false);
    assert.deepEqual(foundTicketScope, { kind: "assigned-to", userId: 1005 });

    foundTicketScope = undefined;
    sessionUser = { id: "1004", role: Role.ADMIN };
    const invalidTicketId = await assignTicketAction(
      Number.NaN,
      initialState,
      new FormData(),
    );
    assert.equal(invalidTicketId.success, false);
    assert.equal(foundTicketScope, undefined);

    const invalidAssignee = new FormData();
    invalidAssignee.set("assigneeId", "0");
    const invalidPayload = await assignTicketAction(81, initialState, invalidAssignee);
    assert.equal(invalidPayload.success, false);
    assert.equal(foundTicketScope, undefined);
  });

  await t.test("ticket updates and comments pass the authenticated user's record scope", async () => {
    sessionUser = { id: "202", role: Role.AGENT };
    const update = await updateTicketAction(81, initialState, validTicketForm());
    assert.equal(update.success, false);
    assert.deepEqual(foundTicketScope, { kind: "assigned-to", userId: 202 });

    foundTicketScope = undefined;
    const statusForm = new FormData();
    statusForm.set("status", "IN_PROGRESS");
    const status = await changeTicketStatusAction(81, initialState, statusForm);
    assert.equal(status.success, false);
    assert.deepEqual(foundTicketScope, { kind: "assigned-to", userId: 202 });

    const slaForm = new FormData();
    slaForm.set("slaId", "1");
    const sla = await assignTicketSLAAction(81, initialState, slaForm);
    assert.equal(sla.success, false);
    assert.deepEqual(foundSLAScope, { kind: "assigned-to", userId: 202 });

    const agentCommentForm = new FormData();
    agentCommentForm.set("content", "Working on this assigned ticket");
    const agentComment = await createCommentAction(81, initialState, agentCommentForm);
    assert.equal(agentComment.success, false);
    assert.deepEqual(createdComment, {
      ticketId: 81,
      authorId: 202,
      scope: { kind: "assigned-to", userId: 202 },
    });

    const attachmentForm = new FormData();
    attachmentForm.set("file", new File(["attachment contents"], "notes.txt", {
      type: "text/plain",
    }));
    const attachment = await uploadTicketAttachmentAction(81, initialState, attachmentForm);
    assert.equal(attachment.success, false);
    assert.deepEqual(uploadedAttachmentScope, {
      kind: "assigned-to",
      userId: 202,
    });

    foundTicketScope = undefined;
    const invalidId = await updateTicketAction(0, initialState, validTicketForm());
    assert.equal(invalidId.success, false);
    assert.equal(foundTicketScope, undefined);

    sessionUser = { id: "303", role: Role.EMPLOYEE };
    const commentForm = new FormData();
    commentForm.set("content", "Please investigate");
    commentForm.set("authorId", "9999");
    const comment = await createCommentAction(81, initialState, commentForm);
    assert.equal(comment.success, false);
    assert.deepEqual(createdComment, {
      ticketId: 81,
      authorId: 303,
      scope: { kind: "created-by", userId: 303 },
    });

    const invalidComment = await createCommentAction(
      Number.NaN,
      initialState,
      commentForm,
    );
    assert.equal(invalidComment.success, false);
    assert.equal(createdComment?.ticketId, 81);
  });

  await t.test("notification updates are bound to the session owner and reject invalid IDs", async () => {
    sessionUser = { id: "404", role: Role.EMPLOYEE };
    const result = await markNotificationReadAction(19, {
      success: false,
      message: "",
    });
    assert.equal(result.success, false);
    assert.deepEqual(markedNotification, { notificationId: 19, userId: 404 });

    const invalidId = await markNotificationReadAction(0, {
      success: false,
      message: "",
    });
    assert.equal(invalidId.success, false);
    assert.deepEqual(markedNotification, { notificationId: 19, userId: 404 });
  });

  await t.test("mark all notifications uses only the authenticated session owner", async () => {
    sessionUser = { id: "404", role: Role.EMPLOYEE };
    const result = await markAllNotificationsReadAction({
      success: false,
      message: "",
    });
    assert.equal(result.success, true);
    assert.equal(markedAllNotificationOwner, 404);
  });

  await t.test("user-management actions reject non-admins and invalid target IDs", async () => {
    sessionUser = { id: "505", role: Role.EMPLOYEE };
    const createForm = new FormData();
    createForm.set("name", "New Agent");
    createForm.set("email", "agent@example.invalid");
    createForm.set("password", "long-enough-password");
    createForm.set("role", "AGENT");
    const denied = await createUserAction(initialState, createForm);
    assert.equal(denied.success, false);
    assert.equal(createdUserActor, undefined);

    sessionUser = { id: "606", role: Role.ADMIN };
    const created = await createUserAction(initialState, createForm);
    assert.equal(created.success, true);
    assert.equal(createdUserActor, 606);

    const validUpdateForm = new FormData();
    validUpdateForm.set("name", "Another Agent");
    validUpdateForm.set("email", "another-agent@example.invalid");
    validUpdateForm.set("role", "AGENT");
    validUpdateForm.set("departmentId", "");
    const invalidTarget = await updateUserAction(0, initialState, validUpdateForm);
    assert.equal(invalidTarget.success, false);
    assert.equal(userMutationCalls, 0);

    const invalidStatus = await setUserStatusAction(
      0,
      false,
      { success: false, message: "" },
    );
    assert.equal(invalidStatus.success, false);
    assert.equal(userMutationCalls, 0);

    sessionUser = { id: "707", role: Role.AGENT };
    createdUserActor = undefined;
    const deniedUserCreate = await createUserAction(initialState, createForm);
    assert.equal(deniedUserCreate.success, false);
    assert.equal(createdUserActor, undefined);

    const deniedUserUpdate = await updateUserAction(1, initialState, validUpdateForm);
    assert.equal(deniedUserUpdate.success, false);
    assert.equal(userMutationCalls, 0);

    const deniedStatus = await setUserStatusAction(
      1,
      false,
      { success: false, message: "" },
    );
    assert.equal(deniedStatus.success, false);
    assert.equal(userMutationCalls, 0);

    const categoryForm = new FormData();
    const deniedCategoryCreate = await createCategoryAction(initialState, categoryForm);
    const deniedCategoryUpdate = await updateCategoryAction(1, initialState, categoryForm);
    const categoryDeleteForm = new FormData();
    categoryDeleteForm.set("categoryId", "1");
    const deniedCategoryDelete = await deleteCategoryAction(initialState, categoryDeleteForm);
    assert.equal(deniedCategoryCreate.success, false);
    assert.equal(deniedCategoryUpdate.success, false);
    assert.equal(deniedCategoryDelete.success, false);

    const departmentForm = new FormData();
    const deniedDepartmentCreate = await createDepartmentAction(initialState, departmentForm);
    const deniedDepartmentUpdate = await updateDepartmentAction(1, initialState, departmentForm);
    assert.equal(deniedDepartmentCreate.success, false);
    assert.equal(deniedDepartmentUpdate.success, false);

    const slaForm = new FormData();
    const deniedSLACreate = await createSLAPolicyAction(initialState, slaForm);
    const deniedSLAUpdate = await updateSLAPolicyAction(1, initialState, slaForm);
    assert.equal(deniedSLACreate.success, false);
    assert.equal(deniedSLAUpdate.success, false);
    assert.equal(restrictedMutationCalls, 0);
  });

  await t.test("user deletion requires Admin and handles ownership, history, and safe outcomes", async () => {
    const form = new FormData();
    form.set("userId", "812");
    userDeleteCalls = 0;

    sessionUser = { id: "810", role: Role.AGENT };
    assert.equal((await deleteUserAction(initialState, form)).success, false);
    sessionUser = { id: "811", role: Role.EMPLOYEE };
    assert.equal((await deleteUserAction(initialState, form)).success, false);
    assert.equal(userDeleteCalls, 0);

    sessionUser = { id: "812", role: Role.ADMIN };
    const beforeSelfDelete = userDeleteCalls;
    const selfDelete = await deleteUserAction(initialState, form);
    assert.equal(selfDelete.success, false);
    assert.match(selfDelete.message, /own account/);
    assert.equal(userDeleteCalls, beforeSelfDelete);

    sessionUser = { id: "810", role: Role.ADMIN };
    userDeleteResult = { kind: "deleted" };
    const deleted = await deleteUserAction(initialState, form);
    assert.deepEqual(deleted, { success: true, message: "User deleted successfully." });
    assert.deepEqual(userDeleteArgs, { id: 812, actorId: 810 });

    userDeleteResult = { kind: "referenced" };
    userDeleteInfo = {
      id: 812, role: Role.EMPLOYEE, isActive: true, ticketCount: 2,
      commentCount: 1, attachmentCount: 1, notificationCount: 0,
      auditLogCount: 1, oauthIdentityCount: 0, passwordResetTokenCount: 0,
      hasNotificationPreference: false,
    };
    const referenced = await deleteUserAction(initialState, form);
    assert.equal(referenced.success, false);
    assert.match(referenced.message, /ticket history/);
    assert.match(referenced.message, /comments/);
    assert.match(referenced.message, /uploaded attachments/);
    assert.match(referenced.message, /audit history/);
    assert.match(referenced.message, /Deactivate/);

    userDeleteInfo = null;
    userDeleteResult = { kind: "missing" };
    const missing = await deleteUserAction(initialState, form);
    assert.match(missing.message, /no longer exists/);

    const invalidForm = new FormData();
    invalidForm.set("userId", "0");
    const callsBeforeInvalid = userDeleteCalls;
    const invalid = await deleteUserAction(initialState, invalidForm);
    assert.match(invalid.message, /invalid/);
    assert.equal(userDeleteCalls, callsBeforeInvalid);

    userDeleteError = new LastActiveAdminDeletionErrorMock();
    const lastAdmin = await deleteUserAction(initialState, form);
    assert.match(lastAdmin.message, /last active administrator/);
    userDeleteError = null;

    userDeleteError = new Prisma.PrismaClientKnownRequestError(
      "Foreign key constraint failed",
      { code: "P2003", clientVersion: "test" },
    );
    const foreignKeyFailure = await deleteUserAction(initialState, form);
    assert.match(foreignKeyFailure.message, /related records/);
    userDeleteError = null;
  });

  await t.test("category deletion requires Admin and handles safe delete outcomes", async () => {
    const form = new FormData();
    form.set("categoryId", "41");
    categoryDeleteCalls = 0;

    sessionUser = { id: "710", role: Role.AGENT };
    assert.equal((await deleteCategoryAction(initialState, form)).success, false);
    sessionUser = { id: "711", role: Role.EMPLOYEE };
    assert.equal((await deleteCategoryAction(initialState, form)).success, false);
    assert.equal(categoryDeleteCalls, 0);

    sessionUser = { id: "712", role: Role.ADMIN };
    categoryDeleteResult = { count: 1 };
    categoryDeleteInfo = null;
    const deleted = await deleteCategoryAction(initialState, form);
    assert.deepEqual(deleted, { success: true, message: "Category deleted successfully." });
    assert.equal(categoryDeleteCalls, 1);

    categoryDeleteResult = { count: 0 };
    categoryDeleteInfo = { id: 41, ticketCount: 2 };
    const referenced = await deleteCategoryAction(initialState, form);
    assert.equal(referenced.success, false);
    assert.match(referenced.message, /used by existing tickets/);

    categoryDeleteInfo = null;
    const missing = await deleteCategoryAction(initialState, form);
    assert.equal(missing.success, false);
    assert.match(missing.message, /no longer exists/);

    const invalidForm = new FormData();
    invalidForm.set("categoryId", "0");
    const callsBeforeInvalid = categoryDeleteCalls;
    const invalid = await deleteCategoryAction(initialState, invalidForm);
    assert.equal(invalid.success, false);
    assert.match(invalid.message, /invalid/);
    assert.equal(categoryDeleteCalls, callsBeforeInvalid);

    categoryDeleteError = new Prisma.PrismaClientKnownRequestError(
      "Foreign key constraint failed",
      { code: "P2003", clientVersion: "test" },
    );
    const foreignKeyFailure = await deleteCategoryAction(initialState, form);
    assert.equal(foreignKeyFailure.success, false);
    assert.match(foreignKeyFailure.message, /used by existing tickets/);
    categoryDeleteError = null;
  });

  await t.test("department deletion requires Admin and protects user and ticket relations", async () => {
    const form = new FormData();
    form.set("departmentId", "73");
    departmentDeleteCalls = 0;

    sessionUser = { id: "720", role: Role.AGENT };
    assert.equal((await deleteDepartmentAction(initialState, form)).success, false);
    sessionUser = { id: "721", role: Role.EMPLOYEE };
    assert.equal((await deleteDepartmentAction(initialState, form)).success, false);
    assert.equal(departmentDeleteCalls, 0);

    sessionUser = { id: "722", role: Role.ADMIN };
    departmentDeleteResult = { count: 1 };
    departmentDeleteInfo = null;
    const deleted = await deleteDepartmentAction(initialState, form);
    assert.deepEqual(deleted, { success: true, message: "Department deleted successfully." });

    departmentDeleteResult = { count: 0 };
    departmentDeleteInfo = { id: 73, userCount: 1, ticketCount: 0 };
    const hasUsers = await deleteDepartmentAction(initialState, form);
    assert.match(hasUsers.message, /used by users/);

    departmentDeleteInfo = { id: 73, userCount: 0, ticketCount: 2 };
    const hasTickets = await deleteDepartmentAction(initialState, form);
    assert.match(hasTickets.message, /used by tickets/);

    departmentDeleteInfo = null;
    const missing = await deleteDepartmentAction(initialState, form);
    assert.match(missing.message, /no longer exists/);

    const invalidForm = new FormData();
    invalidForm.set("departmentId", "0");
    const callsBeforeInvalid = departmentDeleteCalls;
    const invalid = await deleteDepartmentAction(initialState, invalidForm);
    assert.match(invalid.message, /invalid/);
    assert.equal(departmentDeleteCalls, callsBeforeInvalid);

    departmentDeleteError = new Prisma.PrismaClientKnownRequestError(
      "Foreign key constraint failed",
      { code: "P2003", clientVersion: "test" },
    );
    const foreignKeyFailure = await deleteDepartmentAction(initialState, form);
    assert.equal(foreignKeyFailure.success, false);
    assert.match(foreignKeyFailure.message, /used by users or tickets/);
    departmentDeleteError = null;
  });

  await t.test("audit-log page redirects non-admins before querying records", async () => {
    sessionUser = { id: "808", role: Role.EMPLOYEE };
    await assert.rejects(
      auditLogsPage({ searchParams: Promise.resolve({}) }),
      /redirect:\/dashboard/,
    );
    assert.equal(auditListCalls, 0);

    sessionUser = { id: "909", role: Role.ADMIN };
    await auditLogsPage({ searchParams: Promise.resolve({}) });
    assert.equal(auditListCalls, 1);
  });
});
