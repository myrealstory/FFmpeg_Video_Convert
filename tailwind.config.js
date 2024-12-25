/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,tsx,jsx}"],
  theme: {
    theme: {
      extend: {
        colors: {
          background: "var(--background)",
          foreground: "var(--foreground)",
          gray: "#e4e3e3",
          primaryDark: "#1a202c",
        },
      },
    },
  },
  plugins: [],
}

