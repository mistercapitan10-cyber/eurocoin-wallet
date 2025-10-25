/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./config/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Light mode colors
        background: "#f8fafc",
        backgroundAlt: "#f1f5f9",
        surface: "#ffffff",
        surfaceAlt: "#f8fafc",
        foreground: "#1e293b",
        foregroundMuted: "#64748b",
        accent: "#3b82f6",
        accentAlt: "#f59e0b",
        outline: "#e2e8f0",
        // Dark mode colors (accessed via CSS variables or direct class names)
        "dark-background": "#0f172a",
        "dark-backgroundAlt": "#1e293b",
        "dark-surface": "#1e293b",
        "dark-surfaceAlt": "#334155",
        "dark-foreground": "#f1f5f9",
        "dark-foregroundMuted": "#94a3b8",
        "dark-outline": "#334155",
        // Corporate status colors (same for both themes)
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        info: "#3b82f6",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", '"DM Sans"', "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", '"Rubik Mono One"', "sans-serif"],
        mono: ["var(--font-geist-mono)", "SFMono-Regular", "ui-monospace", "monospace"],
      },
      boxShadow: {
        focus: "0 0 0 3px rgba(59, 130, 246, 0.45)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        "card-hover": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "card-elevated": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};
