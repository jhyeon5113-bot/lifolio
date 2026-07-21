import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAIProvider } from "@/lib/ai";
import { withTimeout } from "@/lib/with-timeout";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fires once per consult, right when the missing-info loop closes — same
  // budget as /api/ai/structure, which fires once at the other end of the
  // same conversation.
  const rateLimit = await checkRateLimit(`user:${session.user.id}:route:POST:/api/ai/review-draft`, 20, 60 * 60 * 1000);
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const asStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

  try {
    const result = await withTimeout(
      getAIProvider().reviewStructuredDraft({
        title: typeof body.title === "string" ? body.title : "",
        category: typeof body.category === "string" ? body.category : "",
        background: typeof body.background === "string" ? body.background : "",
        situation: typeof body.situation === "string" ? body.situation : "",
        options: asStringArray(body.options),
        criteria: asStringArray(body.criteria),
        concerns: asStringArray(body.concerns),
      }),
      20_000,
      "AI draft review",
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "AI draft review failed" }, { status: 502 });
  }
}
