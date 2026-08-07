import { z } from "zod";
import { SUPPORTED_LANGUAGES } from "@tech-survivor/config";
import type { SupportedLanguage } from "@tech-survivor/types";

export const languageSchema = z.enum(
  SUPPORTED_LANGUAGES as [SupportedLanguage, ...SupportedLanguage[]],
);

export const testCaseSchema = z.object({
  id: z.string().optional(),
  input: z.string().max(50_000),
  expectedOutput: z.string().max(50_000),
  explanation: z.string().max(2000).optional(),
});
export type TestCaseInput = z.infer<typeof testCaseSchema>;

export const starterCodeMapSchema = z.object({
  c: z.string().max(20_000).optional(),
  cpp: z.string().max(20_000).optional(),
  python: z.string().max(20_000).optional(),
  java: z.string().max(20_000).optional(),
  javascript: z.string().max(20_000).optional(),
  typescript: z.string().max(20_000).optional(),
});

export const codingProblemAdminSchema = z.object({
  title: z.string().trim().min(3).max(200),
  difficulty: z.enum(["easy", "medium", "hard"]),
  description: z.string().trim().min(10).max(20_000),
  inputFormat: z.string().trim().max(5000).default(""),
  outputFormat: z.string().trim().max(5000).default(""),
  constraints: z.string().trim().max(5000).default(""),
  samples: z.array(testCaseSchema).min(1).max(20),
  hiddenTestCases: z.array(testCaseSchema).min(1).max(200),
  starterCode: starterCodeMapSchema.default({}),
  supportedLanguages: z.array(languageSchema).min(1),
  points: z.number().int().min(1).max(10_000),
  scoringMode: z.enum(["all_or_nothing", "partial"]).default("partial"),
  timeLimit: z.number().min(0.5).max(30).default(2),
  memoryLimit: z.number().min(16).max(1024).default(256),
  comparisonMode: z
    .enum(["exact", "trimmed", "case_insensitive", "float_tolerance"])
    .default("trimmed"),
  floatTolerance: z.number().min(0).max(1).default(0.000001),
  active: z.boolean().default(true),
});
export type CodingProblemAdminInput = z.infer<typeof codingProblemAdminSchema>;

export const codingProblemAdminUpdateSchema = codingProblemAdminSchema.partial();
export type CodingProblemAdminUpdateInput = z.infer<typeof codingProblemAdminUpdateSchema>;

export const runCodeRequestSchema = z.object({
  problemId: z.string().min(1),
  language: languageSchema,
  sourceCode: z.string().min(1).max(100_000),
  customInput: z.string().max(50_000).optional(),
});
export type RunCodeRequestInput = z.infer<typeof runCodeRequestSchema>;

export const submitCodeRequestSchema = z.object({
  problemId: z.string().min(1),
  language: languageSchema,
  sourceCode: z.string().min(1).max(100_000),
});
export type SubmitCodeRequestInput = z.infer<typeof submitCodeRequestSchema>;

export const saveCodeRequestSchema = z.object({
  language: languageSchema,
  sourceCode: z.string().max(100_000),
});
export type SaveCodeRequestInput = z.infer<typeof saveCodeRequestSchema>;
