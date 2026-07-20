import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // A decision with no expectedReflectionDate (older rows, or the user
  // picked "나중에 정할게요") is eligible right away — the date only ever
  // narrows eligibility, never blocks it entirely. There can be several of
  // these at once, so this returns all of them (oldest first).
  const decisions = await prisma.decision.findMany({
    where: {
      userId,
      status: "DECIDED",
      reflections: { none: {} },
      OR: [{ expectedReflectionDate: null }, { expectedReflectionDate: { lte: new Date() } }],
    },
    orderBy: { createdAt: "asc" },
    include: { options: true },
  });

  return NextResponse.json({ decisions });
}
