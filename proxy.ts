import { NextResponse, type NextRequest } from "next/server";

import { resolvePageRedirect } from "@/lib/auth/paths";
import { copyCookies, updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { user, response } = await updateSession(request);
  const redirectTo = resolvePageRedirect({
    pathname: request.nextUrl.pathname,
    hasUser: Boolean(user),
  });

  if (!redirectTo) {
    return response;
  }

  const redirectResponse = NextResponse.redirect(new URL(redirectTo, request.url));
  return copyCookies(response, redirectResponse);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
