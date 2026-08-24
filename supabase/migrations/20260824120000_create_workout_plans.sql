-- SPEC-006: public.workout_plans (0..N per auth.users; ≤1 active)

CREATE TABLE public.workout_plans (
  id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  status text NOT NULL,
  week_label text NOT NULL,
  content jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workout_plans_status_check
    CHECK (status IN ('active', 'superseded'))
);

CREATE UNIQUE INDEX workout_plans_one_active_per_user
  ON public.workout_plans (user_id)
  WHERE status = 'active';

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_plans_select_own"
  ON public.workout_plans FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "workout_plans_insert_own"
  ON public.workout_plans FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workout_plans_update_own"
  ON public.workout_plans FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.workout_plans TO authenticated;

CREATE OR REPLACE FUNCTION public.set_workout_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workout_plans_set_updated_at
  BEFORE UPDATE ON public.workout_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.set_workout_plans_updated_at();
