"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { ChatMessage } from "@/components/consult/ChatMessage";
import type { OptionExpectation } from "@/components/consult/OptionExpectationsForm";
import { consultQuickTopics } from "@/lib/mock-data";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { parseListAnswer } from "@/lib/ai/parseListAnswer";
import type { MissingInfoQuestion, StructuredField } from "@/lib/ai";
import type { ConsultMessage, StructuredDraft } from "./types";

type Phase =
  | "intro"
  | "loop"
  | "optionsForm"
  | "optionExpectationsForm"
  | "criteriaForm"
  | "processing"
  | "summary"
  | "reflectionDate"
  | "done";

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DEFAULT_DRAFT: StructuredDraft = {
  category: "학업/전공",
  background: "",
  situation: "",
  options: [],
  criteria: [],
  concerns: [],
};

interface FetchedDecision {
  id: string;
  category: string;
  rawInput: string;
  background: string | null;
  situation: string | null;
  criteria: string[];
  concerns: string[];
  finalChoice: string | null;
  confidence: number | null;
  status: "IN_PROGRESS" | "DECIDED" | "COMPLETED";
  expectedReflectionDate: string | null;
  options: { title: string; expectedPositive: string | null; expectedNegative: string | null }[];
}

function isFieldKnown(field: StructuredField, known: StructuredDraft): boolean {
  if (field === "background") return known.background.trim().length > 0;
  if (field === "situation") return known.situation.trim().length > 0;
  if (field === "options") return known.options.length >= 2;
  if (field === "criteria") return known.criteria.length > 0;
  return known.concerns.length > 0; // concerns
}

function ConsultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeDecisionId = searchParams.get("decisionId");
  const [messages, setMessages] = useState<ConsultMessage[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("intro");
  const [draft, setDraft] = useState<StructuredDraft>(DEFAULT_DRAFT);
  const [decisionId, setDecisionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<MissingInfoQuestion | null>(null);
  const [resuming, setResuming] = useState(!!resumeDecisionId);
  const idRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const nextId = () => {
    idRef.current += 1;
    return `msg-${idRef.current}`;
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const pushMessage = (message: ConsultMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const removeMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const lockMessage = (id: string, patch: Record<string, unknown>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch, locked: true } : m)));
  };

  const runMissingInfoStep = async (currentDraft: StructuredDraft) => {
    const typingId = nextId();
    pushMessage({ id: typingId, role: "ai", kind: "typing" });

    try {
      const res = await fetchWithTimeout("/api/ai/missing-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          background: currentDraft.background,
          situation: currentDraft.situation,
          options: currentDraft.options,
          criteria: currentDraft.criteria,
          concerns: currentDraft.concerns,
        }),
      });
      if (!res.ok) throw new Error(`missing-info failed: ${res.status}`);
      const next: MissingInfoQuestion | null = await res.json();
      removeMessage(typingId);

      if (!next) {
        setCurrentQuestion(null);
        await runSummaryStep(currentDraft);
        return;
      }

      if (next.field === "options") {
        pushMessage({ id: nextId(), role: "ai", kind: "optionsQuestion", question: next.question, locked: false });
        setPhase("optionsForm");
      } else if (next.field === "criteria") {
        pushMessage({
          id: nextId(),
          role: "ai",
          kind: "criteriaQuestion",
          question: next.question,
          choices: next.choices ?? [],
          locked: false,
        });
        setPhase("criteriaForm");
      } else {
        setCurrentQuestion(next);
        pushMessage({ id: nextId(), role: "ai", kind: "text", content: next.question });
        setPhase("loop");
      }
    } catch {
      replaceWithError(typingId, "다음 질문을 준비하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setPhase("loop");
    }
  };

  const runSummaryStep = async (currentDraft: StructuredDraft) => {
    const typingId = nextId();
    pushMessage({ id: typingId, role: "ai", kind: "typing" });

    try {
      const [summaryRes, matchesRes] = await Promise.all([
        fetchWithTimeout("/api/ai/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentDraft),
        }),
        fetchWithTimeout("/api/cases/similar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: currentDraft.category,
            criteria: currentDraft.criteria,
            concerns: currentDraft.concerns,
            background: currentDraft.background,
            situation: currentDraft.situation,
          }),
        }),
      ]);
      if (!summaryRes.ok || !matchesRes.ok) throw new Error("summary step failed");
      const { summary } = await summaryRes.json();
      const matches = await matchesRes.json();

      removeMessage(typingId);
      pushMessage({
        id: nextId(),
        role: "ai",
        kind: "summary",
        summary,
        options: currentDraft.options,
        matches,
        locked: false,
      });
      setPhase("summary");
    } catch {
      replaceWithError(typingId, "정리하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setPhase("summary");
    }
  };

  const replaceWithError = (typingId: string, content: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === typingId ? { id: typingId, role: "ai", kind: "text", content } : m)),
    );
  };

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || (phase !== "intro" && phase !== "loop")) return;
    setInput("");
    pushMessage({ id: nextId(), role: "user", kind: "text", content: trimmed });
    setPhase("processing");

    if (!decisionId) {
      const typingId = nextId();
      pushMessage({ id: typingId, role: "ai", kind: "typing" });
      try {
        const structureRes = await fetchWithTimeout("/api/ai/structure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawInput: trimmed }),
        });
        if (!structureRes.ok) throw new Error(`structure failed: ${structureRes.status}`);
        const structured = await structureRes.json();
        const newDraft: StructuredDraft = {
          category: structured.category ?? DEFAULT_DRAFT.category,
          background: structured.background ?? "",
          situation: structured.situation ?? "",
          options: structured.options ?? [],
          criteria: structured.criteria ?? [],
          concerns: structured.concerns ?? [],
        };

        const decisionRes = await fetch("/api/decisions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawInput: trimmed, ...newDraft }),
        });
        if (!decisionRes.ok) throw new Error(`decision create failed: ${decisionRes.status}`);
        const decision = await decisionRes.json();

        setDecisionId(decision.id);
        setDraft(newDraft);
        removeMessage(typingId);
        await runMissingInfoStep(newDraft);
      } catch {
        replaceWithError(typingId, "생각을 정리하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
        setPhase("intro");
      }
      return;
    }

    if (currentQuestion) {
      const field = currentQuestion.field;
      const updated: StructuredDraft = { ...draft };
      if (field === "background" || field === "situation") {
        updated[field] = trimmed;
      } else {
        updated[field] = parseListAnswer(trimmed);
      }
      setDraft(updated);
      setCurrentQuestion(null);

      try {
        await patchDecision(decisionId, field, updated[field]);
      } catch {
        // Non-fatal — the field stays updated locally; the next successful
        // save (or the final summarize step) will carry it through.
      }
      await runMissingInfoStep(updated);
    }
  };

  const patchDecision = (id: string, field: StructuredField, value: string | string[]) =>
    fetch(`/api/decisions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });

  // useCallback + [decisionId, draft] deps (not the whole render) so
  // ChatMessage's React.memo can actually skip re-rendering already-answered
  // bubbles while the user is typing in the input box below — a fresh
  // closure every render would defeat the memo entirely.
  const handleOptionsSubmit = useCallback(
    async (messageId: string, options: string[]) => {
      if (!decisionId) return;
      lockMessage(messageId, { answer: options });
      const updated: StructuredDraft = { ...draft, options };
      setDraft(updated);
      setPhase("processing");

      try {
        await patchDecision(decisionId, "options", options);
      } catch {
        // Non-fatal — the next successful save carries the field through.
      }

      pushMessage({ id: nextId(), role: "ai", kind: "optionExpectations", options, locked: false });
      setPhase("optionExpectationsForm");
    },
    [decisionId, draft],
  );

  const handleOptionExpectationsSubmit = useCallback(
    async (messageId: string, expectations: OptionExpectation[]) => {
      if (!decisionId) return;
      lockMessage(messageId, { answer: expectations });
      setPhase("processing");

      try {
        await fetch(`/api/decisions/${decisionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ options: expectations }),
        });
      } catch {
        // Non-fatal — the loop continues even if this save fails silently.
      }

      await runMissingInfoStep(draft);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [decisionId, draft],
  );

  const handleCriteriaSubmit = useCallback(
    async (messageId: string, criteria: string[]) => {
      if (!decisionId) return;
      lockMessage(messageId, { answer: criteria });
      const updated: StructuredDraft = { ...draft, criteria };
      setDraft(updated);
      setPhase("processing");

      try {
        await patchDecision(decisionId, "criteria", criteria);
      } catch {
        // Non-fatal — the next successful save carries the field through.
      }
      await runMissingInfoStep(updated);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [decisionId, draft],
  );

  const handleFinalChoice = useCallback(async (messageId: string, choice: string, confidence: number) => {
    if (!decisionId) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId && m.kind === "summary"
          ? { ...m, locked: true, chosen: choice, confidence }
          : m,
      ),
    );
    setPhase("processing");
    try {
      const res = await fetch(`/api/decisions/${decisionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalChoice: choice, confidence, status: "DECIDED" }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
    } catch {
      // This one IS fatal — unlike the other intermediate autosaves, this
      // PATCH is what actually marks the decision DECIDED. Silently
      // continuing here would show the user a "결정됨" UI for a decision
      // that's still IN_PROGRESS server-side (never surfaces in 회고 대기 중).
      pushMessage({
        id: nextId(),
        role: "ai",
        kind: "text",
        content: "결정을 저장하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
      });
      setPhase("summary");
      return;
    }

    pushMessage({
      id: nextId(),
      role: "ai",
      kind: "text",
      content:
        "사람은 결정보다, 그 결과를 돌아보며 더 많이 배웁니다. 미래의 나를 위해 이 선택을 다시 돌아볼 날짜를 정해볼까요?",
    });
    pushMessage({ id: nextId(), role: "ai", kind: "reflectionDate", locked: false });
    setPhase("reflectionDate");
  }, [decisionId]);

  const handleReflectionDate = useCallback(
    async (messageId: string, date: Date | null) => {
      if (!decisionId) return;
      const answer = date
        ? `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일에 다시 돌아보기로 했어요.`
        : "나중에 날짜를 정하기로 했어요.";
      lockMessage(messageId, { answer });
      setPhase("processing");

      if (date) {
        try {
          await fetch(`/api/decisions/${decisionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expectedReflectionDate: toISODate(date) }),
          });
        } catch {
          // Non-fatal — the choice is reflected in the UI even if the save
          // fails silently.
        }
      }

      const revisitLine = date
        ? " 선택한 날짜에 다시 찾아와 오늘의 예상과 실제 결과를 함께 돌아볼게요."
        : "";
      pushMessage({
        id: nextId(),
        role: "ai",
        kind: "text",
        content: `오늘의 의사결정이 기록되었습니다. 앞으로의 결과가 어떻든, 이 기록은 미래의 나를 이해하는 소중한 자료가 될 거예요.${revisitLine} 좋은 선택이 되기를 응원합니다.🌱`,
      });
      setPhase("done");
    },
    [decisionId],
  );

  // Reconstructs the chat transcript from what's already persisted on the
  // Decision (+ its options), rather than relying on any browser-only
  // storage — works no matter how long ago or from which device the user
  // left off. Replays every already-answered field as a locked bubble by
  // walking the same ordered missing-info sequence the live flow uses, and
  // hands off to it live the moment it hits a field that's genuinely still
  // unanswered.
  const resumeFromDecision = async (fetched: FetchedDecision) => {
    const known: StructuredDraft = {
      category: (fetched.category as StructuredDraft["category"]) || DEFAULT_DRAFT.category,
      background: fetched.background ?? "",
      situation: fetched.situation ?? "",
      options: fetched.options.map((o) => o.title),
      criteria: fetched.criteria,
      concerns: fetched.concerns,
    };
    setDecisionId(fetched.id);
    setDraft(known);
    pushMessage({ id: nextId(), role: "user", kind: "text", content: fetched.rawInput });

    let replayDraft: StructuredDraft = { ...DEFAULT_DRAFT, category: known.category };

    try {
      while (true) {
        const res = await fetchWithTimeout("/api/ai/missing-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            background: replayDraft.background,
            situation: replayDraft.situation,
            options: replayDraft.options,
            criteria: replayDraft.criteria,
            concerns: replayDraft.concerns,
          }),
        });
        if (!res.ok) throw new Error(`missing-info failed: ${res.status}`);
        const next: MissingInfoQuestion | null = await res.json();

        if (!next) break; // every field known — fall through to the summary step below

        if (!isFieldKnown(next.field, known)) {
          // The real boundary — hand off to the live, unlocked flow exactly
          // like a normal in-progress conversation.
          if (next.field === "options") {
            pushMessage({ id: nextId(), role: "ai", kind: "optionsQuestion", question: next.question, locked: false });
            setPhase("optionsForm");
          } else if (next.field === "criteria") {
            pushMessage({
              id: nextId(),
              role: "ai",
              kind: "criteriaQuestion",
              question: next.question,
              choices: next.choices ?? [],
              locked: false,
            });
            setPhase("criteriaForm");
          } else {
            setCurrentQuestion(next);
            pushMessage({ id: nextId(), role: "ai", kind: "text", content: next.question });
            setPhase("loop");
          }
          return;
        }

        // Already known — lock it in immediately and move on.
        if (next.field === "options") {
          pushMessage({
            id: nextId(),
            role: "ai",
            kind: "optionsQuestion",
            question: next.question,
            answer: known.options,
            locked: true,
          });
          const hasExpectations = fetched.options.every((o) => o.expectedPositive || o.expectedNegative);
          if (!hasExpectations) {
            pushMessage({ id: nextId(), role: "ai", kind: "optionExpectations", options: known.options, locked: false });
            setPhase("optionExpectationsForm");
            return;
          }
          pushMessage({
            id: nextId(),
            role: "ai",
            kind: "optionExpectations",
            options: known.options,
            locked: true,
            answer: fetched.options.map((o) => ({
              title: o.title,
              expectedPositive: o.expectedPositive ?? "",
              expectedNegative: o.expectedNegative ?? "",
            })),
          });
        } else if (next.field === "criteria") {
          pushMessage({
            id: nextId(),
            role: "ai",
            kind: "criteriaQuestion",
            question: next.question,
            choices: next.choices ?? [],
            answer: known.criteria,
            locked: true,
          });
        } else if (next.field === "concerns") {
          pushMessage({ id: nextId(), role: "ai", kind: "text", content: next.question });
          pushMessage({ id: nextId(), role: "user", kind: "text", content: known.concerns.join(", ") });
        } else {
          pushMessage({ id: nextId(), role: "ai", kind: "text", content: next.question });
          pushMessage({ id: nextId(), role: "user", kind: "text", content: known[next.field] as string });
        }

        replayDraft = { ...replayDraft, [next.field]: known[next.field] };
      }
    } catch {
      pushMessage({
        id: nextId(),
        role: "ai",
        kind: "text",
        content: "이전 상담 내용을 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
      });
      setPhase("loop");
      return;
    }

    // All 5 fields were already known — they'd reached at least the summary
    // step. Regenerate it, then either show it locked with the real final
    // choice (if one was made) or unlocked, awaiting one, exactly like a
    // live resume at that point.
    const typingId = nextId();
    pushMessage({ id: typingId, role: "ai", kind: "typing" });
    try {
      const [summaryRes, matchesRes] = await Promise.all([
        fetchWithTimeout("/api/ai/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(known),
        }),
        fetchWithTimeout("/api/cases/similar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: known.category,
            criteria: known.criteria,
            concerns: known.concerns,
            background: known.background,
            situation: known.situation,
          }),
        }),
      ]);
      if (!summaryRes.ok || !matchesRes.ok) throw new Error("summary regen failed");
      const { summary } = await summaryRes.json();
      const matches = await matchesRes.json();
      removeMessage(typingId);

      if (fetched.finalChoice) {
        pushMessage({
          id: nextId(),
          role: "ai",
          kind: "summary",
          summary,
          options: known.options,
          matches,
          chosen: fetched.finalChoice,
          confidence: fetched.confidence ?? undefined,
          locked: true,
        });
        if (fetched.expectedReflectionDate) {
          setPhase("done");
        } else {
          pushMessage({
            id: nextId(),
            role: "ai",
            kind: "text",
            content:
              "사람은 결정보다, 그 결과를 돌아보며 더 많이 배웁니다. 미래의 나를 위해 이 선택을 다시 돌아볼 날짜를 정해볼까요?",
          });
          pushMessage({ id: nextId(), role: "ai", kind: "reflectionDate", locked: false });
          setPhase("reflectionDate");
        }
      } else {
        pushMessage({ id: nextId(), role: "ai", kind: "summary", summary, options: known.options, matches, locked: false });
        setPhase("summary");
      }
    } catch {
      replaceWithError(typingId, "정리하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setPhase("summary");
    }
  };

  useEffect(() => {
    if (!resumeDecisionId) return;
    fetch(`/api/decisions/${resumeDecisionId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((fetched: FetchedDecision | null) => {
        if (!fetched || fetched.status === "COMPLETED") return;
        return resumeFromDecision(fetched);
      })
      .catch(() => {})
      .finally(() => setResuming(false));
    // Only ever run once per mount — resuming intentionally doesn't re-fire
    // as the reconstructed state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeDecisionId]);

  const inputDisabled = phase !== "intro" && phase !== "loop";

  if (resuming) {
    return (
      <>
        <Header />
        <main className="flex-grow pt-24 pb-32 px-gutter w-full max-w-container-max mx-auto flex items-center justify-center">
          <p className="text-body-md text-on-surface-variant">이전 상담을 불러오는 중...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-grow pt-24 pb-32 px-gutter w-full max-w-container-max mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-grid-gutter">
          {/* Left: AI interviewer presence */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high/50 transition-colors active:scale-95 duration-200 mb-2"
              aria-label="뒤로가기"
            >
              <span className="material-symbols-outlined text-primary">
                arrow_back
              </span>
            </button>
            <div className="glass-card rounded-xl p-8 shadow-[0_4px_20px_rgba(26,35,126,0.04)] flex flex-col items-center text-center">
              <div className="relative w-24 h-24 mb-6 mx-auto rounded-3xl bg-white shadow-md overflow-hidden animate-float">
                <Image
                  src="/mascot-magnifier.png"
                  alt="분석하는 Lifolio 마스코트"
                  fill
                  sizes="96px"
                  className="object-cover scale-110"
                />
              </div>
              <h1 className="text-headline-lg text-primary mb-4">
                구조화된 상담의 시작
              </h1>
              <p className="text-on-surface-variant text-body-lg leading-relaxed">
                복잡한 생각들을 정리할 준비가 되셨나요? <br />
                당신의 고민을 객관적인 시각으로 바라볼 수 있도록 돕겠습니다.
              </p>
              <div className="mt-12 grid grid-cols-2 gap-4 w-full">
                <div className="p-4 bg-white/40 rounded-lg text-left border border-white/20">
                  <span className="material-symbols-outlined text-secondary mb-2 block">
                    query_stats
                  </span>
                  <p className="text-label-md text-primary">논리적 분석</p>
                  <p className="text-[12px] text-on-surface-variant">
                    감정보다 사실 기반의 분석
                  </p>
                </div>
                <div className="p-4 bg-white/40 rounded-lg text-left border border-white/20">
                  <span className="material-symbols-outlined text-secondary mb-2 block">
                    visibility
                  </span>
                  <p className="text-label-md text-primary">다각도 조망</p>
                  <p className="text-[12px] text-on-surface-variant">
                    놓치기 쉬운 변수 확인
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-secondary-container/30 rounded-xl p-6 border border-secondary/10">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-secondary mt-1">
                  info
                </span>
                <div>
                  <h3 className="text-label-md text-on-secondary-container mb-1">
                    상담 가이드
                  </h3>
                  <p className="text-sm text-on-secondary-container opacity-80 leading-snug">
                    구체적인 상황일수록 AI가 더 정교한 질문을 던질 수
                    있습니다. 편안하게 당신의 이야기를 들려주세요.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Chat */}
          <div className="lg:col-span-7 flex flex-col h-full min-h-[600px]">
            <div className="flex-grow glass-card rounded-t-xl p-6 overflow-y-auto flex flex-col gap-6 shadow-[0_4px_20px_rgba(26,35,126,0.04)]">
              <div className="flex gap-4 max-w-[85%]">
                <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden relative bg-white shadow-sm">
                  <Image
                    src="/mascot-magnifier.png"
                    alt="Lifolio AI"
                    fill
                    sizes="40px"
                    className="object-cover scale-110"
                  />
                </div>
                <div className="p-5 bg-white rounded-r-2xl rounded-bl-2xl shadow-sm border border-outline-variant/20">
                  <p className="text-primary text-body-lg mb-2">
                    안녕하세요. 당신의 사유 파트너입니다.
                  </p>
                  <p className="text-on-surface">
                    지금 어떤 중요한 결정을 고민하고 있나요? 무엇이든 자유롭게
                    적어주세요.
                  </p>
                </div>
              </div>

              {phase === "intro" && (
                <div className="flex flex-wrap gap-2 py-4">
                  {consultQuickTopics.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleSend(topic)}
                      className="px-4 py-2 rounded-full border border-outline text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container hover:border-transparent transition-all active:scale-95 text-label-md"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-6">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    decisionId={decisionId}
                    onOptionsSubmit={handleOptionsSubmit}
                    onOptionExpectationsSubmit={handleOptionExpectationsSubmit}
                    onCriteriaSubmit={handleCriteriaSubmit}
                    onFinalChoice={handleFinalChoice}
                    onReflectionDate={handleReflectionDate}
                  />
                ))}
                <div ref={bottomRef} />
              </div>
            </div>

            <div className="glass-card rounded-b-xl p-6 border-t border-outline-variant/10 shadow-[0_-4px_20px_rgba(26,35,126,0.04)]">
              <div className="relative group">
                <textarea
                  className="w-full p-5 bg-white rounded-xl border border-outline-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-body-md placeholder:text-on-surface-variant/50 disabled:opacity-50"
                  placeholder={
                    inputDisabled
                      ? "위 카드에서 계속 진행해주세요"
                      : "여기에 당신의 고민을 적어주세요..."
                  }
                  rows={4}
                  value={input}
                  disabled={inputDisabled}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSend(input);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleSend(input)}
                  disabled={inputDisabled}
                  className="absolute bottom-4 right-4 w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-primary-container active:scale-95 transition-all disabled:opacity-40"
                  aria-label="전송"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
              <div className="flex justify-between items-center mt-4 px-2">
                <span className="text-[10px] text-on-surface-variant/60 flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                  <span className="material-symbols-outlined text-sm">
                    security
                  </span>
                  모든 대화는 암호화되어 안전하게 보호됩니다.
                </span>
                <div className="flex gap-4">
                  <button
                    type="button"
                    className="text-on-surface-variant hover:text-primary transition-colors"
                    aria-label="음성 입력"
                  >
                    <span className="material-symbols-outlined">mic</span>
                  </button>
                  <button
                    type="button"
                    className="text-on-surface-variant hover:text-primary transition-colors"
                    aria-label="파일 첨부"
                  >
                    <span className="material-symbols-outlined">
                      attach_file
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function ConsultPage() {
  return (
    <Suspense
      fallback={
        <>
          <Header />
          <main className="flex-grow pt-24 pb-32 px-gutter w-full max-w-container-max mx-auto flex items-center justify-center">
            <p className="text-body-md text-on-surface-variant">불러오는 중...</p>
          </main>
        </>
      }
    >
      <ConsultContent />
    </Suspense>
  );
}
