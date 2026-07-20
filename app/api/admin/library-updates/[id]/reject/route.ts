import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { rejectLibraryCaseUpdate } from "@/lib/library-review-repo";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const ok = await rejectLibraryCaseUpdate(id);
  if (!ok) {
    return NextResponse.json({ error: "Update not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
