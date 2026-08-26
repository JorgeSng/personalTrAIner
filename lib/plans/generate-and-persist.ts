import { generateWorkoutPlanJson } from "@/lib/ai/gemini";
import { HttpError } from "@/lib/errors/http-error";
import {
  getPreferredCatalogExerciseNames,
  planHasMissingLoadmuscleUrl,
} from "@/lib/plans/loadmuscle-catalog";
import { parsePlanContent } from "@/lib/plans/parse-plan-content";
import type { PlanGenerationProfile, PlanRow } from "@/lib/plans/types";
import { createClient } from "@/lib/supabase/server";
import type { WorkoutPlanContent } from "@/lib/validation/schemas/workout-plan";

function isUniqueViolation(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  return (
    error.code === "23505" ||
    /duplicate key|unique constraint/i.test(error.message ?? "")
  );
}

async function loadProfile(
  userId: string,
): Promise<PlanGenerationProfile & { user_id: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "user_id, experience_level, training_days_per_week, equipment, injuries_notes",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new HttpError(
      500,
      "INTERNAL_ERROR",
      "Unexpected error while reading profile.",
    );
  }

  if (!data) {
    throw new HttpError(
      404,
      "PROFILE_REQUIRED",
      "Profile is required before generating a plan.",
    );
  }

  return data as PlanGenerationProfile & { user_id: string };
}

async function supersedeActiveAndInsert(
  userId: string,
  content: WorkoutPlanContent,
): Promise<PlanRow> {
  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from("workout_plans")
    .update({ status: "superseded" })
    .eq("user_id", userId)
    .eq("status", "active");

  if (updateError) {
    throw new HttpError(
      500,
      "INTERNAL_ERROR",
      "Unexpected error while superseding the previous workout plan.",
    );
  }

  const { data, error } = await supabase
    .from("workout_plans")
    .insert({
      user_id: userId,
      status: "active",
      week_label: content.week_label,
      content,
    })
    .select("*")
    .single();

  if (isUniqueViolation(error)) {
    throw new HttpError(
      409,
      "CONFLICT",
      "Could not activate the new workout plan due to a concurrent update.",
    );
  }

  if (error || !data) {
    throw new HttpError(
      500,
      "INTERNAL_ERROR",
      "Unexpected error while saving the workout plan.",
    );
  }

  return data as PlanRow;
}

async function persistWithRetry(
  userId: string,
  content: WorkoutPlanContent,
): Promise<PlanRow> {
  try {
    return await supersedeActiveAndInsert(userId, content);
  } catch (error) {
    if (error instanceof HttpError && error.code === "CONFLICT") {
      return await supersedeActiveAndInsert(userId, content);
    }
    throw error;
  }
}

function buildSchemaCorrectiveHint(
  profile: PlanGenerationProfile,
  reason: string,
): string {
  return [
    `The previous JSON was invalid: ${reason}`,
    `Return valid JSON with exactly ${profile.training_days_per_week} days.`,
    "Each day needs at least one exercise with name, sets (int), reps (string),",
    "rest_between_sets_sec (int >= 0), and rest_after_exercise_sec (int >= 0).",
    "All visible strings (week_label, labels, names, notes) must be in Spanish.",
    "loadmuscle_url must be an https LoadMuscle URL or null; do not invent URLs.",
  ].join(" ");
}

function buildCatalogNamesCorrectiveHint(): string {
  return [
    "Some exercise names could not be matched to LoadMuscle technique links.",
    "Rename each exercise to the closest equivalent from this preferred list (use the exact wording when possible):",
    getPreferredCatalogExerciseNames().join("; "),
    "Keep Spanish labels/notes and required rest fields. Prefer null for loadmuscle_url; do not invent URLs.",
  ].join(" ");
}

async function generateValidatedContent(
  profile: PlanGenerationProfile,
): Promise<WorkoutPlanContent> {
  const firstRaw = await generateWorkoutPlanJson(profile);
  let parsed = parsePlanContent(firstRaw, profile.training_days_per_week);

  if (!parsed.ok) {
    const secondRaw = await generateWorkoutPlanJson(profile, {
      correctiveHint: buildSchemaCorrectiveHint(profile, parsed.reason),
    });
    parsed = parsePlanContent(secondRaw, profile.training_days_per_week);

    if (!parsed.ok) {
      throw new HttpError(
        502,
        "GEMINI_INVALID_PLAN",
        "Gemini returned an invalid workout plan after retry.",
      );
    }
  }

  // Opción 3: si tras exacto+flexible aún faltan URLs, reintentar con nombres del catálogo.
  if (planHasMissingLoadmuscleUrl(parsed.data)) {
    const catalogRaw = await generateWorkoutPlanJson(profile, {
      correctiveHint: buildCatalogNamesCorrectiveHint(),
    });
    const catalogParsed = parsePlanContent(
      catalogRaw,
      profile.training_days_per_week,
    );

    if (catalogParsed.ok) {
      return catalogParsed.data;
    }
  }

  return parsed.data;
}

export async function generateAndPersistPlan(userId: string): Promise<PlanRow> {
  const profile = await loadProfile(userId);
  const content = await generateValidatedContent(profile);
  return persistWithRetry(userId, content);
}
