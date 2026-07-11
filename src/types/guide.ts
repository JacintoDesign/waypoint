export type Guide = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  coverPhotoUrl: string | null;
  isPublic: boolean;
  slug: string;
};

export type GuideListItem = Guide & {
  coverPhotoSrc: string | null;
};

export type GuideCoverPhotoOption = {
  id: string;
  placeName: string;
  caption: string | null;
  storagePath: string;
  url: string;
  expiresAt: number;
  isSelected: boolean;
};

export type GuideRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover_photo_url: string | null;
  is_public: boolean;
  slug: string;
};
