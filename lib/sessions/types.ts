export type SessionSummary = {
  id: string;
  user_id: string;
  plan_id: string;
  day_index: number;
  performed_on: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SessionExercise = {
  id: string;
  session_id: string;
  exercise_name: string;
  exercise_order: number;
  sets_completed: number;
  weight_kg: number | null;
  reps: string;
  created_at: string;
  updated_at: string;
};

export type SessionDetail = SessionSummary & {
  exercises: SessionExercise[];
};
