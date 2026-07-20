"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import {
  REFLECTION_SAVED_TOAST_KEY,
  REFLECTION_SAVED_EDIT_WINDOW_MS,
  type ReflectionSavedToastPayload,
} from "@/lib/reflection-saved-toast";

const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBUkZ2t_ii-s10x_d3FsunUzoUA4qbdLlQ8ynKaoK2cI_FQCD_DMtzo59Ob6AXvUDsPgp5IrrYGOhZ-wpu7X-PokNNp2hyRaEYNZQbdUETyTjlx06yoJ0zy49XVyMgNPlVqUmegGxFMd7-4boUpPtZsishS7XMRgKUT1_U_t4JXJDy4U0skQWYWrDyuzazpJ6mY9qKPVY4pvhu639bdiSYQKQk9kP3YXiEr6WITYG6YK89o-uv1NLBl";

interface CapsuleDecision {
  id: string;
  title: string;
  finalChoice: string | null;
  createdAt: string;
  expectedReflectionDate: string | null;
}

interface ReflectionDetail {
  id: string;
  satisfaction: number;
  wouldChooseAgain: "YES" | "NO" | "UNSURE";
  actualResult: string;
  actualVsExpected: string;
  chooseAgainReason: string | null;
  reason: string | null;
}

function EmptyState({ loadFailed, onRetry }: { loadFailed?: boolean; onRetry?: () => void } = {}) {
  const router = useRouter();
  return (
    <>
      <Header />
      <main className="pt-32 pb-24 flex flex-col items-center text-center gap-4 px-6">
        <span className="material-symbols-outlined text-4xl text-outline">
          {loadFailed ? "error_outline" : "task_alt"}
        </span>
        <h1 className="text-headline-md text-primary">
          {loadFailed ? "불러오지 못했어요" : "회고할 결정이 없어요"}
        </h1>
        <p className="text-body-md text-on-surface-variant max-w-[400px]">
          {loadFailed
            ? "네트워크 문제로 결정을 불러오지 못했어요. 다시 시도해주세요."
            : "아직 최종 선택을 마친 고민이 없으신 것 같아요. 상담을 통해 결정을 내리면 이곳에서 회고를 남길 수 있어요."}
        </p>
        {loadFailed && onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 px-6 py-3 bg-primary text-white rounded-xl text-label-md active:scale-95 transition-all"
          >
            다시 시도
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push("/home")}
            className="mt-4 px-6 py-3 bg-primary text-white rounded-xl text-label-md active:scale-95 transition-all"
          >
            홈으로 돌아가기
          </button>
        )}
      </main>
    </>
  );
}

function CapsuleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const decisionId = searchParams.get("decisionId");
  const reflectionId = searchParams.get("reflectionId");
  const isEditMode = Boolean(reflectionId);

  const [decision, setDecision] = useState<CapsuleDecision | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [satisfaction, setSatisfaction] = useState(85);
  const [choice, setChoice] = useState<"yes" | "no">("yes");
  const [reflection, setReflection] = useState("");
  const [expectationGap, setExpectationGap] = useState("");
  const [chooseAgainReason, setChooseAgainReason] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!decisionId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadFailed(false);
    // 404 means "genuinely doesn't exist / not yours" — no point retrying,
    // falls through to the normal EmptyState. Anything else (network error,
    // 5xx) is transient and gets the retry-capable loadFailed state instead.
    const fetchOrNotFound = (url: string) =>
      fetch(url).then((res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      });

    Promise.all([
      fetchOrNotFound(`/api/decisions/${decisionId}`),
      reflectionId ? fetchOrNotFound(`/api/reflections/${reflectionId}`) : Promise.resolve(null),
    ])
      .then(([decisionData, reflectionData]: [CapsuleDecision | null, ReflectionDetail | null]) => {
        setDecision(decisionData);
        if (reflectionData) {
          setSatisfaction(reflectionData.satisfaction);
          setChoice(reflectionData.wouldChooseAgain === "NO" ? "no" : "yes");
          setReflection(reflectionData.actualResult);
          setExpectationGap(reflectionData.actualVsExpected);
          setChooseAgainReason(reflectionData.chooseAgainReason ?? "");
          setMessage(reflectionData.reason ?? "");
        }
      })
      .catch(() => setLoadFailed(true))
      .finally(() => setLoading(false));
  }, [decisionId, reflectionId, loadAttempt]);

  const handleSubmit = async () => {
    if (!decisionId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(
        isEditMode ? `/api/reflections/${reflectionId}` : `/api/decisions/${decisionId}/reflection`,
        {
          method: isEditMode ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            satisfaction,
            wouldChooseAgain: choice === "yes" ? "YES" : "NO",
            actualResult: reflection,
            actualVsExpected: expectationGap,
            chooseAgainReason: chooseAgainReason || undefined,
            reason: message || undefined,
          }),
        },
      );
      if (!res.ok) {
        setSubmitError("회고 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
        return;
      }
      if (!isEditMode) {
        const created = await res.json();
        const payload: ReflectionSavedToastPayload = {
          decisionId,
          reflectionId: created.id,
          expiresAt: Date.now() + REFLECTION_SAVED_EDIT_WINDOW_MS,
        };
        try {
          sessionStorage.setItem(REFLECTION_SAVED_TOAST_KEY, JSON.stringify(payload));
        } catch {
          // The reflection is already saved server-side at this point —
          // losing the "you can still edit this" toast isn't worth failing
          // the whole submit over.
        }
      }
      router.push("/home");
    } catch {
      setSubmitError("네트워크 오류로 저장하지 못했어요. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-32 pb-24 flex items-center justify-center">
          <p className="text-body-md text-on-surface-variant">불러오는 중...</p>
        </main>
      </>
    );
  }

  if (!decisionId || !decision) {
    return (
      <EmptyState
        loadFailed={Boolean(decisionId) && loadFailed}
        onRetry={() => setLoadAttempt((n) => n + 1)}
      />
    );
  }

  const decisionDaysAgo = Math.max(
    0,
    Math.floor((Date.now() - new Date(decision.createdAt).getTime()) / 86400000),
  );
  const reflectionDaysElapsed = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(decision.expectedReflectionDate ?? decision.createdAt).getTime()) / 86400000,
    ),
  );

  return (
    <>
      <Header />
      <main className="relative pt-16 pb-24 lg:pb-16 flex flex-col items-center">
        <div className="w-full max-w-container-max px-grid-margin mt-12 mb-16 flex flex-col gap-12 items-start">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary-container hover:opacity-80 transition-opacity active:scale-95"
          >
            <span className="material-symbols-outlined text-[24px]">
              arrow_back
            </span>
          </button>

          <div className="w-full flex flex-col lg:flex-row gap-12">
            {/* Left: Emotional context */}
            <div className="w-full lg:w-1/2 flex flex-col gap-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-label-md w-fit">
                <span className="material-symbols-outlined text-[16px]">
                  schedule
                </span>
                {reflectionDaysElapsed}일 경과
              </div>
              <h2 className="text-headline-lg lg:text-[42px] leading-tight text-primary">
                {decisionDaysAgo}일 전 당신은 <br />
                <span className="text-secondary italic">{decision.title}</span>
                을 결정했습니다.
              </h2>
              <p className="text-body-lg text-on-surface-variant max-w-[500px]">
                시간이 흘러 타임캡슐이 열렸습니다. 그때의 다짐과 지금의
                감정은 어떤 차이가 있나요? 당신의 발자취를 돌아보며 현재를
                기록해보세요.
              </p>
              <div className="relative mt-4">
                <div className="relative overflow-hidden rounded-2xl h-80 shadow-2xl">
                  <Image
                    src={HERO_IMAGE}
                    alt="그때의 기록"
                    fill
                    sizes="(min-width: 1024px) 500px, 100vw"
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8 text-white">
                    <span className="text-label-md opacity-80 uppercase tracking-widest">
                      Your Choice
                    </span>
                    <p className="text-headline-md mt-2">
                      &ldquo;{decision.finalChoice ?? decision.title}&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Reflection form */}
            <div className="w-full lg:w-1/2 glass-card rounded-3xl p-8 lg:p-10 shadow-[0_40px_80px_rgba(26,35,126,0.06)] flex flex-col gap-10 border border-white/40">
              <div className="flex flex-col gap-4">
                <label className="text-headline-md text-primary" htmlFor="reflection">
                  실제 결과 <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="reflection"
                    className="w-full bg-white/80 border border-outline-variant/30 rounded-2xl p-6 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-on-surface resize-none"
                    placeholder="실제로 어떤 일이 있었나요?"
                    rows={4}
                    maxLength={500}
                    value={reflection}
                    onChange={(event) => setReflection(event.target.value)}
                  />
                  <div className="absolute bottom-4 right-4 text-outline text-[12px]">
                    {reflection.length} / 500
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-headline-md text-primary" htmlFor="expectationGap">
                  선택하고 살아보니 무엇이 달랐나요? <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="expectationGap"
                    className="w-full bg-white/80 border border-outline-variant/30 rounded-2xl p-6 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-on-surface resize-none"
                    placeholder="그때 예상했던 모습과 실제로 살아보니 달랐던 점을 적어주세요."
                    rows={4}
                    maxLength={500}
                    value={expectationGap}
                    onChange={(event) => setExpectationGap(event.target.value)}
                  />
                  <div className="absolute bottom-4 right-4 text-outline text-[12px]">
                    {expectationGap.length} / 500
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-end">
                  <label className="text-headline-md text-primary" htmlFor="satisfaction">
                    지금은 어떠신가요? <span className="text-error">*</span>
                  </label>
                  <span className="text-display-lg text-secondary">
                    {satisfaction}
                  </span>
                </div>
                <div className="relative w-full h-8 flex items-center">
                  <div className="absolute w-full h-1.5 bg-surface-variant rounded-full" />
                  <div
                    className="absolute h-1.5 bg-primary rounded-full pointer-events-none"
                    style={{ width: `${satisfaction}%` }}
                  />
                  <input
                    id="satisfaction"
                    className="absolute w-full h-8 bg-transparent appearance-none z-10 cursor-pointer accent-primary"
                    max={100}
                    min={0}
                    type="range"
                    value={satisfaction}
                    onChange={(event) =>
                      setSatisfaction(Number(event.target.value))
                    }
                  />
                </div>
                <div className="flex justify-between text-label-md text-outline">
                  <span>아직은 낯설어요</span>
                  <span>기대 이상이에요</span>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <label className="text-headline-md text-primary">
                  다시 돌아가도 같은 결정을 하실 건가요? <span className="text-error">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setChoice("yes")}
                    className={`flex flex-col items-center justify-center p-3 sm:p-6 rounded-2xl border-2 transition-all active:scale-95 ${
                      choice === "yes"
                        ? "border-primary bg-primary/5"
                        : "border-surface-variant hover:border-primary bg-white/50"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[28px] sm:text-[32px] mb-2 fill ${
                        choice === "yes" ? "text-primary" : "text-outline"
                      }`}
                    >
                      check_circle
                    </span>
                    <span
                      className={`text-label-sm sm:text-label-md text-center ${
                        choice === "yes" ? "text-primary" : "text-on-surface-variant"
                      }`}
                    >
                      네, 후회 없어요
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChoice("no")}
                    className={`flex flex-col items-center justify-center p-3 sm:p-6 rounded-2xl border-2 transition-all active:scale-95 ${
                      choice === "no"
                        ? "border-error bg-error/5"
                        : "border-surface-variant hover:border-error bg-white/50"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[28px] sm:text-[32px] mb-2 ${
                        choice === "no" ? "text-error fill" : "text-outline"
                      }`}
                    >
                      cancel
                    </span>
                    <span
                      className={`text-label-sm sm:text-label-md text-center ${
                        choice === "no" ? "text-error" : "text-on-surface-variant"
                      }`}
                    >
                      다른 선택을 할 것 같아요
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-headline-md text-primary" htmlFor="chooseAgainReason">
                  왜 그런 선택을 하셨나요? <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="chooseAgainReason"
                    className="w-full bg-white/80 border border-outline-variant/30 rounded-2xl p-6 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-on-surface resize-none"
                    placeholder="자세하게 작성할수록 AI가 당신의 의사결정 방식을 더 깊이 이해하여 더욱 정교한 리포트를 제공해요."
                    rows={4}
                    maxLength={500}
                    value={chooseAgainReason}
                    onChange={(event) => setChooseAgainReason(event.target.value)}
                  />
                  <div className="absolute bottom-4 right-4 text-outline text-[12px]">
                    {chooseAgainReason.length} / 500
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-headline-md text-primary" htmlFor="message">
                    다른 사람을 위한 한마디{" "}
                    <span className="text-label-md text-on-surface-variant font-normal">(선택)</span>
                  </label>
                  <p className="text-label-md text-on-surface-variant">
                    비슷한 고민을 하는 사람들에게 당신의 경험이 큰 힘이
                    됩니다.
                  </p>
                </div>
                <div className="relative">
                  <textarea
                    id="message"
                    className="w-full bg-white/80 border border-outline-variant/30 rounded-2xl p-6 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-on-surface resize-none"
                    placeholder="응원의 한마디나 팁을 자유롭게 적어주세요."
                    rows={3}
                    maxLength={200}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                  />
                  <div className="absolute bottom-4 right-4 text-outline text-[12px]">
                    {message.length} / 200
                  </div>
                </div>
              </div>

              {submitError && (
                <p className="text-body-md text-error text-center">{submitError}</p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !reflection.trim() || !expectationGap.trim() || !chooseAgainReason.trim()}
                className="w-full h-16 bg-primary text-on-primary rounded-xl text-headline-md shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all active:scale-95 duration-200 disabled:opacity-60"
              >
                {submitting ? "저장 중..." : isEditMode ? "수정 완료하기" : "회고 완료하기"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function CapsulePage() {
  return (
    <Suspense
      fallback={
        <>
          <Header />
          <main className="pt-32 pb-24 flex items-center justify-center">
            <p className="text-body-md text-on-surface-variant">불러오는 중...</p>
          </main>
        </>
      }
    >
      <CapsuleContent />
    </Suspense>
  );
}
