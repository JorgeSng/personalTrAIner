import { LoginForm } from "@/components/auth/login-form";
import { sanitizeNextPath } from "@/lib/auth/safe-next";
import { getSupabasePublicEnv } from "@/lib/config/env";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = sanitizeNextPath(params.next);
  const supabaseConfigured = Boolean(getSupabasePublicEnv());

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium text-zinc-500">MVP personal · SDD</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
          Iniciar sesión
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Entra o crea la cuenta con email y contraseña.
        </p>
      </div>

      {supabaseConfigured ? (
        <LoginForm nextPath={nextPath} />
      ) : (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Supabase no está configurado. Define NEXT_PUBLIC_SUPABASE_URL y
          NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local (ver .env.example).
        </p>
      )}
    </main>
  );
}
