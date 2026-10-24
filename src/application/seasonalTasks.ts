import type { GardenPlant, GardenTask } from "../domain/garden";

type SeasonalRule = {
  id: string;
  aliases: string[];
  title: (plantName: string) => string;
  months: number[];
  source: {
    name: string;
    url: string;
    reviewedOn: string;
    version: string;
    applicability: string;
    caveat: string;
  };
};

// Velt's regional calendar says strawberries are in season April–August, and
// places asparagus among spring vegetables. These are observation reminders,
// not promises about a particular variety, site, or harvest.
const rules: SeasonalRule[] = [
  {
    id: "velt-strawberry-season",
    aliases: ["frais", "strawber"],
    title: (name) => `Observer la période de récolte de ${name}`,
    months: [4, 5, 6, 7, 8],
    source: {
      name: "Velt — calendrier des légumes et fruits de saison",
      url: "https://velt.nu/seizoenskalender",
      reviewedOn: "2026-10-24",
      version: "v1",
      applicability: "Repère régional de saisonnalité alimentaire, cultures de plein air et serres non chauffées.",
      caveat: "Cette période n’est pas une promesse de récolte au jardin; variété, météo et conditions locales peuvent la modifier.",
    },
  },
  {
    id: "velt-asparagus-spring",
    aliases: ["asperg"],
    title: (name) => `Observer la période de saison de ${name}`,
    months: [3, 4, 5],
    source: {
      name: "Velt — calendrier des légumes et fruits de saison",
      url: "https://velt.nu/seizoenskalender",
      reviewedOn: "2026-10-24",
      version: "v1",
      applicability: "Velt situe les asperges parmi les légumes de printemps dans sa région; l’application traduit ce repère en mars–mai.",
      caveat: "La période mars–mai est un rappel large, pas une date de récolte d’un pied; variété, âge, sol et météo comptent.",
    },
  },
];

const normalize = (value: string) =>
  value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const toDate = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}-01`;

export function seasonalSuggestions(
  plants: GardenPlant[],
  now = new Date(),
): GardenTask[] {
  const suggestions: GardenTask[] = [];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 366);

  for (const plant of plants) {
    const name = normalize(plant.name);
    const rule = rules.find((candidate) =>
      candidate.aliases.some((alias) => name.includes(alias)),
    );
    if (!rule) continue;

    for (let year = today.getFullYear(); year <= horizon.getFullYear(); year += 1) {
      for (const month of rule.months) {
        const date = toDate(year, month);
        const dateValue = new Date(`${date}T00:00:00`);
        if (dateValue < today || dateValue > horizon) continue;
        suggestions.push({
          id: `suggested:${plant.id}:${rule.id}:${year}-${String(month).padStart(2, "0")}`,
          title: rule.title(plant.name),
          date,
          kind: "suggested",
          plantId: plant.id,
          ruleId: rule.id,
          source: rule.source,
        });
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
