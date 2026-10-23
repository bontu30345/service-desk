import { z } from "zod";

export const notificationIdSchema = z
  .number()
  .int()
  .positive()
  .safe("The selected notification is invalid.");
