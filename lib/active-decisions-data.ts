import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format-date";
import type { DecisionCheckInStatus } from "@/lib/decision-status-presentation";

export interface ActiveDecisionView {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge: string;
  progress: number;
  // false for DECIDED (already finished, just waiting on a reflection date)
  // — nothing useful to resume there, so the home page renders it inert.
  clickable: boolean;
  // Latest "how's it going?" check-in for a DECIDED decision — null if the
  // user hasn't checked in yet, or if this is still IN_PROGRESS (check-ins
  // only apply once the choice itself is made).
  currentStatus: DecisionCheckInStatus | null;
}

export const CATEGORY_ICONS: Record<string, string> = {
  "학업/전공": "school",
  "진로/취업": "work",
  "창업/도전": "rocket_launch",
};

function fieldProgress(decision: {
  background: string | null;
  situation: string | null;
  options: { title: string }[];
  criteria: string[];
  concerns: string[];
}): number {
  let filled = 0;
  if (decision.background?.trim()) filled += 1;
  if (decision.situation?.trim()) filled += 1;
  if (decision.options.length >= 2) filled += 1;
  if (decision.criteria.length > 0) filled += 1;
  if (decision.concerns.length > 0) filled += 1;
  return Math.round((filled / 5) * 100);
}

// Everything still "in play" — not yet finalized, or finalized but still
// waiting on its reflection. A COMPLETED decision belongs to History, not here.
export async function getActiveDecisions(userId: string): Promise<ActiveDecisionView[]> {
  const decisions = await prisma.decision.findMany({
    where: { userId, status: { in: ["IN_PROGRESS", "DECIDED"] } },
    include: { options: true },
    orderBy: { updatedAt: "desc" },
  });

  const decidedIds = decisions.filter((d) => d.status === "DECIDED").map((d) => d.id);
  const statusUpdates = decidedIds.length
    ? await prisma.decisionStatusUpdate.findMany({
        where: { decisionId: { in: decidedIds } },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const latestStatusByDecisionId = new Map<string, DecisionCheckInStatus>();
  for (const update of statusUpdates) {
    if (!latestStatusByDecisionId.has(update.decisionId)) {
      latestStatusByDecisionId.set(update.decisionId, update.status);
    }
  }

  const now = new Date();

  return decisions.map((decision) => {
    const icon = CATEGORY_ICONS[decision.category] ?? "psychology";
    const description = decision.situation || decision.background || decision.rawInput;

    if (decision.status === "IN_PROGRESS") {
      return {
        id: decision.id,
        title: decision.title,
        description,
        icon,
        badge: "상담중",
        progress: fieldProgress(decision),
        clickable: true,
        currentStatus: null,
      };
    }

    let badge: string;
    if (!decision.expectedReflectionDate) {
      badge = "회고 날짜 미정";
    } else {
      const days = Math.ceil((decision.expectedReflectionDate.getTime() - now.getTime()) / 86_400_000);
      badge = days > 0 ? `D-${days}` : "회고 대기";
    }

    return {
      id: decision.id,
      title: decision.title,
      description,
      icon,
      badge,
      progress: 100,
      clickable: false,
      currentStatus: latestStatusByDecisionId.get(decision.id) ?? null,
    };
  });
}

export interface CompletedDecisionView {
  id: string;
  title: string;
  description: string;
  icon: string;
  completedDate: string; // "2026.07.10", already formatted
}

// Reflected-on decisions, most recent first, for the home page's "회고
// 완료된 의사결정" slider — a recent highlight reel, not the full list
// (that's History).
export async function getCompletedDecisions(userId: string, limit = 10): Promise<CompletedDecisionView[]> {
  const decisions = await prisma.decision.findMany({
    where: { userId, status: "COMPLETED" },
    include: { reflections: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  return decisions
    .filter((decision) => decision.reflections[0])
    .sort((a, b) => b.reflections[0].createdAt.getTime() - a.reflections[0].createdAt.getTime())
    .slice(0, limit)
    .map((decision) => ({
      id: decision.id,
      title: decision.title,
      description: decision.reflections[0].actualResult,
      icon: CATEGORY_ICONS[decision.category] ?? "psychology",
      completedDate: formatDate(decision.reflections[0].createdAt),
    }));
}
