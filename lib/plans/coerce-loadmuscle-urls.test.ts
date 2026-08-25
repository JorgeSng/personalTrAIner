import { coerceLoadmuscleUrls } from "@/lib/plans/coerce-loadmuscle-urls";

describe("coerceLoadmuscleUrls", () => {
  it("leaves valid https loadmuscle_url values unchanged", () => {
    const input = {
      week_label: "Semana 1",
      days: [
        {
          day_index: 1,
          exercises: [
            {
              name: "Press",
              sets: 3,
              reps: "8-12",
              loadmuscle_url: "https://www.loadmuscle.com/exercise/1",
            },
          ],
        },
      ],
    };

    expect(coerceLoadmuscleUrls(input)).toEqual(input);
  });

  it("coerces http and garbage loadmuscle_url values to null", () => {
    const input = {
      week_label: "Semana 1",
      days: [
        {
          day_index: 1,
          exercises: [
            {
              name: "Press",
              sets: 3,
              reps: "8-12",
              loadmuscle_url: "http://insecure.example/x",
            },
            {
              name: "Remo",
              sets: 3,
              reps: "10",
              loadmuscle_url: "not-a-url",
            },
            {
              name: "Curl",
              sets: 2,
              reps: "12",
              loadmuscle_url: null,
            },
          ],
        },
      ],
    };

    const result = coerceLoadmuscleUrls(input) as typeof input;

    expect(result.days[0].exercises[0].loadmuscle_url).toBeNull();
    expect(result.days[0].exercises[1].loadmuscle_url).toBeNull();
    expect(result.days[0].exercises[2].loadmuscle_url).toBeNull();
  });

  it("returns non-object input unchanged", () => {
    expect(coerceLoadmuscleUrls(null)).toBeNull();
    expect(coerceLoadmuscleUrls("x")).toBe("x");
  });
});
