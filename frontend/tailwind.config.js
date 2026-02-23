/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        surface: {
          950: "#0a0a0f",
          900: "#0f0f17",
          800: "#16161f",
          700: "#1e1e2e",
          600: "#252537",
        },
      },
      boxShadow: {
        glow: "0 0 20px rgba(99, 102, 241, 0.25)",
        "glow-sm": "0 0 10px rgba(99, 102, 241, 0.15)",
      },
    },
  },
  plugins: [],
};
