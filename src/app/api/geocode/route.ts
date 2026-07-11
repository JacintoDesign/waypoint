import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { forwardGeocode } from "@/lib/geocode";

const geocodeQuerySchema = z.object({
  q: z.string().trim().min(3).max(200),
});

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = geocodeQuerySchema.safeParse({
    q: searchParams.get("q"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const location = await forwardGeocode(parsed.data.q);
    return NextResponse.json({ location, query: parsed.data.q });
  } catch (error) {
    console.error("forwardGeocode failed", error);
    return NextResponse.json(
      { error: "Failed to geocode location" },
      { status: 500 },
    );
  }
}
