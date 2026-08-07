import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import type { ApiError } from "@tech-survivor/types";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

export function notFoundHandler(req: Request, res: Response): void {
  const body: ApiError = {
    success: false,
    error: { code: "NOT_FOUND", message: `No route matches ${req.method} ${req.path}` },
  };
  res.status(404).json(body);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    const body: ApiError = {
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    };
    if (err.status >= 500) {
      logger.error({ err, path: req.path }, "Unhandled application error");
    }
    res.status(err.status).json(body);
    return;
  }

  if (err instanceof ZodError) {
    const body: ApiError = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: err.flatten(),
      },
    };
    res.status(400).json(body);
    return;
  }

  logger.error({ err, path: req.path }, "Unexpected error");
  const body: ApiError = {
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
  };
  res.status(500).json(body);
}
