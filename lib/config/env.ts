import { z } from "zod";

const supabasePublicEnvSchema = z.object({
  url: z.string().url(),
  anonKey: z.string().min(1),
});

export type SupabasePublicEnv = z.infer<typeof supabasePublicEnvSchema>;

export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  const parsed = supabasePublicEnvSchema.safeParse({ url, anonKey });
  return parsed.success ? parsed.data : null;
}

export function getGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY;
  return key && key.length > 0 ? key : null;
}

export function getMissingSupabaseEnvMessage(): string {
  return (
    "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
    "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.example)."
  );
}

export function getMissingGeminiEnvMessage(): string {
  return "GEMINI_API_KEY is not configured. See .env.example.";
}
