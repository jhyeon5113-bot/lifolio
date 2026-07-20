"use client";

import { useCallback, useEffect, useState } from "react";

// Server-backed (CaseLike table) so a like is visible to every viewer, not
// just the browser that clicked it — see lib/case-engagement.ts. Keeps the
// same {likedIds, isLiked, toggleLiked} shape the old localStorage-only
// version had, so call sites didn't need to change.
export function useLikedCases() {
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/library/mine-likes")
      .then((res) => (res.ok ? res.json() : { caseIds: [] }))
      .then(({ caseIds }: { caseIds: string[] }) => setLikedIds(new Set(caseIds)))
      .catch(() => {});
  }, []);

  const isLiked = useCallback((id: string) => likedIds.has(id), [likedIds]);

  const toggleLiked = useCallback((id: string) => {
    // Captured from the updater callback (guaranteed to see the latest
    // state) so a failed request can restore exactly what this click
    // started from, rather than blindly re-flipping whatever the set
    // happens to contain by the time the response comes back.
    let wasLiked = false;
    setLikedIds((prev) => {
      wasLiked = prev.has(id);
      const next = new Set(prev);
      if (wasLiked) next.delete(id);
      else next.add(id);
      return next;
    });

    fetch(`/api/library/${id}/like`, { method: "POST" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(({ liked }: { liked: boolean }) => {
        // Reconcile with the server's actual result rather than trust the
        // optimistic flip blindly — e.g. two rapid clicks queued before
        // either response lands could otherwise leave the UI out of sync.
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (liked) next.add(id);
          else next.delete(id);
          return next;
        });
      })
      .catch(() => {
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (wasLiked) next.add(id);
          else next.delete(id);
          return next;
        });
      });
  }, []);

  return { likedIds, isLiked, toggleLiked };
}
