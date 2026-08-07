import { z } from "zod";

export const profileInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  institution: z.string().trim().min(2).max(160),
  department: z.string().trim().min(1).max(120),
  year: z.string().trim().min(1).max(20),
  rollNumber: z.string().trim().min(1).max(60),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,20}$/, "Enter a valid phone number"),
  eventRegistrationId: z.string().trim().max(60).optional(),
});

export type ProfileInputParsed = z.infer<typeof profileInputSchema>;
