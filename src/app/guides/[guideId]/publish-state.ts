export type PublishActionState = {
  error: string | null;
  success: string | null;
};

export const publishActionInitialState: PublishActionState = {
  error: null,
  success: null,
};
