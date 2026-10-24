import { describe, expect, it } from "vitest";
import type { GardenPlant, GardenTask } from "../domain/garden";
import { mergeSeasonalSuggestions, seasonalSuggestions } from "./seasonalTasks";

const plant = (name: string): GardenPlant => ({
  id: "plant-1",
  name,
  kind: "plant",
  areaId: "area-1",
  plantedOn: "2026-03-01",
});

describe("seasonal suggestion generation", () => {
  it("suggests localized observation tasks only for catalogued crops in the next year", () => {
    const suggestions = seasonalSuggestions([plant("Fraisier"), plant("Asperge")], new Date(2026, 2, 1));
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.every((task) => task.kind === "suggested" && task.plantId === "plant-1")).toBe(true);
    expect(suggestions.some((task) => task.ruleId === "velt-strawberry-season" && task.date.startsWith("2026-04"))).toBe(true);
    expect(suggestions.some((task) => task.ruleId === "velt-asparagus-spring" && task.date.startsWith("2026-03"))).toBe(true);
    expect(seasonalSuggestions([plant("Courgette")], new Date(2026, 2, 1))).toEqual([]);
  });

  it("uses stable identities and preserves edited suggestions during refresh", () => {
    const generated = seasonalSuggestions([plant("Fraisier")], new Date(2026, 2, 1));
    const first = generated[0];
    const edited: GardenTask = { ...first, title: "Mon rappel adapté", date: "2026-04-12" };
    const refreshed = mergeSeasonalSuggestions([edited], [plant("Fraisier")], new Date(2026, 2, 1));
    expect(refreshed.find((task) => task.id === first.id)).toEqual(edited);
    expect(new Set(refreshed.map((task) => task.id)).size).toBe(refreshed.length);
    expect(mergeSeasonalSuggestions(refreshed, [plant("Fraisier")], new Date(2026, 2, 1))).toEqual(refreshed);
  });

  it("does not create duplicate suggestions for personal tasks", () => {
    const personal: GardenTask = {
      id: "personal-1",
      title: "Acheter des graines",
      date: "2026-04-04",
      kind: "personal",
    };
    const tasks = mergeSeasonalSuggestions([personal], [plant("Fraisier")], new Date(2026, 2, 1));
    expect(tasks[0]).toEqual(personal);
    expect(tasks.filter((task) => task.kind === "suggested")).toHaveLength(5);
  });
});
