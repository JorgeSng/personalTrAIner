-- SPEC-003: public.profiles (1:1 with auth.users)

CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  experience_level text NOT NULL,
  training_days_per_week smallint NOT NULL,
  equipment text[] NOT NULL,
  injuries_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_experience_level_check
    CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  CONSTRAINT profiles_training_days_per_week_check
    CHECK (training_days_per_week >= 1 AND training_days_per_week <= 7),
  CONSTRAINT profiles_equipment_check
    CHECK (cardinality(equipment) > 0)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_profiles_updated_at();
