import {
  isCuratedLoadmuscleUrl,
  lookupLoadmuscleUrl,
  normalizeExerciseName,
} from "@/lib/plans/loadmuscle-catalog";

export { normalizeExerciseName, isCuratedLoadmuscleUrl };

/**
 * Post-coerce (SPEC-009 D1, sin inventar):
 * 1) Si loadmuscle_url está en el catálogo curado → se mantiene.
 * 2) Si no → match exacto por nombre/alias → URL del catálogo.
 * 3) Sin match → null («Técnica pendiente»).
 */
export function enrichLoadmuscleUrls(raw: unknown): unknown {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return raw;
  }

  const root = raw as Record<string, unknown>;
  const days = root.days;

  if (!Array.isArray(days)) {
    return raw;
  }

  return {
    ...root,
    days: days.map((day) => {
      if (day === null || typeof day !== "object" || Array.isArray(day)) {
        return day;
      }

      const dayObj = day as Record<string, unknown>;
      const exercises = dayObj.exercises;

      if (!Array.isArray(exercises)) {
        return day;
      }

      return {
        ...dayObj,
        exercises: exercises.map((exercise) => {
          if (
            exercise === null ||
            typeof exercise !== "object" ||
            Array.isArray(exercise)
          ) {
            return exercise;
          }

          const ex = exercise as Record<string, unknown>;
          const currentUrl = ex.loadmuscle_url;

          if (isCuratedLoadmuscleUrl(currentUrl)) {
            // Normalizar a la forma canónica del catálogo (sin www).
            const url = new URL(currentUrl);
            const normalized = `https://loadmuscle.com${url.pathname.replace(/\/$/, "")}`;
            return { ...ex, loadmuscle_url: normalized };
          }

          const name = typeof ex.name === "string" ? ex.name : "";
          const fromCatalog = name ? lookupLoadmuscleUrl(name) : null;

          return {
            ...ex,
            loadmuscle_url: fromCatalog,
          };
        }),
      };
    }),
  };
}

/** @deprecated usar isCuratedLoadmuscleUrl — se mantiene alias de tests antiguos */
export function isAllowedLoadmuscleHttpsUrl(value: unknown): value is string {
  return isCuratedLoadmuscleUrl(value);
}
