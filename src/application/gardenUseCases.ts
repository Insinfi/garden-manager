import type {
  GardenArea,
  GardenData,
  GardenPlant,
  GardenTask,
} from "../domain/garden";
import {
  validateArea,
  validatePlant,
  validateTask,
} from "../domain/garden";
import { mergeSeasonalSuggestions } from "./seasonalTasks";
import type { GardenRepository } from "./ports";

export type UseCaseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function validateAreaDraft(input: {
  name: string;
  widthM: number;
  lengthM: number;
}): string | null {
  return validateArea(input);
}

export function placeArea(
  garden: GardenData,
  input: { id: string; name: string; widthM: number; lengthM: number; xM: number; yM: number },
): UseCaseResult<GardenData> {
  const error = validateArea(input);
  if (error) return { ok: false, error };
  const area: GardenArea = {
    ...input,
    name: input.name.trim(),
    xM: Math.max(0, input.xM),
    yM: Math.max(0, input.yM),
  };
  return {
    ok: true,
    value: {
      ...garden,
      areas: [...garden.areas.filter((item) => item.id !== area.id), area],
    },
  };
}

export function updateArea(
  garden: GardenData,
  areaId: string,
  input: { name: string; widthM: number; lengthM: number },
): UseCaseResult<GardenData> {
  const error = validateArea(input);
  if (error) return { ok: false, error };
  const area = garden.areas.find((item) => item.id === areaId);
  if (!area) return { ok: false, error: "Cette zone n’existe plus dans le plan." };
  return {
    ok: true,
    value: {
      ...garden,
      areas: garden.areas.map((item) =>
        item.id === areaId
          ? {
              ...item,
              name: input.name.trim(),
              widthM: input.widthM,
              lengthM: input.lengthM,
            }
          : item,
      ),
    },
  };
}

export function addPlant(
  garden: GardenData,
  input: Omit<GardenPlant, "id">,
  plantId: string,
): UseCaseResult<GardenData> {
  const error = validatePlant(input);
  if (error) return { ok: false, error };
  const plant: GardenPlant = { ...input, id: plantId, name: input.name.trim() };
  const plants = [...garden.plants.filter((item) => item.id !== plantId), plant];
  return {
    ok: true,
    value: {
      ...garden,
      plants,
      tasks: mergeSeasonalSuggestions(garden.tasks, plants),
    },
  };
}

export function saveTask(
  garden: GardenData,
  input: { title: string; date: string },
  taskId: string,
  existing?: GardenTask,
): UseCaseResult<GardenData> {
  const error = validateTask(input);
  if (error) return { ok: false, error };
  const task: GardenTask = existing
    ? { ...existing, title: input.title.trim(), date: input.date }
    : { id: taskId, title: input.title.trim(), date: input.date, kind: "personal" };
  const tasks = existing
    ? garden.tasks.map((item) => item.id === existing.id ? task : item)
    : [...garden.tasks.filter((item) => item.id !== taskId), task];
  return { ok: true, value: { ...garden, tasks } };
}

export async function loadGarden(
  repository: GardenRepository,
): Promise<{ garden: GardenData; hasNewSuggestions: boolean }> {
  const stored = await repository.load();
  const tasks = mergeSeasonalSuggestions(stored.tasks, stored.plants);
  return {
    garden: { ...stored, tasks },
    hasNewSuggestions: tasks.length !== stored.tasks.length,
  };
}

export async function saveGarden(
  repository: GardenRepository,
  garden: GardenData,
): Promise<void> {
  await repository.save(garden);
}
