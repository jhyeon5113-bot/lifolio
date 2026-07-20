import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CHECK_IN_OPTIONS, type DecisionCheckInStatus } from "@/lib/decision-status-presentation";

const VALID_STATUSES = new Set(CHECK_IN_OPTIONS.map((option) => option.value));

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const decision = await prisma.decision.findUnique({ where: { id } });
  if (!decision || decision.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (decision.status !== "DECIDED") {
    return NextResponse.json({ error: "Decision is not awaiting reflection" }, { status: 409 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const status = body.status as DecisionCheckInStatus;
  if (!VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Every check-in is kept as its own row (never overwritten) — see the
  // schema comment on DecisionStatusUpdate.
  const update = await prisma.decisionStatusUpdate.create({
    data: { decisionId: id, status },
  });

  return NextResponse.json(update);
}
