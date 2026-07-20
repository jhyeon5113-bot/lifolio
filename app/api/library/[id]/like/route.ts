import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { toggleCaseLike } from "@/lib/case-engagement";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await toggleCaseLike(session.user.id, id);
  if (!result) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
