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
          DEFAULT: "#10B981",
          hover: "#059669",
          light: "#D1FAE5",
          muted: "rgba(16,185,129,0.12)",
        },
        surface: "#FFFFFF",
        canvas: "#F9FAFB",
        brand: {
          text: "#111827",
          muted: "#6B7280",
          border: "#E5E7EB",
          danger: "#EF4444",
          "danger-hover": "#DC2626",
        },
      },
      fontFamily: {
        sans: ["Montserrat", "sans-serif"],
      },
      spacing: {
        sidebar: "220px",
        "sidebar-sm": "64px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};
