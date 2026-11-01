import { describe, expect, it } from "vitest";
import type { GardenPlant, GardenTask } from "../domain/garden";
import { mergeSeasonalSuggestions, seasonalSuggestions } from "./seasonalTasks";

const plant = (name: string, id = "plant-1"): GardenPlant => ({
  id,
  name,
  kind: "plant",
  areaId: "area-1",
  plantedOn: "2026-03-01",
});

describe("source-backed seasonal task generation", () => {
  it("creates distinct sowing, harvest-check, and cultivar-specific pruning reminders", () => {
    const suggestions = seasonalSuggestions([
      plant("Tomate"),
      plant("Carotte", "plant-2"),
      plant("Framboisier d’été", "plant-3"),
      plant("Framboisier d’automne", "plant-4"),
      plant("Asperge", "plant-5"),
      plant("Courgette", "plant-6"),
    ], new Date(2026, 1, 1));

    expect(suggestions.some((task) =>
      task.plantId === "plant-1" &&
      task.ruleId === "tomato-sow" &&
      task.date === "2026-02-01" &&
      task.title.includes("semis"),
    )).toBe(true);
    expect(suggestions.some((task) =>
      task.plantId === "plant-1" && task.ruleId === "tomato-harvest",
    )).toBe(true);
    expect(suggestions.some((task) => task.ruleId === "compo-summer-raspberry-prune" && task.date.includes("-07-"))).toBe(true);
    expect(suggestions.some((task) => task.ruleId === "compo-autumn-raspberry-prune" && task.date.includes("-11-"))).toBe(true);
    expect(suggestions.some((task) => task.plantId === "plant-5")).toBe(false);
    expect(suggestions.some((task) => task.plantId === "plant-6")).toBe(false);
    expect(suggestions.every((task) =>
      task.kind === "suggested" &&
      task.plantId &&
      task.source?.url.startsWith("https://") &&
      task.source?.evidence &&
      task.source?.reviewedOn === "2026-10-24" &&
      task.source?.version === "potager-be-v2",
    )).toBe(true);
  });

  it("uses exact crop-name matching and schedules a current-month reminder from today", () => {
    const suggestions = seasonalSuggestions(
      [plant("Radis"), plant("Radis noir", "unknown")],
      new Date(2026, 4, 15),
    );
    expect(suggestions.some((task) => task.date === "2026-05-15")).toBe(true);
    expect(suggestions.some((task) => task.plantId === "unknown")).toBe(false);
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

  it("keeps personal tasks and does not generate duplicates for them", () => {
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
