import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/lib/ai";
import type {
  DecisionCaseDetail,
  DecisionOption as CaseDecisionOption,
  LibraryCase,
  LibraryStep,
} from "@/lib/types";

const OPTION_LABELS = ["Option A", "Option B", "Option C", "Option D"];

function optionLabel(index: number): string {
  return OPTION_LABELS[index] ?? `Option ${index + 1}`;
}

function criteriaLabel(index: number, total: number): string {
  return total > 1 ? `판단 기준 ${index + 1}` : "판단 기준";
}

type CaseRow = Awaited<ReturnType<typeof prisma.decision_cases.findMany>>[number];
type ProfileRow = Awaited<ReturnType<typeof prisma.caseProfile.findMany>>[number];

function toLibraryCase(caseRow: CaseRow, profile: ProfileRow): LibraryCase {
  return {
    id: caseRow.dedupe_key,
    category: caseRow.category,
    tags: profile.tags,
    title: caseRow.title,
    steps: profile.steps as unknown as LibraryStep[],
    authorInitials: profile.authorInitials,
    authorAvatarColor: profile.authorAvatarColor,
    viewCount: profile.viewCount,
    likeCount: profile.likeCount,
  };
}

function toDecisionCaseDetail(caseRow: CaseRow, profile: ProfileRow): DecisionCaseDetail {
  const richPoints = profile.optionPoints as unknown as
    | { title: string; points: { icon: string; text: string }[] }[]
    | null;

  const options: CaseDecisionOption[] = caseRow.options.map((title, index) => ({
    label: optionLabel(index),
    title,
    accent: index === 0 ? "secondary" : "primary",
    points: richPoints?.find((o) => o.title === title)?.points ?? [],
  }));

  return {
    id: caseRow.dedupe_key,
    tag: profile.detailTag,
    date: profile.date,
    title: caseRow.title,
    subtitle: profile.subtitle,
    contextParagraphs:
      caseRow.background === caseRow.situation
        ? [caseRow.background]
        : [caseRow.background, caseRow.situation],
    options,
    chosenOptionLabel: caseRow.final_choice,
    criteria: caseRow.criteria.map((text, index) => ({
      label: criteriaLabel(index, caseRow.criteria.length),
      text,
    })),
    expectation: caseRow.expected_outcome,
    fear: caseRow.anxieties[0] ?? "",
    satisfactionScore: caseRow.satisfaction,
    outcomeQuote: caseRow.actual_outcome,
    sameChoiceAgain: profile.sameChoiceAgainText ?? "",
    expectationGap: caseRow.outcome_gap,
    messageForOthers: caseRow.advice_for_others || undefined,
    followUpUpdates: (profile.followUpUpdates as { label: string; text: string }[] | null) ?? [],
  };
}

export async function getLibraryCases(): Promise<LibraryCase[]> {
  const caseRows = await prisma.decision_cases.findMany({
    orderBy: { created_at: "asc" },
  });
  const profiles = await prisma.caseProfile.findMany({
    where: { caseId: { in: caseRows.map((c) => c.id) } },
  });
  const profileByCaseId = new Map(profiles.map((p) => [p.caseId, p]));

  return caseRows
    .filter((row) => profileByCaseId.has(row.id))
    .map((row) => toLibraryCase(row, profileByCaseId.get(row.id)!));
}

const TODAYS_READING_COUNT = 1;
const POPULAR_POOL_SIZE = 15;

// Deterministic index from a string seed — same seed always yields the same
// index, so "today's" picks stay stable across repeated visits/requests but
// still rotate once the date (part of the seed) changes. No randomness, no
// AI call — this is intentionally rule-based.
function seededIndex(seed: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % modulo;
}

// "오늘의 읽을거리" — no generative AI involved. Picks from cases with the
// highest reported satisfaction (the only real "well-regarded" signal the
// case data has; there's no view/like tracking to call "popular"), scoped
// to the user's most-frequent Decision.category when they have one, and
// rotated daily via a seeded offset rather than re-randomized on refresh.
// A brand-new user (no decisions yet) has no interest category, so they
// always see the same category-agnostic popular pool everyone else falls
// back to.
export async function getTodaysReading(userId: string | undefined): Promise<LibraryCase[]> {
  let interestCategory: string | null = null;
  if (userId) {
    const decisions = await prisma.decision.findMany({
      where: { userId },
      select: { category: true },
    });
    if (decisions.length > 0) {
      const counts = new Map<string, number>();
      for (const d of decisions) counts.set(d.category, (counts.get(d.category) ?? 0) + 1);
      interestCategory = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }
  }

  const popularPool = async (category?: string) =>
    prisma.decision_cases.findMany({
      where: category ? { category } : undefined,
      orderBy: { satisfaction: "desc" },
      take: POPULAR_POOL_SIZE,
    });

  let pool = interestCategory ? await popularPool(interestCategory) : await popularPool();
  if (pool.length < TODAYS_READING_COUNT) {
    const fallback = await popularPool();
    const seen = new Set(pool.map((row) => row.id));
    pool = [...pool, ...fallback.filter((row) => !seen.has(row.id))];
  }

  const profiles = await prisma.caseProfile.findMany({
    where: { caseId: { in: pool.map((row) => row.id) } },
  });
  const profileByCaseId = new Map(profiles.map((p) => [p.caseId, p]));
  const withProfile = pool.filter((row) => profileByCaseId.has(row.id));
  if (withProfile.length === 0) return [];

  const today = new Date().toISOString().slice(0, 10);
  const offset = seededIndex(`${userId ?? "anonymous"}-${today}`, withProfile.length);
  const picks: CaseRow[] = [];
  for (let i = 0; i < Math.min(TODAYS_READING_COUNT, withProfile.length); i += 1) {
    picks.push(withProfile[(offset + i) % withProfile.length]);
  }

  return picks.map((row) => toLibraryCase(row, profileByCaseId.get(row.id)!));
}

// Case IDs (decision_cases.dedupe_key) for cases this user personally
// submitted and got approved into the shared library — traced through
// LibraryCaseSubmission.decision.userId, never guessed from category/title.
export async function getMyLibraryCaseIds(userId: string): Promise<string[]> {
  const submissions = await prisma.libraryCaseSubmission.findMany({
    where: { status: "APPROVED", decision: { userId } },
    select: { publishedCaseDedupeKey: true },
  });
  return submissions
    .map((s) => s.publishedCaseDedupeKey)
    .filter((key): key is string => key !== null);
}

export async function getLibraryCaseDetails(): Promise<Record<string, DecisionCaseDetail>> {
  const caseRows = await prisma.decision_cases.findMany();
  const profiles = await prisma.caseProfile.findMany({
    where: { caseId: { in: caseRows.map((c) => c.id) } },
  });
  const profileByCaseId = new Map(profiles.map((p) => [p.caseId, p]));

  const details: Record<string, DecisionCaseDetail> = {};
  for (const row of caseRows) {
    const profile = profileByCaseId.get(row.id);
    if (!profile) continue;
    details[row.dedupe_key] = toDecisionCaseDetail(row, profile);
  }
  return details;
}

export async function getLibraryCaseDetail(id: string): Promise<DecisionCaseDetail | null> {
  const caseRow = await prisma.decision_cases.findUnique({ where: { dedupe_key: id } });
  if (!caseRow) return null;
  const profile = await prisma.caseProfile.findUnique({ where: { caseId: caseRow.id } });
  if (!profile) return null;
  return toDecisionCaseDetail(caseRow, profile);
}

export interface SimilarCaseMatch {
  case: LibraryCase;
  reason: string;
}

// Character-bigram Dice similarity — a cheap, tokenizer-free way to catch
// "same topic, different phrasing" for Korean text (no stemmer needed).
// Returns 0~1; used to compare the user's own words against a case's.
function bigrams(text: string): Set<string> {
  const normalized = text.replace(/\s+/g, "");
  const grams = new Set<string>();
  for (let i = 0; i < normalized.length - 1; i += 1) {
    grams.add(normalized.slice(i, i + 2));
  }
  return grams;
}

function textSimilarity(a: string, b: string): number {
  if (!a.trim() || !b.trim()) return 0;
  const setA = bigrams(a);
  const setB = bigrams(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let shared = 0;
  for (const gram of setA) {
    if (setB.has(gram)) shared += 1;
  }
  return (2 * shared) / (setA.size + setB.size);
}

// A user criterion/concern is usually a short tag ("성장") while a case's is
// a full original sentence — exact equality almost never fires, so treat it
// as a match whenever one contains the other.
function looselyIncludes(haystack: string[], needle: string): boolean {
  return haystack.some((h) => h.includes(needle) || needle.includes(h));
}

// Cases are found by scoring against the shared decision_cases table — AI
// never picks the matches, it only explains why each one was picked
// (Role 4, see lib/ai/types.ts). Category match, shared criteria/concerns,
// and free-text topic similarity (background+situation) all contribute —
// the last one is what catches "same topic" even when the user's tags don't
// literally match the case's own wording.
export async function findSimilarCases(
  input: {
    category: string;
    criteria: string[];
    concerns: string[];
    background?: string;
    situation?: string;
  },
  limit = 3,
): Promise<SimilarCaseMatch[]> {
  const caseRows = await prisma.decision_cases.findMany();
  const profiles = await prisma.caseProfile.findMany({
    where: { caseId: { in: caseRows.map((c) => c.id) } },
  });
  const profileByCaseId = new Map(profiles.map((p) => [p.caseId, p]));

  const queryText = [input.background, input.situation].filter(Boolean).join(" ");

  const scored = caseRows
    .map((row) => {
      const profile = profileByCaseId.get(row.id);
      if (!profile) return null;
      const sharedCriteria = input.criteria.filter((c) => looselyIncludes(row.criteria, c)).length;
      const sharedConcerns = input.concerns.filter((c) => looselyIncludes(row.anxieties, c)).length;
      const categoryMatch = row.category === input.category ? 1 : 0;
      const caseText = [row.title, row.background, row.situation].filter(Boolean).join(" ");
      const topicSimilarity = queryText ? textSimilarity(queryText, caseText) : 0;
      const score =
        categoryMatch * 10 + sharedCriteria * 3 + sharedConcerns * 3 + topicSimilarity * 20;
      return { row, profile, score };
    })
    .filter((entry): entry is { row: CaseRow; profile: ProfileRow; score: number } => entry !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const provider = getAIProvider();
  return Promise.all(
    scored.map(async ({ row, profile }) => {
      const { reason } = await provider.explainSimilarity({
        userCategory: input.category,
        userCriteria: input.criteria,
        userConcerns: input.concerns,
        caseCriteria: row.criteria,
        caseConcerns: row.anxieties,
      });
      return { case: toLibraryCase(row, profile), reason };
    }),
  );
}
