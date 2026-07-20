import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { getPendingLibraryCaseUpdates } from "@/lib/library-review-repo";

export async function GET() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates = await getPendingLibraryCaseUpdates();
  return NextResponse.json({
    updates: updates.map((u) => ({
      id: u.id,
      decisionId: u.decisionId,
      decisionTitle: u.decision.title,
      content: u.content,
      monthsAfterLabel: u.monthsAfterLabel,
      submittedAt: u.submittedAt,
    })),
  });
}
