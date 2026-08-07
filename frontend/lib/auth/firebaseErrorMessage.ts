/** Firebase Auth throws errors with a `.code` like "auth/email-already-in-use". This maps the
 *  handful of codes we expect to see on these forms to friendly copy, falling back to the raw
 *  message for anything unexpected so users still get *something* actionable. */

const FRIENDLY_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "This email is already registered. Try logging in instead.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/weak-password": "Choose a stronger password (at least 8 characters).",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/user-not-found": "Incorrect email or password.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/invalid-login-credentials": "Incorrect email or password.",
  "auth/user-disabled": "This account has been disabled. Contact an organizer for help.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
};

function hasCode(error: unknown): error is { code: string; message?: string } {
  return typeof error === "object" && error !== null && "code" in error && typeof (error as { code: unknown }).code === "string";
}

export function getFirebaseAuthErrorMessage(error: unknown): string {
  if (hasCode(error)) {
    const friendly = FRIENDLY_MESSAGES[error.code];
    if (friendly) return friendly;
    if (typeof error.message === "string" && error.message.length > 0) return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
