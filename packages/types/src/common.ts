export type Role = "participant" | "admin";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "UNAUTHORIZED"
  | "PROFILE_INCOMPLETE"
  | "ROUND_NOT_STARTED"
  | "ROUND_PAUSED"
  | "ROUND_EXPIRED"
  | "ROUND_CLOSED"
  | "ALREADY_SUBMITTED"
  | "NOT_QUALIFIED"
  | "INVALID_LANGUAGE"
  | "CODE_TOO_LARGE"
  | "COMPILER_UNAVAILABLE"
  | "COMPILER_TIMEOUT"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "DISQUALIFIED"
  | "INTERNAL_ERROR";

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
