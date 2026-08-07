import rateLimit from "express-rate-limit";
import type { Request } from "express";
import type { ApiError } from "@tech-survivor/types";
import { loadEnv } from "../config/env.js";

const env = loadEnv();

const rateLimitedResponse: ApiError = {
  success: false,
  error: { code: "RATE_LIMITED", message: "Too many requests. Please slow down and try again shortly." },
};

function byUserOrIp(req: Request): string {
  return req.user?.uid ?? req.ip ?? "anonymous";
}

export const authRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: env.AUTH_RATE_LIMIT_PER_MINUTE,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: byUserOrIp,
  handler: (_req, res) => res.status(429).json(rateLimitedResponse),
});

export const runRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: env.RUN_RATE_LIMIT_PER_MINUTE,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: byUserOrIp,
  handler: (_req, res) => res.status(429).json(rateLimitedResponse),
});

export const submitRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: env.SUBMIT_RATE_LIMIT_PER_MINUTE,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: byUserOrIp,
  handler: (_req, res) => res.status(429).json(rateLimitedResponse),
});

export const generalApiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: byUserOrIp,
  handler: (_req, res) => res.status(429).json(rateLimitedResponse),
});
