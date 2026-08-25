import { HttpError } from "@/lib/errors/http-error";
import { createClient } from "@/lib/supabase/server";
import type { PlanRow } from "@/lib/plans/types";

export async function getActivePlan(userId: string): Promise<PlanRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workout_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new HttpError(
      500,
      "INTERNAL_ERROR",
      "Unexpected error while reading active workout plan.",
    );
  }

  return (data as PlanRow | null) ?? null;
}
