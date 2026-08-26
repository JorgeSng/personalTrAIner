import { coerceLoadmuscleUrls } from "@/lib/plans/coerce-loadmuscle-urls";
import { enrichLoadmuscleUrls } from "@/lib/plans/enrich-loadmuscle-urls";
import {
  workoutPlanContentSchema,
  type WorkoutPlanContent,
} from "@/lib/validation/schemas/workout-plan";

export type ParsePlanContentResult =
  | { ok: true; data: WorkoutPlanContent }
  | { ok: false; reason: string };

export function parsePlanContent(
  raw: unknown,
  trainingDaysPerWeek: number,
): ParsePlanContentResult {
  const coerced = coerceLoadmuscleUrls(raw);
  const enriched = enrichLoadmuscleUrls(coerced);
  const parsed = workoutPlanContentSchema.safeParse(enriched);

  if (!parsed.success) {
    return {
      ok: false,
      reason: parsed.error.issues[0]?.message ?? "Invalid workout plan content.",
    };
  }

  if (parsed.data.days.length !== trainingDaysPerWeek) {
    return {
      ok: false,
      reason: `Expected ${trainingDaysPerWeek} days, got ${parsed.data.days.length}.`,
    };
  }

  return { ok: true, data: parsed.data };
}
