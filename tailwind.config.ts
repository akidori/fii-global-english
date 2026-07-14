import type { Config } from "tailwindcss";

/**
 * Fii の世界観（電脳／ホログラム）に合わせたトークン。
 * 実体の配色は fii-desktop/styles.css から抽出:
 *   navy  #0d111a / #070c16, cyan #39c5ff / #45cdff / #7fd8ff, ink #eaf6ff
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#070c16",
          800: "#0b1120",
          700: "#0d111a",
          600: "#111827",
          500: "#16203a",
        },
        cyan: {
          bright: "#45cdff",
          core: "#39c5ff",
          soft: "#7fd8ff",
        },
        violet: {
          core: "#a06bff",
          soft: "#c9a7ff",
        },
        ink: "#eaf6ff",
        muted: "#9fb4cc",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(69, 205, 255, 0.22)",
        "glow-strong": "0 0 34px rgba(69, 205, 255, 0.42)",
        panel: "0 14px 40px rgba(0,0,0,0.5), 0 0 24px rgba(69,205,255,0.1)",
      },
      keyframes: {
        "fii-float": {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "fii-glow": {
          "0%,100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.94)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "xp-fill": {
          "0%": { width: "0%" },
        },
      },
      animation: {
        "fii-float": "fii-float 4s ease-in-out infinite",
        "fii-glow": "fii-glow 2s ease-in-out infinite",
        "pop-in": "pop-in 0.28s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
