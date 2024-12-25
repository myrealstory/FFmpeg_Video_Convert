// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,tsx,jsx}"],
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
  plugins: [],
};

export default config;