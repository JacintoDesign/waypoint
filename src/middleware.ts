import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

function isAuthoringRoute(pathname: string): boolean {
  return pathname === "/guides" || pathname.startsWith("/guides/");
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (isAuthoringRoute(pathname) && !user) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/sign-in";
    signInUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (pathname === "/sign-in" && user) {
    const guidesUrl = request.nextUrl.clone();
    guidesUrl.pathname = "/guides";
    guidesUrl.search = "";
    return NextResponse.redirect(guidesUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json)$).*)",
  ],
};
