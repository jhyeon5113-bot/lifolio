import { prisma } from "@/lib/prisma";
import type { DecisionDnaLevel1Output } from "@/lib/ai";
import { getOrCreateDecisionDnaSnapshot } from "@/lib/dna-repo";
import { getDecisionTraitProfile, type DecisionTraitProfileView } from "@/lib/trait-repo";

export interface CategoryBreakdownRow {
  label: string;
  hasSatisfaction: boolean;
  value: number;
  suffix: string;
  bar: string;
}

export interface ReflectedDecisionSummary {
  id: string;
  title: string;
  satisfaction: number;
  summary: string;
}

export interface TrendPoint {
  date: Date;
  satisfaction: number;
}

export interface ReportData {
  dateRange: { from: Date; to: Date } | null;
  categoryBreakdown: CategoryBreakdownRow[];
  topCriteria: [string, number][];
  avgHours: number | null;
  chooseAgainRate: number | null;
  avgSatisfaction: number | null;
  dna: DecisionDnaLevel1Output | null;
  dnaMeta: { level: number; basedOnReflectionCount: number; generatedAt: Date } | null;
  dnaProgress: { completedCount: number; requiredCount: number } | null;
  traitProfile: DecisionTraitProfileView | null;
  goodDecisions: ReflectedDecisionSummary[];
  roughDecisions: ReflectedDecisionSummary[];
  trend: TrendPoint[];
  completedCount: number;
}

// Everything here is computed live from Decision/Reflection rows — no
// psychological axes or time-of-day patterns are fabricated, since there's
// no real signal for those yet. The Role 6 AI insight comes from
// getOrCreateDecisionDnaSnapshot (lib/dna-repo.ts), which persists a
// DecisionDnaSnapshot row and only regenerates it once new reflections
// have actually come in.
export async function getReportData(userId: string | undefined): Promise<ReportData> {
  const rawDecisions = userId
    ? await prisma.decision.findMany({
        where: { userId },
        include: { reflections: { orderBy: { createdAt: "desc" }, take: 1 } },
        orderBy: { createdAt: "asc" },
      })
    : [];
  const decisions = rawDecisions.map((d) => ({ ...d, reflection: d.reflections[0] ?? null }));

  const completed = decisions.filter(
    (d): d is typeof d & { reflection: NonNullable<typeof d.reflection> } => d.reflection !== null,
  );
  const decided = decisions.filter((d) => d.status !== "IN_PROGRESS");

  const dateRange =
    decisions.length > 0
      ? { from: decisions[0].createdAt, to: decisions[decisions.length - 1].createdAt }
      : null;

  const categoryMap = new Map<string, { count: number; satisfactionSum: number; satisfactionCount: number }>();
  for (const d of decisions) {
    const entry = categoryMap.get(d.category) ?? { count: 0, satisfactionSum: 0, satisfactionCount: 0 };
    entry.count += 1;
    if (d.reflection) {
      entry.satisfactionSum += d.reflection.satisfaction;
      entry.satisfactionCount += 1;
    }
    categoryMap.set(d.category, entry);
  }
  const categoryBreakdown: CategoryBreakdownRow[] = [...categoryMap.entries()].map(([label, v], index) => ({
    label,
    hasSatisfaction: v.satisfactionCount > 0,
    value: v.satisfactionCount > 0 ? Math.round(v.satisfactionSum / v.satisfactionCount) : v.count,
    suffix: v.satisfactionCount > 0 ? "평균 만족도" : `결정 ${v.count}건`,
    bar: index % 2 === 0 ? "bg-primary" : "bg-secondary",
  }));

  const criteriaCounts = new Map<string, number>();
  for (const d of decisions) {
    for (const c of d.criteria) criteriaCounts.set(c, (criteriaCounts.get(c) ?? 0) + 1);
  }
  const topCriteria = [...criteriaCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7);

  const avgHours =
    decided.length > 0
      ? decided.reduce((sum, d) => sum + (d.updatedAt.getTime() - d.createdAt.getTime()), 0) /
        decided.length /
        3_600_000
      : null;

  const chooseAgainYes = completed.filter((d) => d.reflection.wouldChooseAgain === "YES").length;
  const chooseAgainRate = completed.length > 0 ? Math.round((chooseAgainYes / completed.length) * 100) : null;
  const avgSatisfaction =
    completed.length > 0
      ? Math.round(completed.reduce((sum, d) => sum + d.reflection.satisfaction, 0) / completed.length)
      : null;

  const dnaResult = userId ? await getOrCreateDecisionDnaSnapshot(userId) : null;
  const dna = dnaResult?.ready ? dnaResult.insights : null;
  const dnaMeta = dnaResult?.ready
    ? { level: dnaResult.level, basedOnReflectionCount: dnaResult.basedOnReflectionCount, generatedAt: dnaResult.generatedAt }
    : null;
  const dnaProgress =
    dnaResult && !dnaResult.ready
      ? { completedCount: dnaResult.completedCount, requiredCount: dnaResult.requiredCount }
      : null;

  const traitProfile = userId ? await getDecisionTraitProfile(userId) : null;

  const toSummary = (d: (typeof completed)[number]): ReflectedDecisionSummary => ({
    id: d.id,
    title: d.title,
    satisfaction: d.reflection.satisfaction,
    summary: d.reflection.aiComparisonSummary || d.reflection.actualVsExpected,
  });

  const goodDecisions = completed.filter((d) => d.reflection.satisfaction >= 70).slice(0, 2).map(toSummary);
  const roughDecisions = completed
    .filter((d) => d.reflection.satisfaction < 50 || d.reflection.wouldChooseAgain === "NO")
    .slice(0, 2)
    .map(toSummary);

  const trend: TrendPoint[] = completed.map((d) => ({
    date: d.reflection.actualReflectionDate,
    satisfaction: d.reflection.satisfaction,
  }));

  return {
    dateRange,
    categoryBreakdown,
    topCriteria,
    avgHours,
    chooseAgainRate,
    avgSatisfaction,
    dna,
    dnaMeta,
    dnaProgress,
    traitProfile,
    goodDecisions,
    roughDecisions,
    trend,
    completedCount: completed.length,
  };
}
