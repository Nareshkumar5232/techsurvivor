import { z } from "zod";
import { ROUND1_OPTIONS_PER_QUESTION } from "@tech-survivor/config";

export const mcqAnswerSchema = z.object({
  questionId: z.string().min(1),
  optionIndex: z.number().int().min(0).max(ROUND1_OPTIONS_PER_QUESTION - 1),
});
export type MCQAnswerInput = z.infer<typeof mcqAnswerSchema>;

export const mcqMarkReviewSchema = z.object({
  questionId: z.string().min(1),
  marked: z.boolean(),
});
export type MCQMarkReviewInput = z.infer<typeof mcqMarkReviewSchema>;

export const monitoringEventSchema = z.object({
  type: z.enum([
    "tab_switch",
    "window_blur",
    "fullscreen_exit",
    "refresh",
    "network_disconnect",
    "network_reconnect",
    "copy",
    "paste",
  ]),
});
export type MonitoringEventInput = z.infer<typeof monitoringEventSchema>;

export const mcqQuestionAdminSchema = z.object({
  question: z.string().trim().min(3).max(2000),
  options: z.array(z.string().trim().min(1).max(500)).length(ROUND1_OPTIONS_PER_QUESTION),
  correctOptionIndex: z.number().int().min(0).max(ROUND1_OPTIONS_PER_QUESTION - 1),
  marks: z.number().min(0).max(100).default(1),
  negativeMarks: z.number().min(0).max(100).default(0),
  explanation: z.string().trim().max(2000).default(""),
  category: z.string().trim().min(1).max(80),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  active: z.boolean().default(true),
});
export type MCQQuestionAdminInput = z.infer<typeof mcqQuestionAdminSchema>;

export const mcqQuestionAdminUpdateSchema = mcqQuestionAdminSchema.partial();
export type MCQQuestionAdminUpdateInput = z.infer<typeof mcqQuestionAdminUpdateSchema>;
