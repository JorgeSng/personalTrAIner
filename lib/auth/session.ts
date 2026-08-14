import type { User } from "@supabase/supabase-js";

import { getMissingSupabaseEnvMessage } from "@/lib/config/env";
import { HttpError } from "@/lib/errors/http-error";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function getUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function requireUser(): Promise<User> {
  if (!isSupabaseConfigured()) {
    throw new HttpError(503, "SUPABASE_NOT_CONFIGURED", getMissingSupabaseEnvMessage());
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new HttpError(401, "UNAUTHORIZED", "Authentication required.");
  }

  return data.user;
}
