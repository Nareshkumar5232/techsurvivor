import { loadEnv } from "../config/env.js";
import { Judge0CompilerProvider } from "./Judge0CompilerProvider.js";
import { MockCompilerProvider } from "./MockCompilerProvider.js";
import type { CompilerProvider } from "./types.js";

export * from "./types.js";

let cachedProvider: CompilerProvider | undefined;

export function getCompilerProvider(): CompilerProvider {
  if (cachedProvider) return cachedProvider;
  const env = loadEnv();
  cachedProvider =
    env.COMPILER_PROVIDER === "judge0" ? new Judge0CompilerProvider(env) : new MockCompilerProvider();
  return cachedProvider;
}
