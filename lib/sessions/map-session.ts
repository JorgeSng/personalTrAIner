import type {
  SessionExercise,
  SessionSummary,
} from "@/lib/sessions/types";

type SessionRow = {
  id: string;
  user_id: string;
  plan_id: string;
  day_index: number;
  performed_on: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type ExerciseRow = {
  id: string;
  session_id: string;
  exercise_name: string;
  exercise_order: number;
  sets_completed: number;
  weight_kg: number | string | null;
  reps: string;
  created_at: string;
  updated_at: string;
};

export function mapSessionSummary(row: SessionRow): SessionSummary {
  return {
    id: row.id,
    user_id: row.user_id,
    plan_id: row.plan_id,
    day_index: row.day_index,
    performed_on: row.performed_on,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapSessionExercise(row: ExerciseRow): SessionExercise {
  return {
    id: row.id,
    session_id: row.session_id,
    exercise_name: row.exercise_name,
    exercise_order: row.exercise_order,
    sets_completed: row.sets_completed,
    weight_kg: row.weight_kg == null ? null : Number(row.weight_kg),
    reps: row.reps,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
