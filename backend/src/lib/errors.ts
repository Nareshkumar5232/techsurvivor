import type { ErrorCode } from "@tech-survivor/types";

const ERROR_STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  UNAUTHORIZED: 403,
  PROFILE_INCOMPLETE: 403,
  ROUND_NOT_STARTED: 409,
  ROUND_PAUSED: 409,
  ROUND_EXPIRED: 409,
  ROUND_CLOSED: 409,
  ALREADY_SUBMITTED: 409,
  NOT_QUALIFIED: 403,
  INVALID_LANGUAGE: 400,
  CODE_TOO_LARGE: 413,
  COMPILER_UNAVAILABLE: 503,
  COMPILER_TIMEOUT: 504,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  DISQUALIFIED: 403,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = ERROR_STATUS[code];
    this.details = details;
  }
}
