import { describe, expect, it } from "vitest";
import migration from "../../supabase/migrations/0001_private_gardens.sql?raw";
import headers from "../../public/_headers?raw";

describe("private storage and static hosting boundaries", () => {
  it("keeps every garden operation authenticated and owner-scoped in the migration", () => {
    expect(migration).toMatch(/alter table public\.gardens enable row level security/i);
    expect(migration).toMatch(/revoke all on public\.gardens from anon/i);
    expect(migration).toMatch(
      /grant select,\s*insert,\s*update,\s*delete on public\.gardens to authenticated/i,
    );

    for (const operation of ["select", "insert", "update", "delete"]) {
      const policyBlock = migration.match(
        new RegExp(
          `create policy "[^"]+"\\s+on public\\.gardens for ${operation}([\\s\\S]*?)(?=create policy|$)`,
          "i",
        ),
      );
      expect(policyBlock, `a ${operation} policy must exist`).not.toBeNull();
      expect(policyBlock?.[1]).toMatch(/to authenticated/i);
      expect(policyBlock?.[1]).toMatch(/auth\.uid\(\)\)*\s*=\s*owner_id/i);
    }
    expect(migration).not.toMatch(/to anon/i);
  });

  it("keeps static shell security headers and prevents caching the HTML entry point", () => {
    expect(headers).toContain("X-Content-Type-Options: nosniff");
    expect(headers).toContain("X-Frame-Options: DENY");
    expect(headers).toContain("Referrer-Policy: strict-origin-when-cross-origin");
    expect(headers).toContain("/index.html");
    expect(headers).toContain("Cache-Control: no-cache");
  });
});
