import { NextRequest, NextResponse } from "next/server";
import acceptLanguage from "accept-language";
import { cookieName, defaultLocale, LocaleKeysType, locales } from "./src/app/i18n";

acceptLanguage.languages(locales);

export const config = {
  // matcher: '/:lng*'
  matcher: ["/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js).*)"],
};

export function middleware(req: NextRequest) {
  let lng;

  if (req.cookies.has(cookieName))
    lng = acceptLanguage.get(req.cookies.get(cookieName)!.value);
  if (!lng) lng = acceptLanguage.get(req.headers.get("Accept-Language"));
  if (!lng) lng = defaultLocale;

  // Skip redirection if path already starts with a valid locale
const pathname = req.nextUrl.pathname;

const alreadyHasLocale = locales.some((loc: LocaleKeysType) =>
  pathname.startsWith(`/${loc}`)
);


// 5. 如果沒有語言代碼且路徑不屬於系統文件，重導向到帶語言的 URL
if (!alreadyHasLocale && !pathname.startsWith("/_next")) {
  const newUrl = new URL(`/${lng}${pathname}`, req.url);
  // 防止語言重複加入
  return NextResponse.redirect(newUrl);
}

  if (req.headers.has("referer")) {
    const refererUrl = new URL(req.headers.get("referer")!);
    const lngInReferer = locales.find((l) =>
      refererUrl.pathname.startsWith(`/${l}`)
    );

    const response = NextResponse.next();


     // Only update the cookie if the locale from the referer is valid
  if (lngInReferer) {
    response.cookies.set(cookieName, lngInReferer);
  }
    return response;
  }

  return NextResponse.next();
}