import Link from "next/link";
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from "@tech-survivor/config";

const FAQS: { question: string; answer: React.ReactNode }[] = [
  {
    question: "What happens if I refresh or close my tab during Round 1?",
    answer:
      "Nothing to worry about — your timer and your answers so far are tracked server-side, not in your browser. Reopen the round and you'll pick up right where you left off, with the same time remaining.",
  },
  {
    question: "Which languages can I use in Round 2?",
    answer: (
      <>
        Round 2 supports {SUPPORTED_LANGUAGES.map((l) => LANGUAGE_LABELS[l]).join(", ")}. You can
        switch languages between problems, but each submission is graded in whichever language you
        submitted it in.
      </>
    ),
  },
  {
    question: "What if I don't qualify in Round 1?",
    answer:
      "You can still view your Round 1 result and the answer key (if enabled) on your dashboard, but Round 2 stays locked for your account — only participants who meet the qualification score can access it.",
  },
  {
    question: "Is there negative marking in Round 1?",
    answer:
      "Not by default. Negative marking is an admin-configurable setting per event, so always check the schedule and announcements for the specifics in force on the day.",
  },
  {
    question: "How is Round 2 scored?",
    answer:
      "Each problem is worth a fixed number of points and graded against a set of hidden test cases. By default you earn partial credit: score = problem points × (test cases passed / total test cases). Only your best-scoring submission per problem counts.",
  },
  {
    question: "How are leaderboard ties broken?",
    answer: (
      <>
        In order: higher total score, then more problems fully accepted, then lower total penalty
        time, then an earlier last accepted submission. See the{" "}
        <Link href="/rules" className="text-brand-blue hover:underline">
          rules page
        </Link>{" "}
        for details.
      </>
    ),
  },
  {
    question: "Can I use my phone or tablet for either round?",
    answer:
      "We strongly recommend a laptop or desktop with a stable internet connection, especially for Round 2's code editor. Small screens make the split-screen workspace difficult to use.",
  },
  {
    question: "Is my activity monitored during the rounds?",
    answer:
      "Yes — tab switches, window blur events, fullscreen exits, and copy-paste actions are logged for both rounds. This monitoring is one input used for integrity review, not a guarantee against all forms of cheating.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-navy-900 sm:text-4xl">Frequently asked questions</h1>
      <p className="mt-3 text-slate-600">
        Can&apos;t find your question here? Reach out on the{" "}
        <Link href="/contact" className="text-brand-blue hover:underline">
          contact page
        </Link>
        .
      </p>

      <dl className="mt-10 divide-y divide-slate-200">
        {FAQS.map((item) => (
          <div key={item.question} className="py-5">
            <dt className="font-semibold text-navy-900">{item.question}</dt>
            <dd className="mt-2 text-sm text-slate-600">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
