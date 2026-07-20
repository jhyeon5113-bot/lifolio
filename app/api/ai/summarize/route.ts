import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAIProvider } from "@/lib/ai";
import { withTimeout } from "@/lib/withTimeout";

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

  try {
    const result = await withTimeout(
      getAIProvider().summarizeDecision({
        category: typeof body.category === "string" ? body.category : "",
        background: typeof body.background === "string" ? body.background : "",
        situation: typeof body.situation === "string" ? body.situation : "",
        options: Array.isArray(body.options) ? body.options : [],
        criteria: Array.isArray(body.criteria) ? body.criteria : [],
        concerns: Array.isArray(body.concerns) ? body.concerns : [],
      }),
      20_000,
      "AI summarize",
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "AI summary failed" }, { status: 502 });
  }
}
