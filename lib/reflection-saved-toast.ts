export const REFLECTION_SAVED_TOAST_KEY = "lifolio_reflection_saved_toast";
export const REFLECTION_SAVED_EDIT_WINDOW_MS = 5 * 60 * 1000;

export interface ReflectionSavedToastPayload {
  decisionId: string;
  reflectionId: string;
  expiresAt: number;
}
