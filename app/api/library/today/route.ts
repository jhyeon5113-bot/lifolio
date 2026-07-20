import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTodaysReading } from "@/lib/cases-repo";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  const cases = await getTodaysReading(userId);
  return NextResponse.json({ cases });
}
