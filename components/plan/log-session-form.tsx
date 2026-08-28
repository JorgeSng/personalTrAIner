"use client";

import { useState } from "react";

import {
  buildSessionCreatePayload,
  getTodayLocalDateString,
  type LogSessionExerciseInput,
} from "@/lib/sessions/log-session-form-helpers";
import {
  SESSION_CANCEL_CTA,
  SESSION_HELP_COPY,
  SESSION_NETWORK_ERROR,
  SESSION_REGISTER_CTA,
  SESSION_REPS_PLACEHOLDER,
  SESSION_SAVE_CTA,
  SESSION_SUBMITTING_LABEL,
  SESSION_SUCCESS_COPY,
  sessionErrorMessage,
} from "@/lib/sessions/messages";

type PlanExercise = {
  name: string;
};

type Props = {
  planId: string;
  dayIndex: number;
  exercises: PlanExercise[];
};

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

function createInitialRows(exercises: PlanExercise[]): LogSessionExerciseInput[] {
  return exercises.map((exercise, index) => ({
    exerciseName: exercise.name,
    exerciseOrder: index,
    setsCompleted: "",
    weightKg: "",
    reps: "",
  }));
}

export function LogSessionForm({ planId, dayIndex, exercises }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [performedOn, setPerformedOn] = useState(() => getTodayLocalDateString());
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<LogSessionExerciseInput[]>(() =>
    createInitialRows(exercises),
  );

  const today = getTodayLocalDateString();

  function handleOpen() {
    setOpen(true);
    setSuccessMessage(null);
    setError(null);
    setPerformedOn(getTodayLocalDateString());
    setNotes("");
    setRows(createInitialRows(exercises));
  }

  function handleCancel() {
    setOpen(false);
    setError(null);
  }

  function updateRow(
    index: number,
    field: keyof Pick<
      LogSessionExerciseInput,
      "setsCompleted" | "weightKg" | "reps"
    >,
    value: string,
  ) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError(null);

    const result = buildSessionCreatePayload(planId, dayIndex, {
      performedOn,
      notes,
    }, rows);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.payload),
      });

      if (response.status === 201) {
        setOpen(false);
        setSuccessMessage(SESSION_SUCCESS_COPY);
        return;
      }

      let code: string | undefined;
      let message: string | undefined;

      try {
        const body = (await response.json()) as ApiErrorBody;
        code = body.error?.code;
        message = body.error?.message;
      } catch {
        code = undefined;
        message = undefined;
      }

      setError(sessionErrorMessage(code, message));
    } catch {
      setError(SESSION_NETWORK_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {successMessage ? (
        <p className="text-sm font-medium text-emerald-700" role="status">
          {successMessage}
        </p>
      ) : null}

      {!open ? (
        <button
          type="button"
          onClick={handleOpen}
          className="self-start rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
        >
          {SESSION_REGISTER_CTA}
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4"
          aria-label={`Registrar sesión día ${dayIndex}`}
        >
          <p className="text-sm text-zinc-600">{SESSION_HELP_COPY}</p>

          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            Fecha
            <input
              type="date"
              value={performedOn}
              max={today}
              onChange={(event) => setPerformedOn(event.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            Notas (opcional)
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
            />
          </label>

          <div className="flex flex-col gap-4">
            {rows.map((row, index) => (
              <fieldset
                key={`${row.exerciseName}-${row.exerciseOrder}`}
                className="flex flex-col gap-2 border-t border-zinc-200 pt-3 first:border-t-0 first:pt-0"
              >
                <legend className="text-sm font-medium text-zinc-900">
                  {row.exerciseName}
                </legend>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="flex flex-col gap-1 text-sm text-zinc-700">
                    Series hechas
                    <input
                      type="number"
                      min={1}
                      step={1}
                      inputMode="numeric"
                      value={row.setsCompleted}
                      onChange={(event) =>
                        updateRow(index, "setsCompleted", event.target.value)
                      }
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-zinc-700">
                    Peso (kg)
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      inputMode="decimal"
                      value={row.weightKg}
                      onChange={(event) =>
                        updateRow(index, "weightKg", event.target.value)
                      }
                      placeholder="Peso corporal"
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-zinc-700">
                    Reps
                    <input
                      type="text"
                      value={row.reps}
                      onChange={(event) =>
                        updateRow(index, "reps", event.target.value)
                      }
                      placeholder={SESSION_REPS_PLACEHOLDER}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
                    />
                  </label>
                </div>
              </fieldset>
            ))}
          </div>

          {error ? (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? SESSION_SUBMITTING_LABEL : SESSION_SAVE_CTA}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {SESSION_CANCEL_CTA}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
