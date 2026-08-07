export type MCQDifficulty = "easy" | "medium" | "hard";

/** Full question record — server/admin only. Never sent to participants during an attempt. */
export interface MCQQuestion {
  id: string;
  eventId: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  marks: number;
  negativeMarks: number;
  explanation: string;
  category: string;
  difficulty: MCQDifficulty;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Sanitized question shape sent to a participant during an active attempt — no correct answer. */
export interface MCQQuestionPublic {
  id: string;
  question: string;
  options: string[];
  marks: number;
}

export type QuestionNavStatus =
  | "not_visited"
  | "visited_unanswered"
  | "answered"
  | "marked_review"
  | "answered_marked_review";

export type MonitoringEventType =
  | "tab_switch"
  | "window_blur"
  | "fullscreen_exit"
  | "refresh"
  | "network_disconnect"
  | "network_reconnect"
  | "copy"
  | "paste";

export interface MonitoringEvent {
  type: MonitoringEventType;
  timestamp: string;
}

export type AttemptStatus = "in_progress" | "submitted" | "auto_submitted" | "expired";

export interface MCQAttempt {
  id: string;
  userId: string;
  eventId: string;
  roundId: string;
  assignedQuestionIds: string[];
  optionOrders: Record<string, number[]>;
  answers: Record<string, number>;
  markedForReview: string[];
  startTime: string;
  expiresAt: string;
  submittedAt: string | null;
  score: number | null;
  percentage: number | null;
  correctCount: number | null;
  incorrectCount: number | null;
  unansweredCount: number | null;
  qualified: boolean | null;
  status: AttemptStatus;
  monitoringEvents: MonitoringEvent[];
}

/** Client-facing attempt view: questions in randomized order, answers, no correctness data. */
export interface MCQAttemptView {
  id: string;
  roundId: string;
  questions: MCQQuestionPublic[];
  answers: Record<string, number>;
  markedForReview: string[];
  startTime: string;
  expiresAt: string;
  status: AttemptStatus;
}

export interface MCQReviewItem {
  questionId: string;
  question: string;
  options: string[];
  selectedOptionIndex: number | null;
  correctOptionIndex: number;
  explanation: string;
}

export interface MCQResultView {
  score: number;
  totalMarks: number;
  percentage: number;
  qualified: boolean;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeUsedSeconds: number;
  review: MCQReviewItem[] | null;
}
