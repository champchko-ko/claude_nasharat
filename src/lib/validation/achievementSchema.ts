import { z } from "zod";

export const achievementSchema = z.object({
  titleAr: z
    .string()
    .trim()
    .min(1, "Arabic title is required")
    .max(200, "Title cannot exceed 200 characters"),
  titleEn: z.string().trim().max(200, "Title cannot exceed 200 characters").nullable().optional(),
  description: z
    .string()
    .trim()
    .max(5000, "Description cannot exceed 5000 characters")
    .nullable()
    .optional(),
  departmentId: z.string().nullable().optional(),
  category: z.enum(["academic", "competition", "sports", "scientific", "community", "other"]),
  dateAchieved: z.string().min(1, "Date achieved is required"),
  visibility: z.enum(["public", "internal"]),
});

export type AchievementInput = z.infer<typeof achievementSchema>;
