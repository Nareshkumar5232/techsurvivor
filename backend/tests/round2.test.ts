import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/config/firebaseAdmin.js", () => import("./support/fakeFirebaseAdmin.js"));

import { resetFakeFirestore } from "./support/fakeFirebaseAdmin.js";
import { makeCodingProblem, makeEvent, makeUser } from "./support/fixtures.js";
import { createProblem } from "../src/repositories/codingRepo.js";
import { createEvent } from "../src/repositories/eventRepo.js";
import { createUser } from "../src/repositories/userRepo.js";
import { getPublicProblem, submitCode } from "../src/services/codingService.js";
import { getEntryForUser } from "../src/services/leaderboardService.js";

const USER_ID = "user-1";

describe("Hidden test case protection", () => {
  beforeEach(async () => {
    resetFakeFirestore();
    await createProblem(makeCodingProblem());
  });

  it("never includes hiddenTestCases in the participant-facing problem shape", async () => {
    const publicProblem = await getPublicProblem("problem-easy");
    expect(publicProblem).not.toHaveProperty("hiddenTestCases");
    // Sanity: the field really does exist on the stored admin record, so its absence above
    // is the mapping function's doing, not an accident of an empty fixture.
    const { getProblem } = await import("../src/repositories/codingRepo.js");
    const stored = await getProblem("problem-easy");
    expect(stored!.hiddenTestCases.length).toBeGreaterThan(0);
  });
});

describe("Best coding score per problem never decreases", () => {
  beforeEach(async () => {
    resetFakeFirestore();
    await createEvent(makeEvent());
    await createUser(makeUser({ uid: USER_ID }));
    // MockCompilerProvider never really executes code - on an "accepted" execution it just
    // echoes stdin back as stdout (see MockCompilerProvider.ts). Using identity input/output
    // pairs here means "accepted execution" and "output matches expected" coincide, which is
    // what lets this test deterministically produce a full-score, all-hidden-tests-pass result
    // without a real compiler.
    await createProblem(
      makeCodingProblem({
        hiddenTestCases: [
          { id: "h1", input: "ECHO_A", expectedOutput: "ECHO_A" },
          { id: "h2", input: "ECHO_B", expectedOutput: "ECHO_B" },
        ],
      }),
    );
  });

  it("a later lower-scoring submission does not overwrite a previous higher score", async () => {
    const user = makeUser({ uid: USER_ID });

    // First submission: mock "executes" successfully and echoes each hidden test's input,
    // which happens to equal that test's expected output -> both tests pass -> full score.
    const good = await submitCode(user, "problem-easy", "python", "print(input())\n");
    expect(good.verdict).toBe("accepted");
    expect(good.score).toBe(100);

    let entry = await getEntryForUser(USER_ID);
    expect(entry!.easyScore).toBe(100);

    // Second submission: force a wrong-answer verdict via the mock compiler's marker, so
    // every hidden test fails and the score drops to 0.
    const bad = await submitCode(user, "problem-easy", "python", "// MOCK_VERDICT: wrong_answer\n");
    expect(bad.score).toBeLessThan(100);

    entry = await getEntryForUser(USER_ID);
    expect(entry!.easyScore).toBe(100); // unchanged - the lower score never replaced the higher one
  });
});
