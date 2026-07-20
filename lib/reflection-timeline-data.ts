import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format-date";

export interface ReflectionTimelineEntry {
  id: string;
  date: string; // "2026.08.10"
  monthsAfterLabel: string; // "1개월 후" | "당일"
  satisfaction: number;
  wouldChooseAgain: "YES" | "NO" | "UNSURE";
  chooseAgainReasonExcerpt: string | null;
}

// "N개월 후" relative to when the decision itself was made — shared by the
// timeline sheet and the library follow-up-update draft.
export function getMonthsAfterLabel(decisionCreatedAt: Date, referenceDate: Date): string {
  const monthsAfter = Math.round((referenceDate.getTime() - decisionCreatedAt.getTime()) / (30 * 86_400_000));
  return monthsAfter <= 0 ? "당일" : `${monthsAfter}개월 후`;
}

// Every reflection ever recorded for one decision, newest first — powers
// the "다시 되돌아보기" timeline sheet. Returns null if the decision doesn't
// exist or isn't the caller's.
export async function getReflectionTimeline(
  userId: string,
  decisionId: string,
): Promise<ReflectionTimelineEntry[] | null> {
  const decision = await prisma.decision.findUnique({
    where: { id: decisionId },
    include: { reflections: { orderBy: { createdAt: "desc" } } },
  });
  if (!decision || decision.userId !== userId) return null;

  return decision.reflections.map((reflection) => ({
    id: reflection.id,
    date: formatDate(reflection.createdAt),
    monthsAfterLabel: getMonthsAfterLabel(decision.createdAt, reflection.createdAt),
    satisfaction: reflection.satisfaction,
    wouldChooseAgain: reflection.wouldChooseAgain,
    chooseAgainReasonExcerpt: reflection.chooseAgainReason,
  }));
}
