export interface ProblemScore {
  problemId: string;
  difficulty: "easy" | "medium" | "hard";
  score: number;
  accepted: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  participantName: string;
  institution: string;
  easyScore: number;
  mediumScore: number;
  hardScore: number;
  easyAccepted: boolean;
  mediumAccepted: boolean;
  hardAccepted: boolean;
  round1Score: number;
  totalScore: number;
  acceptedProblemCount: number;
  penaltyTime: number;
  lastAcceptedAt: string | null;
  rank: number;
  updatedAt: string;
}
