import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { getPendingSubmissionCount } from "@/lib/library-review-repo";

export async function GET() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const count = await getPendingSubmissionCount();
  return NextResponse.json({ count });
}
