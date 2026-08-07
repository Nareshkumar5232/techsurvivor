"use client";

import Link from "next/link";
import { sendEmailVerification } from "firebase/auth";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import type { ParticipantRoundStatus } from "@tech-survivor/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRound1Result, useEventStatus } from "@/lib/hooks/useEventStatus";
import { firebaseAuth } from "@/lib/firebaseClient";
import { ROUND_STATUS_BADGE_VARIANT, ROUND_STATUS_LABELS } from "@/lib/participantRoundStatus";
import { cn } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Code2,
  GraduationCap,
  Hash,
  ListChecks,
  Lock,
} from "lucide-react";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function round1Cta(status: ParticipantRoundStatus): { label: string; href: string } | null {
  switch (status) {
    case "not_started":
    case "available":
      return { label: "Start Round 1", href: "/round1" };
    case "in_progress":
      return { label: "Continue Round 1", href: "/round1" };
    case "submitted":
    case "qualified":
    case "not_qualified":
      return { label: "View Result", href: "/round1/result" };
    default:
      return null;
  }
}

function round1LockedMessage(status: ParticipantRoundStatus): string {
  if (status === "paused") return "Round 1 is currently paused by the organizers.";
  if (status === "closed") return "Round 1 has closed.";
  return "Round 1 is not currently available.";
}

function round2Cta(status: ParticipantRoundStatus): { label: string; href: string } | null {
  if (status === "available") return { label: "Start Round 2", href: "/round2" };
  if (status === "in_progress") return { label: "Continue Round 2", href: "/round2" };
  return null;
}

function round2LockedMessage(status: ParticipantRoundStatus): string {
  switch (status) {
    case "not_started":
      return "Round 2 opens soon - hang tight.";
    case "paused":
      return "Round 2 is currently paused by the organizers.";
    case "closed":
      return "Round 2 has closed.";
    case "submitted":
      return "You have already submitted Round 2.";
    default:
      return "Round 2 is not currently available to you.";
  }
}

function EmailVerificationAlert() {
  const [sending, setSending] = useState(false);

  async function handleResend() {
    if (!firebaseAuth.currentUser) return;
    setSending(true);
    try {
      await sendEmailVerification(firebaseAuth.currentUser);
      toast.success("Verification email sent. Check your inbox.");
    } catch {
      toast.error("Could not send verification email. Try again later.");
    } finally {
      setSending(false);
    }
  }

  return (
    <motion.div variants={itemVariants}>
      <Alert variant="warning" title="Verify your email">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>Your email address hasn&apos;t been verified yet. Some notifications may be missed.</span>
          <Button size="sm" variant="outline" onClick={handleResend} disabled={sending}>
            {sending ? "Sending..." : "Resend verification email"}
          </Button>
        </div>
      </Alert>
    </motion.div>
  );
}

/** Accent gradient reflecting how the participant stands on a round. */
function statusAccent(status: ParticipantRoundStatus): string {
  if (status === "qualified" || status === "available" || status === "in_progress") return "from-blue-600 to-indigo-600";
  if (status === "submitted") return "from-emerald-500 to-teal-500";
  if (status === "not_qualified") return "from-rose-500 to-red-600";
  return "from-slate-400 to-slate-500";
}

function RoundCard({
  icon: Icon,
  title,
  description,
  status,
  cta,
  lockedMessage,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  status: ParticipantRoundStatus;
  cta: { label: string; href: string } | null;
  lockedMessage: string;
}) {
  const accent = statusAccent(status);

  return (
    <motion.div variants={itemVariants} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <Card className="glass-card relative h-full overflow-hidden">
        <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", accent)} aria-hidden="true" />
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md",
                accent,
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>{title}</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
            </div>
          </div>
          <Badge variant={ROUND_STATUS_BADGE_VARIANT[status]}>{ROUND_STATUS_LABELS[status]}</Badge>
        </CardHeader>
        <CardContent>
          {cta ? (
            <Link href={cta.href} className={cn(buttonVariants({ variant: "primary" }), "group")}>
              {cta.label}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">{lockedMessage}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Round2LockedTeaser({ qualificationPercentage }: { qualificationPercentage: number }) {
  const result = useRound1Result(true);
  const percentage = result.data?.percentage ?? null;
  const progress = percentage !== null ? Math.min(100, (percentage / qualificationPercentage) * 100) : 0;

  return (
    <motion.div variants={itemVariants}>
      <Card className="relative h-full overflow-hidden border-dashed border-slate-300/80 bg-slate-50/40 dark:border-white/10 dark:bg-white/[0.02]">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-400/15 text-slate-400 dark:text-slate-500">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-slate-500 dark:text-slate-400">Round 2 - Coding</CardTitle>
            <p className="text-xs text-slate-400 dark:text-slate-500">Locked</p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Score at least <span className="font-semibold text-slate-600 dark:text-slate-300">{qualificationPercentage}%</span> in
            Round 1 to unlock the coding round.
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {percentage !== null ? `Your Round 1 score: ${percentage.toFixed(1)}%` : "Complete Round 1 to see your progress here."}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const eventStatus = useEventStatus();

  const profileFields = profile
    ? [
        { label: "Institution", value: profile.institution, icon: Building2 },
        { label: "Department", value: profile.department, icon: GraduationCap },
        { label: "Year", value: profile.year, icon: CalendarDays },
        { label: "Roll Number", value: profile.rollNumber, icon: Hash },
      ]
    : [];

  return (
    <motion.div
      className="p-6 sm:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants}>
        <h1 className="bg-gradient-to-r from-navy-900 to-slate-600 bg-clip-text text-2xl font-bold text-transparent dark:from-white dark:to-slate-300">
          Welcome{profile ? `, ${profile.fullName}` : ""}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {eventStatus.data ? `${eventStatus.data.event.name} - here's where things stand.` : "Here's where things stand for Tech Survivor."}
        </p>
      </motion.div>

      {profile && !profile.emailVerified && <EmailVerificationAlert />}

      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {eventStatus.isLoading && (
          <>
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </>
        )}
        {eventStatus.isError && (
          <Alert variant="error" className="md:col-span-2">
            Could not load round status.
          </Alert>
        )}
        {eventStatus.data && (
          <>
            <RoundCard
              icon={ListChecks}
              title={eventStatus.data.round1.config.name || "Round 1"}
              description={`${eventStatus.data.round1.config.questionCount} questions - ${eventStatus.data.round1.config.qualificationPercentage}% to qualify`}
              status={eventStatus.data.round1.participantStatus}
              cta={round1Cta(eventStatus.data.round1.participantStatus)}
              lockedMessage={round1LockedMessage(eventStatus.data.round1.participantStatus)}
            />
            {eventStatus.data.round2.participantStatus === "locked" ? (
              <Round2LockedTeaser qualificationPercentage={eventStatus.data.round1.config.qualificationPercentage} />
            ) : (
              <RoundCard
                icon={Code2}
                title={eventStatus.data.round2.config.name || "Round 2"}
                description="Live coding round"
                status={eventStatus.data.round2.participantStatus}
                cta={round2Cta(eventStatus.data.round2.participantStatus)}
                lockedMessage={round2LockedMessage(eventStatus.data.round2.participantStatus)}
              />
            )}
          </>
        )}
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {profile ? (
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                {profileFields.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-start gap-2.5">
                    <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
                    <div>
                      <dt className="text-xs uppercase text-slate-400">{label}</dt>
                      <dd className="text-sm font-medium text-navy-900 dark:text-white">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            ) : (
              <Skeleton className="h-16 w-full" />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
