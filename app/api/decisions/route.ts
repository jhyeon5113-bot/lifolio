import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getHistoryEntries } from "@/lib/history-data";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

function deriveTitle(options: string[], situation: string, rawInput: string): string {
  if (options.length >= 2) return `${options[0]} vs ${options[1]}`;
  const fallback = situation.trim() || rawInput.trim();
  return fallback.length > 30 ? `${fallback.slice(0, 30)}…` : fallback;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await getHistoryEntries(session.user.id);
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 30/hour — generous for real usage (a handful of new consult sessions a
  // day), tight enough to stop a runaway loop from flooding the DB.
  const rateLimit = await checkRateLimit(`user:${session.user.id}:route:POST:/api/decisions`, 30, 60 * 60 * 1000);
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const asStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  const rawInput = typeof body.rawInput === "string" ? body.rawInput : "";
  const category = typeof body.category === "string" ? body.category : "학업/전공";
  const background = typeof body.background === "string" ? body.background : "";
  const situation = typeof body.situation === "string" ? body.situation : "";
  const options = asStringArray(body.options);
  const criteria = asStringArray(body.criteria);
  const concerns = asStringArray(body.concerns);

  if (!rawInput.trim()) {
    return NextResponse.json({ error: "rawInput is required" }, { status: 400 });
  }

  const decision = await prisma.decision.create({
    data: {
      userId: session.user.id,
      category,
      title: deriveTitle(options, situation, rawInput),
      rawInput,
      background,
      situation,
      criteria,
      concerns,
      options: {
        create: options.map((title, index) => ({ title, sortOrder: index })),
      },
    },
    include: { options: true },
  });

  return NextResponse.json(decision);
}
