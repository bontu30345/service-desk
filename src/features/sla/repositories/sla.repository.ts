import { prisma } from "@/lib/prisma";
import type { SLAPolicyInput } from "../schemas/sla.schema";
import { safeSLASelect } from "../types/sla";

export function listSLAPolicies() {
  return prisma.sLA.findMany({
    select: safeSLASelect,
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
}

export function findSLAPolicyById(id: number) {
  return prisma.sLA.findUnique({
    where: { id },
    select: safeSLASelect,
  });
}

export function createSLAPolicy(input: SLAPolicyInput) {
  return prisma.sLA.create({
    data: input,
    select: safeSLASelect,
  });
}

export function updateSLAPolicy(id: number, input: SLAPolicyInput) {
  return prisma.sLA.update({
    where: { id },
    data: input,
    select: safeSLASelect,
  });
}
