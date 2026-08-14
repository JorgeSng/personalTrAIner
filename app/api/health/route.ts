import { NextResponse } from "next/server";

import { getGeminiApiKey, getSupabasePublicEnv } from "@/lib/config/env";

export async function GET() {
  const supabase = getSupabasePublicEnv();
  const gemini = getGeminiApiKey();

  return NextResponse.json({
    status: "ok",
    service: "personaltrainer",
    integrations: {
      supabase: supabase ? "configured" : "missing",
      gemini: gemini ? "configured" : "missing",
    },
  });
}
