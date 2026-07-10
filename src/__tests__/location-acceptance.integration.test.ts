import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { GET as getNearby } from "@/app/api/places/nearby/route";
import { GET as getInBounds } from "@/app/api/places/in-bounds/route";
import {
  emptyViewport,
  PLACE_A_DISTANCE_METERS,
  placeA,
  placeB,
  QUERY_POINT,
  viewportCoveringAOnly,
} from "@/__tests__/fixtures/places";

function loadEnvFile(path: string): void {
  if (!existsSync(path)) {
    return;
  }

  const contents = readFileSync(path, "utf8");
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(join(process.cwd(), ".env"));

const hasIntegrationEnv =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function buildNearbyRequest(): Request {
  const params = new URLSearchParams({
    lat: String(QUERY_POINT.lat),
    lng: String(QUERY_POINT.lng),
    radius: "1000",
    guideId: placeA.guideId,
  });
  return new Request(`http://localhost/api/places/nearby?${params.toString()}`);
}

function buildInBoundsRequest(bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}): Request {
  const params = new URLSearchParams({
    north: String(bounds.north),
    south: String(bounds.south),
    east: String(bounds.east),
    west: String(bounds.west),
    guideId: placeA.guideId,
  });
  return new Request(`http://localhost/api/places/in-bounds?${params.toString()}`);
}

describe.skipIf(!hasIntegrationEnv)("location acceptance API (integration)", () => {
  beforeAll(() => {
    if (!hasIntegrationEnv) {
      return;
    }
  });

  it("nearby: returns A within radius, omits B, distance within 5% of 500m", async () => {
    const response = await getNearby(buildNearbyRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.places).toHaveLength(1);
    expect(body.places[0].id).toBe(placeA.id);
    expect(body.places.map((place: { id: string }) => place.id)).not.toContain(
      placeB.id,
    );

    const reportedDistance = body.places[0].distanceMeters as number;
    const tolerance = PLACE_A_DISTANCE_METERS * 0.05;
    expect(reportedDistance).toBeGreaterThanOrEqual(
      PLACE_A_DISTANCE_METERS - tolerance,
    );
    expect(reportedDistance).toBeLessThanOrEqual(
      PLACE_A_DISTANCE_METERS + tolerance,
    );
  });

  it("on-screen: viewport covering A but not B returns A only", async () => {
    const response = await getInBounds(buildInBoundsRequest(viewportCoveringAOnly));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.places).toHaveLength(1);
    expect(body.places[0].id).toBe(placeA.id);
    expect(body.places[0].location).toEqual(placeA.location);
    expect(
      body.places.some((place: { id: string }) => place.id === placeB.id),
    ).toBe(false);
  });

  it("empty result: bounds far from all places returns empty array, not an error", async () => {
    const response = await getInBounds(buildInBoundsRequest(emptyViewport));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.places).toEqual([]);
  });
});
