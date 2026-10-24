import { describe, expect, it } from "vitest";
import { validateArea, validatePlant, validateTask } from "./garden";

describe("garden record validation", () => {
  it("accepts approximate metric rectangular areas and rejects invalid dimensions", () => {
    expect(validateArea({ name: "Carré", widthM: 2.5, lengthM: 4 })).toBeNull();
    expect(validateArea({ name: "Carré", widthM: 0, lengthM: 4 })).toContain("largeur");
    expect(validateArea({ name: "Carré", widthM: 2, lengthM: 0 })).toContain("longueur");
    expect(validateArea({ name: "Carré", widthM: Number.POSITIVE_INFINITY, lengthM: 4 })).toContain("largeur");
    expect(validateArea({ name: "  ", widthM: 2, lengthM: 4 })).toContain("nom");
  });

  it("requires a plant name, area relation, and valid planting date", () => {
    expect(validatePlant({ name: "Fraisier", areaId: "zone-1", plantedOn: "2026-04-10" })).toBeNull();
    expect(validatePlant({ name: "", areaId: "zone-1", plantedOn: "2026-04-10" })).toContain("nom");
    expect(validatePlant({ name: "Fraisier", areaId: "", plantedOn: "2026-04-10" })).toContain("zone");
    expect(validatePlant({ name: "Fraisier", areaId: "zone-1", plantedOn: "" })).toContain("date");
  });

  it("requires a task title and date", () => {
    expect(validateTask({ title: "Préparer le carré", date: "2026-04-10" })).toBeNull();
    expect(validateTask({ title: "", date: "2026-04-10" })).toContain("nom");
    expect(validateTask({ title: "Préparer le carré", date: "not-a-date" })).toContain("date");
  });
});
