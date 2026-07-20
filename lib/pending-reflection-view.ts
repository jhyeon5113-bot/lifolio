import type { PendingReflection } from "@/lib/types";

export interface PendingReflectionDecision {
  id: string;
  title: string;
  finalChoice: string | null;
  createdAt: string;
  expectedReflectionDate: string | null;
}

// Shared by the home page's slider and its "전체보기" full-list page so the
// day-math stays in one place.
export function toPendingReflections(decisions: PendingReflectionDecision[]): PendingReflection[] {
  const now = Date.now();
  return decisions.map((decision) => ({
    id: decision.id,
    title: decision.title,
    daysElapsed: Math.max(
      0,
      Math.floor((now - new Date(decision.expectedReflectionDate ?? decision.createdAt).getTime()) / 86400000),
    ),
    decisionDaysAgo: Math.max(0, Math.floor((now - new Date(decision.createdAt).getTime()) / 86400000)),
    choiceSummary: decision.finalChoice ?? decision.title,
    note: "결정 후 시간이 흘렀어요. 지금을 기록해보세요.",
    decisionLabel: decision.title,
  }));
}
