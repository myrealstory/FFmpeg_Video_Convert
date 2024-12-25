import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { LocaleKeysType, locales } from "../i18n";
import "@/styles/globals.css";

const openSans = Open_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export type LayoutProps = {
  params: Promise<{ lang: LocaleKeysType }>;
  children: React.ReactNode;
};

export async function generateStaticParams() {
  const supportedLocales = ["en", "tc"];
  return supportedLocales.map((lang) => ({ lang }));
}

export default async function RootLayout({ children, params }: LayoutProps) {
  const { lang } = await params;

  if (!locales.includes(lang)) {
    throw new Error(`Unsupported language: ${lang}`);
  }

  return (
    <html lang={lang}>
      <head>
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1, maximum-scale=1"
        />
      </head>
      <body className={`${openSans.className} bg-white bg-opacity-30 relative`}>
        {children}
      </body>
    </html>
  );
}
