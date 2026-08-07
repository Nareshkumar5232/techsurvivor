import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { runRateLimiter } from "../src/middleware/rateLimit.js";

// RUN_RATE_LIMIT_PER_MINUTE defaults to 10 (see config/env.ts) - setupEnv.ts doesn't override it.
const LIMIT = 10;

function buildTestApp() {
  const app = express();
  app.get("/probe", runRateLimiter, (_req, res) => res.status(200).json({ ok: true }));
  return app;
}

describe("run submission rate limiting", () => {
  it("allows requests up to the configured limit and rejects the next one with RATE_LIMITED", async () => {
    const app = buildTestApp();

    for (let i = 0; i < LIMIT; i++) {
      const res = await request(app).get("/probe");
      expect(res.status).toBe(200);
    }

    const res = await request(app).get("/probe");
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe("RATE_LIMITED");
  });
});
