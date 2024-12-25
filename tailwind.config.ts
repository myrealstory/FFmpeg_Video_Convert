import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // 包括動態路由的所有文件
    "./pages/**/*.{js,ts,jsx,tsx}",  // 傳統 Pages Router 的文件
    "./components/**/*.{js,ts,jsx,tsx}", // 組件文件
    "./styles/**/*.{css,scss}",      // 自定義樣式文件
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
};

export default config;
