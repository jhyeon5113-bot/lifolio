"use client";

import { useEffect } from "react";

/** Renders nothing; records a view count for `id` once when mounted. */
export function RecordCaseView({ id }: { id: string }) {
  useEffect(() => {
    fetch(`/api/library/${id}/view`, { method: "POST" }).catch(() => {
      // Best-effort — a lost view count isn't worth surfacing to the user.
    });
  }, [id]);

  return null;
}
