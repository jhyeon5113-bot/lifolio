"use client";

import { useCallback, useEffect, useState } from "react";

function readStoredIds(storageKey: string): string[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

/** Persists a toggleable set of case ids (bookmarks, likes, ...) to localStorage. */
export function useLocalIdSet(storageKey: string) {
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIds(new Set(readStoredIds(storageKey)));
  }, [storageKey]);

  const toggle = useCallback(
    (id: string) => {
      setIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        try {
          window.localStorage.setItem(storageKey, JSON.stringify([...next]));
        } catch {
          // Private-browsing storage limits, quota exceeded, etc. — the
          // toggle still reflects in-memory state for this session even if
          // it can't persist.
        }
        return next;
      });
    },
    [storageKey],
  );

  const has = useCallback((id: string) => ids.has(id), [ids]);

  return { ids, has, toggle };
}
