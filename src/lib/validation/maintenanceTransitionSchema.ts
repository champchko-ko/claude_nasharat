import { z } from "zod";

export const maintenanceTransitionSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  targetStatus: z.enum([
    "submitted",
    "triaged",
    "assigned",
    "in_progress",
    "waiting_for_parts",
    "resolved",
    "closed",
    "reopened",
    "rejected",
  ]),
  reason: z.string().max(1000, "Reason cannot exceed 1000 characters").nullable().default(null),
});

export type MaintenanceTransitionInput = z.infer<typeof maintenanceTransitionSchema>;
