import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(5000),
    FRONTEND_URL: z.string().url().default("http://localhost:3000"),

    FIREBASE_PROJECT_ID: z.string().min(1, "FIREBASE_PROJECT_ID is required"),
    FIREBASE_CLIENT_EMAIL: z.string().min(1, "FIREBASE_CLIENT_EMAIL is required"),
    FIREBASE_PRIVATE_KEY: z.string().min(1, "FIREBASE_PRIVATE_KEY is required"),
    FIREBASE_STORAGE_BUCKET: z.string().optional(),

    COMPILER_PROVIDER: z.enum(["judge0", "mock"]).default("mock"),
    JUDGE0_API_URL: z.string().url().optional(),
    JUDGE0_API_KEY: z.string().optional(),
    JUDGE0_API_HOST: z.string().optional(),
    JUDGE0_AUTH_TOKEN: z.string().optional(),
    JUDGE0_AUTH_HEADER: z.string().default("X-Auth-Token"),

    COMPILER_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
    COMPILER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(1000),
    COMPILER_MAX_POLL_ATTEMPTS: z.coerce.number().int().positive().default(30),

    MAX_CODE_SIZE_BYTES: z.coerce.number().int().positive().default(100_000),
    MAX_OUTPUT_SIZE_BYTES: z.coerce.number().int().positive().default(100_000),

    RUN_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(10),
    SUBMIT_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(5),
    AUTH_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(10),

    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  })
  .superRefine((data, ctx) => {
    if (data.COMPILER_PROVIDER === "judge0") {
      if (!data.JUDGE0_API_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "JUDGE0_API_URL is required when COMPILER_PROVIDER=judge0",
          path: ["JUDGE0_API_URL"],
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | undefined;

/**
 * Parses and validates process.env once, caching the result. Throws with a
 * readable, non-secret-leaking message on startup if anything required is
 * missing - fail fast rather than limping along with undefined config.
 */
export function loadEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

/** Test-only hook to reset the memoized env between test cases. */
export function resetEnvCacheForTests(): void {
  cachedEnv = undefined;
}
