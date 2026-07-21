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

  // AI calls cost money once a real provider is connected — limit is
  // deliberately tighter than the other AI routes since this only fires
  // once per new decision in normal usage.
  const rateLimit = await checkRateLimit(`user:${session.user.id}:route:POST:/api/ai/structure`, 20, 60 * 60 * 1000);
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const rawInput = typeof body.rawInput === "string" ? body.rawInput : "";
  if (!rawInput.trim()) {
    return NextResponse.json({ error: "rawInput is required" }, { status: 400 });
  }

  try {
    const result = await withTimeout(getAIProvider().structureDecision({ rawInput }), 20_000, "AI structure");
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "AI structuring failed" }, { status: 502 });
  }
}
