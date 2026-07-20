import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMyLibraryCaseIds } from "@/lib/cases-repo";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const caseIds = await getMyLibraryCaseIds(session.user.id);
  return NextResponse.json({ caseIds });
}
