import type { GardenPlant, GardenTask } from "../domain/garden";
import { findCropEntry } from "../domain/cropCatalog";
import type { CropActionRule } from "../domain/cropCatalog";

const toDate = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}-01`;

function taskDateForMonth(year: number, month: number, today: Date): string {
  const monthStart = new Date(year, month - 1, 1);
  if (
    year === today.getFullYear() &&
    month === today.getMonth() + 1 &&
    monthStart < today
  ) {
    return `${year}-${String(month).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }
  return toDate(year, month);
}

function asTaskSource(source: CropActionRule["source"]): NonNullable<GardenTask["source"]> {
  return {
    name: source.name,
    url: source.url,
    reviewedOn: source.reviewedOn,
    version: source.version,
    applicability: source.applicability,
    caveat: source.caveat,
    evidence: source.evidence,
  };
}

export function seasonalSuggestions(
  plants: GardenPlant[],
  now = new Date(),
): GardenTask[] {
  const suggestions: GardenTask[] = [];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 366);

  for (const plant of plants) {
    const entry = findCropEntry(plant.name);
    if (!entry) continue;

    for (const rule of entry.rules) {
      for (let year = today.getFullYear(); year <= horizon.getFullYear(); year += 1) {
        for (const month of rule.months) {
          const monthStart = new Date(year, month - 1, 1);
          const monthEnd = new Date(year, month, 0);
          if (monthEnd < today || monthStart > horizon) continue;

          const date = taskDateForMonth(year, month, today);
          suggestions.push({
            id: `suggested:${plant.id}:${rule.id}:${year}-${String(month).padStart(2, "0")}`,
            title: rule.title(plant.name),
            date,
            kind: "suggested",
            plantId: plant.id,
            ruleId: rule.id,
            source: asTaskSource(rule.source),
          });
        }
      }
    }
  }

  return suggestions;
}

/** Add only missing rule instances; edited existing suggestions stay untouched. */
export function mergeSeasonalSuggestions(
  existing: GardenTask[],
  plants: GardenPlant[],
  now = new Date(),
): GardenTask[] {
  const knownIds = new Set(existing.map((task) => task.id));
  const newTasks = seasonalSuggestions(plants, now).filter((task) => !knownIds.has(task.id));
  return [...existing, ...newTasks];
}
