import { sanitizeNextPath } from "@/lib/auth/safe-next";

export const LOGIN_PATH = "/login";
export const HOME_PATH = "/";
export const ONBOARDING_PATH = "/onboarding";
export const PLAN_PATH = "/plan";

export function buildLoginRedirect(pathname: string): string {
  const next = sanitizeNextPath(pathname);
  return `${LOGIN_PATH}?next=${encodeURIComponent(next)}`;
}

export function resolvePageRedirect(input: {
  pathname: string;
  hasUser: boolean;
}): string | null {
  const { pathname, hasUser } = input;

  if (pathname.startsWith("/api/")) {
    return null;
  }

  if (!hasUser && pathname !== LOGIN_PATH) {
    return buildLoginRedirect(pathname);
  }

  if (hasUser && pathname === LOGIN_PATH) {
    return HOME_PATH;
  }

  return null;
}
