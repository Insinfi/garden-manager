import { describe, expect, it } from "vitest";
import { cropCatalog, cropCoverageManifest } from "./cropCatalog";
import { requestAdvice } from "./guidance";

describe("requested garden advice and coverage manifest", () => {
  it("returns source-backed Belgian calendar context for a common crop on request", () => {
    const advice = requestAdvice("Tomate");
    expect(advice).toHaveLength(1);
    expect(advice[0]).toMatchObject({
      sourceUrl: "https://www.intratuin.be/inspiratie/zaaikalender-moestuin",
      reviewedOn: "2026-10-24",
      version: "potager-be-v2",
    });
    expect(advice[0].message).toContain("février à avril");
    expect(advice[0].evidence).toContain("Tableau");
    expect(advice[0].evidence).toContain("ligne « Tomaat »");
    expect(advice[0].applicability).toContain("belge");
    expect(advice[0].caveat).toContain("Tournai");
  });

  it("returns type-sensitive pruning guidance only for the stated raspberry type", () => {
    expect(requestAdvice("Framboisier")).toEqual([]);
    expect(requestAdvice("Framboisier d’été")[0].message).toContain("de deux ans");
    expect(requestAdvice("Framboisier d’automne")[0].message).toContain("au ras du sol");
  });

  it("does not infer a crop from a partial or unlisted common name", () => {
    expect(requestAdvice("Tomaterie")).toEqual([]);
    expect(requestAdvice("Fraisier des bois")).toEqual([]);
    expect(requestAdvice("Chou kale")).toEqual([]);
  });

  it("makes included advice, actions, locality, and exact gaps auditable", () => {
    expect(cropCoverageManifest).toHaveLength(13);
    expect(cropCoverageManifest).toHaveLength(cropCatalog.length);
    expect(cropCoverageManifest.map((entry) => entry.crop)).toContain("Asperge");
    expect(cropCoverageManifest.find((entry) => entry.crop === "Asperge")?.seasonalActions).toEqual([]);
    expect(cropCoverageManifest.find((entry) => entry.crop === "Fraisier")?.seasonalActions).toContain("harvest-check");
    for (const entry of cropCatalog) {
      expect(entry.adviceSource.url).toMatch(/^https:\/\//);
      expect(entry.adviceSource.evidence.length).toBeGreaterThan(20);
      expect(entry.gaps.length).toBeGreaterThan(0);
    }
  });
});
