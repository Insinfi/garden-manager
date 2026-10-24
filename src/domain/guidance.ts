export type GardenAdvice = {
  id: string;
  title: string;
  message: string;
  sourceName: string;
  sourceUrl: string;
  reviewedOn: string;
  version: string;
  applicability: string;
  caveat: string;
};

const veltUrl = "https://velt.nu/seizoenskalender";

export const adviceCatalog: GardenAdvice[] = [
  {
    id: "strawberry-season",
    title: "La saison des fraises",
    message:
      "Velt indique une période d’avril à août pour les fraises de saison dans sa région. Vous pouvez prendre cette période comme repère pour observer vos fraisiers.",
    sourceName: "Velt — calendrier des légumes et fruits de saison",
    sourceUrl: veltUrl,
    reviewedOn: "2026-10-24",
    version: "v1",
    applicability: "Calendrier régional des récoltes, pour les cultures de plein air et serres non chauffées.",
    caveat:
      "Ce repère concerne les produits de saison, pas une garantie de récolte dans votre jardin. La variété, la météo, le microclimat et les conditions de culture changent les dates.",
  },
  {
    id: "asparagus-season",
    title: "La saison des asperges",
    message:
      "Le calendrier de Velt situe les asperges parmi les légumes des mois de printemps. Il ne fixe pas une date de récolte pour un pied précis.",
    sourceName: "Velt — calendrier des légumes et fruits de saison",
    sourceUrl: veltUrl,
    reviewedOn: "2026-10-24",
    version: "v1",
    applicability: "Région de Velt; calendrier de saisonnalité alimentaire.",
    caveat:
      "À utiliser comme repère général seulement. La variété, l’âge du plant, le sol et la météo locale influencent la récolte.",
  },
];

export function requestAdvice(plantName: string): GardenAdvice[] {
  const query = plantName.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  if (query.includes("frais") || query.includes("strawber")) {
    return adviceCatalog.filter((entry) => entry.id === "strawberry-season");
  }
  if (query.includes("asperg")) {
    return adviceCatalog.filter((entry) => entry.id === "asparagus-season");
  }
  return [];
}
