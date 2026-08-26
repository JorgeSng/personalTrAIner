import { redirect } from "next/navigation";

import { GeneratePlanCta } from "@/components/plan/generate-plan-cta";
import { PlanPanel } from "@/components/plan/plan-panel";
import { buildLoginRedirect, PLAN_PATH } from "@/lib/auth/paths";
import { getUser } from "@/lib/auth/session";
import { hasSessionProfile } from "@/lib/onboarding/get-session-profile";
import { resolveProfileGateRedirect } from "@/lib/onboarding/resolve-destination";
import { getActivePlan } from "@/lib/plans/get-active-plan";

export default async function PlanPage() {
  const user = await getUser();

  if (!user) {
    redirect(buildLoginRedirect(PLAN_PATH));
  }

  const hasProfile = await hasSessionProfile();
  const gateRedirect = resolveProfileGateRedirect({
    pathname: PLAN_PATH,
    hasProfile,
  });

  if (gateRedirect) {
    redirect(gateRedirect);
  }

  const plan = await getActivePlan(user.id);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-16">
      <div>
        <p className="text-sm font-medium text-zinc-500">MVP personal · SDD</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
          Tu plan
        </h1>
      </div>

      <PlanPanel plan={plan} />
      <GeneratePlanCta hasPlan={Boolean(plan)} />
    </main>
  );
}
