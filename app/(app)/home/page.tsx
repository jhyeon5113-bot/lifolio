"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Header } from "@/components/Header";
import { Fab } from "@/components/Fab";
import { LoadError } from "@/components/LoadError";
import { LibraryCaseCard } from "@/components/LibraryCaseCard";
import { PendingReflectionCard } from "@/components/home/PendingReflectionCard";
import { ActiveDecisionCard } from "@/components/home/ActiveDecisionCard";
import { CompletedDecisionCard } from "@/components/home/CompletedDecisionCard";
import { currentUser } from "@/lib/mock-data";
import type { PendingReflection, LibraryCase } from "@/lib/types";
import type { ActiveDecisionView, CompletedDecisionView } from "@/lib/active-decisions-data";
import type { DecisionCheckInStatus } from "@/lib/decision-status-presentation";
import {
  REFLECTION_SAVED_TOAST_KEY,
  type ReflectionSavedToastPayload,
} from "@/lib/reflection-saved-toast";
import { toPendingReflections, type PendingReflectionDecision } from "@/lib/pending-reflection-view";
import { useSavedCases } from "@/lib/useSavedCases";
import { useLikedCases } from "@/lib/useLikedCases";

const DISMISS_KEY = "lifolio_capsule_dismissed";

// Overlays that only ever mount after user interaction or an async fetch —
// never needed for the initial paint, so split them out of the /home bundle
// instead of loading their code up front.
const TimeCapsuleModal = dynamic(() => import("@/components/TimeCapsuleModal").then((m) => m.TimeCapsuleModal), {
  ssr: false,
});
const DecisionStatusSheet = dynamic(
  () => import("@/components/DecisionStatusSheet").then((m) => m.DecisionStatusSheet),
  { ssr: false },
);
const ReflectionTimelineSheet = dynamic(
  () => import("@/components/ReflectionTimelineSheet").then((m) => m.ReflectionTimelineSheet),
  { ssr: false },
);
const ReflectionSavedToast = dynamic(
  () => import("@/components/ReflectionSavedToast").then((m) => m.ReflectionSavedToast),
  { ssr: false },
);

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userName = session?.user?.name ?? currentUser.name;
  const [showCapsuleModal, setShowCapsuleModal] = useState(false);
  const [pendingReflections, setPendingReflections] = useState<PendingReflection[]>([]);
  const [activeDecisions, setActiveDecisions] = useState<ActiveDecisionView[]>([]);
  const [completedDecisions, setCompletedDecisions] = useState<CompletedDecisionView[]>([]);
  const [todaysReading, setTodaysReading] = useState<LibraryCase[]>([]);
  const [statusSheetDecisionId, setStatusSheetDecisionId] = useState<string | null>(null);
  const [justUpdatedId, setJustUpdatedId] = useState<string | null>(null);
  const [timelineDecision, setTimelineDecision] = useState<{ id: string; title: string } | null>(null);
  const [savedToast, setSavedToast] = useState<ReflectionSavedToastPayload | null>(null);
  const [activeError, setActiveError] = useState(false);
  const [completedError, setCompletedError] = useState(false);
  const [readingError, setReadingError] = useState(false);
  const [pendingError, setPendingError] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const { isSaved, toggleSaved } = useSavedCases();
  const { isLiked, toggleLiked } = useLikedCases();

  useEffect(() => {
    const raw = sessionStorage.getItem(REFLECTION_SAVED_TOAST_KEY);
    if (!raw) return;
    try {
      const payload: ReflectionSavedToastPayload = JSON.parse(raw);
      if (payload.expiresAt > Date.now()) {
        setSavedToast(payload);
      } else {
        sessionStorage.removeItem(REFLECTION_SAVED_TOAST_KEY);
      }
    } catch {
      sessionStorage.removeItem(REFLECTION_SAVED_TOAST_KEY);
    }
  }, []);

  const dismissSavedToast = () => {
    sessionStorage.removeItem(REFLECTION_SAVED_TOAST_KEY);
    setSavedToast(null);
  };

  const handleSavedToastEdit = () => {
    if (!savedToast) return;
    const { decisionId, reflectionId } = savedToast;
    dismissSavedToast();
    router.push(`/capsule?decisionId=${decisionId}&reflectionId=${reflectionId}`);
  };

  useEffect(() => {
    let cancelled = false;
    setActiveError(false);
    fetch("/api/decisions/active")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(({ decisions }: { decisions: ActiveDecisionView[] }) => {
        if (!cancelled) setActiveDecisions(decisions);
      })
      .catch(() => {
        if (!cancelled) setActiveError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [retryTick]);

  useEffect(() => {
    let cancelled = false;
    setCompletedError(false);
    fetch("/api/decisions/completed")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(({ decisions }: { decisions: CompletedDecisionView[] }) => {
        if (!cancelled) setCompletedDecisions(decisions);
      })
      .catch(() => {
        if (!cancelled) setCompletedError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [retryTick]);

  useEffect(() => {
    let cancelled = false;
    setReadingError(false);
    fetch("/api/library/today")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(({ cases }: { cases: LibraryCase[] }) => {
        if (!cancelled) setTodaysReading(cases);
      })
      .catch(() => {
        if (!cancelled) setReadingError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [retryTick]);

  useEffect(() => {
    let cancelled = false;
    setPendingError(false);
    fetch("/api/decisions/pending-reflection")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(({ decisions }: { decisions: PendingReflectionDecision[] }) => {
        if (!cancelled) setPendingReflections(toPendingReflections(decisions));
      })
      .catch(() => {
        if (!cancelled) setPendingError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [retryTick]);

  useEffect(() => {
    if (pendingReflections.length === 0) return;
    if (savedToast) return; // don't stack two centered overlays
    if (sessionStorage.getItem(DISMISS_KEY) !== "1") {
      const timer = setTimeout(() => setShowCapsuleModal(true), 600);
      return () => clearTimeout(timer);
    }
  }, [pendingReflections, savedToast]);

  const dismissModal = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setShowCapsuleModal(false);
  };

  const handleStatusSelect = async (status: DecisionCheckInStatus) => {
    const decisionId = statusSheetDecisionId;
    if (!decisionId) return;
    setStatusSheetDecisionId(null);
    const previous = activeDecisions;
    setActiveDecisions((prev) =>
      prev.map((decision) => (decision.id === decisionId ? { ...decision, currentStatus: status } : decision)),
    );
    setJustUpdatedId(decisionId);
    setTimeout(() => {
      setJustUpdatedId((current) => (current === decisionId ? null : current));
    }, 1500);
    try {
      const res = await fetch(`/api/decisions/${decisionId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
    } catch {
      // Revert the optimistic update — the server never actually saved it.
      setActiveDecisions(previous);
    }
  };

  return (
    <>
      <Header />
      <main className="pt-24 max-w-container-max mx-auto px-4 md:px-gutter">
        <section className="mb-8">
          <Link
            href="/consult"
            className="bg-primary-container text-on-primary-container p-6 rounded-2xl shadow-lg border border-primary/20 flex items-center justify-between group cursor-pointer hover:bg-primary transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-white fill">
                  psychology
                </span>
              </div>
              <div>
                <h3 className="text-title-lg text-white mb-1">
                  새로운 고민 시작하기
                </h3>
                <p className="text-label-md text-on-primary-container/80">
                  AI와 함께 최선의 선택을 찾아보세요
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-white text-3xl group-hover:translate-x-2 transition-transform">
              arrow_forward
            </span>
          </Link>
        </section>

        <section className="mb-10">
          <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-surface tracking-tight leading-snug">
            안녕하세요, <span className="text-primary">{userName}</span>
            님.
            <br />
            기록은 더 나은 선택으로 이어집니다.
          </h1>
        </section>

        <div className="flex flex-col gap-gutter">
          {/* Pending reflections */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary fill">
                  pending_actions
                </span>
                <h2 className="text-label-sm uppercase tracking-wider text-outline">
                  회고 대기 중
                </h2>
              </div>
              <Link
                href="/home/pending-reflections"
                className="text-label-md text-primary-container flex items-center gap-1 hover:underline"
              >
                전체보기{" "}
                <span className="material-symbols-outlined text-sm">
                  chevron_right
                </span>
              </Link>
            </div>
            <div className="flex overflow-x-auto gap-u-md hide-scrollbar pb-4 snap-x">
              {pendingError ? (
                <LoadError className="min-w-[300px]" onRetry={() => setRetryTick((n) => n + 1)} />
              ) : (
                <>
                  {pendingReflections.length === 0 && (
                    <div className="min-w-[300px] md:min-w-[400px] snap-start h-full flex flex-col items-center justify-center text-center py-10 gap-2 border border-outline-variant p-u-md rounded-xl shadow-sm bg-white">
                      <span className="material-symbols-outlined text-3xl text-outline">
                        task_alt
                      </span>
                      <p className="text-body-md text-on-surface-variant">
                        아직 회고할 결정이 없어요.
                      </p>
                      <p className="text-label-sm text-outline">
                        최종 선택을 마치면 여기에 표시됩니다.
                      </p>
                    </div>
                  )}
                  {pendingReflections.map((item) => (
                    <PendingReflectionCard
                      key={item.id}
                      item={item}
                      className="min-w-[300px] md:min-w-[400px] snap-start"
                    />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Active decisions */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary fill">
                  analytics
                </span>
                <h2 className="text-label-sm uppercase tracking-wider text-outline">
                  진행 중인 의사결정
                </h2>
              </div>
              <Link
                href="/home/active-decisions"
                className="text-label-md text-primary-container flex items-center gap-1 hover:underline"
              >
                전체보기{" "}
                <span className="material-symbols-outlined text-sm">
                  chevron_right
                </span>
              </Link>
            </div>
            <div className="flex items-start overflow-x-auto gap-u-md hide-scrollbar pb-4 snap-x">
              {activeError ? (
                <LoadError onRetry={() => setRetryTick((n) => n + 1)} />
              ) : (
                <>
                  {activeDecisions.length === 0 && (
                    <p className="text-body-md text-on-surface-variant py-6">
                      진행 중인 의사결정이 없어요.
                    </p>
                  )}
                  {activeDecisions.map((decision) => (
                    <ActiveDecisionCard
                      key={decision.id}
                      decision={decision}
                      onStatusUpdateClick={setStatusSheetDecisionId}
                      justUpdated={decision.id === justUpdatedId}
                      className="min-w-[280px] md:min-w-[340px] snap-start"
                    />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Completed (reflected-on) decisions */}
          {(completedDecisions.length > 0 || completedError) && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary fill">
                    check_circle
                  </span>
                  <h2 className="text-label-sm uppercase tracking-wider text-outline">
                    회고 완료된 의사결정
                  </h2>
                </div>
                <Link
                  href="/home/completed-decisions"
                  className="text-label-md text-primary-container flex items-center gap-1 hover:underline"
                >
                  전체보기{" "}
                  <span className="material-symbols-outlined text-sm">
                    chevron_right
                  </span>
                </Link>
              </div>
              <div className="flex overflow-x-auto gap-u-md hide-scrollbar pb-4 snap-x">
                {completedError ? (
                  <LoadError onRetry={() => setRetryTick((n) => n + 1)} />
                ) : (
                  completedDecisions.map((decision) => (
                    <CompletedDecisionCard
                      key={decision.id}
                      decision={decision}
                      onTimelineClick={setTimelineDecision}
                      className="min-w-[300px] md:min-w-[360px] snap-start"
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <section className="mt-gutter">
          <div className="relative overflow-hidden rounded-2xl bg-inverse-surface text-white p-u-md md:p-u-lg flex flex-col md:flex-row items-center gap-6 shadow-lg">
            <div className="relative z-10 w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-3xl text-white fill">
                psychology
              </span>
            </div>
            <div className="relative z-10 text-center md:text-left">
              <h4 className="text-label-sm text-primary-fixed mb-1 uppercase tracking-widest">
                오늘의 AI 인사이트
              </h4>
              <p className="text-body-lg leading-snug max-w-2xl">
                &ldquo;최근 3개월간, 감정적일 때의 선택보다{" "}
                <span className="text-secondary-fixed font-bold underline underline-offset-4 decoration-2">
                  논리적 분석 시 만족도가 40% 더 높았습니다.
                </span>
                &rdquo;
              </p>
            </div>
          </div>
        </section>

        <section className="mt-gutter mb-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary fill">
              auto_stories
            </span>
            <h2 className="text-label-sm uppercase tracking-wider text-outline">
              오늘의 읽을거리
            </h2>
          </div>
          {readingError ? (
            <LoadError onRetry={() => setRetryTick((n) => n + 1)} />
          ) : todaysReading.length === 0 ? (
            <p className="text-body-md text-on-surface-variant py-6">
              오늘 추천할 사례를 준비 중이에요.
            </p>
          ) : (
            <div className="max-w-[400px]">
              <LibraryCaseCard
                item={todaysReading[0]}
                hasDetail
                saved={isSaved(todaysReading[0].id)}
                onToggleSave={toggleSaved}
                liked={isLiked(todaysReading[0].id)}
                onToggleLike={toggleLiked}
              />
            </div>
          )}
        </section>
      </main>
      <Fab />
      {showCapsuleModal && pendingReflections[0] && (
        <TimeCapsuleModal
          reflection={pendingReflections[0]}
          onClose={dismissModal}
        />
      )}
      {statusSheetDecisionId && (
        <DecisionStatusSheet
          onSelect={handleStatusSelect}
          onClose={() => setStatusSheetDecisionId(null)}
        />
      )}
      {timelineDecision && (
        <ReflectionTimelineSheet
          decisionId={timelineDecision.id}
          decisionTitle={timelineDecision.title}
          onClose={() => setTimelineDecision(null)}
        />
      )}
      {savedToast && (
        <ReflectionSavedToast onEdit={handleSavedToastEdit} onClose={dismissSavedToast} />
      )}
    </>
  );
}
