import { z } from "zod";

export const locationSchema = z.object({
  building: z
    .string()
    .trim()
    .min(1, "Building name is required")
    .max(100, "Building cannot exceed 100 characters"),
  floor: z.string().trim().max(50, "Floor cannot exceed 50 characters").nullable().optional(),
  room: z.string().trim().max(50, "Room cannot exceed 50 characters").nullable().optional(),
  kind: z.enum(["room", "lab", "hall", "facility", "outdoor"]),
});

export type LocationInput = z.infer<typeof locationSchema>;
