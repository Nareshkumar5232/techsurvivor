import { z } from "zod";

export const coordinatorSchema = z.object({
  name: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(30),
  email: z.string().trim().email(),
});

export const eventConfigUpdateSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(5000).optional(),
  organization: z.string().trim().max(200).optional(),
  logoUrl: z.string().url().nullable().optional(),
  registrationStart: z.string().datetime().optional(),
  registrationEnd: z.string().datetime().optional(),
  eventStart: z.string().datetime().optional(),
  eventEnd: z.string().datetime().optional(),
  leaderboardVisibility: z.enum(["hidden", "visible", "frozen", "published"]).optional(),
  includeRound1ScoreInFinal: z.boolean().optional(),
  coordinators: z.array(coordinatorSchema).optional(),
  prizeDetails: z.string().trim().max(5000).optional(),
});
export type EventConfigUpdateInput = z.infer<typeof eventConfigUpdateSchema>;

export const roundConfigUpdateSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  durationMinutes: z.number().int().min(1).max(600).optional(),
  qualificationPercentage: z.number().min(0).max(100).optional(),
  qualificationMinimumScore: z.number().min(0).optional(),
  instructions: z.string().max(10_000).optional(),
  settings: z
    .object({
      warningsBeforeDisqualification: z.number().int().min(0).max(20).optional(),
      allowAnswerReview: z.boolean().optional(),
    })
    .optional(),
});
export type RoundConfigUpdateInput = z.infer<typeof roundConfigUpdateSchema>;

export const announcementInputSchema = z.object({
  title: z.string().trim().min(2).max(200),
  message: z.string().trim().min(1).max(5000),
  priority: z.enum(["info", "warning", "urgent"]).default("info"),
  audience: z.enum(["all", "participants", "admins", "qualified"]).default("all"),
  publishAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  active: z.boolean().default(true),
});
export type AnnouncementInput = z.infer<typeof announcementInputSchema>;
