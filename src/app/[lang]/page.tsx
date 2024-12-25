import { LocaleKeysType, useTranslation } from "../i18n";
import { notFound } from "next/navigation";
import { InputBox } from "./InputBox";
import { VideoEditor } from "../../components/VideoEditor";

export type PageProps = {
  params: Promise<{
    lang: LocaleKeysType;
  }>;
};

export default async function Home({ params }: PageProps) {

  const { lang } = await params;
  const supportedLocales = ["en", "tc"]; // List of supported languages

  if (!supportedLocales.includes(lang)) {
    notFound(); // Returns a 404 page for unsupported languages
    // return <main>Your page content here for lang: {lang}</main>;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const {translate: t} = await useTranslation(lang);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
      <h1 className="text-3xl font-bold mb-2">
        {t("HomePage.welcome")}
      </h1>
      <p className='mb-6'>{t("HomePage.currentLang")}<span className='font-semibold text-lg uppercase'>{" - "}{lang}</span></p>
      <InputBox lang={lang} />
      <VideoEditor lang={lang}/>
      </main>
      
    </div>
  );
}
