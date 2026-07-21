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

  const rateLimit = await checkRateLimit(`user:${session.user.id}:route:POST:/api/ai/title`, 30, 60 * 60 * 1000);
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const result = await withTimeout(
      getAIProvider().generateTitle({
        category: typeof body.category === "string" ? body.category : "",
        background: typeof body.background === "string" ? body.background : "",
        situation: typeof body.situation === "string" ? body.situation : "",
        options: Array.isArray(body.options) ? body.options : [],
        criteria: Array.isArray(body.criteria) ? body.criteria : [],
        concerns: Array.isArray(body.concerns) ? body.concerns : [],
      }),
      20_000,
      "AI title",
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "AI title generation failed" }, { status: 502 });
  }
}
