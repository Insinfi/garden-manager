/**
 * Curated starter catalog for a temperate Belgian kitchen garden.
 *
 * The month windows below are transcribed as broad calendar windows from
 * Belgian retail/gardening references, not adjusted to a particular garden.
 * Keep each action attached to the evidence that supports that exact action.
 */
export type CatalogSource = {
  name: string;
  url: string;
  reviewedOn: string;
  version: string;
  applicability: string;
  caveat: string;
  evidence: string;
};

export type CropAction = "sow" | "harvest-check" | "prune";

export type CropActionRule = {
  id: string;
  action: CropAction;
  months: number[];
  title: (recordedName: string) => string;
  source: CatalogSource;
};

export type CropCatalogEntry = {
  id: string;
  /** Exact normalized names only; never infer a species from a partial match. */
  names: string[];
  displayName: string;
  advice: string;
  adviceCategories: string[];
  adviceSource: CatalogSource;
  rules: CropActionRule[];
  gaps: string[];
};

const reviewedOn = "2026-10-24";
const version = "potager-be-v2";
const belgianCalendar = {
  name: "Intratuin Belgique — calendrier de semis du potager",
  url: "https://www.intratuin.be/inspiratie/zaaikalender-moestuin",
  reviewedOn,
  version,
  applicability:
    "Calendrier publié sur le site belge d’Intratuin; repère général pour un potager belge, utile comme base régionale pour Tournai.",
  caveat:
    "Les mois ne sont pas un calendrier propre à Tournai et ne tiennent pas compte de la variété, du type de culture (abri/plein air), du sol, du microclimat ni de la météo de l’année. « Vérifier la récolte » est un rappel d’observation, pas une promesse de maturité.",
  evidence:
    "Tableau « Intratuin moestuin zaaikalender »; la ligne, l’opération et les mois applicables sont précisés par culture ci-dessous.",
} satisfies CatalogSource;
const veltCalendar = {
  name: "Velt — calendrier des légumes et fruits de saison",
  url: "https://velt.nu/seizoenskalender",
  reviewedOn,
  version,
  applicability:
    "Velt décrit les produits de saison de sa région en plein air et en serre non chauffée; c’est un repère belge régional, pas un calendrier de culture du jardin.",
  caveat:
    "Une période de saisonnalité alimentaire ne prouve ni la date de plantation ni la récolte d’un pied individuel. Variété, âge et conditions du jardin changent les dates.",
  evidence:
    "Présentation du calendrier Velt : asperges au printemps et fraises d’avril à août; le calendrier porte sur les mois de récolte des produits régionaux.",
} satisfies CatalogSource;
const compoRaspberry = {
  name: "COMPO Belgique — Framboises : planter, soigner et tailler",
  url: "https://www.compo.be/nl/advies/planten/kruiden-groenten-fruit/framboos",
  reviewedOn,
  version,
  applicability:
    "Fiche de jardinage publiée par COMPO Belgique sur les framboisiers d’été et d’automne.",
  caveat:
    "Le type été/automne est indispensable : les cannes fructifient et se taillent différemment. Pour l’été, seules les cannes ayant fructifié doivent être coupées. La fiche donne une période générale, à adapter aux conditions observées.",
  evidence:
    "Sections « Wanneer worden frambozen aangeplant? » et « Hoe en wanneer moeten frambozen worden gesnoeid? » : plantation des sujets à racines nues au printemps ou en automne; taille après récolte, vers fin juillet pour les variétés d’été et début novembre pour les variétés d’automne; possibilité d’attendre le printemps avant le redémarrage.",
} satisfies CatalogSource;

const sowRule = (id: string, months: number[], title: CropActionRule["title"]): CropActionRule => ({
  id,
  action: "sow",
  months,
  title,
  source: belgianCalendar,
});
const harvestRule = (id: string, months: number[], title: CropActionRule["title"]): CropActionRule => ({
  id,
  action: "harvest-check",
  months,
  title,
  source: belgianCalendar,
});
const calendarEntry = (
  id: string,
  names: string[],
  displayName: string,
  advice: string,
  sowMonths: number[],
  harvestMonths: number[],
  evidence: string,
): CropCatalogEntry => ({
  id,
  names,
  displayName,
  advice,
  adviceCategories: [
    ...(sowMonths.length ? ["semis (sous abri et/ou pleine terre selon le mois)"] : []),
    ...(harvestMonths.length ? ["période de récolte indicative"] : []),
  ],
  adviceSource: {
    ...belgianCalendar,
    evidence: `Tableau « Intratuin moestuin zaaikalender », ${evidence}`,
  },
  rules: [
    ...(sowMonths.length
      ? [sowRule(`${id}-sow`, sowMonths, (name) => `Prévoir un semis de ${name}`)]
      : []),
    ...(harvestMonths.length
      ? [harvestRule(`${id}-harvest`, harvestMonths, (name) => `Vérifier si ${name} peut être récolté`)]
      : []),
  ].map((rule) => ({
    ...rule,
    source: {
      ...belgianCalendar,
      evidence: `Tableau « Intratuin moestuin zaaikalender », ${evidence}`,
    },
  })),
  gaps: [
    "Pas de dates spécifiques à Tournai, à une variété ou aux conditions de cette parcelle.",
    "Pas de conseil vérifié sur la plantation de jeunes plants, la taille, l’arrosage ou les maladies dans cette entrée.",
  ],
});

export const cropCatalog: CropCatalogEntry[] = [
  calendarEntry(
    "tomato",
    ["tomate", "tomates"],
    "Tomate",
    "Le calendrier belge indique des semis sous abri de février à avril, puis une période « semis et récolte » de juillet à octobre. Le tableau ne sépare pas plus précisément ces dernières opérations.",
    [2, 3, 4, 7, 8, 9, 10],
    [7, 8, 9, 10],
    "ligne « Tomaat » : semis sous abri en février–avril; le tableau regroupe semis et récolte en juillet–octobre.",
  ),
  calendarEntry(
    "carrot",
    ["carotte", "carottes"],
    "Carotte",
    "Repère du calendrier : semis sous abri en février, semis en pleine terre en mars et avril, récolte de mai à août; le tableau signale aussi « semis et récolte » de septembre à novembre.",
    [2, 3, 4, 9, 10, 11],
    [5, 6, 7, 8, 9, 10, 11],
    "ligne « Wortel » : semis sous abri en février, semis en pleine terre en mars–avril, récolte en mai–août, semis et récolte en septembre–novembre.",
  ),
  calendarEntry(
    "lettuce",
    ["laitue pommée", "laitues pommées"],
    "Laitue pommée",
    "Repère du calendrier pour la laitue pommée : semis sous abri de janvier à avril, récolte de mai à août, puis « semis et récolte » de septembre à décembre.",
    [1, 2, 3, 4, 9, 10, 11, 12],
    [5, 6, 7, 8, 9, 10, 11, 12],
    "ligne « Kropsla » : semis sous abri en janvier–avril, récolte en mai–août, semis et récolte en septembre–décembre.",
  ),
  calendarEntry(
    "radish",
    ["radis", "radis roses"],
    "Radis",
    "Repère du calendrier : semis sous abri de janvier à avril, récolte de mai à août, puis « semis et récolte » de septembre à décembre.",
    [1, 2, 3, 4, 9, 10, 11, 12],
    [5, 6, 7, 8, 9, 10, 11, 12],
    "ligne « Radijs » : semis sous abri en janvier–avril, récolte en mai–août, semis et récolte en septembre–décembre.",
  ),
  calendarEntry(
    "spinach",
    ["epinard", "epinards"],
    "Épinard",
    "Le calendrier mentionne semis et récolte en janvier, semis sous abri en février, semis en pleine terre en mars-avril, récolte de mai à septembre, puis semis et récolte d’octobre à décembre.",
    [1, 2, 3, 4, 10, 11, 12],
    [1, 5, 6, 7, 8, 9, 10, 11, 12],
    "ligne « Spinazie » : semis et récolte en janvier; semis sous abri en février; semis en pleine terre en mars–avril; récolte en mai–septembre; semis et récolte en octobre–décembre.",
  ),
  calendarEntry(
    "cucumber",
    ["concombre", "concombres"],
    "Concombre",
    "Repère du calendrier : semis sous abri de février à mai, semis en pleine terre en juin, puis « semis et récolte » de juillet à octobre.",
    [2, 3, 4, 5, 6, 7, 8, 9, 10],
    [7, 8, 9, 10],
    "ligne « Komkommer » : semis sous abri en février–mai, semis en pleine terre en juin, semis et récolte en juillet–octobre.",
  ),
  calendarEntry(
    "beet",
    ["betterave", "betteraves", "betterave rouge"],
    "Betterave",
    "Repère du calendrier : semis en pleine terre d’avril à juin, récolte en juillet, puis « semis et récolte » d’août à novembre.",
    [4, 5, 6, 8, 9, 10, 11],
    [7, 8, 9, 10, 11],
    "ligne « Bieten » : semis en pleine terre en avril–juin, récolte en juillet, semis et récolte en août–novembre.",
  ),
  calendarEntry(
    "bean",
    ["haricot", "haricots", "haricot nain", "haricot a rames"],
    "Haricot",
    "Repère du calendrier : semis sous abri en avril, semis en pleine terre en mai et juin, récolte en juillet, puis « semis et récolte » d’août à octobre.",
    [4, 5, 6, 8, 9, 10],
    [7, 8, 9, 10],
    "ligne « Bonen » : semis sous abri en avril, semis en pleine terre en mai–juin, récolte en juillet, semis et récolte en août–octobre.",
  ),
  calendarEntry(
    "leek",
    ["poireau", "poireaux"],
    "Poireau",
    "Repère du calendrier : semis sous abri de janvier à avril, semis en pleine terre en mai, puis « semis et récolte » de juillet à décembre.",
    [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12],
    [7, 8, 9, 10, 11, 12],
    "ligne « Prei » : semis sous abri en janvier–avril, semis en pleine terre en mai, semis et récolte en juillet–décembre.",
  ),
  {
    id: "strawberry",
    names: ["fraisier", "fraisiers", "fraise", "fraises"],
    displayName: "Fraisier",
    advice:
      "Velt indique avril à août pour la saison des fraises dans sa région. C’est un repère de récolte des produits de saison, pas un calendrier de plantation du fraisier.",
    adviceCategories: ["saisonnalité régionale des produits (pas de calendrier de culture)"],
    adviceSource: veltCalendar,
    rules: [
      {
        id: "velt-strawberry-season",
        action: "harvest-check",
        months: [4, 5, 6, 7, 8],
        title: (name) => `Vérifier la récolte des fruits de ${name}`,
        source: veltCalendar,
      },
    ],
    gaps: [
      "Velt ne donne pas dans ce calendrier de période de plantation, de taille, ni de rendement pour un fraisier du jardin.",
      "La saison Velt n’est pas une observation horticole propre à Tournai ou à une variété.",
    ],
  },
  {
    id: "asparagus",
    names: ["asperge", "asperges", "asperge verte", "asperge blanche"],
    displayName: "Asperge",
    advice:
      "Velt place les asperges parmi les légumes de printemps de sa région. Le calendrier ne prescrit ni plantation, ni taille, ni récolte pour un pied donné.",
    adviceCategories: ["saisonnalité régionale des produits (pas de calendrier de culture)"],
    adviceSource: veltCalendar,
    rules: [],
    gaps: [
      "Aucune règle automatique de plantation, taille ou récolte : la saisonnalité alimentaire ne suffit pas à établir ces actions pour un plant, notamment sans connaître son âge.",
    ],
  },
  {
    id: "summer-raspberry",
    names: ["framboise d ete", "framboises d ete", "framboisier d ete", "framboisier d ete non remontant"],
    displayName: "Framboisier d’été",
    advice:
      "COMPO Belgique distingue les framboisiers d’été, qui fructifient sur des cannes de deux ans. La fiche situe la taille après récolte, vers fin juillet, et précise de ne couper que les cannes ayant fructifié; elle indique aussi la plantation des sujets à racines nues au printemps ou en automne.",
    adviceCategories: ["plantation des racines nues", "taille après récolte", "différence été/automne"],
    adviceSource: compoRaspberry,
    rules: [
      {
        id: "compo-summer-raspberry-prune",
        action: "prune",
        months: [7],
        title: (name) => `Après la récolte, tailler uniquement les cannes ayant fructifié de ${name}`,
        source: compoRaspberry,
      },
    ],
    gaps: [
      "La règle suppose que le nom enregistré confirme un framboisier d’été et qu’une récolte vient d’être observée; elle ne doit pas être appliquée à une framboise d’automne.",
      "Le calendrier de la fiche est général et non ajusté au microclimat de Tournai.",
    ],
  },
  {
    id: "autumn-raspberry",
    names: ["framboise d automne", "framboises d automne", "framboisier d automne"],
    displayName: "Framboisier d’automne",
    advice:
      "COMPO Belgique indique que les framboisiers d’automne fructifient sur des pousses de l’année; après récolte, la fiche recommande de rabattre les cannes au ras du sol, généralement au début de novembre. Elle indique qu’on peut aussi attendre le printemps avant le redémarrage.",
    adviceCategories: ["taille après récolte", "différence été/automne"],
    adviceSource: compoRaspberry,
    rules: [
      {
        id: "compo-autumn-raspberry-prune",
        action: "prune",
        months: [11],
        title: (name) => `Après la récolte, tailler les cannes de ${name} au ras du sol`,
        source: compoRaspberry,
      },
    ],
    gaps: [
      "La règle suppose que le nom enregistré confirme un framboisier d’automne; les framboisiers d’été exigent une taille différente.",
      "La fiche propose aussi d’attendre le printemps : novembre est un repère indicatif, pas une échéance obligatoire.",
      "Le calendrier de la fiche est général et non ajusté au microclimat de Tournai.",
    ],
  },
];

export type CropCoverage = {
  crop: string;
  recognizedNames: string[];
  adviceCategories: string[];
  seasonalActions: CropAction[];
  locality: string;
  gaps: string[];
};

/** Runtime-readable coverage manifest; unknown/common ambiguous names stay out. */
export const cropCoverageManifest: CropCoverage[] = cropCatalog.map((entry) => ({
  crop: entry.displayName,
  recognizedNames: entry.names,
  adviceCategories: entry.adviceCategories,
  seasonalActions: [...new Set(entry.rules.map((rule) => rule.action))],
  locality:
    entry.id.includes("raspberry")
      ? "Belgique; fiche de jardinage nationale, sans calibration communale."
      : entry.id === "strawberry" || entry.id === "asparagus"
        ? "Région Velt; saisonnalité régionale de produits, pas calendrier de culture propre au jardin."
        : "Calendrier publié sur le site belge d’Intratuin; repère général belge, sans calibration communale.",
  gaps: entry.gaps,
}));

export const normalizeCropName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr")
    .replace(/[’']/g, " ")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function findCropEntry(name: string): CropCatalogEntry | undefined {
  const normalized = normalizeCropName(name);
  return cropCatalog.find((entry) =>
    entry.names.some((candidate) => normalizeCropName(candidate) === normalized),
  );
}
