import assert from "node:assert/strict";
import test from "node:test";
import type { Role } from "@prisma/client";
import { hasPermission } from "../../src/lib/permission-policy";
import type { Permission } from "../../src/lib/permission-policy";
import {
  getAllowedTicketStatusTransitions,
  getTicketQueueScope,
  getTicketReadPermission,
  getTicketReadScope,
  getTicketUpdateScope,
} from "../../src/features/tickets/access";

test("each role has exactly its expected permission set", () => {
  const allPermissions = [
    "ticket:create",
    "ticket:read:own",
    "ticket:read:work",
    "ticket:update:assigned",
    "ticket:comment:own",
    "ticket:comment:work",
    "ticket:assign",
    "ticket:manage",
    "notification:read:own",
    "notification:read:all",
    "user:manage",
    "department:manage",
    "category:manage",
    "sla:manage",
    "dashboard:admin",
    "audit-log:read",
  ] as const satisfies readonly Permission[];

  const expectedPermissions: Record<Role, readonly Permission[]> = {
    ADMIN: allPermissions,
    AGENT: [
      "ticket:read:work",
      "ticket:update:assigned",
      "ticket:comment:work",
      "ticket:assign",
      "notification:read:own",
    ],
    EMPLOYEE: [
      "ticket:create",
      "ticket:read:own",
      "ticket:comment:own",
      "notification:read:own",
    ],
  };

  for (const [role, expected] of Object.entries(expectedPermissions) as [
    Role,
    readonly Permission[],
  ][]) {
    const actual = allPermissions.filter((permission) =>
      hasPermission(role, permission),
    );
    assert.deepEqual([...actual].sort(), [...expected].sort(), role);
  }
});

test("ticket read permissions and scopes are derived from role", () => {
  assert.equal(getTicketReadPermission("ADMIN"), "ticket:manage");
  assert.equal(getTicketReadPermission("AGENT"), "ticket:read:work");
  assert.equal(getTicketReadPermission("EMPLOYEE"), "ticket:read:own");
  assert.deepEqual(getTicketReadScope("ADMIN", 10), { kind: "all" });
  assert.deepEqual(getTicketReadScope("AGENT", 20), {
    kind: "assigned-to",
    userId: 20,
  });
  assert.deepEqual(getTicketReadScope("EMPLOYEE", 30), {
    kind: "created-by",
    userId: 30,
  });
  assert.deepEqual(getTicketUpdateScope("AGENT", 20), {
    kind: "assigned-to",
    userId: 20,
  });
  assert.equal(getTicketUpdateScope("EMPLOYEE", 30), null);
});

test("ticket queues only narrow each role's existing read scope", () => {
  assert.deepEqual(getTicketQueueScope("ADMIN", 10, "all"), { kind: "all" });
  assert.deepEqual(getTicketQueueScope("ADMIN", 10, "assigned"), {
    kind: "assigned-to",
    userId: 10,
  });
  assert.deepEqual(getTicketQueueScope("AGENT", 20, "all"), {
    kind: "assigned-to",
    userId: 20,
  });
  assert.deepEqual(getTicketQueueScope("AGENT", 20, "assigned"), {
    kind: "assigned-to",
    userId: 20,
  });
  assert.deepEqual(getTicketQueueScope("EMPLOYEE", 30, "all"), {
    kind: "created-by",
    userId: 30,
  });
  assert.deepEqual(getTicketQueueScope("EMPLOYEE", 30, "assigned"), {
    kind: "created-by-and-assigned-to",
    userId: 30,
  });
});

test("ticket status transition helper permits only the established next state", () => {
  assert.deepEqual(getAllowedTicketStatusTransitions("OPEN"), ["IN_PROGRESS"]);
  assert.deepEqual(getAllowedTicketStatusTransitions("IN_PROGRESS"), ["RESOLVED"]);
  assert.deepEqual(getAllowedTicketStatusTransitions("RESOLVED"), ["CLOSED"]);
  assert.deepEqual(getAllowedTicketStatusTransitions("CLOSED"), []);
});
