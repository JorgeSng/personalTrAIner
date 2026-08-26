import {
  enrichLoadmuscleUrls,
  isAllowedLoadmuscleHttpsUrl,
  normalizeExerciseName,
} from "@/lib/plans/enrich-loadmuscle-urls";
import {
  CURATED_LOADMUSCLE_URLS,
  LOADMUSCLE_CATALOG,
  lookupLoadmuscleUrl,
} from "@/lib/plans/loadmuscle-catalog";

describe("normalizeExerciseName", () => {
  it("lowercases, trims, and strips accents", () => {
    expect(normalizeExerciseName("  Press de Banca  ")).toBe("press de banca");
    expect(normalizeExerciseName("Sentadilla Búlgara")).toBe("sentadilla bulgara");
  });
});

describe("LOADMUSCLE_CATALOG", () => {
  it("has enough MVP entries and only curated unique URLs", () => {
    expect(LOADMUSCLE_CATALOG.length).toBeGreaterThanOrEqual(25);
    expect(CURATED_LOADMUSCLE_URLS.size).toBeGreaterThanOrEqual(25);
  });
});

describe("isAllowedLoadmuscleHttpsUrl / curated", () => {
  it("accepts only curated https loadmuscle URLs", () => {
    expect(
      isAllowedLoadmuscleHttpsUrl(
        "https://loadmuscle.com/exercises/dumbbell-goblet-squat",
      ),
    ).toBe(true);
    expect(
      isAllowedLoadmuscleHttpsUrl(
        "https://www.loadmuscle.com/exercises/dumbbell-goblet-squat",
      ),
    ).toBe(true);
  });

  it("rejects invented loadmuscle slugs and foreign hosts", () => {
    expect(
      isAllowedLoadmuscleHttpsUrl("https://loadmuscle.com/exercises/goblet-squat"),
    ).toBe(false);
    expect(
      isAllowedLoadmuscleHttpsUrl("http://loadmuscle.com/exercises/pull-up"),
    ).toBe(false);
    expect(
      isAllowedLoadmuscleHttpsUrl("https://evil.example/exercises/pull-up"),
    ).toBe(false);
  });
});

describe("lookupLoadmuscleUrl", () => {
  it("matches exact aliases only", () => {
    expect(lookupLoadmuscleUrl("Dominadas")).toBe(
      "https://loadmuscle.com/exercises/pull-up",
    );
    expect(lookupLoadmuscleUrl("Sentadilla Goblet con Mancuerna")).toBe(
      "https://loadmuscle.com/exercises/dumbbell-goblet-squat",
    );
    expect(lookupLoadmuscleUrl("Remo con Mancuerna a Una Mano")).toBe(
      "https://loadmuscle.com/exercises/dumbbell-one-arm-row-rack-support",
    );
    expect(lookupLoadmuscleUrl("Press de Pecho en Suelo con Mancuernas")).toBe(
      "https://loadmuscle.com/exercises/dumbbell-alternating-floor-press",
    );
    expect(lookupLoadmuscleUrl("Curl de Bíceps con Mancuernas")).toBe(
      "https://loadmuscle.com/exercises/dumbbell-biceps-curl",
    );
  });

  it("does not invent or fuzzy-match unknown names", () => {
    expect(lookupLoadmuscleUrl("Ejercicio inventado XYZ")).toBeNull();
    expect(lookupLoadmuscleUrl("Zancadas Hacia Atrás con Mancuernas")).toBeNull();
    expect(
      lookupLoadmuscleUrl("Extensión de Tríceps sobre la Cabeza con Mancuerna"),
    ).toBeNull();
    expect(lookupLoadmuscleUrl("Sentadilla Goblet Extra Profunda")).toBeNull();
  });
});

describe("enrichLoadmuscleUrls", () => {
  it("keeps a curated LoadMuscle https URL", () => {
    const input = {
      week_label: "Semana 1",
      days: [
        {
          day_index: 1,
          exercises: [
            {
              name: "Cualquier nombre",
              sets: 3,
              reps: "8",
              loadmuscle_url: "https://loadmuscle.com/exercises/front-plank",
            },
          ],
        },
      ],
    };

    const result = enrichLoadmuscleUrls(input) as typeof input;
    expect(result.days[0].exercises[0].loadmuscle_url).toBe(
      "https://loadmuscle.com/exercises/front-plank",
    );
  });

  it("drops invented loadmuscle slugs and fills from exact catalog name", () => {
    const input = {
      week_label: "Semana 1",
      days: [
        {
          day_index: 1,
          exercises: [
            {
              name: "Push-up",
              sets: 3,
              reps: "10",
              loadmuscle_url: "https://loadmuscle.com/exercises/not-a-real-slug",
            },
            {
              name: "Remo con mancuerna",
              sets: 3,
              reps: "10",
              loadmuscle_url: "https://evil.example/row",
            },
          ],
        },
      ],
    };

    const result = enrichLoadmuscleUrls(input) as typeof input;
    expect(result.days[0].exercises[0].loadmuscle_url).toBe(
      "https://loadmuscle.com/exercises/push-up",
    );
    expect(result.days[0].exercises[1].loadmuscle_url).toBe(
      "https://loadmuscle.com/exercises/dumbbell-one-arm-row-rack-support",
    );
  });

  it("sets null when there is no curated URL and no exact name match", () => {
    const input = {
      week_label: "Semana 1",
      days: [
        {
          day_index: 1,
          exercises: [
            {
              name: "Movimiento inventado XYZ",
              sets: 2,
              reps: "12",
              loadmuscle_url: "https://loadmuscle.com/exercises/fake-slug",
            },
          ],
        },
      ],
    };

    const result = enrichLoadmuscleUrls(input) as typeof input;
    expect(result.days[0].exercises[0].loadmuscle_url).toBeNull();
  });
});
