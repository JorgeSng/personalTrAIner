import { PlanDays } from "@/components/plan/plan-days";
import { PLAN_EMPTY_COPY } from "@/lib/plans/messages";
import type { PlanRow } from "@/lib/plans/types";

type Props = {
  plan: PlanRow | null;
};

export function PlanPanel({ plan }: Props) {
  if (!plan) {
    return <p className="text-sm text-zinc-600">{PLAN_EMPTY_COPY}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
        {plan.week_label}
      </h2>
      <PlanDays planId={plan.id} days={plan.content.days} />
    </div>
  );
}
