"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { MonitoringEventType } from "@tech-survivor/types";
import { apiClient } from "@/lib/apiClient";

// Only the event types this hook actually fires need a message; "refresh" is part of the
// shared MonitoringEventType union but this hook never fires it, so it's intentionally omitted.
const WARN_MESSAGES: Partial<Record<MonitoringEventType, string>> = {
  tab_switch: "Tab switch detected. This activity is being logged for exam integrity.",
  window_blur: "Window focus lost. This activity is being logged for exam integrity.",
  fullscreen_exit: "Fullscreen exited. This activity is being logged for exam integrity.",
  network_disconnect: "You've gone offline. Your answers are saved locally until you reconnect.",
  copy: "Copying is discouraged and has been logged.",
  paste: "Pasting is discouraged and has been logged.",
};

/** Fire-and-forget: never blocks the UI and never surfaces an error to the participant -
 *  monitoring is best-effort and losing one event is not worth interrupting the exam. */
function reportMonitoringEvent(type: MonitoringEventType) {
  apiClient.post("/round1/monitoring-event", { type }).catch(() => {});
  if (type === "network_reconnect") {
    toast.success("You're back online.");
    return;
  }
  const message = WARN_MESSAGES[type];
  if (message) toast.warning(message);
}

/**
 * Attaches integrity-monitoring listeners (tab switches, window blur, fullscreen exit,
 * copy/paste, network changes) for the duration the returned `active` flag is true, and
 * reports each one to the backend. Warn-only: never blocks input or auto-disqualifies -
 * that decision is left to an admin reviewing the logged events server-side.
 */
export function useExamMonitoring(active: boolean) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(typeof navigator === "undefined" ? true : navigator.onLine);
  }, []);

  useEffect(() => {
    if (!active) return;

    function onVisibilityChange() {
      if (document.hidden) reportMonitoringEvent("tab_switch");
    }
    function onBlur() {
      reportMonitoringEvent("window_blur");
    }
    function onFullscreenChange() {
      if (!document.fullscreenElement) reportMonitoringEvent("fullscreen_exit");
    }
    function onCopy() {
      reportMonitoringEvent("copy");
    }
    function onPaste() {
      reportMonitoringEvent("paste");
    }
    function onOnline() {
      setIsOnline(true);
      reportMonitoringEvent("network_reconnect");
    }
    function onOffline() {
      setIsOnline(false);
      reportMonitoringEvent("network_disconnect");
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [active]);

  return { isOnline };
}

/** Warns the participant before they navigate away or close the tab while an attempt is
 *  still in progress. Removed automatically once `active` becomes false or on unmount. */
export function useBeforeUnloadWarning(active: boolean) {
  useEffect(() => {
    if (!active) return;
    function handler(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [active]);
}
