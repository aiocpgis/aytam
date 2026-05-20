/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Tajawal", "system-ui", "sans-serif"],
      },
      colors: {
        charity: {
          ink: "#0F172A",
          blue: "#2563EB",
          cyan: "#06B6D4",
          mint: "#10B981",
          warm: "#F59E0B",
          soft: "#F8FAFC"
        }
      },
      boxShadow: {
        glass: "0 24px 80px rgba(15, 23, 42, 0.14)",
        soft: "0 14px 40px rgba(37, 99, 235, 0.12)"
      }
    },
  },
  plugins: [],
};
