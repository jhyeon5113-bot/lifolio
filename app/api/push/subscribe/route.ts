import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface SubscribeBody {
  endpoint?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown };
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SubscribeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  const p256dh = typeof body.keys?.p256dh === "string" ? body.keys.p256dh : "";
  const authSecret = typeof body.keys?.auth === "string" ? body.keys.auth : "";
  if (!endpoint || !p256dh || !authSecret) {
    return NextResponse.json({ error: "endpoint and keys.p256dh/keys.auth are required" }, { status: 400 });
  }

  // Keyed by endpoint (not userId+endpoint) — the same browser subscription
  // can't belong to two users at once, and re-subscribing (permission
  // re-granted, key rotation) should update the existing row rather than
  // pile up duplicates.
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId: session.user.id,
      endpoint,
      p256dh,
      auth: authSecret,
      userAgent: request.headers.get("user-agent") ?? undefined,
    },
    update: {
      userId: session.user.id,
      p256dh,
      auth: authSecret,
      userAgent: request.headers.get("user-agent") ?? undefined,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SubscribeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  if (!endpoint) {
    return NextResponse.json({ error: "endpoint is required" }, { status: 400 });
  }

  // Scoped to the caller's own userId so one user can't delete another's
  // subscription by guessing/replaying an endpoint string.
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: session.user.id } });

  return NextResponse.json({ ok: true });
}
