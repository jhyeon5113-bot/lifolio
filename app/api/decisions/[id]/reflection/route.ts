import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createSubmissionDraft, createLibraryCaseUpdateDraft } from "@/lib/library-review-repo";
import { getMonthsAfterLabel } from "@/lib/reflection-timeline-data";
import { clamp } from "@/lib/clamp";
import { LEVEL_1_REFLECTION_THRESHOLD } from "@/lib/dna-repo";
import { notifyNow } from "@/lib/notifications/create";
import { reportLevelUpContent } from "@/lib/notifications/content";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(
    `user:${session.user.id}:route:POST:/api/decisions/reflection`,
    20,
    60 * 60 * 1000,
  );
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  const { id } = await params;
  const decision = await prisma.decision.findUnique({
    where: { id },
    include: { options: true, reflections: true, libraryCaseSubmission: true },
  });
  if (!decision || decision.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (decision.status === "IN_PROGRESS") {
    return NextResponse.json({ error: "Decision is not decided yet" }, { status: 409 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const satisfaction =
    typeof body.satisfaction === "number" ? clamp(body.satisfaction, 0, 100) : 50;
  const wouldChooseAgain =
    body.wouldChooseAgain === "YES" || body.wouldChooseAgain === "NO" || body.wouldChooseAgain === "UNSURE"
      ? body.wouldChooseAgain
      : "UNSURE";
  const actualResult = typeof body.actualResult === "string" ? body.actualResult : "";
  const actualVsExpected = typeof body.actualVsExpected === "string" ? body.actualVsExpected : "";
  const chooseAgainReason =
    typeof body.chooseAgainReason === "string" && body.chooseAgainReason.trim() ? body.chooseAgainReason : undefined;
  const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason : undefined;

  // Only the very first reflection flips the decision COMPLETED and queues
  // a library-card draft — follow-up reflections ("다시 회고하기") just add
  // another row to the timeline.
  const isFirstReflection = decision.reflections.length === 0;

  const [reflection] = await prisma.$transaction([
    prisma.reflection.create({
      data: {
        decisionId: id,
        actualResult,
        satisfaction,
        actualVsExpected,
        wouldChooseAgain,
        chooseAgainReason,
        reason,
      },
    }),
    ...(isFirstReflection
      ? [prisma.decision.update({ where: { id }, data: { status: "COMPLETED" as const } })]
      : []),
  ]);

  if (isFirstReflection) {
    // Auto-queue a library-card draft for admin review — never published
    // automatically, see lib/library-review-repo.ts.
    await createSubmissionDraft(decision, reflection);

    // ⑦ Report level-up notification. Only a decision's *first* reflection
    // can move the completed-decision count at all (a "다시 회고하기"
    // follow-up on an already-counted decision never does), so this is the
    // only branch where a level-up is even possible — and today that means
    // exactly one thing: crossing the Level 0→1 threshold. lib/dna-repo.ts
    // is explicit that Levels 2-5 are out of MVP scope and this repo never
    // produces them, so there's no "did we cross 7/15/30/50" to check for.
    // Fired here (at save time) rather than from inside
    // getOrCreateDecisionDnaSnapshot, because that function only runs
    // lazily when someone loads /report — hooking it there would mean the
    // notification could only ever fire while the user is already looking
    // at the report, which defeats the point of notifying them.
    const userId = session.user.id;
    const completedCount = await prisma.decision.count({
      where: { userId, reflections: { some: {} } },
    });
    if (completedCount === LEVEL_1_REFLECTION_THRESHOLD) {
      await notifyNow(userId, "REPORT_LEVEL_UP", reportLevelUpContent(1)).catch((error) => {
        console.error(`reflection route: REPORT_LEVEL_UP notifyNow failed for user ${userId}:`, error);
      });
    }
  } else if (decision.libraryCaseSubmission?.status === "APPROVED") {
    // The case is already live in the public library — a follow-up
    // reflection queues a small admin-reviewed addition to that same card
    // rather than a whole new draft.
    await createLibraryCaseUpdateDraft(
      decision.id,
      reflection.id,
      actualResult,
      getMonthsAfterLabel(decision.createdAt, reflection.createdAt),
    );
  }

  return NextResponse.json(reflection);
}
