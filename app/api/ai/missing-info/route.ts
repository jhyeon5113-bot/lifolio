import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAIProvider } from "@/lib/ai";
import { withTimeout } from "@/lib/withTimeout";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Higher limit than the other AI routes — this one legitimately fires
  // several times per consult session (once per missing field).
  const rateLimit = await checkRateLimit(`user:${session.user.id}:route:POST:/api/ai/missing-info`, 60, 60 * 60 * 1000);
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const result = await withTimeout(
      getAIProvider().detectMissingInfo({
        background: typeof body.background === "string" ? body.background : "",
        situation: typeof body.situation === "string" ? body.situation : "",
        options: Array.isArray(body.options) ? body.options : [],
        criteria: Array.isArray(body.criteria) ? body.criteria : [],
        concerns: Array.isArray(body.concerns) ? body.concerns : [],
      }),
      20_000,
      "AI missing-info",
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "AI check failed" }, { status: 502 });
  }
}
