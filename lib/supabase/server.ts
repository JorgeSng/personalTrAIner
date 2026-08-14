import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import {
  getMissingSupabaseEnvMessage,
  getSupabasePublicEnv,
} from "@/lib/config/env";
import { HttpError } from "@/lib/errors/http-error";

export async function createClient() {
  const env = getSupabasePublicEnv();

  if (!env) {
    throw new HttpError(503, "SUPABASE_NOT_CONFIGURED", getMissingSupabaseEnvMessage());
  }

  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component without mutable cookies — safe to ignore.
        }
      },
    },
  });
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicEnv() !== null;
}
