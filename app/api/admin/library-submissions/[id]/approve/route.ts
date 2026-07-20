import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { approveSubmission } from "@/lib/library-review-repo";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const result = await approveSubmission(id);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Could not approve submission" }, { status: 400 });
  }
}
