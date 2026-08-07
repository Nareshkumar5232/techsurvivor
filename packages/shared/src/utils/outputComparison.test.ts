import { describe, expect, it } from "vitest";
import { compareOutput } from "./outputComparison.js";

describe("compareOutput", () => {
  it("treats CRLF and LF as equal under trimmed mode", () => {
    expect(compareOutput("hello\r\nworld\r\n", "hello\nworld", "trimmed")).toBe(true);
  });

  it("ignores trailing whitespace and trailing blank lines", () => {
    expect(compareOutput("42   \n\n\n", "42", "trimmed")).toBe(true);
  });

  it("preserves meaningful internal spacing", () => {
    expect(compareOutput("a  b", "a b", "trimmed")).toBe(false);
  });

  it("is case-sensitive by default (trimmed mode)", () => {
    expect(compareOutput("Hello", "hello", "trimmed")).toBe(false);
  });

  it("case_insensitive mode ignores case", () => {
    expect(compareOutput("Hello", "hello", "case_insensitive")).toBe(true);
  });

  it("float_tolerance mode allows small numeric deviation", () => {
    expect(compareOutput("3.14159", "3.14160", "float_tolerance", 0.001)).toBe(true);
    expect(compareOutput("3.14159", "4.0", "float_tolerance", 0.001)).toBe(false);
  });

  it("exact mode requires byte-for-byte equality", () => {
    expect(compareOutput("42\n", "42", "exact")).toBe(false);
    expect(compareOutput("42", "42", "exact")).toBe(true);
  });
});
