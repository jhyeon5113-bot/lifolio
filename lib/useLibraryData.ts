"use client";

import { useCallback, useEffect, useState } from "react";
import type { DecisionCaseDetail, LibraryCase } from "@/lib/types";

interface LibraryData {
  cases: LibraryCase[];
  details: Record<string, DecisionCaseDetail>;
  loading: boolean;
  error: boolean;
  retry: () => void;
}

export function useLibraryData(): LibraryData {
  const [cases, setCases] = useState<LibraryCase[]>([]);
  const [details, setDetails] = useState<Record<string, DecisionCaseDetail>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    fetch("/api/cases")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load cases: ${res.status}`);
        return res.json();
      })
      .then((data: { cases: LibraryCase[]; details: Record<string, DecisionCaseDetail> }) => {
        if (cancelled) return;
        setCases(data.cases ?? []);
        setDetails(data.details ?? {});
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { cases, details, loading, error, retry };
}
