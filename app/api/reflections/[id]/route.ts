import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clamp } from "@/lib/clamp";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const reflection = await prisma.reflection.findUnique({ where: { id }, include: { decision: true } });
  if (!reflection || reflection.decision.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(reflection);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.reflection.findUnique({ where: { id }, include: { decision: true } });
  if (!existing || existing.decision.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const satisfaction =
    typeof body.satisfaction === "number" ? clamp(body.satisfaction, 0, 100) : existing.satisfaction;
  const wouldChooseAgain =
    body.wouldChooseAgain === "YES" || body.wouldChooseAgain === "NO" || body.wouldChooseAgain === "UNSURE"
      ? body.wouldChooseAgain
      : existing.wouldChooseAgain;
  const actualResult = typeof body.actualResult === "string" ? body.actualResult : existing.actualResult;
  const actualVsExpected =
    typeof body.actualVsExpected === "string" ? body.actualVsExpected : existing.actualVsExpected;
  const chooseAgainReason =
    typeof body.chooseAgainReason === "string" && body.chooseAgainReason.trim()
      ? body.chooseAgainReason
      : existing.chooseAgainReason;
  const reason =
    typeof body.reason === "string" && body.reason.trim() ? body.reason : existing.reason;

  const reflection = await prisma.reflection.update({
    where: { id },
    data: { satisfaction, wouldChooseAgain, actualResult, actualVsExpected, chooseAgainReason, reason },
  });

  return NextResponse.json(reflection);
}
