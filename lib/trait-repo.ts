import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/lib/ai";
import type { Decision } from "@/lib/generated/prisma/client";
import type { TraitScores } from "@/lib/trait-presentation";

export type { TraitScores } from "@/lib/trait-presentation";

// New data only nudges the running average — see the PRD's own example
// (existing 72, new 60 → ~70.8). The very first decision has no prior to
// blend against, so it's used as-is.
const EMA_ALPHA = 0.1;

function blend(existing: number | null, incoming: number): number {
  if (existing === null) return Math.round(incoming);
  return Math.round(existing * (1 - EMA_ALPHA) + incoming * EMA_ALPHA);
}

export interface DecisionTraitProfileView extends TraitScores {
  decisionsAnalyzedCount: number;
  updatedAt: Date;
}

// Called right when a Decision is finalized (status → DECIDED) — doesn't
// wait on a Reflection, unlike the Decision DNA snapshot.
export async function updateDecisionTraitProfile(
  userId: string,
  decision: Decision,
): Promise<DecisionTraitProfileView> {
  const decisionHours = Math.max(
    0,
    (decision.updatedAt.getTime() - decision.createdAt.getTime()) / 3_600_000,
  );

  const raw = await getAIProvider().analyzeDecisionTraits({
    background: decision.background ?? "",
    situation: decision.situation ?? "",
    criteria: decision.criteria,
    concerns: decision.concerns,
    decisionHours,
  });

  const existing = await prisma.decisionTraitProfile.findUnique({ where: { userId } });

  const blended: TraitScores = {
    rational: blend(existing?.rational ?? null, raw.rational),
    emotional: blend(existing?.emotional ?? null, raw.emotional),
    longTerm: blend(existing?.longTerm ?? null, raw.longTerm),
    shortTerm: blend(existing?.shortTerm ?? null, raw.shortTerm),
    planned: blend(existing?.planned ?? null, raw.planned),
    executionFocused: blend(existing?.executionFocused ?? null, raw.executionFocused),
  };

  const profile = await prisma.decisionTraitProfile.upsert({
    where: { userId },
    create: { userId, ...blended, decisionsAnalyzedCount: 1 },
    update: { ...blended, decisionsAnalyzedCount: { increment: 1 } },
  });

  return profile;
}

export async function getDecisionTraitProfile(
  userId: string,
): Promise<DecisionTraitProfileView | null> {
  return prisma.decisionTraitProfile.findUnique({ where: { userId } });
}
