"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Fab } from "@/components/Fab";
import { LoadError } from "@/components/LoadError";
import { PendingReflectionCard } from "@/components/home/PendingReflectionCard";
import { toPendingReflections, type PendingReflectionDecision } from "@/lib/pending-reflection-view";
import type { PendingReflection } from "@/lib/types";

export default function PendingReflectionsPage() {
  const [items, setItems] = useState<PendingReflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch("/api/decisions/pending-reflection")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(({ decisions }: { decisions: PendingReflectionDecision[] }) => {
        if (!cancelled) setItems(toPendingReflections(decisions));
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
              pending_actions
            </span>
            <h1 className="text-headline-lg text-primary">회고 대기 중</h1>
          </div>
          <p className="text-body-md text-on-surface-variant">
            최종 선택을 마쳤지만 아직 회고를 남기지 않은 의사결정이에요.
          </p>
        </section>

        {loading ? (
          <p className="text-body-md text-on-surface-variant text-center py-16">불러오는 중...</p>
        ) : error ? (
          <LoadError onRetry={() => setAttempt((n) => n + 1)} />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center text-center gap-2 py-16">
            <span className="material-symbols-outlined text-3xl text-outline">
              task_alt
            </span>
            <p className="text-body-md text-on-surface-variant">아직 회고할 결정이 없어요.</p>
            <p className="text-label-sm text-outline">최종 선택을 마치면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <PendingReflectionCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
      <Fab />
    </>
  );
}
