import { z } from "zod";

export const calendarSchema = z.object({
  titleAr: z
    .string()
    .trim()
    .min(1, "Arabic title is required")
    .max(200, "Title cannot exceed 200 characters"),
  titleEn: z
    .string()
    .trim()
    .max(200, "Title cannot exceed 200 characters")
    .nullable()
    .default(null),
  description: z
    .string()
    .trim()
    .max(5000, "Description cannot exceed 5000 characters")
    .nullable()
    .default(null),
  category: z.enum(["event", "academic", "exam", "holiday", "meeting", "activity", "other"]),
  visibility: z.enum(["public", "internal"]),
  startsAt: z.string().min(1, "Start date and time is required"),
  endsAt: z.string().min(1, "End date and time is required"),
  location: z
    .string()
    .trim()
    .max(200, "Location cannot exceed 200 characters")
    .nullable()
    .default(null),
});

export type CalendarInput = z.infer<typeof calendarSchema>;
