import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("get_places_in_bounds migration", () => {
  const sql = readFileSync(
    join(
      process.cwd(),
      "supabase/migrations/20260709200000_get_places_in_bounds.sql",
    ),
    "utf8",
  );

  it("filters spatially in the database using GiST-friendly operators", () => {
    expect(sql).toContain("p.location && b.bbox");
    expect(sql).toContain("ST_Intersects(p.location, b.bbox)");
    expect(sql).toContain("ST_MakeEnvelope(p_west, p_south, p_east, p_north, 4326)");
    expect(sql).not.toMatch(/latitude\s+between/i);
  });
});
