import { createBrowserClient } from "@supabase/ssr";

import {
  getMissingSupabaseEnvMessage,
  getSupabasePublicEnv,
} from "@/lib/config/env";
import { HttpError } from "@/lib/errors/http-error";

export function createClient() {
  const env = getSupabasePublicEnv();

  if (!env) {
    throw new HttpError(503, "SUPABASE_NOT_CONFIGURED", getMissingSupabaseEnvMessage());
  }

  return createBrowserClient(env.url, env.anonKey);
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicEnv() !== null;
}
