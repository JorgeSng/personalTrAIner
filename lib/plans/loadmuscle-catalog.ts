/**
 * Catálogo curado LoadMuscle (SPEC-009 D1/D2).
 *
 * Solo URLs verificadas con título "…: Exercise Guide | LoadMuscle".
 * Resolución: match exacto por nombre/alias normalizado. Sin inventar slugs.
 * URLs de Gemini fuera de este set → se ignoran y se intenta match por nombre.
 */

export type LoadmuscleCatalogEntry = {
  names: string[];
  url: string;
};

export const LOADMUSCLE_CATALOG: LoadmuscleCatalogEntry[] = [
  {
    names: ["dominadas", "dominada", "pull-up", "pull up", "pullups", "pull ups"],
    url: "https://loadmuscle.com/exercises/pull-up",
  },
  {
    names: ["chin-up", "chin up", "chinups", "dominadas supinas"],
    url: "https://loadmuscle.com/exercises/chin-up",
  },
  {
    names: [
      "fondos",
      "fondo",
      "dips",
      "dip",
      "fondos en paralelas",
      "fondos de pecho",
      "chest dip",
    ],
    url: "https://loadmuscle.com/exercises/chest-dip",
  },
  {
    names: ["fondos de triceps", "fondos de tríceps", "triceps dip", "triceps dips"],
    url: "https://loadmuscle.com/exercises/triceps-dip",
  },
  {
    names: [
      "flexiones",
      "flexion",
      "flexión",
      "push-up",
      "push up",
      "pushups",
      "push ups",
    ],
    url: "https://loadmuscle.com/exercises/push-up",
  },
  {
    names: [
      "flexiones pica",
      "pike push-up",
      "pike push up",
      "flexiones en pica",
    ],
    url: "https://loadmuscle.com/exercises/pike-push-up",
  },
  {
    names: [
      "press banca con mancuernas",
      "press de banca con mancuernas",
      "press banca",
      "press de banca",
      "press mancuernas",
      "dumbbell bench press",
      "db bench press",
    ],
    url: "https://loadmuscle.com/exercises/dumbbell-bench-press",
  },
  {
    names: [
      "press de pecho en suelo con mancuernas",
      "press de pecho en suelo",
      "press pecho en suelo",
      "press en suelo con mancuernas",
      "press en suelo neutro con mancuernas",
      "press en suelo neutro",
      "press en suelo",
      "floor press",
      "dumbbell floor press",
      "dumbbell alternating floor press",
      "db floor press",
    ],
    url: "https://loadmuscle.com/exercises/dumbbell-alternating-floor-press",
  },
  {
    names: [
      "remo con mancuerna",
      "remo mancuerna",
      "remo con mancuerna a una mano",
      "remo a una mano",
      "remo unilateral",
      "dumbbell row",
      "db row",
      "one arm dumbbell row",
      "dumbbell one arm row",
    ],
    url: "https://loadmuscle.com/exercises/dumbbell-one-arm-row-rack-support",
  },
  {
    names: [
      "remo horizontal con mancuernas",
      "remo horizontal",
      "remo inclinado con mancuernas",
      "remo inclinado",
      "bent over dumbbell row",
      "bent-over dumbbell row",
      "dumbbell bent over row",
    ],
    url: "https://loadmuscle.com/exercises/dumbbell-bent-over-row",
  },
  {
    names: [
      "sentadilla goblet",
      "sentadilla goblet con mancuerna",
      "goblet squat",
      "goblet squats",
      "dumbbell goblet squat",
    ],
    url: "https://loadmuscle.com/exercises/dumbbell-goblet-squat",
  },
  {
    names: [
      "press militar con mancuernas",
      "press hombros con mancuernas",
      "press de hombros",
      "press de hombros de pie con mancuernas",
      "press de hombros de pie",
      "press hombros de pie",
      "dumbbell shoulder press",
      "db shoulder press",
      "dumbbell standing overhead press",
      "overhead press mancuernas",
    ],
    url: "https://loadmuscle.com/exercises/dumbbell-standing-overhead-press",
  },
  {
    names: [
      "press de hombros sentado con mancuernas",
      "press hombros sentado",
      "dumbbell seated shoulder press",
    ],
    url: "https://loadmuscle.com/exercises/dumbbell-seated-shoulder-press",
  },
  {
    names: [
      "curl de biceps",
      "curl de bíceps",
      "curl de biceps con mancuernas",
      "curl de bíceps con mancuernas",
      "curl mancuernas",
      "dumbbell curl",
      "dumbbell biceps curl",
      "db curl",
      "bicep curl",
    ],
    url: "https://loadmuscle.com/exercises/dumbbell-biceps-curl",
  },
  {
    names: [
      "zancadas con mancuernas",
      "zancadas",
      "zancada",
      "dumbbell lunges",
      "dumbbell lunge",
      "lunges",
      "lunge",
    ],
    url: "https://loadmuscle.com/exercises/dumbbell-lunge",
  },
  {
    names: ["plancha", "plank", "front plank"],
    url: "https://loadmuscle.com/exercises/front-plank",
  },
  {
    names: [
      "peso muerto con mancuernas",
      "deadlift con mancuernas",
      "dumbbell deadlift",
      "db deadlift",
    ],
    url: "https://loadmuscle.com/exercises/dumbbell-deadlift",
  },
  {
    names: [
      "aperturas con mancuernas",
      "aperturas",
      "dumbbell fly",
      "dumbbell flye",
      "db fly",
    ],
    url: "https://loadmuscle.com/exercises/dumbbell-fly",
  },
  {
    names: [
      "elevaciones laterales",
      "elevacion lateral",
      "dumbbell lateral raise",
      "lateral raise",
      "db lateral raise",
    ],
    url: "https://loadmuscle.com/exercises/dumbbell-lateral-raise",
  },
  {
    names: [
      "patada de triceps",
      "patada de tríceps",
      "kickback",
      "dumbbell kickback",
      "triceps kickback",
    ],
    url: "https://loadmuscle.com/exercises/dumbbell-kickback",
  },
  {
    names: [
      "extension de triceps tumbado",
      "extensión de tríceps tumbado",
      "skull crusher mancuernas",
      "dumbbell lying triceps extension",
      "lying triceps extension",
    ],
    url: "https://loadmuscle.com/exercises/dumbbell-lying-triceps-extension",
  },
  {
    names: [
      "sentadilla bulgara",
      "sentadilla búlgara",
      "bulgarian split squat",
      "split squat bulgara",
      "dumbbell bulgarian split squat",
    ],
    url: "https://loadmuscle.com/exercises/dumbbell-bulgarian-split-squat",
  },
  {
    names: [
      "peso muerto rumano con mancuernas",
      "rdl con mancuernas",
      "dumbbell romanian deadlift",
      "dumbbell rdl",
      "db rdl",
    ],
    url: "https://loadmuscle.com/exercises/dumbbell-romanian-deadlift",
  },
  {
    names: [
      "sentadilla peso corporal",
      "sentadilla sin peso",
      "bodyweight squat",
      "air squat",
    ],
    url: "https://loadmuscle.com/exercises/air-squat",
  },
  {
    names: [
      "puente de gluteos",
      "puente de glúteos",
      "puente de gluteo",
      "puente de glúteo",
      "glute bridge",
      "hip bridge",
      "glute bridge two legs on floor",
    ],
    url: "https://loadmuscle.com/exercises/glute-bridge-two-legs-on-floor",
  },
  {
    names: [
      "puente de gluteo con mancuerna",
      "puente de glúteo con mancuerna",
      "puente de gluteos con mancuerna",
      "dumbbell glute bridge",
    ],
    url: "https://loadmuscle.com/exercises/dumbbell-glute-bridge",
  },
  {
    names: ["escaladores", "mountain climber", "mountain climbers"],
    url: "https://loadmuscle.com/exercises/mountain-climber",
  },
  {
    names: ["burpee", "burpees"],
    url: "https://loadmuscle.com/exercises/burpee",
  },
  {
    names: ["encogimientos con mancuernas", "shrugs", "dumbbell shrug", "db shrug"],
    url: "https://loadmuscle.com/exercises/dumbbell-shrug",
  },
  {
    names: ["remo renegade", "renegade row", "renegade rows", "dumbbell renegade row"],
    url: "https://loadmuscle.com/exercises/dumbbell-renegade-row",
  },
  {
    names: [
      "curl martillo",
      "hammer curl",
      "dumbbell hammer curl",
      "db hammer curl",
    ],
    url: "https://loadmuscle.com/exercises/dumbbell-hammer-curl",
  },
  {
    names: [
      "elevaciones frontales",
      "elevacion frontal",
      "dumbbell front raise",
      "front raise",
    ],
    url: "https://loadmuscle.com/exercises/dumbbell-front-raise",
  },
  {
    names: ["pullover con mancuerna", "dumbbell pullover", "db pullover"],
    url: "https://loadmuscle.com/exercises/dumbbell-pullover",
  },
  {
    names: [
      "elevaciones de gemelos con mancuernas",
      "gemelos con mancuernas",
      "dumbbell calf raise",
      "db calf raise",
      "dumbbell standing calf raise",
    ],
    url: "https://loadmuscle.com/exercises/dumbbell-standing-calf-raise",
  },
  {
    names: ["elevaciones de gemelos", "gemelos", "standing calf raise", "calf raise"],
    url: "https://loadmuscle.com/exercises/standing-calf-raise",
  },
  {
    names: ["abdominales", "sit-up", "sit up", "situps"],
    url: "https://loadmuscle.com/exercises/sit-up",
  },
  {
    names: ["crunch bicicleta", "bicycle crunch", "bicycle crunches"],
    url: "https://loadmuscle.com/exercises/bicycle-crunch",
  },
  {
    names: [
      "zancadas caminando",
      "walking lunge",
      "walking lunges",
      "zancada caminando",
      "dumbbell walking lunge",
    ],
    url: "https://loadmuscle.com/exercises/dumbbell-walking-lunge",
  },
  {
    names: [
      "remo invertido",
      "inverted row",
      "australian pull-up",
      "australian pull up",
    ],
    url: "https://loadmuscle.com/exercises/inverted-row",
  },
  {
    names: ["thruster con mancuernas", "dumbbell thruster", "db thruster"],
    url: "https://loadmuscle.com/exercises/dumbbell-thruster",
  },
  {
    names: [
      "paseo del granjero",
      "farmer walk",
      "farmers walk",
      "farmer's walk",
    ],
    url: "https://loadmuscle.com/exercises/farmers-walk",
  },
  {
    names: [
      "sentadilla sumo con mancuerna",
      "dumbbell sumo squat",
      "sumo squat mancuerna",
    ],
    url: "https://loadmuscle.com/exercises/dumbbell-sumo-squat",
  },
];

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

export function normalizeExerciseName(name: string): string {
  return stripAccents(name).trim().toLowerCase().replace(/\s+/g, " ");
}

const catalogByName: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const entry of LOADMUSCLE_CATALOG) {
    for (const name of entry.names) {
      map.set(normalizeExerciseName(name), entry.url);
    }
  }
  return map;
})();

/** Set de URLs curadas (únicas). */
export const CURATED_LOADMUSCLE_URLS: ReadonlySet<string> = new Set(
  LOADMUSCLE_CATALOG.map((entry) => entry.url),
);

export function isCuratedLoadmuscleUrl(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") {
      return false;
    }
    const hostOk =
      url.hostname === "loadmuscle.com" || url.hostname === "www.loadmuscle.com";
    if (!hostOk) {
      return false;
    }
    // Comparar sin www y sin trailing slash
    const normalized = `https://loadmuscle.com${url.pathname.replace(/\/$/, "")}`;
    return CURATED_LOADMUSCLE_URLS.has(normalized);
  } catch {
    return false;
  }
}

/** Solo match exacto por alias normalizado. No inventa ni aproxima. */
export function lookupLoadmuscleUrl(exerciseName: string): string | null {
  return catalogByName.get(normalizeExerciseName(exerciseName)) ?? null;
}

/** Nombres preferidos (primer alias) para el prompt Gemini. */
export function getPreferredCatalogExerciseNames(): string[] {
  return LOADMUSCLE_CATALOG.map((entry) => entry.names[0]).filter(Boolean);
}

export function planHasMissingLoadmuscleUrl(content: {
  days: Array<{ exercises: Array<{ loadmuscle_url?: string | null }> }>;
}): boolean {
  return content.days.some((day) =>
    day.exercises.some((exercise) => !exercise.loadmuscle_url),
  );
}
