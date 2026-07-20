import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import type { NotificationType } from "@/lib/generated/prisma/client";
import type { NotificationContent } from "@/lib/notifications/content";

// Event-driven notifications (②LIBRARY_PUBLISHED, ⑦REPORT_LEVEL_UP): create
// the row and push immediately — these fire at the exact moment something
// happens (an admin approves a submission, a reflection crosses a report
// level threshold), so there's no daily queue involved.
export async function notifyNow(
  userId: string,
  type: NotificationType,
  content: NotificationContent,
  decisionId?: string,
): Promise<void> {
  const now = new Date();
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title: content.title,
      body: content.body,
      linkUrl: content.linkUrl,
      decisionId,
      scheduledSendAt: now,
      sentAt: now,
    },
  });

  // A push failure must never roll back or surface as an error to the
  // caller (e.g. approving a submission) — the in-app Notification row
  // above already exists and is what actually matters; push is a
  // best-effort bonus channel on top of it.
  await sendPushToUser(userId, { title: content.title, body: content.body, url: content.linkUrl }).catch((error) => {
    console.error(`notifyNow: push send failed for notification ${notification.id}:`, error);
  });
}

// Time-based notifications (①③④⑤): queued into one of today's 3 delivery
// slots by the daily compute job (lib/notifications/compute.ts), not pushed
// immediately — app/api/internal/notifications/deliver does that later, at
// the slot's actual time.
export async function queueNotification(
  userId: string,
  type: NotificationType,
  content: NotificationContent,
  scheduledSendAt: Date,
  decisionId?: string,
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId,
      type,
      title: content.title,
      body: content.body,
      linkUrl: content.linkUrl,
      decisionId,
      scheduledSendAt,
    },
  });
}
