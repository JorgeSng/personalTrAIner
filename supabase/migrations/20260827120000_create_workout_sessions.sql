-- SPEC-010: public.workout_sessions + public.workout_session_exercises
-- Granularity: one row per exercise logged in a session (not per set).
-- RLS on exercises via EXISTS to own session (no denormalized user_id).

CREATE TABLE public.workout_sessions (
  id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.workout_plans (id) ON DELETE RESTRICT,
  day_index int NOT NULL,
  performed_on date NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workout_sessions_day_index_check
    CHECK (day_index >= 1 AND day_index <= 7)
);

CREATE INDEX workout_sessions_user_performed_on_idx
  ON public.workout_sessions (user_id, performed_on DESC);

CREATE INDEX workout_sessions_plan_id_idx
  ON public.workout_sessions (plan_id);

CREATE TABLE public.workout_session_exercises (
  id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.workout_sessions (id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  exercise_order int NOT NULL,
  sets_completed int NOT NULL,
  weight_kg numeric,
  reps text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workout_session_exercises_exercise_order_check
    CHECK (exercise_order >= 0),
  CONSTRAINT workout_session_exercises_sets_completed_check
    CHECK (sets_completed >= 1),
  CONSTRAINT workout_session_exercises_weight_kg_check
    CHECK (weight_kg IS NULL OR weight_kg >= 0),
  CONSTRAINT workout_session_exercises_exercise_name_check
    CHECK (char_length(exercise_name) >= 1),
  CONSTRAINT workout_session_exercises_reps_check
    CHECK (char_length(reps) >= 1)
);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_session_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_sessions_select_own"
  ON public.workout_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "workout_sessions_insert_own"
  ON public.workout_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workout_sessions_update_own"
  ON public.workout_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Exercises: own-row via parent session (no user_id column on this table).
CREATE POLICY "workout_session_exercises_select_own"
  ON public.workout_session_exercises FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.workout_sessions s
      WHERE s.id = session_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "workout_session_exercises_insert_own"
  ON public.workout_session_exercises FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.workout_sessions s
      WHERE s.id = session_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "workout_session_exercises_update_own"
  ON public.workout_session_exercises FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.workout_sessions s
      WHERE s.id = session_id
        AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.workout_sessions s
      WHERE s.id = session_id
        AND s.user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.workout_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.workout_session_exercises TO authenticated;

CREATE OR REPLACE FUNCTION public.set_workout_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workout_sessions_set_updated_at
  BEFORE UPDATE ON public.workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_workout_sessions_updated_at();

CREATE OR REPLACE FUNCTION public.set_workout_session_exercises_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workout_session_exercises_set_updated_at
  BEFORE UPDATE ON public.workout_session_exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.set_workout_session_exercises_updated_at();
