export type PlaceActionState = {
  error: string | null;
  success: string | null;
  placeId?: string | null;
};

export const placeActionInitialState: PlaceActionState = {
  error: null,
  success: null,
};
