/**
 * Pre-proceso (SPEC-007 D5): URLs loadmuscle_url que no sean https válidas → null.
 */

function isValidHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function coerceLoadmuscleUrls(raw: unknown): unknown {
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
          if (!("loadmuscle_url" in ex)) {
            return exercise;
          }

          const url = ex.loadmuscle_url;
          if (url === null || url === undefined) {
            return { ...ex, loadmuscle_url: url ?? null };
          }

          return {
            ...ex,
            loadmuscle_url: isValidHttpsUrl(url) ? url : null,
          };
        }),
      };
    }),
  };
}
