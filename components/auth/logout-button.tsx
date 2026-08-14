"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { LOGIN_PATH } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleLogout() {
    setSubmitting(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace(LOGIN_PATH);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <button
      className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
      disabled={submitting}
      onClick={() => void handleLogout()}
      type="button"
    >
      Cerrar sesión
    </button>
  );
}
