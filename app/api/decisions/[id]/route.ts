import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateDecisionTraitProfile } from "@/lib/trait-repo";
import { clamp } from "@/lib/clamp";

const VALID_DECISION_STATUSES = new Set(["IN_PROGRESS", "DECIDED", "COMPLETED"]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const decision = await prisma.decision.findUnique({
    where: { id },
    include: { options: true, reflections: { orderBy: { createdAt: "desc" } } },
  });
  if (!decision || decision.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(decision);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.decision.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const data: {
    title?: string;
    category?: string;
    background?: string;
    situation?: string;
    criteria?: string[];
    concerns?: string[];
    currentPreference?: string;
    finalChoice?: string;
    confidence?: number;
    status?: "IN_PROGRESS" | "DECIDED" | "COMPLETED";
    expectedReflectionDate?: Date;
  } = {};
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body.category === "string") data.category = body.category;
  if (typeof body.background === "string") data.background = body.background;
  if (typeof body.situation === "string") data.situation = body.situation;
  if (Array.isArray(body.criteria)) data.criteria = body.criteria.filter((c): c is string => typeof c === "string");
  if (Array.isArray(body.concerns)) data.concerns = body.concerns.filter((c): c is string => typeof c === "string");
  if (typeof body.currentPreference === "string") data.currentPreference = body.currentPreference;
  if (typeof body.finalChoice === "string") data.finalChoice = body.finalChoice;
  if (typeof body.confidence === "number") data.confidence = clamp(body.confidence, 0, 100);
  if (typeof body.status === "string" && VALID_DECISION_STATUSES.has(body.status)) {
    data.status = body.status as "IN_PROGRESS" | "DECIDED" | "COMPLETED";
  }
  if (typeof body.expectedReflectionDate === "string") {
    const parsed = new Date(body.expectedReflectionDate);
    if (!Number.isNaN(parsed.getTime())) {
      data.expectedReflectionDate = parsed;
    }
  }

  interface OptionInput {
    title: string;
    expectedPositive?: string;
    expectedNegative?: string;
  }
  const options: OptionInput[] | undefined = Array.isArray(body.options)
    ? body.options
        .map((o: unknown) =>
          typeof o === "string"
            ? { title: o }
            : {
                title: typeof (o as OptionInput)?.title === "string" ? (o as OptionInput).title : "",
                expectedPositive: (o as OptionInput)?.expectedPositive,
                expectedNegative: (o as OptionInput)?.expectedNegative,
              },
        )
        .filter((o) => o.title.trim().length > 0)
    : undefined;

  const decision = await prisma.$transaction(async (tx) => {
    if (options) {
      await tx.decisionOption.deleteMany({ where: { decisionId: id } });
      await tx.decisionOption.createMany({
        data: options.map((option, index) => ({
          decisionId: id,
          title: option.title,
          expectedPositive: option.expectedPositive,
          expectedNegative: option.expectedNegative,
          sortOrder: index,
        })),
      });
    }
    return tx.decision.update({
      where: { id },
      data,
      include: { options: true },
    });
  });

  // Decision Trait Profile updates the moment a decision is finalized —
  // doesn't wait on a Reflection. Only fire on the IN_PROGRESS→DECIDED
  // transition so re-patching an already-DECIDED decision doesn't
  // double-count it in the EMA.
  if (data.status === "DECIDED" && existing.status !== "DECIDED") {
    await updateDecisionTraitProfile(session.user.id, decision);
  }

  return NextResponse.json(decision);
}
