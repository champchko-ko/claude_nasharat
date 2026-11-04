import { z } from "zod";

export const departmentSchema = z.object({
  nameAr: z
    .string()
    .trim()
    .min(1, "Arabic department name is required")
    .max(100, "Department name cannot exceed 100 characters"),
  nameEn: z
    .string()
    .trim()
    .min(1, "English department name is required")
    .max(100, "Department name cannot exceed 100 characters"),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;
