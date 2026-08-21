import { redirect } from "next/navigation";

import { HomeShell } from "@/components/auth/home-shell";
import { buildLoginRedirect, HOME_PATH } from "@/lib/auth/paths";
import { getUser } from "@/lib/auth/session";
import { hasSessionProfile } from "@/lib/onboarding/get-session-profile";
import { resolveProfileGateRedirect } from "@/lib/onboarding/resolve-destination";

export default async function Home() {
  const user = await getUser();

  if (!user) {
    redirect(buildLoginRedirect(HOME_PATH));
  }

  const hasProfile = await hasSessionProfile();
  const gateRedirect = resolveProfileGateRedirect({
    pathname: HOME_PATH,
    hasProfile,
  });

  if (gateRedirect) {
    redirect(gateRedirect);
  }

  return <HomeShell email={user.email ?? user.id} />;
}
