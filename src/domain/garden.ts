export type GardenArea = {
  id: string;
  name: string;
  widthM: number;
  lengthM: number;
  xM: number;
  yM: number;
};

export type GardenPlant = {
  id: string;
  name: string;
  kind: "plant" | "tree";
  areaId: string;
  plantedOn: string;
};

export type GardenTask = {
  id: string;
  title: string;
  date: string;
  kind: "suggested" | "personal";
  plantId?: string;
  ruleId?: string;
  source?: {
    name: string;
    url: string;
    reviewedOn: string;
    version: string;
    applicability: string;
    caveat: string;
    evidence?: string;
  };
};

export type GardenData = {
  schemaVersion: 1;
  areas: GardenArea[];
  plants: GardenPlant[];
  tasks: GardenTask[];
};

export const emptyGarden = (): GardenData => ({
  schemaVersion: 1,
  areas: [],
  plants: [],
  tasks: [],
});

export function validateArea(input: {
  name: string;
  widthM: number;
  lengthM: number;
}): string | null {
  if (!input.name.trim()) return "Donnez un nom à cette zone.";
  if (!Number.isFinite(input.widthM) || input.widthM <= 0) {
    return "La largeur doit être supérieure à 0 mètre.";
  }
  if (!Number.isFinite(input.lengthM) || input.lengthM <= 0) {
    return "La longueur doit être supérieure à 0 mètre.";
  }
  return null;
}

export function validatePlant(input: {
  name: string;
  areaId: string;
  plantedOn: string;
}): string | null {
  if (!input.name.trim()) return "Indiquez le nom de la plante ou de l’arbre.";
  if (!input.areaId) return "Choisissez une zone du plan.";
  if (!input.plantedOn || Number.isNaN(Date.parse(input.plantedOn))) {
    return "Indiquez une date de plantation valide.";
  }
  return null;
}

export function validateTask(input: { title: string; date: string }): string | null {
  if (!input.title.trim()) return "Écrivez le nom de la tâche.";
  if (!input.date || Number.isNaN(Date.parse(input.date))) return "Choisissez une date valide.";
  return null;
}
