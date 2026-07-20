import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const LIST_LIMIT = 20;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Only ever surfaces notifications that have actually been sent
  // (sentAt not null) — a time-based one queued for a later slot today
  // shouldn't be visible in-app before its scheduled moment arrives, or
  // the whole point of spacing multiple same-day notifications apart
  // would be defeated by just opening the bell early.
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId, sentAt: { not: null } },
      orderBy: { sentAt: "desc" },
      take: LIST_LIMIT,
      select: { id: true, type: true, title: true, body: true, linkUrl: true, sentAt: true, readAt: true },
    }),
    prisma.notification.count({
      where: { userId, sentAt: { not: null }, readAt: null },
    }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}
