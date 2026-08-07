import type { CodingProblem, EventConfig, MCQQuestion, RoundConfig, UserProfile } from "@tech-survivor/types";

export function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  const now = new Date().toISOString();
  return {
    uid: "user-1",
    role: "participant",
    fullName: "Test Participant",
    email: "participant@example.com",
    emailVerified: true,
    institution: "Test Institute",
    department: "CSE",
    year: "3rd Year",
    rollNumber: "T-100",
    phone: "9999999999",
    eventRegistrationId: null,
    profileComplete: true,
    status: "active",
    disqualified: false,
    disqualificationReason: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function makeEvent(overrides: Partial<EventConfig> = {}): EventConfig {
  const now = new Date().toISOString();
  return {
    id: "main",
    name: "Tech Survivor",
    description: "Test event",
    organization: "Test Org",
    logoUrl: null,
    registrationStart: now,
    registrationEnd: now,
    eventStart: now,
    eventEnd: now,
    status: "round1_live",
    leaderboardVisibility: "visible",
    includeRound1ScoreInFinal: false,
    coordinators: [],
    prizeDetails: "",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function makeRound(overrides: Partial<RoundConfig> = {}): RoundConfig {
  return {
    id: "round1",
    eventId: "main",
    name: "Round 1 - MCQ Qualification",
    type: "mcq",
    status: "live",
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 30 * 60_000).toISOString(),
    durationMinutes: 30,
    questionCount: 20,
    qualificationPercentage: 70,
    qualificationMinimumScore: 15,
    instructions: "Answer all questions.",
    settings: { warningsBeforeDisqualification: 3, allowAnswerReview: false },
    ...overrides,
  };
}

export function makeQuestions(count = 20): MCQQuestion[] {
  const now = new Date().toISOString();
  return Array.from({ length: count }, (_, i) => ({
    id: `q${i}`,
    eventId: "main",
    question: `Question ${i}?`,
    options: ["A", "B", "C", "D"],
    correctOptionIndex: 0,
    marks: 1,
    negativeMarks: 0,
    explanation: "",
    category: "General",
    difficulty: "easy" as const,
    active: true,
    createdAt: now,
    updatedAt: now,
  }));
}

export function makeCodingProblem(overrides: Partial<CodingProblem> = {}): CodingProblem {
  const now = new Date().toISOString();
  return {
    id: "problem-easy",
    eventId: "main",
    title: "Two Number Sum",
    slug: "two-number-sum",
    difficulty: "easy",
    description: "Add two numbers.",
    inputFormat: "Two integers.",
    outputFormat: "Their sum.",
    constraints: "",
    samples: [{ id: "s1", input: "2 3", expectedOutput: "5" }],
    hiddenTestCases: [
      { id: "h1", input: "2 3", expectedOutput: "5" },
      { id: "h2", input: "10 20", expectedOutput: "30" },
    ],
    starterCode: {},
    supportedLanguages: ["python", "cpp", "java", "javascript", "typescript", "c"],
    points: 100,
    scoringMode: "partial",
    timeLimit: 2,
    memoryLimit: 256,
    comparisonMode: "trimmed",
    floatTolerance: 0.000001,
    active: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
