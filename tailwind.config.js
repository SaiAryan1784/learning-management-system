/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: "#1C1C1E",
          light: "#2C2C2E",
          muted: "#3A3A3C",
        },
        emerald: {
          DEFAULT: "rgb(var(--brand-primary) / <alpha-value>)",
          hover: "rgb(var(--brand-primary-dark) / <alpha-value>)",
          light: "rgb(var(--brand-primary-light) / <alpha-value>)",
          muted: "rgb(var(--brand-primary) / 0.12)",
        },
        // Icon accent — its own token so a theme can recolour icons independently of
        // buttons/fills. Defaults to the brand primary, so `text-icon` renders exactly
        // like `text-emerald` until a theme actually sets an icon colour.
        icon: {
          DEFAULT: "rgb(var(--brand-icon) / <alpha-value>)",
          muted: "rgb(var(--brand-icon) / 0.12)",
        },
        surface: "#FFFFFF",
        canvas: "#F9FAFB",
        brand: {
          // Var-driven so every existing `text-brand-text` becomes themeable. The :root
          // default resolves to the previous literal #111827 — nothing shifts until a
          // theme overrides it inside a ThemeScope.
          text: "rgb(var(--brand-text) / <alpha-value>)",
          muted: "#6B7280",
          border: "#E5E7EB",
          danger: "#EF4444",
          "danger-hover": "#DC2626",
          warning: "#F59E0B",
          info: "#3B82F6",
        },
      },
      fontFamily: {
        sans: ["Montserrat", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display": ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "700" }],
        "heading": ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.01em", fontWeight: "600" }],
        "subheading": ["1.125rem", { lineHeight: "1.4", fontWeight: "600" }],
        "body": ["0.9375rem", { lineHeight: "1.55" }],
        "caption": ["0.8125rem", { lineHeight: "1.4" }],
      },
      spacing: {
        sidebar: "220px",
        "sidebar-sm": "64px",
      },
      borderRadius: {
        lg: "0.625rem",
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        soft: "0 2px 8px rgba(17,24,39,0.04), 0 1px 2px rgba(17,24,39,0.03)",
        elevated: "0 8px 24px rgba(17,24,39,0.08), 0 2px 6px rgba(17,24,39,0.04)",
        floating: "0 20px 40px rgba(17,24,39,0.14), 0 6px 12px rgba(17,24,39,0.06)",
        "ring-emerald": "0 0 0 4px rgba(16,185,129,0.18)",
        "ring-danger": "0 0 0 4px rgba(239,68,68,0.16)",
      },
      transitionDuration: {
        250: "250ms",
        400: "400ms",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        "fade-in": "fade-in 250ms ease-out",
      },
    },
  },
  plugins: [],
};
