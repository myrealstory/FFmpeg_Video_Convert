import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{html,js,ts,jsx,tsx}",
    "./components/**/*.{html,js,ts,jsx,tsx,mdx}",
    "./app/**/*.{html,js,ts,jsx,tsx}", // 如果使用 Next.js App Router
  ],
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
} satisfies Config;
