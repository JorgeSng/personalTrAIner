import { HOME_PATH, ONBOARDING_PATH } from "@/lib/auth/paths";
import { sanitizeNextPath } from "@/lib/auth/safe-next";

export function resolvePostAuthDestination(
  hasProfile: boolean,
  nextPath?: string | null,
): string {
  if (!hasProfile) {
    return ONBOARDING_PATH;
  }

  return sanitizeNextPath(nextPath);
}

export function resolveProfileGateRedirect(input: {
  pathname: string;
  hasProfile: boolean;
}): string | null {
  const { pathname, hasProfile } = input;

  if (!hasProfile && pathname === HOME_PATH) {
    return ONBOARDING_PATH;
  }

  if (hasProfile && pathname === ONBOARDING_PATH) {
    return HOME_PATH;
  }

  return null;
}
