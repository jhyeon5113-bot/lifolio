"use client";

import { useLocalIdSet } from "./useLocalIdSet";

const STORAGE_KEY = "lifolio:savedCaseIds";

export function useSavedCases() {
  const { ids: savedIds, has: isSaved, toggle: toggleSaved } = useLocalIdSet(STORAGE_KEY);
  return { savedIds, isSaved, toggleSaved };
}
