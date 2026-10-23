import { SLAStatus } from "@prisma/client";
import { z } from "zod";

const positiveMinutes = z
  .string()
  .trim()
  .regex(/^[1-9]\d*$/, "Enter a positive whole number of minutes.")
  .transform(Number)
  .refine(
    (value) => Number.isSafeInteger(value) && value <= 2_147_483_647,
    "Minutes must be within the supported range.",
  );

export const slaPolicySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "SLA name is required.")
    .max(100, "SLA name must be 100 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be 1000 characters or fewer.")
    .transform((value) => (value === "" ? null : value)),
  responseTimeMinutes: positiveMinutes,
  resolutionTimeMinutes: positiveMinutes,
  status: z.nativeEnum(SLAStatus, {
    error: "Choose a valid SLA status.",
  }),
});

export const slaIdSchema = z.coerce
  .number()
  .int()
  .positive()
  .safe("The selected SLA policy is invalid.");

export type SLAPolicyInput = z.infer<typeof slaPolicySchema>;

export type SLAPolicyActionState = {
  success: boolean;
  message: string;
  fieldErrors?: Partial<
    Record<
      | "name"
      | "description"
      | "responseTimeMinutes"
      | "resolutionTimeMinutes"
      | "status",
      string[]
    >
  >;
};
