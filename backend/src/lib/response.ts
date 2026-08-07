import type { NextFunction, Request, Response } from "express";
import type { ApiSuccess } from "@tech-survivor/types";

export function sendSuccess<T>(res: Response, data: T, message?: string, status = 200): void {
  const body: ApiSuccess<T> = message !== undefined ? { success: true, data, message } : { success: true, data };
  res.status(status).json(body);
}

/** Wraps an async Express handler so rejected promises reach the centralized error handler. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
