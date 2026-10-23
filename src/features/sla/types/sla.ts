import type { Prisma } from "@prisma/client";

export const safeSLASelect = {
  id: true,
  name: true,
  description: true,
  responseTimeMinutes: true,
  resolutionTimeMinutes: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SLASelect;

export type SafeSLA = Prisma.SLAGetPayload<{
  select: typeof safeSLASelect;
}>;
