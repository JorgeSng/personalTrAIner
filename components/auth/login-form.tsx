"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AUTH_GENERIC_ERROR, AUTH_NETWORK_ERROR } from "@/lib/auth/messages";
import { resolvePostAuthDestination } from "@/lib/onboarding/resolve-destination";
import { createClient } from "@/lib/supabase/client";
import { credentialsSchema } from "@/lib/validation/schemas/auth";

type FieldErrors = {
  email?: string;
  password?: string;
};

type Props = {
  nextPath: string;
};

export function LoginForm({ nextPath }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function resolveDestinationAfterAuth(): Promise<string> {
    try {
      const response = await fetch("/api/profile");
      if (!response.ok) {
        return resolvePostAuthDestination(false, nextPath);
      }
      const body = (await response.json()) as { data?: unknown };
      return resolvePostAuthDestination(body.data != null, nextPath);
    } catch {
      return resolvePostAuthDestination(false, nextPath);
    }
  }

  async function handleAuth(mode: "login" | "signup") {
    setFormError(null);

    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "email" || field === "password") {
          nextErrors[field] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const supabase = createClient();
      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword(parsed.data)
          : await supabase.auth.signUp(parsed.data);

      if (result.error || !result.data.session) {
        setFormError(AUTH_GENERIC_ERROR);
        return;
      }

      const destination = await resolveDestinationAfterAuth();
      router.replace(destination);
      router.refresh();
    } catch {
      setFormError(AUTH_NETWORK_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void handleAuth("login");
      }}
    >
      <label className="flex flex-col gap-1 text-sm text-zinc-700">
        Email
        <input
          autoComplete="email"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          value={email}
        />
        {fieldErrors.email ? (
          <span className="text-sm text-red-600">{fieldErrors.email}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-1 text-sm text-zinc-700">
        Contraseña
        <input
          autoComplete="current-password"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
        {fieldErrors.password ? (
          <span className="text-sm text-red-600">{fieldErrors.password}</span>
        ) : null}
      </label>

      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          disabled={submitting}
          type="submit"
        >
          Entrar
        </button>
        <button
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
          disabled={submitting}
          onClick={() => void handleAuth("signup")}
          type="button"
        >
          Crear cuenta
        </button>
      </div>
    </form>
  );
}
