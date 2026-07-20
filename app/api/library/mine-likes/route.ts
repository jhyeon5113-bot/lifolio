import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserLikedCaseDedupeKeys } from "@/lib/case-engagement";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const caseIds = await getUserLikedCaseDedupeKeys(session.user.id);
  return NextResponse.json({ caseIds });
}
