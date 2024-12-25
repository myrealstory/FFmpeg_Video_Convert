import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,css,scss,mdx}", // 如果使用 Next.js App Router
    "./styles/**/*.{css,scss}", // 包括自定義 CSS 文件        // If you use public HTML files
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
