import { z } from "zod";

export const patchParticipantAdminSchema = z.object({
  disqualified: z.boolean().optional(),
  disqualificationReason: z.string().trim().max(500).optional(),
  status: z.enum(["active", "suspended"]).optional(),
});
export type PatchParticipantAdminInput = z.infer<typeof patchParticipantAdminSchema>;

export const leaderboardVisibilitySchema = z.object({
  visibility: z.enum(["hidden", "visible", "frozen", "published"]),
});
export type LeaderboardVisibilityInput = z.infer<typeof leaderboardVisibilitySchema>;
