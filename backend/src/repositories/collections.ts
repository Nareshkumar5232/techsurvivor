export const COLLECTIONS = {
  USERS: "users",
  EVENTS: "events",
  ROUNDS: "rounds",
  MCQ_QUESTIONS: "mcqQuestions",
  MCQ_ATTEMPTS: "mcqAttempts",
  CODING_PROBLEMS: "codingProblems",
  SAVED_CODE: "savedCode",
  SUBMISSIONS: "submissions",
  LEADERBOARDS: "leaderboards",
  ENTRIES: "entries",
  ANNOUNCEMENTS: "announcements",
  AUDIT_LOGS: "auditLogs",
} as const;

/** Tech Survivor runs a single event per deployment - fixed document IDs keep every
 *  read/write a direct lookup instead of a query, and remove an entire class of
 *  "which event am I in" bugs. */
export const DEFAULT_EVENT_ID = "main";
export const ROUND1_ID = "round1";
export const ROUND2_ID = "round2";
