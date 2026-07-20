import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { findSimilarCases } from "@/lib/cases-repo";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const asStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  const matches = await findSimilarCases({
    category: typeof body.category === "string" ? body.category : "",
    criteria: asStringArray(body.criteria),
    concerns: asStringArray(body.concerns),
    background: typeof body.background === "string" ? body.background : undefined,
    situation: typeof body.situation === "string" ? body.situation : undefined,
  });
  return NextResponse.json(matches);
}
