import { z } from "zod";

export const circularSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters"),
  body: z
    .string()
    .trim()
    .min(1, "Content is required")
    .max(10000, "Content cannot exceed 10000 characters"),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  visibility: z.enum(["public", "internal"]).default("internal"),
  responseType: z.enum(["acknowledgement", "approval", "task"]),
  dueAt: z.string().nullable().default(null),
  publishAt: z.string().nullable().default(null),
  departmentIds: z.array(z.string()).default([]),
});

export type CircularInput = z.infer<typeof circularSchema>;
