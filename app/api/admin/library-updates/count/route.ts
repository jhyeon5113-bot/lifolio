import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { getPendingLibraryCaseUpdateCount } from "@/lib/library-review-repo";

export async function GET() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const count = await getPendingLibraryCaseUpdateCount();
  return NextResponse.json({ count });
}
