import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(`user:${session.user.id}:route:/api/push/test`, 5, 60 * 60 * 1000);
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  const subscriptionCount = await prisma.pushSubscription.count({ where: { userId: session.user.id } });
  if (subscriptionCount === 0) {
    return NextResponse.json({ error: "등록된 구독이 없어요." }, { status: 400 });
  }

  await sendPushToUser(session.user.id, {
    title: "테스트 알림이에요",
    body: "이 알림이 보인다면 푸시가 정상 작동하고 있어요.",
    url: "/notifications",
  });

  return NextResponse.json({ ok: true });
}
