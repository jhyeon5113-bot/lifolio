import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getReflectionTimeline } from "@/lib/reflection-timeline-data";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const timeline = await getReflectionTimeline(session.user.id, id);
  if (!timeline) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ timeline });
}
