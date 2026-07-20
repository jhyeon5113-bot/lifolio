import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { incrementCaseView } from "@/lib/case-engagement";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await incrementCaseView(id);

  return NextResponse.json({ ok: true });
}
