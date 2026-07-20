import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { approveLibraryCaseUpdate } from "@/lib/library-review-repo";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const content = typeof body.content === "string" ? body.content : "";

  try {
    await approveLibraryCaseUpdate(id, content);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not approve update" }, { status: 400 });
  }
}
