import { describe, expect, it } from "vitest";
import { requestAdvice } from "./guidance";

describe("requested garden advice", () => {
  it("returns sourced caveated advice for a known local seasonal fact", () => {
    const advice = requestAdvice("Fraisier");
    expect(advice).toHaveLength(1);
    expect(advice[0].sourceUrl).toContain("velt.nu");
    expect(advice[0].caveat).toContain("variété");
  });

  it("does not invent advice for an unknown plant name", () => {
    expect(requestAdvice("Tomate")).toEqual([]);
  });
});
