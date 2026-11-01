import { cropCatalog, findCropEntry } from "./cropCatalog";
import type { CatalogSource } from "./cropCatalog";

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
  evidence: string;
};

const toAdvice = (
  entry: (typeof cropCatalog)[number],
): GardenAdvice => ({
  id: `${entry.id}-advice`,
  title: `Repères pour ${entry.displayName.toLocaleLowerCase("fr")}`,
  message: entry.advice,
  sourceName: entry.adviceSource.name,
  sourceUrl: entry.adviceSource.url,
  reviewedOn: entry.adviceSource.reviewedOn,
  version: entry.adviceSource.version,
  applicability: entry.adviceSource.applicability,
  caveat: entry.adviceSource.caveat,
  evidence: entry.adviceSource.evidence,
});

export const adviceCatalog: GardenAdvice[] = cropCatalog.map(toAdvice);
export type { CatalogSource };

/** Advice is returned only for a fully recognized, normalized crop name. */
export function requestAdvice(plantName: string): GardenAdvice[] {
  const entry = findCropEntry(plantName);
  return entry ? [toAdvice(entry)] : [];
}
