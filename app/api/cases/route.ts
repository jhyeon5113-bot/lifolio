import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getLibraryCaseDetails, getLibraryCases } from "@/lib/cases-repo";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [cases, details] = await Promise.all([
    getLibraryCases(),
    getLibraryCaseDetails(),
  ]);

  return NextResponse.json({ cases, details });
}
