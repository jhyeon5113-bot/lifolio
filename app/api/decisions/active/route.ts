import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getActiveDecisions } from "@/lib/active-decisions-data";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decisions = await getActiveDecisions(session.user.id);
  return NextResponse.json({ decisions });
}
