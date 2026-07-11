import { NextResponse } from "next/server";
import { PLACE_CARD_PHOTO_TRANSFORM } from "@/lib/place-photos";
import { getSignedPhotoById } from "@/queries/photos";

type RouteContext = {
  params: Promise<{ photoId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { photoId } = await context.params;
  const variant = new URL(request.url).searchParams.get("variant");

  try {
    const photo = await getSignedPhotoById(photoId, {
      transform: variant === "full" ? undefined : PLACE_CARD_PHOTO_TRANSFORM,
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    return NextResponse.json({
      url: photo.url,
      expiresAt: photo.expiresAt,
    });
  } catch (error) {
    console.error("getSignedPhotoById failed", error);
    return NextResponse.json(
      { error: "Failed to sign photo URL" },
      { status: 500 },
    );
  }
}
