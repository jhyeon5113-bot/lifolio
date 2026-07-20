import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { updateSubmissionDraft, type SubmissionDraftPatch } from "@/lib/library-review-repo";
import { clamp } from "@/lib/clamp";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const asStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

  const patch: SubmissionDraftPatch = {};
  const stringFields: (keyof SubmissionDraftPatch)[] = [
    "title",
    "category",
    "background",
    "situation",
    "finalChoice",
    "expectedOutcome",
    "actualOutcome",
    "wouldChooseAgain",
    "chooseAgainReason",
    "outcomeGap",
    "adviceForOthers",
    "subtitle",
    "detailTag",
    "tags",
    "authorInitials",
  ];
  for (const field of stringFields) {
    if (typeof body[field] === "string") (patch as Record<string, string>)[field] = body[field];
  }
  if (Array.isArray(body.options)) patch.options = asStringArray(body.options);
  if (Array.isArray(body.criteria)) patch.criteria = asStringArray(body.criteria);
  if (Array.isArray(body.anxieties)) patch.anxieties = asStringArray(body.anxieties);
  if (typeof body.satisfaction === "number") patch.satisfaction = clamp(body.satisfaction, 0, 100);

  const submission = await updateSubmissionDraft(id, patch);
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }
  return NextResponse.json(submission);
}
