import { NextResponse } from "next/server";
import { getSignedPhotoById } from "@/queries/photos";

type RouteContext = {
  params: Promise<{ photoId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { photoId } = await context.params;

  try {
    const photo = await getSignedPhotoById(photoId);

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
