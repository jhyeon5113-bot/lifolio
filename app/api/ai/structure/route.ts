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
