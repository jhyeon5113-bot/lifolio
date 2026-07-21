import { NextResponse } from "next/server";
import { requireInternalSecret } from "@/lib/notifications/internal-auth";
import { computeDailyQueue } from "@/lib/notifications/compute";

// Called once a day (by the cron-trigger Worker, at the first of the three
// delivery slots) — finds everyone due for a ①③④⑤ notification today and
// queues each into one of today's slots. Safe to call more than once on
// the same day: every eligibility check in computeDailyQueue is a fresh
// "does this already exist?" query, so a repeat call just finds nothing
// new to queue.
export async function POST(request: Request) {
  const authError = requireInternalSecret(request);
  if (authError) return authError;

  const result = await computeDailyQueue();
  return NextResponse.json(result);
}
