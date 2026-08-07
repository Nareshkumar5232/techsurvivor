import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import type { ApiSuccess } from "@tech-survivor/types";
import { loadEnv } from "./config/env.js";
import { isFirebaseAdminInitialized } from "./config/firebaseAdmin.js";
import { logger } from "./lib/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { generalApiLimiter } from "./middleware/rateLimit.js";
import { authRouter } from "./routes/auth.js";
import { profileRouter } from "./routes/profile.js";
import { eventRouter } from "./routes/event.js";
import { round1Router } from "./routes/round1.js";
import { round2Router } from "./routes/round2.js";
import { submissionsRouter } from "./routes/submissions.js";
import { leaderboardRouter } from "./routes/leaderboard.js";
import { adminRouter } from "./routes/admin/index.js";

export function createApp(): Express {
  const env = loadEnv();
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(pinoHttp({ logger, autoLogging: env.NODE_ENV !== "test" }));

  app.get("/health", (_req, res) => {
    const body: ApiSuccess<{ status: string; timestamp: string }> = {
      success: true,
      data: { status: "healthy", timestamp: new Date().toISOString() },
    };
    res.status(200).json(body);
  });

  app.get("/ready", (_req, res) => {
    const checks = {
      express: true,
      firebaseAdmin: isFirebaseAdminInitialized(),
      env: true,
      compiler: env.COMPILER_PROVIDER === "mock" || Boolean(env.JUDGE0_API_URL),
    };
    const ready = Object.values(checks).every(Boolean);
    const body: ApiSuccess<{ ready: boolean; checks: typeof checks }> = {
      success: true,
      data: { ready, checks },
    };
    res.status(ready ? 200 : 503).json(body);
  });

  app.use("/api", generalApiLimiter);
  app.use("/api/auth", authRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api/event", eventRouter);
  app.use("/api/round1", round1Router);
  app.use("/api/round2", round2Router);
  app.use("/api/submissions", submissionsRouter);
  app.use("/api/leaderboard", leaderboardRouter);
  app.use("/api/admin", adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
