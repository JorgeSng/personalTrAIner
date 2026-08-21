import {
  buildEquipmentList,
  EQUIPMENT_PRESETS,
} from "@/lib/onboarding/equipment-presets";

describe("EQUIPMENT_PRESETS", () => {
  it("exposes the MVP presets with stable API values", () => {
    expect(EQUIPMENT_PRESETS.map((preset) => preset.value)).toEqual([
      "dumbbells",
      "bar_pullups",
      "bench",
      "bands",
      "bodyweight",
    ]);
  });
});

describe("buildEquipmentList", () => {
  it("unions selected presets and trimmed custom chips", () => {
    expect(
      buildEquipmentList(["dumbbells", "bands"], ["  Kettlebell  ", ""]),
    ).toEqual(["dumbbells", "bands", "Kettlebell"]);
  });

  it("returns an empty list when nothing is selected", () => {
    expect(buildEquipmentList([], ["   "])).toEqual([]);
  });
});
