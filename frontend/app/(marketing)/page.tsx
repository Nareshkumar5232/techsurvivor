"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Code2, ListChecks, Trophy, Users, Zap, Shield } from "lucide-react";
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from "@tech-survivor/config";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Countdown } from "@/components/marketing/countdown";
import { usePublicEvent } from "@/lib/hooks/useEventStatus";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={fadeUp}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export default function LandingPage() {
  const { data: event, isLoading, isError, error } = usePublicEvent();

  return (
    <div className="relative flex flex-col overflow-hidden">
      {/* Background ambient blobs */}
      <div className="pointer-events-none absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-blue-500/8 blur-3xl animate-pulse-glow" />
      <div className="pointer-events-none absolute top-40 right-0 h-[350px] w-[350px] rounded-full bg-indigo-500/8 blur-3xl animate-pulse-glow [animation-delay:3s]" />
      <div className="pointer-events-none absolute top-[800px] left-0 h-[300px] w-[300px] rounded-full bg-purple-500/6 blur-3xl" />

      {/* ─── HERO ─── */}
      <section className="relative px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-24">
        <div className="mx-auto max-w-4xl text-center">
          {isLoading && (
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-6 w-40 rounded-full" />
              <Skeleton className="h-16 w-3/4 rounded-xl" />
              <Skeleton className="h-5 w-2/3 rounded-lg" />
              <Skeleton className="h-16 w-80 rounded-2xl" />
            </div>
          )}

          {isError && !isLoading && (
            <div className="mx-auto max-w-md text-left">
              <Alert variant="warning" title="Event details are not available yet">
                {error instanceof Error ? error.message : "Please check back soon."}
              </Alert>
            </div>
          )}

          {!isLoading && !isError && event && (
            <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.6 }}>
              {/* Badge */}
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-700 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                {event.organization}
              </span>

              {/* Headline */}
              <h1 className="mt-5 text-5xl font-black tracking-tight text-slate-900 sm:text-7xl leading-[1.1]">
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  {event.name}
                </span>
              </h1>

              {/* Subtext */}
              <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-500 leading-relaxed">{event.description}</p>

              {/* Countdown */}
              <div className="mt-10 flex justify-center">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-md hover:shadow-lg transition-shadow">
                  <Countdown
                    target={
                      new Date(event.registrationEnd).getTime() > Date.now()
                        ? event.registrationEnd
                        : event.eventStart
                    }
                    liveLabel="The event is live now"
                  />
                </div>
              </div>

              {/* CTA */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link href="/register" className={buttonVariants({ variant: "primary", size: "lg" })}>
                  Register now →
                </Link>
                <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
                  Log in
                </Link>
              </div>
            </motion.div>
          )}

          {!isLoading && !isError && !event && (
            <div className="mx-auto max-w-md text-left">
              <Alert variant="info" title="Event details coming soon">
                Registration will open here once the event is configured. Check back shortly.
              </Alert>
            </div>
          )}
        </div>
      </section>

      {/* ─── TWO ROUNDS ─── */}
      <Section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 sm:text-4xl">Two rounds. One winner.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-500">
              Qualify through a timed MCQ round, then prove yourself in a live coding contest.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="glass-card group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 border border-blue-200/80 text-blue-600 shadow-sm">
                    <ListChecks className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Round 1</span>
                    <CardTitle className="text-lg mt-0.5">MCQ Qualifier</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5 text-sm text-slate-500">
                <p>20 multiple-choice questions, one mark each, timed and auto-submitted.</p>
                <p>Score at least 15/20 (75%) to qualify for Round 2.</p>
                <p className="font-semibold text-slate-700">One attempt only — make it count.</p>
              </CardContent>
            </Card>

            <Card className="glass-card group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 border border-indigo-200/80 text-indigo-600 shadow-sm">
                    <Code2 className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Round 2</span>
                    <CardTitle className="text-lg mt-0.5">Live Coding</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5 text-sm text-slate-500">
                <p>3 problems — easy (100 pts), medium (200 pts), hard (300 pts).</p>
                <p>Split-screen coding workspace with real compilation and test execution.</p>
                <p className="font-semibold text-slate-700">Submit as many times as you like — best score per problem counts.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>

      {/* ─── LANGUAGES ─── */}
      <Section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 text-center shadow-glass sm:p-12">
          <div className="flex justify-center mb-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 border border-blue-200 text-blue-600">
              <Zap className="h-6 w-6" />
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">Code in the language you know best</h2>
          <p className="mt-2 text-slate-500">Round 2 supports six languages out of the box.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <span
                key={lang}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:scale-105 hover:border-blue-300 hover:text-blue-700 hover:shadow-md cursor-default"
              >
                {LANGUAGE_LABELS[lang]}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── RULES TEASER ─── */}
      <Section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-glass hover:shadow-glass-hover transition-shadow sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200 text-slate-600">
            <Shield className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-2xl font-black text-slate-900">Solo participation, fair play</h2>
          <p className="mt-3 text-slate-500 leading-relaxed">
            One account per participant, one Round 1 attempt, and browser activity monitoring during
            both rounds. Read the full rules before you register.
          </p>
          <Link href="/rules" className={`${buttonVariants({ variant: "outline" })} mt-6`}>
            View full rules
          </Link>
        </div>
      </Section>

      {/* ─── PRIZES ─── */}
      {!isLoading && event?.prizeDetails && (
        <Section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-8 text-center text-white shadow-2xl border border-white/10 sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
              <Trophy className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-3xl font-black sm:text-4xl">Prizes</h2>
            <p className="mx-auto mt-4 max-w-2xl whitespace-pre-line text-lg text-slate-300">{event.prizeDetails}</p>
          </div>
        </Section>
      )}

      {/* ─── COORDINATORS ─── */}
      {!isLoading && event && event.coordinators.length > 0 && (
        <Section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-black text-slate-900 sm:text-3xl">Event coordinators</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {event.coordinators.map((c) => (
                <Card key={c.email}>
                  <CardContent className="p-6">
                    <p className="font-bold text-slate-900 text-lg">{c.name}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mt-0.5">{c.role}</p>
                    <p className="mt-3 text-sm text-slate-500">{c.phone}</p>
                    <p className="text-sm text-slate-500">{c.email}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}

