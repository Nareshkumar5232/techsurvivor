import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@tech-survivor/types", "@tech-survivor/config", "@tech-survivor/shared"],
  // Pin the workspace root explicitly - without this Next.js can get confused by an unrelated
  // lockfile elsewhere on the machine (e.g. a personal home-directory package-lock.json) and
  // infer the wrong monorepo root.
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
