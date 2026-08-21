import { getUser } from "@/lib/auth/session";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function getSessionProfile(): Promise<Record<string, unknown> | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const user = await getUser();
  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("Unexpected error while reading profile for gate.");
  }

  return data;
}

export async function hasSessionProfile(): Promise<boolean> {
  const profile = await getSessionProfile();
  return profile !== null;
}
