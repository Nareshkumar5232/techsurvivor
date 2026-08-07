import pino from "pino";
import { loadEnv } from "../config/env.js";

const env = loadEnv();

export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } }
      : undefined,
  redact: {
    paths: [
      "req.headers.authorization",
      "*.FIREBASE_PRIVATE_KEY",
      "*.JUDGE0_API_KEY",
      "*.JUDGE0_AUTH_TOKEN",
    ],
    censor: "[REDACTED]",
  },
});
