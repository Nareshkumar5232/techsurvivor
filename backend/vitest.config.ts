import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/support/setupEnv.ts"],
    include: ["tests/**/*.test.ts"],
    testTimeout: 10_000,
  },
});
