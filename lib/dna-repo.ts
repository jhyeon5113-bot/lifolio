import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { getAIProvider } from "@/lib/ai";
import type { DecisionDnaLevel1Output } from "@/lib/ai";

export interface DecisionDnaSnapshotView {
  ready: true;
  level: number;
  basedOnReflectionCount: number;
  insights: DecisionDnaLevel1Output;
  generatedAt: Date;
}

export interface DecisionDnaProgress {
  ready: false;
  completedCount: number;
  requiredCount: number;
}

export type DecisionDnaResult = DecisionDnaSnapshotView | DecisionDnaProgress;

// PRD Part 5 §3: Level 1 ("First Reflection") only unlocks once 3 decisions
// have been reflected on — Levels 2-5 (7/15/30/50+) are explicitly out of
// MVP scope ("8. MVP Scope"), so this repo never produces anything above 1.
// Exported so the reflection-save route (app/api/decisions/[id]/reflection)
// can fire the ⑦REPORT_LEVEL_UP notification off the exact same number,
// rather than a second hardcoded "3" drifting out of sync with this one.
export const LEVEL_1_REFLECTION_THRESHOLD = 3;

// A snapshot is reused as-is until the user's completed-reflection count
// grows past what it was generated from — that's the only regeneration
// trigger for now, so a stub/real AI call only happens when there's
// genuinely new data to analyze.
export async function getOrCreateDecisionDnaSnapshot(userId: string): Promise<DecisionDnaResult> {
  const rawDecisions = await prisma.decision.findMany({
    where: { userId },
    include: { reflections: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const decisions = rawDecisions.map((d) => ({ ...d, reflection: d.reflections[0] ?? null }));
  const completed = decisions.filter(
    (d): d is typeof d & { reflection: NonNullable<typeof d.reflection> } => d.reflection !== null,
  );
  if (completed.length < LEVEL_1_REFLECTION_THRESHOLD) {
    return { ready: false, completedCount: completed.length, requiredCount: LEVEL_1_REFLECTION_THRESHOLD };
  }

  const latest = await prisma.decisionDnaSnapshot.findFirst({
    where: { userId },
    orderBy: { generatedAt: "desc" },
  });

  if (latest && latest.basedOnReflectionCount >= completed.length) {
    return {
      ready: true,
      level: latest.level,
      basedOnReflectionCount: latest.basedOnReflectionCount,
      insights: latest.insights as unknown as DecisionDnaLevel1Output,
      generatedAt: latest.generatedAt,
    };
  }

  const insights = await getAIProvider().analyzeDecisionDnaLevel1({
    completedDecisions: completed.map((d) => ({
      category: d.category,
      criteria: d.criteria,
      concerns: d.concerns,
      satisfaction: d.reflection.satisfaction,
      wouldChooseAgain: d.reflection.wouldChooseAgain,
      decisionHours: Math.max(0, (d.updatedAt.getTime() - d.createdAt.getTime()) / 3_600_000),
    })),
  });

  const snapshot = await prisma.decisionDnaSnapshot.create({
    data: {
      userId,
      level: 1,
      basedOnReflectionCount: completed.length,
      insights: insights as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    ready: true,
    level: snapshot.level,
    basedOnReflectionCount: snapshot.basedOnReflectionCount,
    insights,
    generatedAt: snapshot.generatedAt,
  };
}
