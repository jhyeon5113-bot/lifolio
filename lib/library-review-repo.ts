import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { Decision, DecisionOption, Reflection } from "@/lib/generated/prisma/client";
import { formatDate } from "@/lib/format-date";
import { notifyNow } from "@/lib/notifications/create";
import { libraryPublishedContent } from "@/lib/notifications/content";
import { getEmbeddingProvider } from "@/lib/embedding";
import { buildEmbeddingText } from "@/lib/embedding/case-text";
import { storeCaseEmbedding } from "@/lib/embedding/search";

function categoryToTags(category: string): string {
  return category
    .split("/")
    .map((part) => `#${part}`)
    .join(" ");
}

function mapWouldChooseAgain(choice: "YES" | "NO" | "UNSURE"): string {
  if (choice === "YES") return "yes";
  if (choice === "NO") return "no";
  return "depends";
}

// Called right when a Reflection is saved — pre-fills a review draft from
// the real Decision+Reflection content. Never overwrites an existing draft
// (defensive; the reflection route only calls this once per decision).
export async function createSubmissionDraft(
  decision: Decision & { options: DecisionOption[] },
  reflection: Reflection,
): Promise<void> {
  const chosenOption = decision.options.find((o) => o.title === decision.finalChoice);
  const subtitleSource =
    reflection.aiComparisonSummary || decision.situation || decision.background || decision.title;

  const existing = await prisma.libraryCaseSubmission.findUnique({ where: { decisionId: decision.id } });
  if (existing) return;

  await prisma.libraryCaseSubmission.create({
    data: {
      decisionId: decision.id,
      title: decision.title,
      category: decision.category,
      background: decision.background ?? "",
      situation: decision.situation ?? "",
      options: decision.options.map((o) => o.title),
      finalChoice: decision.finalChoice ?? "",
      criteria: decision.criteria,
      expectedOutcome: chosenOption?.expectedPositive ?? "",
      anxieties: decision.concerns,
      actualOutcome: reflection.actualResult,
      satisfaction: reflection.satisfaction,
      wouldChooseAgain: mapWouldChooseAgain(reflection.wouldChooseAgain),
      chooseAgainReason: reflection.chooseAgainReason,
      outcomeGap: reflection.aiComparisonSummary || reflection.actualVsExpected,
      adviceForOthers: reflection.reason ?? "",
      subtitle: subtitleSource.slice(0, 80),
      detailTag: decision.category,
      tags: categoryToTags(decision.category),
      authorInitials: "LF",
    },
  });
}

export function getPendingSubmissions() {
  return prisma.libraryCaseSubmission.findMany({
    where: { status: "PENDING" },
    orderBy: { submittedAt: "asc" },
  });
}

export function getPendingSubmissionCount() {
  return prisma.libraryCaseSubmission.count({ where: { status: "PENDING" } });
}

export interface SubmissionDraftPatch {
  title?: string;
  category?: string;
  background?: string;
  situation?: string;
  options?: string[];
  finalChoice?: string;
  criteria?: string[];
  expectedOutcome?: string;
  anxieties?: string[];
  actualOutcome?: string;
  satisfaction?: number;
  wouldChooseAgain?: string;
  chooseAgainReason?: string;
  outcomeGap?: string;
  adviceForOthers?: string;
  subtitle?: string;
  detailTag?: string;
  tags?: string;
  authorInitials?: string;
}

export async function updateSubmissionDraft(id: string, patch: SubmissionDraftPatch) {
  const existing = await prisma.libraryCaseSubmission.findUnique({ where: { id } });
  if (!existing) return null;
  return prisma.libraryCaseSubmission.update({ where: { id }, data: patch });
}

// Writes the (possibly admin-edited) draft into the shared decision_cases +
// CaseProfile tables as one new library case, then marks the submission
// APPROVED. Atomic — a submission should never end up half-published.
export async function approveSubmission(id: string): Promise<{ dedupeKey: string }> {
  const submission = await prisma.libraryCaseSubmission.findUnique({
    where: { id },
    include: { decision: { select: { userId: true, title: true } } },
  });
  if (!submission || submission.status !== "PENDING") {
    throw new Error("Submission not found or not pending");
  }

  const dedupeKey = `lifolio-user-${submission.decisionId}`;
  // decision_cases.satisfaction is a NOT NULL smallint the shared table
  // constrains to 1~100 — clamp defensively rather than let a 0 crash the write.
  const satisfaction = Math.min(100, Math.max(1, submission.satisfaction));

  let caseId = "";

  await prisma.$transaction(async (tx) => {
    const caseRow = await tx.decision_cases.create({
      data: {
        title: submission.title,
        category: submission.category,
        options: submission.options,
        final_choice: submission.finalChoice,
        criteria: submission.criteria,
        expected_outcome: submission.expectedOutcome,
        anxieties: submission.anxieties,
        actual_outcome: submission.actualOutcome,
        satisfaction,
        would_choose_again: submission.wouldChooseAgain,
        background: submission.background,
        situation: submission.situation,
        outcome_gap: submission.outcomeGap,
        advice_for_others: submission.adviceForOthers,
        source_url: `lifolio://decision/${submission.decisionId}`,
        source_name: "Lifolio 사용자",
        dedupe_key: dedupeKey,
      },
    });

    const steps = [
      { label: "상황", value: submission.situation.slice(0, 40), dotColor: "bg-secondary-fixed" },
      { label: "고민", value: submission.background.slice(0, 40), dotColor: "bg-tertiary-fixed" },
      { label: "선택", value: submission.finalChoice, dotColor: "bg-primary-container" },
      { label: "결과", value: submission.actualOutcome.slice(0, 40), dotColor: "bg-secondary" },
    ];

    await tx.caseProfile.create({
      data: {
        caseId: caseRow.id,
        subtitle: submission.subtitle,
        detailTag: submission.detailTag,
        date: formatDate(new Date()),
        tags: submission.tags,
        steps: steps as unknown as Prisma.InputJsonValue,
        authorInitials: submission.authorInitials,
        authorAvatarColor: "bg-primary-fixed text-on-primary-fixed",
        sameChoiceAgainText: submission.chooseAgainReason || null,
      },
    });

    caseId = caseRow.id;

    await tx.libraryCaseSubmission.update({
      where: { id },
      data: { status: "APPROVED", publishedCaseDedupeKey: dedupeKey, reviewedAt: new Date() },
    });
  });

  // Outside the transaction on purpose — this does a network call (push
  // send) and writes to an unrelated table, neither of which should hold
  // the decision_cases/CaseProfile transaction open.
  await notifyNow(
    submission.decision.userId,
    "LIBRARY_PUBLISHED",
    libraryPublishedContent({ id: submission.decisionId, title: submission.decision.title }, dedupeKey),
    submission.decisionId,
  ).catch((error) => {
    console.error(`approveSubmission: notifyNow failed for submission ${id}:`, error);
  });

  // Also outside the transaction (network call) and a no-op today — no
  // embedding provider is configured yet (see lib/embedding/). Once one is,
  // every newly-approved case gets embedded right here, from its
  // pre-decision fields only (never expectedOutcome/actualOutcome/etc.).
  const embeddingProvider = getEmbeddingProvider();
  if (embeddingProvider) {
    try {
      const text = buildEmbeddingText({
        title: submission.title,
        category: submission.category,
        background: submission.background,
        situation: submission.situation,
        options: submission.options,
        criteria: submission.criteria,
        concerns: submission.anxieties,
      });
      const embedding = await embeddingProvider.embed(text);
      await storeCaseEmbedding(caseId, embedding);
    } catch (error) {
      console.error(`approveSubmission: embedding failed for submission ${id}:`, error);
    }
  }

  return { dedupeKey };
}

export async function rejectSubmission(id: string): Promise<boolean> {
  const existing = await prisma.libraryCaseSubmission.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.libraryCaseSubmission.update({
    where: { id },
    data: { status: "REJECTED", reviewedAt: new Date() },
  });
  return true;
}

// Queued whenever a follow-up reflection ("다시 회고하기") comes in for a
// decision whose case is already live in the public library — see
// app/api/decisions/[id]/reflection/route.ts. Never overwrites an existing
// draft for the same reflection (defensive; a reflection only triggers this
// once, at creation time).
export async function createLibraryCaseUpdateDraft(
  decisionId: string,
  reflectionId: string,
  content: string,
  monthsAfterLabel: string,
): Promise<void> {
  const existing = await prisma.libraryCaseUpdate.findUnique({ where: { reflectionId } });
  if (existing) return;

  await prisma.libraryCaseUpdate.create({
    data: { decisionId, reflectionId, content, monthsAfterLabel },
  });
}

export function getPendingLibraryCaseUpdates() {
  return prisma.libraryCaseUpdate.findMany({
    where: { status: "PENDING" },
    include: { decision: true },
    orderBy: { submittedAt: "asc" },
  });
}

export function getPendingLibraryCaseUpdateCount() {
  return prisma.libraryCaseUpdate.count({ where: { status: "PENDING" } });
}

// Appends { label, text } to the live public card's CaseProfile —
// found by walking decisionId → LibraryCaseSubmission.publishedCaseDedupeKey
// → decision_cases → CaseProfile (same convention approveSubmission uses).
export async function approveLibraryCaseUpdate(id: string, editedContent?: string): Promise<void> {
  const update = await prisma.libraryCaseUpdate.findUnique({ where: { id } });
  if (!update || update.status !== "PENDING") {
    throw new Error("Update not found or not pending");
  }
  const content = editedContent?.trim() || update.content;

  const submission = await prisma.libraryCaseSubmission.findUnique({ where: { decisionId: update.decisionId } });
  if (!submission?.publishedCaseDedupeKey) {
    throw new Error("Decision has no published case to update");
  }
  const caseRow = await prisma.decision_cases.findUnique({ where: { dedupe_key: submission.publishedCaseDedupeKey } });
  if (!caseRow) {
    throw new Error("Published case not found");
  }

  await prisma.$transaction(async (tx) => {
    const profile = await tx.caseProfile.findUnique({ where: { caseId: caseRow.id } });
    if (!profile) throw new Error("Case profile not found");

    const existingUpdates = (profile.followUpUpdates as { label: string; text: string }[] | null) ?? [];
    await tx.caseProfile.update({
      where: { caseId: caseRow.id },
      data: {
        followUpUpdates: [
          ...existingUpdates,
          { label: update.monthsAfterLabel, text: content },
        ] as unknown as Prisma.InputJsonValue,
      },
    });

    await tx.libraryCaseUpdate.update({
      where: { id },
      data: { status: "APPROVED", content, reviewedAt: new Date() },
    });
  });
}

export async function rejectLibraryCaseUpdate(id: string): Promise<boolean> {
  const existing = await prisma.libraryCaseUpdate.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.libraryCaseUpdate.update({
    where: { id },
    data: { status: "REJECTED", reviewedAt: new Date() },
  });
  return true;
}
