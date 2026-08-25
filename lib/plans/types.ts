import type { WorkoutPlanContent } from "@/lib/validation/schemas/workout-plan";

export type PlanStatus = "active" | "superseded";

export type PlanRow = {
  id: string;
  user_id: string;
  status: PlanStatus;
  week_label: string;
  content: WorkoutPlanContent;
  created_at: string;
  updated_at: string;
};

export type PlanGenerationProfile = {
  experience_level: string;
  training_days_per_week: number;
  equipment: string[];
  injuries_notes?: string | null;
};
