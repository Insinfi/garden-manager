import { describe, expect, it, vi } from "vitest";
import { emptyGarden } from "../domain/garden";
import type { GardenTask } from "../domain/garden";
import { addPlant, loadGarden, placeArea, saveTask, updateArea } from "./gardenUseCases";

describe("garden application operations", () => {
  it("places and edits an area in an extendable metric sketch", () => {
    const placed = placeArea(emptyGarden(), {
      id: "area-1",
      name: "Carré",
      widthM: 2.5,
      lengthM: 3,
      xM: 50,
      yM: 50,
    });
    expect(placed.ok).toBe(true);
    if (!placed.ok) return;
    expect(placed.value.areas[0]).toMatchObject({ xM: 50, yM: 50, widthM: 2.5, lengthM: 3 });

    const changed = updateArea(placed.value, "area-1", {
      name: "Grand carré",
      widthM: 4,
      lengthM: 5,
    });
    expect(changed.ok).toBe(true);
    if (changed.ok) expect(changed.value.areas[0].name).toBe("Grand carré");
  });

  it("adds a linked plant and generates its stable seasonal task records", () => {
    const area = placeArea(emptyGarden(), {
      id: "area-1",
      name: "Bac",
      widthM: 2,
      lengthM: 3,
      xM: 0,
      yM: 0,
    });
    if (!area.ok) throw new Error(area.error);
    const result = addPlant(area.value, {
      name: "Fraisier",
      kind: "plant",
      areaId: "area-1",
      plantedOn: "2026-03-01",
    }, "plant-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.plants[0]).toMatchObject({ id: "plant-1", areaId: "area-1" });
    expect(result.value.tasks.every((task) => task.plantId === "plant-1" && task.source?.reviewedOn)).toBe(true);
  });

  it("keeps a generated task's provenance when its owner edits it", () => {
    const original: GardenTask = {
      id: "suggested:plant-1:rule:2026-04",
      title: "Observer la récolte",
      date: "2026-04-01",
      kind: "suggested",
      plantId: "plant-1",
      ruleId: "rule",
      source: {
        name: "Velt",
        url: "https://velt.nu/seizoenskalender",
        reviewedOn: "2026-10-24",
        version: "v1",
        applicability: "Région",
        caveat: "Repère",
      },
    };
    const result = saveTask({ ...emptyGarden(), tasks: [original] }, {
      title: "Mon rappel",
      date: "2026-04-05",
    }, original.id, original);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.tasks).toHaveLength(1);
      expect(result.value.tasks[0]).toMatchObject({
        title: "Mon rappel",
        date: "2026-04-05",
        kind: "suggested",
        source: original.source,
      });
    }
  });

  it("loads stored data and fills only missing seasonal suggestions", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const result = await loadGarden({
      mode: "local",
      load: async () => ({
        ...emptyGarden(),
        plants: [{
          id: "plant-1",
          name: "Fraisier",
          kind: "plant",
          areaId: "area-1",
          plantedOn: "2026-03-01",
        }],
      }),
      save,
    });
    expect(result.hasNewSuggestions).toBe(true);
    expect(result.garden.tasks.length).toBeGreaterThan(0);
    expect(save).not.toHaveBeenCalled();
  });
});
