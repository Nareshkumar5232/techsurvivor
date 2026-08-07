import type { CodingDifficulty, StarterCodeMap, SupportedLanguage } from "@tech-survivor/types";

export const ROUND1_QUESTION_COUNT = 20;
export const ROUND1_OPTIONS_PER_QUESTION = 4;
export const ROUND1_MAX_SCORE = 20;
export const ROUND1_QUALIFICATION_PERCENTAGE = 70;
export const ROUND1_QUALIFICATION_MIN_SCORE = 15;
export const ROUND1_DEFAULT_DURATION_MINUTES = 30;

export const ROUND2_PROBLEM_COUNT = 3;
export const ROUND2_DEFAULT_POINTS: Record<CodingDifficulty, number> = {
  easy: 100,
  medium: 200,
  hard: 300,
};
export const ROUND2_MAX_SCORE = 600;
export const ROUND2_DEFAULT_DURATION_MINUTES = 90;

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  "c",
  "cpp",
  "python",
  "java",
  "javascript",
  "typescript",
];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  c: "C",
  cpp: "C++",
  python: "Python",
  java: "Java",
  javascript: "JavaScript",
  typescript: "TypeScript",
};

/**
 * Judge0 CE language IDs. These match the standard hosted Judge0 CE catalog
 * (GCC 9.2.0 / OpenJDK 13 / Python 3.8 / Node 12 / TS 3.7). If your hosted
 * instance's `/languages` list differs, override via JUDGE0_LANGUAGE_ID_OVERRIDES
 * (JSON env var) rather than editing this file.
 */
export const JUDGE0_LANGUAGE_IDS: Record<SupportedLanguage, number> = {
  c: 50,
  cpp: 54,
  java: 62,
  python: 71,
  javascript: 63,
  typescript: 74,
};

export const DEFAULT_STARTER_CODE: StarterCodeMap = {
  c: `#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Write your code here
    return 0;
}
`,
  python: `def solve():
    # Write your code here
    pass

if __name__ == "__main__":
    solve()
`,
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Write your code here
    }
}
`,
  javascript: `function solve(input) {
    // Write your code here
    return "";
}

const fs = require("fs");
const input = fs.readFileSync(0, "utf8");
console.log(solve(input));
`,
  typescript: `function solve(input: string): string {
    // Write your code here
    return "";
}

const fs = require("fs");
const input: string = fs.readFileSync(0, "utf8");
console.log(solve(input));
`,
};

export const MAX_CODE_SIZE_BYTES_DEFAULT = 100_000;
export const MAX_OUTPUT_SIZE_BYTES_DEFAULT = 100_000;

export const RUN_RATE_LIMIT_PER_MINUTE_DEFAULT = 10;
export const SUBMIT_RATE_LIMIT_PER_MINUTE_DEFAULT = 5;
export const AUTH_RATE_LIMIT_PER_MINUTE_DEFAULT = 10;

export const COMPILER_REQUEST_TIMEOUT_MS_DEFAULT = 30_000;
export const COMPILER_POLL_INTERVAL_MS_DEFAULT = 1000;
export const COMPILER_MAX_POLL_ATTEMPTS_DEFAULT = 30;

export const DEFAULT_WARNINGS_BEFORE_DISQUALIFICATION = 3;

/**
 * Simplified contest-style penalty: every non-accepted Submit attempt on a problem the
 * participant has not yet solved adds this many minutes. This is not full ICPC penalty
 * scoring (no per-problem freeze window, no distinction for partial-credit near-misses) -
 * it exists only to break leaderboard ties in a way participants can understand.
 */
export const PENALTY_MINUTES_PER_WRONG_SUBMISSION = 10;
