import { AlertTriangle } from "lucide-react";
import {
  ROUND1_MAX_SCORE,
  ROUND1_QUALIFICATION_MIN_SCORE,
} from "@tech-survivor/config";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RULE_SECTIONS: { title: string; points: string[] }[] = [
  {
    title: "Participation",
    points: [
      "Participation is solo — team registrations are not accepted.",
      "One account per participant. Registering multiple accounts under different emails is a violation and may result in disqualification.",
      "The details you submit at registration (name, institution, roll number, etc.) must be accurate and match your ID if verification is requested.",
    ],
  },
  {
    title: "Round 1 — MCQ",
    points: [
      "You get exactly one attempt at Round 1. There is no retake for any reason, including technical issues on your end — report problems to a coordinator immediately.",
      `You must score at least ${ROUND1_QUALIFICATION_MIN_SCORE}/${ROUND1_MAX_SCORE} to qualify for Round 2.`,
      "The round timer auto-submits your attempt when it expires, whether or not you've answered every question.",
      "Negative marking is off by default but is admin-configurable — always check the day's announcements.",
    ],
  },
  {
    title: "Round 2 — Coding",
    points: [
      "Only qualified participants can access Round 2.",
      "You may submit each problem multiple times; your best-scoring submission per problem counts.",
      "Do not share code, discuss problems, or collaborate with other participants during the round.",
      "Using unauthorized external tools (AI code assistants, pre-written solution banks, etc.) during the round is prohibited unless organizers state otherwise.",
    ],
  },
  {
    title: "Monitoring & disqualification",
    points: [
      "Both rounds log browser activity, including tab switches, window blur events, fullscreen exits, and copy-paste actions, for integrity review.",
      "Browser-based monitoring cannot guarantee complete prevention of cheating — it is one input among several used to review conduct, not an infallible detector.",
      "The number of warnings before disqualification, and the exact disqualification policy, are configured by the organizing team and may vary by event; announcements will state the specifics in force for this event.",
      "Disqualification decisions are made by the organizing team and are final.",
    ],
  },
  {
    title: "Leaderboard tie-breaks",
    points: [
      "Ties on the Round 2 leaderboard are broken, in order, by: (1) higher total score, (2) more problems fully accepted, (3) lower total penalty time, (4) earlier timestamp of the last accepted submission.",
    ],
  },
];

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-navy-900 sm:text-4xl">Rules</h1>
      <p className="mt-3 text-slate-600">
        A summary of the rules that apply to every participant. Read this before you register.
      </p>

      <div className="mt-6">
        <Alert variant="warning" title="Play fair">
          Violating these rules can result in disqualification at the organizers&apos; discretion, at any
          point before results are finalized.
        </Alert>
      </div>

      <div className="mt-10 space-y-6">
        {RULE_SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {section.title === "Monitoring & disqualification" && (
                  <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
                )}
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
