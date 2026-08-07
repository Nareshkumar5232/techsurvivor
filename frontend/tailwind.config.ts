import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0a0e1a",
          900: "#0f1729",
          800: "#141d35",
          700: "#1b2646",
        },
        brand: {
          blue: "#2563eb",
          purple: "#7c3aed",
          cyan: "#06b6d4",
        },
        verdict: {
          accepted: "#16a34a",
          error: "#dc2626",
          warning: "#d97706",
          info: "#2563eb",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glass: "0 4px 20px rgba(15, 23, 42, 0.06)",
        "glass-hover": "0 12px 40px rgba(37, 99, 235, 0.1), 0 4px 16px rgba(15, 23, 42, 0.06)",
        "glass-dark": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glass-glow": "0 0 20px rgba(37, 99, 235, 0.2)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "live-pulse": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 0 0 rgba(34, 197, 94, 0.5)" },
          "50%": { opacity: "0.8", boxShadow: "0 0 0 6px rgba(34, 197, 94, 0)" },
        },
        "border-glow": {
          "0%, 100%": { borderColor: "rgba(96, 165, 250, 0.2)" },
          "50%": { borderColor: "rgba(96, 165, 250, 0.5)" },
        },
        "rotate-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "pulse-glow": "pulse-glow 6s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "live-pulse": "live-pulse 2s ease-in-out infinite",
        "border-glow": "border-glow 3s ease-in-out infinite",
        "rotate-slow": "rotate-slow 20s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
