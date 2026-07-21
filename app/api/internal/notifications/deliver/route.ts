import { NextResponse } from "next/server";
import { requireInternalSecret } from "@/lib/notifications/internal-auth";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

// Called at each of the day's 3 delivery slots (see
// .github/workflows/notifications-cron.yml) — sends
// the actual push for every Notification that's now due and hasn't gone
// out yet. Each queued row already carries its own real title/body (see
// lib/notifications/compute.ts's per-slot assignment) — no digest/bundling
// here, multiple same-day notifications for one user were already spread
// across different slots at compute time instead.
export async function POST(request: Request) {
  const authError = requireInternalSecret(request);
  if (authError) return authError;

  const now = new Date();
  const due = await prisma.notification.findMany({
    where: { scheduledSendAt: { lte: now }, sentAt: null },
    select: { id: true, userId: true, title: true, body: true, linkUrl: true },
  });

  let delivered = 0;
  for (const notification of due) {
    try {
      await sendPushToUser(notification.userId, {
        title: notification.title,
        body: notification.body,
        url: notification.linkUrl ?? "/home",
      });
    } catch (error) {
      // The in-app Notification row (marked sent below regardless) is what
      // matters most — a push failure for one row must never abort
      // delivery of the rest of the batch.
      console.error(`deliver: push send failed for notification ${notification.id}:`, error);
    }
    await prisma.notification.update({ where: { id: notification.id }, data: { sentAt: now } });
    delivered += 1;
  }

  return NextResponse.json({ delivered });
}
