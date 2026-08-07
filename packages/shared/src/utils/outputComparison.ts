import type { ComparisonMode } from "@tech-survivor/types";

/** Normalizes line endings and strips trailing blank lines / trailing whitespace per line. */
export function normalizeOutput(raw: string): string {
  const unified = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = unified.split("\n").map((line) => line.replace(/[ \t]+$/, ""));
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines.join("\n");
}

function floatAwareEquals(actual: string, expected: string, tolerance: number): boolean {
  const actualTokens = actual.split(/\s+/).filter(Boolean);
  const expectedTokens = expected.split(/\s+/).filter(Boolean);
  if (actualTokens.length !== expectedTokens.length) return false;
  for (let i = 0; i < actualTokens.length; i++) {
    const a = actualTokens[i]!;
    const e = expectedTokens[i]!;
    const aNum = Number(a);
    const eNum = Number(e);
    if (!Number.isNaN(aNum) && !Number.isNaN(eNum)) {
      if (Math.abs(aNum - eNum) > tolerance) return false;
    } else if (a !== e) {
      return false;
    }
  }
  return true;
}

export function compareOutput(
  actualOutput: string,
  expectedOutput: string,
  mode: ComparisonMode,
  floatTolerance = 0.000001,
): boolean {
  const normalizedActual = normalizeOutput(actualOutput);
  const normalizedExpected = normalizeOutput(expectedOutput);

  switch (mode) {
    case "exact":
      return actualOutput === expectedOutput;
    case "trimmed":
      return normalizedActual === normalizedExpected;
    case "case_insensitive":
      return normalizedActual.toLowerCase() === normalizedExpected.toLowerCase();
    case "float_tolerance":
      return floatAwareEquals(normalizedActual, normalizedExpected, floatTolerance);
    default:
      return normalizedActual === normalizedExpected;
  }
}
