import { prisma } from "@/lib/prisma";

// The public library route/URL param is decision_cases.dedupe_key (see
// lib/cases-repo.ts's toLibraryCase — LibraryCase.id = dedupe_key), but
// CaseProfile/CaseLike key off decision_cases.id (a UUID). Every function
// here takes the public dedupeKey and resolves it once.
async function resolveCaseId(dedupeKey: string): Promise<string | null> {
  const caseRow = await prisma.decision_cases.findUnique({
    where: { dedupe_key: dedupeKey },
    select: { id: true },
  });
  return caseRow?.id ?? null;
}

// Simple raw hit counter, incremented on every detail-page visit — no
// per-viewer dedup, matching the pre-existing (localStorage) behavior this
// replaces. Silently no-ops on an unknown id rather than throwing, since
// this is called from a fire-and-forget mount effect that shouldn't be able
// to break page rendering.
export async function incrementCaseView(dedupeKey: string): Promise<void> {
  const caseId = await resolveCaseId(dedupeKey);
  if (!caseId) return;
  await prisma.caseProfile.update({
    where: { caseId },
    data: { viewCount: { increment: 1 } },
  });
}

export interface ToggleLikeResult {
  liked: boolean;
  likeCount: number;
}

// Toggles a (userId, case) like on/off, keeping CaseProfile.likeCount (a
// cached counter, read far more often than written) in sync with the real
// CaseLike rows inside one transaction.
export async function toggleCaseLike(userId: string, dedupeKey: string): Promise<ToggleLikeResult | null> {
  const caseId = await resolveCaseId(dedupeKey);
  if (!caseId) return null;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.caseLike.findUnique({
      where: { userId_caseId: { userId, caseId } },
    });

    if (existing) {
      await tx.caseLike.delete({ where: { id: existing.id } });
      const profile = await tx.caseProfile.update({
        where: { caseId },
        data: { likeCount: { decrement: 1 } },
      });
      return { liked: false, likeCount: profile.likeCount };
    }

    await tx.caseLike.create({ data: { userId, caseId } });
    const profile = await tx.caseProfile.update({
      where: { caseId },
      data: { likeCount: { increment: 1 } },
    });
    return { liked: true, likeCount: profile.likeCount };
  });
}

// dedupeKeys (not internal caseIds) this user has liked — for the
// server-backed useLikedCases() hook to know which cards to render as
// already-liked on load.
export async function getUserLikedCaseDedupeKeys(userId: string): Promise<string[]> {
  const likes = await prisma.caseLike.findMany({
    where: { userId },
    select: { caseId: true },
  });
  if (likes.length === 0) return [];

  const cases = await prisma.decision_cases.findMany({
    where: { id: { in: likes.map((l) => l.caseId) } },
    select: { dedupe_key: true },
  });
  return cases.map((c) => c.dedupe_key);
}
