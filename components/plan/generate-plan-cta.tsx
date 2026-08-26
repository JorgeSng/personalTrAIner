"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  PLAN_GENERATING_LABEL,
  PLAN_NETWORK_ERROR,
  planGenerateErrorMessage,
} from "@/lib/plans/messages";

type Props = {
  hasPlan: boolean;
};

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

export function GeneratePlanCta({ hasPlan }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });

      if (response.status === 201) {
        router.refresh();
        return;
      }

      let code: string | undefined;
      try {
        const body = (await response.json()) as ApiErrorBody;
        code = body.error?.code;
      } catch {
        code = undefined;
      }

      setError(planGenerateErrorMessage(code));
    } catch {
      setError(PLAN_NETWORK_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  const label = hasPlan ? "Regenerar plan" : "Generar plan";

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? PLAN_GENERATING_LABEL : label}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
