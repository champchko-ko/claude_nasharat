import { z } from "zod";

export const maintenanceSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(5000, "Description cannot exceed 5000 characters"),
  category: z.enum([
    "electrical",
    "plumbing",
    "hvac",
    "carpentry",
    "cleaning",
    "it",
    "safety",
    "other",
  ]),
  priority: z.enum(["emergency", "urgent", "medium", "deferrable"]),
  locationId: z.string().nullable().default(null),
  area: z.string().max(100, "Area cannot exceed 100 characters").nullable().default(null),
  assetRef: z
    .string()
    .max(100, "Asset reference cannot exceed 100 characters")
    .nullable()
    .default(null),
});

export type MaintenanceInput = z.infer<typeof maintenanceSchema>;
