import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCompletedDecisions } from "@/lib/active-decisions-data";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limitParam = Number(new URL(request.url).searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 10;

  const decisions = await getCompletedDecisions(session.user.id, limit);
  return NextResponse.json({ decisions });
}
