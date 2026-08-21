"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { HOME_PATH } from "@/lib/auth/paths";
import {
  buildEquipmentList,
  EQUIPMENT_PRESETS,
} from "@/lib/onboarding/equipment-presets";
import {
  ONBOARDING_CONFIG_ERROR,
  ONBOARDING_CONFLICT_ERROR,
  ONBOARDING_EQUIPMENT_REQUIRED,
  ONBOARDING_GENERIC_ERROR,
  ONBOARDING_NETWORK_ERROR,
  ONBOARDING_VALIDATION_ERROR,
} from "@/lib/onboarding/messages";
import {
  profileSchema,
  type ExperienceLevel,
} from "@/lib/validation/schemas/profile";

type FieldErrors = {
  experience_level?: string;
  training_days_per_week?: string;
  equipment?: string;
  injuries_notes?: string;
};

export function OnboardingForm() {
  const router = useRouter();
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "">(
    "",
  );
  const [trainingDays, setTrainingDays] = useState("3");
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [customEquipment, setCustomEquipment] = useState<string[]>([]);
  const [customDraft, setCustomDraft] = useState("");
  const [injuriesNotes, setInjuriesNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function togglePreset(value: string) {
    setSelectedPresets((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  function addCustomEquipment() {
    const trimmed = customDraft.trim();
    if (!trimmed) {
      return;
    }
    setCustomEquipment((current) =>
      current.includes(trimmed) ? current : [...current, trimmed],
    );
    setCustomDraft("");
  }

  function removeCustomEquipment(value: string) {
    setCustomEquipment((current) => current.filter((item) => item !== value));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setConflict(false);

    const equipment = buildEquipmentList(selectedPresets, customEquipment);
    if (equipment.length === 0) {
      setFieldErrors({ equipment: ONBOARDING_EQUIPMENT_REQUIRED });
      return;
    }

    const notes = injuriesNotes.trim();
    const payload = {
      experience_level: experienceLevel,
      training_days_per_week: Number(trainingDays),
      equipment,
      ...(notes ? { injuries_notes: notes } : {}),
    };

    const parsed = profileSchema.safeParse(payload);
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (
          field === "experience_level" ||
          field === "training_days_per_week" ||
          field === "equipment" ||
          field === "injuries_notes"
        ) {
          nextErrors[field] = issue.message;
        }
      }
      if (!nextErrors.equipment && equipment.length === 0) {
        nextErrors.equipment = ONBOARDING_EQUIPMENT_REQUIRED;
      }
      setFieldErrors(nextErrors);
      setFormError(ONBOARDING_VALIDATION_ERROR);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (response.status === 201) {
        router.replace(HOME_PATH);
        router.refresh();
        return;
      }

      let code: string | undefined;
      try {
        const body = (await response.json()) as {
          error?: { code?: string; message?: string };
        };
        code = body.error?.code;
      } catch {
        code = undefined;
      }

      if (response.status === 409 || code === "CONFLICT") {
        setConflict(true);
        setFormError(ONBOARDING_CONFLICT_ERROR);
        return;
      }

      if (response.status === 503 || code === "SUPABASE_NOT_CONFIGURED") {
        setFormError(ONBOARDING_CONFIG_ERROR);
        return;
      }

      if (response.status === 400 || code === "VALIDATION_ERROR") {
        setFormError(ONBOARDING_VALIDATION_ERROR);
        return;
      }

      setFormError(ONBOARDING_GENERIC_ERROR);
    } catch {
      setFormError(ONBOARDING_NETWORK_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={(event) => void handleSubmit(event)}>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-zinc-800">
          Nivel de experiencia
        </legend>
        <div className="flex flex-col gap-2">
          {(
            [
              ["beginner", "Principiante"],
              ["intermediate", "Intermedio"],
              ["advanced", "Avanzado"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex items-center gap-2 text-sm text-zinc-700"
            >
              <input
                checked={experienceLevel === value}
                name="experience_level"
                onChange={() => setExperienceLevel(value)}
                type="radio"
                value={value}
              />
              {label}
            </label>
          ))}
        </div>
        {fieldErrors.experience_level ? (
          <span className="text-sm text-red-600">
            {fieldErrors.experience_level}
          </span>
        ) : null}
      </fieldset>

      <label className="flex flex-col gap-1 text-sm text-zinc-700">
        Días de entrenamiento por semana
        <select
          className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
          name="training_days_per_week"
          onChange={(event) => setTrainingDays(event.target.value)}
          value={trainingDays}
        >
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
        {fieldErrors.training_days_per_week ? (
          <span className="text-sm text-red-600">
            {fieldErrors.training_days_per_week}
          </span>
        ) : null}
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-zinc-800">
          Material disponible
        </legend>
        <div className="flex flex-col gap-2">
          {EQUIPMENT_PRESETS.map((preset) => (
            <label
              key={preset.value}
              className="flex items-center gap-2 text-sm text-zinc-700"
            >
              <input
                checked={selectedPresets.includes(preset.value)}
                name="equipment_preset"
                onChange={() => togglePreset(preset.value)}
                type="checkbox"
              />
              {preset.label}
            </label>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap items-end gap-2">
          <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm text-zinc-700">
            Otro
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
              name="equipment_other"
              onChange={(event) => setCustomDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCustomEquipment();
                }
              }}
              type="text"
              value={customDraft}
            />
          </label>
          <button
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            onClick={addCustomEquipment}
            type="button"
          >
            Añadir
          </button>
        </div>

        {customEquipment.length > 0 ? (
          <ul className="flex flex-wrap gap-2 pt-1">
            {customEquipment.map((item) => (
              <li key={item}>
                <button
                  className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                  onClick={() => removeCustomEquipment(item)}
                  type="button"
                >
                  {item} ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {fieldErrors.equipment ? (
          <span className="text-sm text-red-600">{fieldErrors.equipment}</span>
        ) : null}
      </fieldset>

      <label className="flex flex-col gap-1 text-sm text-zinc-700">
        Lesiones o limitaciones (opcional)
        <textarea
          className="min-h-24 rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
          name="injuries_notes"
          onChange={(event) => setInjuriesNotes(event.target.value)}
          value={injuriesNotes}
        />
      </label>

      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

      {conflict ? (
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            onClick={() => {
              router.replace(HOME_PATH);
              router.refresh();
            }}
            type="button"
          >
            Ir al inicio
          </button>
          <button
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
            disabled={submitting}
            onClick={() => {
              void (async () => {
                setFormError(null);
                setConflict(false);
                try {
                  const response = await fetch("/api/profile");
                  const body = (await response.json()) as { data?: unknown };
                  if (body.data) {
                    router.replace(HOME_PATH);
                    router.refresh();
                  }
                } catch {
                  setFormError(ONBOARDING_NETWORK_ERROR);
                }
              })();
            }}
            type="button"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      <button
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        disabled={submitting}
        type="submit"
      >
        Guardar y continuar
      </button>
    </form>
  );
}
