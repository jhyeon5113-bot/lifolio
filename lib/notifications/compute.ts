import { prisma } from "@/lib/prisma";
import { addKSTDays, kstDaysBetween, kstSlotInstant, DELIVERY_SLOT_HOURS_KST } from "@/lib/notifications/kst";
import { queueNotification } from "@/lib/notifications/create";
import {
  reflectionDueContent,
  inProgressReminderContent,
  statusUpdateNudgeContent,
  followUpReflectionContent,
  type NotificationContent,
} from "@/lib/notifications/content";
import type { NotificationType } from "@/lib/generated/prisma/client";

interface Candidate {
  userId: string;
  decisionId: string;
  type: NotificationType;
  content: NotificationContent;
}

// ① Reflection due — decision is DECIDED, has no reflection yet, and its
// expectedReflectionDate has arrived (or was never set). One-time: the
// `notifications: none` filter is the whole idempotency check.
async function computeReflectionDue(now: Date): Promise<Candidate[]> {
  const decisions = await prisma.decision.findMany({
    where: {
      status: "DECIDED",
      reflections: { none: {} },
      OR: [{ expectedReflectionDate: null }, { expectedReflectionDate: { lte: now } }],
      notifications: { none: { type: "REFLECTION_DUE" } },
    },
    select: { id: true, userId: true, title: true },
  });

  return decisions.map((d) => ({
    userId: d.userId,
    decisionId: d.id,
    type: "REFLECTION_DUE" as const,
    content: reflectionDueContent({ id: d.id, title: d.title }),
  }));
}

// ③ In-progress reminder — fires twice per decision, at +1일 and +3일 from
// creation. Which occurrence is "next" is derived from how many
// IN_PROGRESS_REMINDER rows already exist for this decision (0 → the +1일
// one is next, 1 → +3일 is next, 2+ → done) — no separate occurrence
// counter needed in the schema.
const IN_PROGRESS_REMINDER_DAYS = [1, 3] as const;

async function computeInProgressReminders(now: Date): Promise<Candidate[]> {
  const decisions = await prisma.decision.findMany({
    where: { status: "IN_PROGRESS" },
    select: {
      id: true,
      userId: true,
      title: true,
      createdAt: true,
      notifications: { where: { type: "IN_PROGRESS_REMINDER" }, select: { id: true } },
    },
  });

  const candidates: Candidate[] = [];
  for (const d of decisions) {
    const targetDay = IN_PROGRESS_REMINDER_DAYS[d.notifications.length];
    if (targetDay === undefined) continue; // both occurrences already sent
    if (addKSTDays(d.createdAt, targetDay) > now) continue; // not due yet

    candidates.push({
      userId: d.userId,
      decisionId: d.id,
      type: "IN_PROGRESS_REMINDER",
      content: inProgressReminderContent({ id: d.id, title: d.title }),
    });
  }
  return candidates;
}

// ④ Status-update nudge — only for DECIDED decisions that (a) have a
// expectedReflectionDate set (no date ⇒ no midpoint to compute, so these
// are skipped entirely — agreed tradeoff, not a bug) and (b) have at least
// one prior check-in. One-time at the midpoint between the first check-in
// and the target reflection date, UNLESS that span is 3+ months, in which
// case it repeats monthly instead.
const THREE_MONTHS_DAYS = 90;
const MONTHLY_INTERVAL_DAYS = 30;

async function computeStatusUpdateNudges(now: Date): Promise<Candidate[]> {
  const decisions = await prisma.decision.findMany({
    where: {
      status: "DECIDED",
      expectedReflectionDate: { not: null },
      statusUpdates: { some: {} },
    },
    select: {
      id: true,
      userId: true,
      title: true,
      expectedReflectionDate: true,
      statusUpdates: { orderBy: { createdAt: "asc" }, take: 1, select: { createdAt: true } },
      notifications: {
        where: { type: "STATUS_UPDATE_NUDGE" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  const candidates: Candidate[] = [];
  for (const d of decisions) {
    const firstUpdateAt = d.statusUpdates[0]?.createdAt;
    const targetDate = d.expectedReflectionDate;
    if (!firstUpdateAt || !targetDate) continue; // guaranteed by the where clause, but keeps this typesafe

    const gapDays = kstDaysBetween(firstUpdateAt, targetDate);
    const lastNudgeAt = d.notifications[0]?.createdAt ?? null;

    let due: boolean;
    if (gapDays < THREE_MONTHS_DAYS) {
      // One-time, at the midpoint — never fires again once sent once.
      due = lastNudgeAt === null && now >= addKSTDays(firstUpdateAt, Math.floor(gapDays / 2));
    } else {
      // Recurring monthly, anchored to the last nudge (or the first
      // check-in if none sent yet).
      const anchor = lastNudgeAt ?? firstUpdateAt;
      due = now >= addKSTDays(anchor, MONTHLY_INTERVAL_DAYS);
    }
    if (!due) continue;

    candidates.push({
      userId: d.userId,
      decisionId: d.id,
      type: "STATUS_UPDATE_NUDGE",
      content: statusUpdateNudgeContent({ id: d.id, title: d.title }),
    });
  }
  return candidates;
}

// ⑤ Follow-up reflection suggestion — COMPLETED decisions with at least one
// reflection. Fires once, D days after the first reflection, where D is how
// many days the user originally took from decision → first reflection
// (capped at 40 days if that gap is longer).
const FOLLOW_UP_CAP_DAYS = 40;

async function computeFollowUpReflections(now: Date): Promise<Candidate[]> {
  const decisions = await prisma.decision.findMany({
    where: {
      status: "COMPLETED",
      reflections: { some: {} },
      notifications: { none: { type: "FOLLOW_UP_REFLECTION" } },
    },
    select: {
      id: true,
      userId: true,
      title: true,
      createdAt: true,
      reflections: { orderBy: { createdAt: "asc" }, take: 1, select: { createdAt: true } },
    },
  });

  const candidates: Candidate[] = [];
  for (const d of decisions) {
    const firstReflectionAt = d.reflections[0]?.createdAt;
    if (!firstReflectionAt) continue; // guaranteed by the where clause

    const gapDays = Math.min(kstDaysBetween(d.createdAt, firstReflectionAt), FOLLOW_UP_CAP_DAYS);
    if (addKSTDays(firstReflectionAt, gapDays) > now) continue; // not due yet

    candidates.push({
      userId: d.userId,
      decisionId: d.id,
      type: "FOLLOW_UP_REFLECTION",
      content: followUpReflectionContent({ id: d.id, title: d.title }),
    });
  }
  return candidates;
}

export interface DailyComputeResult {
  queued: number;
  deferredToNextDay: number;
}

// Runs once a day, but must also be safe to run again the same day (a
// retried/duplicate cron invocation) without exceeding the per-user 3-a-day
// budget or double-booking a slot — so "how many slots are left today for
// this user" is computed fresh from what's already in the DB for today,
// not assumed to start at 3 every run.
async function slotsUsedToday(userId: string, now: Date): Promise<Set<number>> {
  const dayStart = kstSlotInstant(now, 0);
  const dayEnd = kstSlotInstant(now, 24);
  const existing = await prisma.notification.findMany({
    where: { userId, scheduledSendAt: { gte: dayStart, lt: dayEnd } },
    select: { scheduledSendAt: true },
  });
  return new Set(existing.map((n) => n.scheduledSendAt.getTime()));
}

// Finds everyone due for ①③④⑤ today, then per user fills only whatever's
// left of today's 3 delivery slots (accounting for anything an earlier run
// today already queued) — anything that still doesn't fit is left unqueued
// so tomorrow's run naturally reconsiders it (every eligibility check above
// is a fresh "does this already exist?" query, not a one-shot side effect,
// so nothing is lost by deferring).
export async function computeDailyQueue(now: Date = new Date()): Promise<DailyComputeResult> {
  const [reflectionDue, inProgress, statusNudges, followUps] = await Promise.all([
    computeReflectionDue(now),
    computeInProgressReminders(now),
    computeStatusUpdateNudges(now),
    computeFollowUpReflections(now),
  ]);

  const byUser = new Map<string, Candidate[]>();
  for (const candidate of [...reflectionDue, ...inProgress, ...statusNudges, ...followUps]) {
    const list = byUser.get(candidate.userId) ?? [];
    list.push(candidate);
    byUser.set(candidate.userId, list);
  }

  let queued = 0;
  let deferredToNextDay = 0;

  for (const [userId, candidates] of byUser) {
    const usedSlotTimes = await slotsUsedToday(userId, now);
    const freeSlotHours = DELIVERY_SLOT_HOURS_KST.filter((hour) => !usedSlotTimes.has(kstSlotInstant(now, hour).getTime()));

    const toQueue = candidates.slice(0, freeSlotHours.length);
    deferredToNextDay += candidates.length - toQueue.length;

    for (let i = 0; i < toQueue.length; i += 1) {
      const candidate = toQueue[i];
      const scheduledSendAt = kstSlotInstant(now, freeSlotHours[i]);
      await queueNotification(candidate.userId, candidate.type, candidate.content, scheduledSendAt, candidate.decisionId);
      queued += 1;
    }
  }

  return { queued, deferredToNextDay };
}
