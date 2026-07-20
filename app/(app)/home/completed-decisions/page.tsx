"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Fab } from "@/components/Fab";
import { LoadError } from "@/components/LoadError";
import { ReflectionTimelineSheet } from "@/components/ReflectionTimelineSheet";
import { CompletedDecisionCard } from "@/components/home/CompletedDecisionCard";
import type { CompletedDecisionView } from "@/lib/active-decisions-data";

const FULL_LIST_LIMIT = 500;

export default function CompletedDecisionsPage() {
  const [decisions, setDecisions] = useState<CompletedDecisionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [timelineDecision, setTimelineDecision] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(`/api/decisions/completed?limit=${FULL_LIST_LIMIT}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(({ decisions }: { decisions: CompletedDecisionView[] }) => {
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
              check_circle
            </span>
            <h1 className="text-headline-lg text-primary">회고 완료된 의사결정</h1>
          </div>
          <p className="text-body-md text-on-surface-variant">
            회고까지 마친 의사결정이에요. 카드를 눌러 지금까지의 회고를 다시 되돌아보거나 이어서 기록할 수 있어요.
          </p>
        </section>

        {loading ? (
          <p className="text-body-md text-on-surface-variant text-center py-16">불러오는 중...</p>
        ) : error ? (
          <LoadError onRetry={() => setAttempt((n) => n + 1)} />
        ) : decisions.length === 0 ? (
          <p className="text-body-md text-on-surface-variant text-center py-16">
            아직 회고를 완료한 결정이 없어요.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {decisions.map((decision) => (
              <CompletedDecisionCard
                key={decision.id}
                decision={decision}
                onTimelineClick={setTimelineDecision}
              />
            ))}
          </div>
        )}
      </main>
      <Fab />
      {timelineDecision && (
        <ReflectionTimelineSheet
          decisionId={timelineDecision.id}
          decisionTitle={timelineDecision.title}
          onClose={() => setTimelineDecision(null)}
        />
      )}
    </>
  );
}
