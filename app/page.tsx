import Link from "next/link";

import { getGeminiApiKey, getSupabasePublicEnv } from "@/lib/config/env";

export default function Home() {
  const supabaseConfigured = Boolean(getSupabasePublicEnv());
  const geminiConfigured = Boolean(getGeminiApiKey());

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium text-zinc-500">MVP personal · SDD</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-900">
          personalTrAIner
        </h1>
        <p className="mt-3 text-lg text-zinc-600">
          Entrenador con IA para recomposición corporal. Perfil y plan se configuran al
          usar la app — no en el código.
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
        <h2 className="font-medium text-zinc-900">Integraciones (local)</h2>
        <ul className="mt-2 space-y-1">
          <li>Supabase: {supabaseConfigured ? "configurado" : "pendiente (.env.local)"}</li>
          <li>Gemini: {geminiConfigured ? "configurado" : "pendiente (.env.local)"}</li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800"
          href="/api/health"
        >
          GET /api/health
        </Link>
        <span className="self-center text-zinc-500">POST /api/plan/generate (stub)</span>
      </div>
    </main>
  );
}
