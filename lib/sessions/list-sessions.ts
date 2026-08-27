import { HttpError } from "@/lib/errors/http-error";
import { mapSessionSummary } from "@/lib/sessions/map-session";
import type { SessionSummary } from "@/lib/sessions/types";
import { createClient } from "@/lib/supabase/server";

export type ListSessionsOptions = {
  plan_id?: string;
  limit: number;
};

export async function listSessions(
  userId: string,
  options: ListSessionsOptions,
): Promise<SessionSummary[]> {
  const supabase = await createClient();

  let query = supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId);

  if (options.plan_id) {
    query = query.eq("plan_id", options.plan_id);
  }

  const { data, error } = await query
    .order("performed_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(options.limit);

  if (error) {
    throw new HttpError(
      500,
      "INTERNAL_ERROR",
      "Unexpected error while listing workout sessions.",
    );
  }

  return (data ?? []).map(mapSessionSummary);
}
