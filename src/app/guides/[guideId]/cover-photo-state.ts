export type CoverPhotoActionState = {
  error: string | null;
  success: string | null;
};

export const coverPhotoActionInitialState: CoverPhotoActionState = {
  error: null,
  success: null,
};
