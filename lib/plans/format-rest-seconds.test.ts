import { formatRestSeconds } from "@/lib/plans/format-rest-seconds";

describe("formatRestSeconds", () => {
  it("formats non-exact-minute durations as seconds", () => {
    expect(formatRestSeconds(0)).toBe("0 s");
    expect(formatRestSeconds(45)).toBe("45 s");
    expect(formatRestSeconds(90)).toBe("90 s");
  });

  it("formats exact minutes as min", () => {
    expect(formatRestSeconds(60)).toBe("1 min");
    expect(formatRestSeconds(120)).toBe("2 min");
  });
});
