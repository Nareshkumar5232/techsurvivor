import type { Announcement, EventConfig, RoundConfig, UserProfile } from "@tech-survivor/types";
import { ROUND1_DEFAULT_DURATION_MINUTES, ROUND2_DEFAULT_DURATION_MINUTES } from "@tech-survivor/config";
import { auth, db } from "./firebaseAdmin.js";
import { buildCodingProblems, buildMcqQuestions, SEED_EVENT_ID, SEED_PASSWORD } from "./seedData.js";

interface SeedParticipant {
  email: string;
  fullName: string;
  institution: string;
  department: string;
  year: string;
  rollNumber: string;
  phone: string;
}

const PARTICIPANTS: SeedParticipant[] = [
  { email: "alice.participant@example.com", fullName: "Alice Sharma", institution: "NIT Trichy", department: "CSE", year: "3rd Year", rollNumber: "TS-101", phone: "9000000101" },
  { email: "bob.participant@example.com", fullName: "Bob Kumar", institution: "IIT Madras", department: "ECE", year: "2nd Year", rollNumber: "TS-102", phone: "9000000102" },
  { email: "carol.participant@example.com", fullName: "Carol Fernandes", institution: "Anna University", department: "IT", year: "4th Year", rollNumber: "TS-103", phone: "9000000103" },
  { email: "dave.participant@example.com", fullName: "Dave Iyer", institution: "VIT Vellore", department: "CSE", year: "3rd Year", rollNumber: "TS-104", phone: "9000000104" },
  { email: "eve.participant@example.com", fullName: "Eve Nair", institution: "PSG Tech", department: "CSE", year: "2nd Year", rollNumber: "TS-105", phone: "9000000105" },
];

async function upsertAuthUser(email: string, password: string): Promise<string> {
  try {
    const existing = await auth.getUserByEmail(email);
    return existing.uid;
  } catch {
    const created = await auth.createUser({ email, password, emailVerified: true });
    return created.uid;
  }
}

async function seedAdmin(now: string): Promise<void> {
  const email = "admin@techsurvivor.dev";
  const uid = await upsertAuthUser(email, SEED_PASSWORD);
  await auth.setCustomUserClaims(uid, { role: "admin" });
  const profile: UserProfile = {
    uid,
    role: "admin",
    fullName: "Event Administrator",
    email,
    emailVerified: true,
    institution: "Tech Survivor Organizing Committee",
    department: "Administration",
    year: "-",
    rollNumber: `admin-${uid.slice(0, 8)}`,
    phone: "-",
    eventRegistrationId: null,
    profileComplete: true,
    status: "active",
    disqualified: false,
    disqualificationReason: null,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection("users").doc(uid).set(profile, { merge: true });
  console.log(`Admin ready: ${email} / ${SEED_PASSWORD} (uid ${uid})`);
}

async function seedParticipants(now: string): Promise<UserProfile[]> {
  const profiles: UserProfile[] = [];
  for (const p of PARTICIPANTS) {
    const uid = await upsertAuthUser(p.email, SEED_PASSWORD);
    await auth.setCustomUserClaims(uid, { role: "participant" });
    const profile: UserProfile = {
      uid,
      role: "participant",
      fullName: p.fullName,
      email: p.email,
      emailVerified: true,
      institution: p.institution,
      department: p.department,
      year: p.year,
      rollNumber: p.rollNumber,
      phone: p.phone,
      eventRegistrationId: null,
      profileComplete: true,
      status: "active",
      disqualified: false,
      disqualificationReason: null,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection("users").doc(uid).set(profile, { merge: true });
    profiles.push(profile);
    console.log(`Participant ready: ${p.email} / ${SEED_PASSWORD} (uid ${uid})`);
  }
  return profiles;
}

async function seedEventAndRounds(now: string): Promise<void> {
  const nowMs = Date.parse(now);
  const event: EventConfig = {
    id: SEED_EVENT_ID,
    name: "Tech Survivor",
    description:
      "A two-round individual technical competition: an MCQ qualification round followed by a " +
      "live coding challenge across three difficulty levels.",
    organization: "Tech Survivor Organizing Committee",
    logoUrl: null,
    registrationStart: new Date(nowMs - 7 * 86_400_000).toISOString(),
    registrationEnd: new Date(nowMs + 7 * 86_400_000).toISOString(),
    eventStart: now,
    eventEnd: new Date(nowMs + 3 * 86_400_000).toISOString(),
    status: "round1_live",
    leaderboardVisibility: "visible",
    includeRound1ScoreInFinal: false,
    coordinators: [
      { name: "Event Coordinator", role: "Faculty Coordinator", phone: "9000000001", email: "coordinator@techsurvivor.dev" },
      { name: "Student Lead", role: "Student Coordinator", phone: "9000000002", email: "student.lead@techsurvivor.dev" },
    ],
    prizeDetails: "Cash prizes and certificates for the top 3 participants on the final leaderboard.",
    createdAt: now,
    updatedAt: now,
  };
  await db.collection("events").doc(SEED_EVENT_ID).set(event, { merge: true });

  const round1: RoundConfig = {
    id: "round1",
    eventId: SEED_EVENT_ID,
    name: "Round 1 - MCQ Qualification",
    type: "mcq",
    status: "live",
    startTime: now,
    endTime: new Date(nowMs + ROUND1_DEFAULT_DURATION_MINUTES * 60_000).toISOString(),
    durationMinutes: ROUND1_DEFAULT_DURATION_MINUTES,
    questionCount: 20,
    qualificationPercentage: 70,
    qualificationMinimumScore: 15,
    instructions:
      "Answer all 20 questions. Each correct answer is worth 1 mark, there is no negative " +
      "marking by default. You need at least 15/20 to qualify for Round 2. The round auto-submits " +
      "when the timer reaches zero, and you only get one attempt.",
    settings: { warningsBeforeDisqualification: 3, allowAnswerReview: false },
  };

  const round2: RoundConfig = {
    id: "round2",
    eventId: SEED_EVENT_ID,
    name: "Round 2 - Coding Challenge",
    type: "coding",
    status: "live",
    startTime: now,
    endTime: new Date(nowMs + ROUND2_DEFAULT_DURATION_MINUTES * 60_000).toISOString(),
    durationMinutes: ROUND2_DEFAULT_DURATION_MINUTES,
    questionCount: 3,
    qualificationPercentage: 0,
    qualificationMinimumScore: 0,
    instructions:
      "Solve three problems - one easy (100 pts), one medium (200 pts), one hard (300 pts). " +
      "You may submit as many times as you like; your best score per problem counts.",
    settings: { warningsBeforeDisqualification: 3, allowAnswerReview: false },
  };

  await db.collection("events").doc(SEED_EVENT_ID).collection("rounds").doc("round1").set(round1, { merge: true });
  await db.collection("events").doc(SEED_EVENT_ID).collection("rounds").doc("round2").set(round2, { merge: true });
  console.log("Event and rounds seeded (Round 1 and Round 2 are both set to live for local testing).");
}

async function seedMcqQuestions(now: string): Promise<void> {
  const questions = buildMcqQuestions(now);
  const batch = db.batch();
  for (const q of questions) {
    batch.set(db.collection("mcqQuestions").doc(q.id), q, { merge: true });
  }
  await batch.commit();
  console.log(`Seeded ${questions.length} MCQ questions.`);
}

async function seedCodingProblems(now: string): Promise<void> {
  const problems = buildCodingProblems(now);
  const batch = db.batch();
  for (const p of problems) {
    batch.set(db.collection("codingProblems").doc(p.id), p, { merge: true });
  }
  await batch.commit();
  console.log(`Seeded ${problems.length} coding problems.`);
}

async function seedAnnouncements(now: string): Promise<void> {
  const announcements: Announcement[] = [
    {
      id: "seed-announcement-welcome",
      eventId: SEED_EVENT_ID,
      title: "Welcome to Tech Survivor!",
      message: "Registration is open. Read the Rules page before Round 1 begins.",
      priority: "info",
      audience: "all",
      publishAt: now,
      expiresAt: null,
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "seed-announcement-round2-tip",
      eventId: SEED_EVENT_ID,
      title: "Round 2 tip",
      message: "Your best submission per problem counts, so keep improving after your first attempt.",
      priority: "info",
      audience: "qualified",
      publishAt: now,
      expiresAt: null,
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
  const batch = db.batch();
  for (const a of announcements) {
    batch.set(db.collection("announcements").doc(a.id), a, { merge: true });
  }
  await batch.commit();
  console.log(`Seeded ${announcements.length} announcements.`);
}

/** Alice (index 0) gets a finalized, qualifying Round 1 attempt (15/20). Bob (index 1) gets a
 *  finalized, NON-qualifying attempt (14/20) - together these are the two mandatory qualification
 *  boundary cases the test suite checks. Everyone else starts with no attempt so the live
 *  start-round flow can still be exercised locally. */
async function seedRound1Attempts(participants: UserProfile[], now: string): Promise<void> {
  const questions = buildMcqQuestions(now);
  const assignedQuestionIds = questions.map((q) => q.id);
  const optionOrders = Object.fromEntries(assignedQuestionIds.map((id) => [id, [0, 1, 2, 3]]));

  function buildAnswers(correctCount: number): Record<string, number> {
    const answers: Record<string, number> = {};
    questions.forEach((q, i) => {
      answers[q.id] = i < correctCount ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4;
    });
    return answers;
  }

  const scenarios: { participant: UserProfile; correctCount: number }[] = [
    { participant: participants[0]!, correctCount: 15 },
    { participant: participants[1]!, correctCount: 14 },
  ];

  for (const { participant, correctCount } of scenarios) {
    const answers = buildAnswers(correctCount);
    const attemptId = `${participant.uid}_round1`;
    await db.collection("mcqAttempts").doc(attemptId).set(
      {
        id: attemptId,
        userId: participant.uid,
        eventId: SEED_EVENT_ID,
        roundId: "round1",
        assignedQuestionIds,
        optionOrders,
        answers,
        markedForReview: [],
        startTime: now,
        expiresAt: new Date(Date.parse(now) + ROUND1_DEFAULT_DURATION_MINUTES * 60_000).toISOString(),
        submittedAt: now,
        score: correctCount,
        percentage: (correctCount / 20) * 100,
        correctCount,
        incorrectCount: 20 - correctCount,
        unansweredCount: 0,
        qualified: correctCount >= 15,
        status: "submitted",
        monitoringEvents: [],
      },
      { merge: true },
    );

    await db
      .collection("leaderboards")
      .doc(SEED_EVENT_ID)
      .collection("entries")
      .doc(participant.uid)
      .set(
        {
          userId: participant.uid,
          participantName: participant.fullName,
          institution: participant.institution,
          easyScore: 0,
          mediumScore: 0,
          hardScore: 0,
          easyAccepted: false,
          mediumAccepted: false,
          hardAccepted: false,
          round1Score: correctCount,
          totalScore: 0,
          acceptedProblemCount: 0,
          penaltyTime: 0,
          lastAcceptedAt: null,
          rank: 0,
          updatedAt: now,
        },
        { merge: true },
      );
  }
  console.log("Seeded Round 1 attempts: Alice qualifies at 15/20, Bob does not qualify at 14/20.");
}

/** Gives Alice (already qualified above) one accepted submission on the easy problem, so the
 *  leaderboard and submission history have real sample data to look at. */
async function seedSampleSubmission(alice: UserProfile, now: string): Promise<void> {
  const submissionId = "seed-submission-alice-easy";
  await db.collection("submissions").doc(submissionId).set(
    {
      id: submissionId,
      userId: alice.uid,
      eventId: SEED_EVENT_ID,
      problemId: "seed-easy-shortest-completing-word",
      language: "python",
      sourceCode:
        "plate = input()\n" +
        "n = int(input())\n" +
        "words = input().split()\n" +
        "need = {}\n" +
        "for ch in plate.lower():\n" +
        "    if ch.isalpha():\n" +
        "        need[ch] = need.get(ch, 0) + 1\n" +
        "best = None\n" +
        "for w in words:\n" +
        "    have = {}\n" +
        "    for ch in w.lower():\n" +
        "        have[ch] = have.get(ch, 0) + 1\n" +
        "    if all(have.get(k, 0) >= v for k, v in need.items()):\n" +
        "        if best is None or len(w) < len(best):\n" +
        "            best = w\n" +
        "print(best)\n",
      kind: "submit",
      status: "completed",
      verdict: "accepted",
      passedTests: 5,
      totalTests: 5,
      score: 100,
      runtime: 0.02,
      memory: 3072,
      compilerOutput: null,
      submittedAt: now,
      completedAt: now,
    },
    { merge: true },
  );

  await db
    .collection("leaderboards")
    .doc(SEED_EVENT_ID)
    .collection("entries")
    .doc(alice.uid)
    .set(
      {
        easyScore: 100,
        easyAccepted: true,
        acceptedProblemCount: 1,
        lastAcceptedAt: now,
        updatedAt: now,
      },
      { merge: true },
    );
  console.log("Seeded one sample accepted submission for Alice on the easy problem.");
}

async function main(): Promise<void> {
  const now = new Date().toISOString();
  await seedAdmin(now);
  const participants = await seedParticipants(now);
  await seedEventAndRounds(now);
  await seedMcqQuestions(now);
  await seedCodingProblems(now);
  await seedAnnouncements(now);
  await seedRound1Attempts(participants, now);
  await seedSampleSubmission(participants[0]!, now);
  console.log("\nSeed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
