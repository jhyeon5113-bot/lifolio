"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadError } from "@/components/LoadError";
import { useEscapeToClose } from "@/lib/useEscapeToClose";
import type { ReflectionTimelineEntry } from "@/lib/reflection-timeline-data";
import { GOOD_DECISION_SATISFACTION_THRESHOLD } from "@/lib/satisfaction-thresholds";

const CHOICE_LABEL: Record<ReflectionTimelineEntry["wouldChooseAgain"], string> = {
  YES: "예",
  NO: "아니오",
  UNSURE: "미정",
};

function satisfactionEmoji(satisfaction: number): string {
  if (satisfaction >= GOOD_DECISION_SATISFACTION_THRESHOLD) return "😊";
  if (satisfaction >= 40) return "😐";
  return "😕";
}

export function ReflectionTimelineSheet({
  decisionId,
  decisionTitle,
  onClose,
}: {
  decisionId: string;
  decisionTitle: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<ReflectionTimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEscapeToClose(onClose);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(`/api/decisions/${decisionId}/reflections`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(({ timeline }: { timeline: ReflectionTimelineEntry[] }) => {
        if (!cancelled) setEntries(timeline);
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
  }, [decisionId, attempt]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-primary/20 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-surface rounded-t-3xl p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] shadow-[0_-20px_50px_rgba(0,6,102,0.12)] animate-pop"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-outline-variant rounded-full mx-auto mb-6" />
        <h2 className="text-headline-md text-primary text-center mb-1">
          {decisionTitle}
        </h2>
        <p className="text-label-md text-outline text-center mb-6">
          회고 타임라인
        </p>

        {loading ? (
          <p className="text-body-md text-on-surface-variant text-center py-10">
            불러오는 중...
          </p>
        ) : error ? (
          <LoadError onRetry={() => setAttempt((n) => n + 1)} />
        ) : entries.length === 0 ? (
          <p className="text-body-md text-on-surface-variant text-center py-10">
            아직 회고 기록이 없어요.
          </p>
        ) : (
          <div className="flex flex-col gap-3 mb-6">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="border border-outline-variant/30 rounded-2xl p-4 bg-white"
              >
                <p className="text-label-md text-outline mb-2">
                  📅 {entry.date} ({entry.monthsAfterLabel})
                </p>
                <p className="text-body-md text-on-surface mb-1">
                  {satisfactionEmoji(entry.satisfaction)} 만족도 {entry.satisfaction}
                </p>
                <p className="text-body-md text-on-surface mb-2">
                  ↺ 다시 선택 : {CHOICE_LABEL[entry.wouldChooseAgain]}
                </p>
                {entry.chooseAgainReasonExcerpt && (
                  <p className="text-body-md text-on-surface-variant italic line-clamp-2">
                    &ldquo;{entry.chooseAgainReasonExcerpt}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => router.push(`/capsule?decisionId=${decisionId}`)}
          className="w-full py-3.5 text-label-md text-on-primary bg-primary rounded-xl active:scale-95 transition-all"
        >
          다시 회고하기
        </button>
      </div>
    </div>
  );
}
