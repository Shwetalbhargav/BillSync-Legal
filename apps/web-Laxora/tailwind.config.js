/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F8F5EF",
        app: "#F8F5EF",
        panel: "#FFFFFF",
        nav: "#0B1F3A",
        primary: "#123B63",
        primaryStrong: "#002546",
        accent: "#C9A227",
        accentSoft: "#FFE08E",
        ink: "#1F2933",
        muted: "#6B7280",
        border: "#E5E7EB",
        blueLine: "#D9E3F1",
        blueSoft: "#EDF4FF",
        success: "#15803D",
        warning: "#D97706",
        danger: "#B91C1C",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(31, 41, 51, 0.07)",
      },
    },
  },
  plugins: [],
};
