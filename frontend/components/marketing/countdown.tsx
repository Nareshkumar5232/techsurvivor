"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  /** ISO timestamp to count down to. */
  target: string;
  /** Shown once `target` is in the past. */
  liveLabel?: string;
  className?: string;
}

interface RemainingTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getRemaining(targetMs: number): RemainingTime | null {
  const diff = targetMs - Date.now();
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

const UNITS: { key: keyof RemainingTime; label: string }[] = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Minutes" },
  { key: "seconds", label: "Seconds" },
];

export function Countdown({ target, liveLabel = "Live now", className }: CountdownProps) {
  const targetMs = new Date(target).getTime();
  // Start as "not yet known" rather than computing immediately, so the server-rendered markup
  // and the first client render match exactly (avoids a hydration mismatch from the clock
  // ticking between render passes). The real value fills in on mount, a tick later.
  const [remaining, setRemaining] = useState<RemainingTime | null | undefined>(undefined);

  useEffect(() => {
    const tick = () => setRemaining(getRemaining(targetMs));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetMs]);

  if (Number.isNaN(targetMs)) return null;

  if (remaining === undefined) {
    return (
      <div className={className}>
        <div className="flex gap-3 sm:gap-4">
          {UNITS.map(({ key }) => (
            <div
              key={key}
              className="flex min-w-[64px] flex-col items-center rounded-lg bg-navy-900 px-3 py-2 text-white sm:min-w-[76px] sm:px-4 sm:py-3"
              aria-hidden="true"
            >
              <span className="text-xl font-bold tabular-nums sm:text-2xl">--</span>
              <span className="text-[10px] uppercase tracking-wide text-slate-300 sm:text-xs">&nbsp;</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!remaining) {
    return (
      <div className={className}>
        <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-600" aria-hidden="true" />
          {liveLabel}
        </span>
      </div>
    );
  }

  return (
    <div className={className} role="timer" aria-label="Countdown">
      <div className="flex gap-3 sm:gap-4">
        {UNITS.map(({ key, label }) => (
          <div
            key={key}
            className="flex min-w-[64px] flex-col items-center rounded-lg bg-navy-900 px-3 py-2 text-white sm:min-w-[76px] sm:px-4 sm:py-3"
          >
            <span className="text-xl font-bold tabular-nums sm:text-2xl">
              {String(remaining[key]).padStart(2, "0")}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-slate-300 sm:text-xs">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
