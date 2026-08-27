import { HttpError } from "@/lib/errors/http-error";
import {
  mapSessionExercise,
  mapSessionSummary,
} from "@/lib/sessions/map-session";
import type { SessionDetail } from "@/lib/sessions/types";
import { createClient } from "@/lib/supabase/server";
import type { WorkoutSessionCreate } from "@/lib/validation/schemas/workout-session";

export async function createSession(
  userId: string,
  input: WorkoutSessionCreate,
): Promise<SessionDetail> {
  const supabase = await createClient();

  const { data: plan, error: planError } = await supabase
    .from("workout_plans")
    .select("id")
    .eq("id", input.plan_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (planError) {
    throw new HttpError(
      500,
      "INTERNAL_ERROR",
      "Unexpected error while verifying workout plan ownership.",
    );
  }

  if (!plan) {
    throw new HttpError(404, "PLAN_NOT_FOUND", "Workout plan not found.");
  }

  const { data: sessionRow, error: sessionError } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: userId,
      plan_id: input.plan_id,
      day_index: input.day_index,
      performed_on: input.performed_on,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();

  if (sessionError || !sessionRow) {
    throw new HttpError(
      500,
      "INTERNAL_ERROR",
      "Unexpected error while creating workout session.",
    );
  }

  const exercisePayload = input.exercises.map((exercise) => ({
    session_id: sessionRow.id as string,
    exercise_name: exercise.exercise_name,
    exercise_order: exercise.exercise_order,
    sets_completed: exercise.sets_completed,
    weight_kg: exercise.weight_kg ?? null,
    reps: exercise.reps,
  }));

  const { data: exerciseRows, error: exercisesError } = await supabase
    .from("workout_session_exercises")
    .insert(exercisePayload)
    .select("*")
    .order("exercise_order", { ascending: true });

  if (exercisesError || !exerciseRows) {
    throw new HttpError(
      500,
      "INTERNAL_ERROR",
      "Unexpected error while creating workout session exercises.",
    );
  }

  return {
    ...mapSessionSummary(sessionRow),
    exercises: exerciseRows.map(mapSessionExercise),
  };
}
