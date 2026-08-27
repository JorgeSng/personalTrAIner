import { HttpError } from "@/lib/errors/http-error";
import {
  mapSessionExercise,
  mapSessionSummary,
} from "@/lib/sessions/map-session";
import type { SessionDetail } from "@/lib/sessions/types";
import { createClient } from "@/lib/supabase/server";

export async function getSessionById(
  userId: string,
  sessionId: string,
): Promise<SessionDetail> {
  const supabase = await createClient();

  const { data: sessionRow, error: sessionError } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (sessionError) {
    throw new HttpError(
      500,
      "INTERNAL_ERROR",
      "Unexpected error while reading workout session.",
    );
  }

  if (!sessionRow) {
    throw new HttpError(404, "SESSION_NOT_FOUND", "Workout session not found.");
  }

  const { data: exerciseRows, error: exercisesError } = await supabase
    .from("workout_session_exercises")
    .select("*")
    .eq("session_id", sessionId)
    .order("exercise_order", { ascending: true });

  if (exercisesError) {
    throw new HttpError(
      500,
      "INTERNAL_ERROR",
      "Unexpected error while reading workout session exercises.",
    );
  }

  return {
    ...mapSessionSummary(sessionRow),
    exercises: (exerciseRows ?? []).map(mapSessionExercise),
  };
}
