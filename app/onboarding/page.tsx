import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { buildLoginRedirect, ONBOARDING_PATH } from "@/lib/auth/paths";
import { getUser } from "@/lib/auth/session";
import { getSupabasePublicEnv } from "@/lib/config/env";
import { hasSessionProfile } from "@/lib/onboarding/get-session-profile";
import { ONBOARDING_CONFIG_ERROR } from "@/lib/onboarding/messages";
import { resolveProfileGateRedirect } from "@/lib/onboarding/resolve-destination";

export default async function OnboardingPage() {
  const user = await getUser();

  if (!user) {
    redirect(buildLoginRedirect(ONBOARDING_PATH));
  }

  const hasProfile = await hasSessionProfile();
  const gateRedirect = resolveProfileGateRedirect({
    pathname: ONBOARDING_PATH,
    hasProfile,
  });

  if (gateRedirect) {
    redirect(gateRedirect);
  }

  const supabaseConfigured = Boolean(getSupabasePublicEnv());

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium text-zinc-500">MVP personal · SDD</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
          Onboarding
        </h1>
        <p className="mt-2 text-sm text-zinc-600">Cuéntanos cómo entrenas</p>
      </div>

      {supabaseConfigured ? (
        <OnboardingForm />
      ) : (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {ONBOARDING_CONFIG_ERROR}
        </p>
      )}
    </main>
  );
}
