"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Fab } from "@/components/Fab";
import { LoadError } from "@/components/LoadError";
import { DecisionStatusSheet } from "@/components/DecisionStatusSheet";
import { ActiveDecisionCard } from "@/components/home/ActiveDecisionCard";
import type { ActiveDecisionView } from "@/lib/active-decisions-data";
import type { DecisionCheckInStatus } from "@/lib/decision-status-presentation";

export default function ActiveDecisionsPage() {
  const [decisions, setDecisions] = useState<ActiveDecisionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [statusSheetDecisionId, setStatusSheetDecisionId] = useState<string | null>(null);
  const [statusUpdateError, setStatusUpdateError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch("/api/decisions/active")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(({ decisions }: { decisions: ActiveDecisionView[] }) => {
        if (!cancelled) setDecisions(decisions);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const handleStatusSelect = async (status: DecisionCheckInStatus) => {
    const decisionId = statusSheetDecisionId;
    if (!decisionId) return;
    setStatusSheetDecisionId(null);
    setStatusUpdateError(false);
    const previous = decisions;
    setDecisions((prev) =>
      prev.map((decision) => (decision.id === decisionId ? { ...decision, currentStatus: status } : decision)),
    );
    try {
      const res = await fetch(`/api/decisions/${decisionId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
    } catch {
      // Revert the optimistic update — the server never actually saved it.
      setDecisions(previous);
      setStatusUpdateError(true);
    }
  };

  return (
    <>
      <Header />
      <main className="pt-24 pb-24 px-4 md:px-gutter max-w-container-max mx-auto">
        <Link
          href="/home"
          className="text-primary hover:bg-primary/5 rounded-full transition-colors active:scale-95 duration-200 -ml-2 inline-flex items-center gap-1.5 w-fit px-2 py-2 mb-6"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="text-label-md pr-1">홈으로</span>
        </Link>

        <section className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary fill">
              analytics
            </span>
            <h1 className="text-headline-lg text-primary">진행 중인 의사결정</h1>
          </div>
          <p className="text-body-md text-on-surface-variant">
            아직 상담 중이거나, 결정은 내렸지만 회고 시점을 기다리고 있는 의사결정이에요.
          </p>
        </section>

        {statusUpdateError && (
          <p className="mb-6 px-4 py-3 rounded-lg bg-error/10 text-error text-body-md">
            상태 업데이트에 실패했어요. 다시 시도해주세요.
          </p>
        )}

        {loading ? (
          <p className="text-body-md text-on-surface-variant text-center py-16">불러오는 중...</p>
        ) : error ? (
          <LoadError onRetry={() => setAttempt((n) => n + 1)} />
        ) : decisions.length === 0 ? (
          <p className="text-body-md text-on-surface-variant text-center py-16">
            진행 중인 의사결정이 없어요.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {decisions.map((decision) => (
              <ActiveDecisionCard
                key={decision.id}
                decision={decision}
                onStatusUpdateClick={setStatusSheetDecisionId}
              />
            ))}
          </div>
        )}
      </main>
      <Fab />
      {statusSheetDecisionId && (
        <DecisionStatusSheet onSelect={handleStatusSelect} onClose={() => setStatusSheetDecisionId(null)} />
      )}
    </>
  );
}
