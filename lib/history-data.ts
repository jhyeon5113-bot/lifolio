import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format-date";

export type HistoryStatus = "선택 완료" | "회고 대기" | "회고 완료";

export interface HistoryEntryView {
  id: string;
  createdAt: string; // ISO, for date-range filtering
  date: string; // formatted display, e.g. "2026.07.10"
  category: string;
  title: string;
  situation: string;
  background: string;
  finalChoice: string;
  result: string;
  status: HistoryStatus;
}

// Only decisions that have actually been made (DECIDED/COMPLETED) show up
// here — a decision still mid-consultation hasn't been "내려진" yet.
export async function getHistoryEntries(userId: string): Promise<HistoryEntryView[]> {
  const decisions = await prisma.decision.findMany({
    where: { userId, status: { in: ["DECIDED", "COMPLETED"] } },
    include: { reflections: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  return decisions.map((d) => {
    const reflection = d.reflections[0] ?? null;
    let status: HistoryStatus;
    if (reflection) {
      status = "회고 완료";
    } else if (!d.expectedReflectionDate || d.expectedReflectionDate <= now) {
      // No date set (e.g. "나중에 정할게요") is treated the same as an
      // already-passed date — both mean a reflection is eligible right now.
      status = "회고 대기";
    } else {
      status = "선택 완료";
    }

    return {
      id: d.id,
      createdAt: d.createdAt.toISOString(),
      date: formatDate(d.createdAt),
      category: d.category,
      title: d.title,
      situation: d.situation ?? "",
      background: d.background ?? "",
      finalChoice: d.finalChoice ?? "",
      result: reflection?.actualResult ?? "아직 회고 전이에요.",
      status,
    };
  });
}
