export const EQUIPMENT_PRESETS = [
  { value: "dumbbells", label: "Mancuernas" },
  { value: "bar_pullups", label: "Barra/dominadas" },
  { value: "bench", label: "Banco" },
  { value: "bands", label: "Bandas" },
  { value: "bodyweight", label: "Peso corporal" },
] as const;

export type EquipmentPresetValue = (typeof EQUIPMENT_PRESETS)[number]["value"];

export function buildEquipmentList(
  selectedPresets: readonly string[],
  customItems: readonly string[],
): string[] {
  const fromPresets = EQUIPMENT_PRESETS.filter((preset) =>
    selectedPresets.includes(preset.value),
  ).map((preset) => preset.value);

  const fromCustom = customItems
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return [...fromPresets, ...fromCustom];
}
