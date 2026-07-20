import { memo } from "react";
import Link from "next/link";
import type { PendingReflection } from "@/lib/types";

export const PendingReflectionCard = memo(function PendingReflectionCard({
  item,
  className = "",
}: {
  item: PendingReflection;
  className?: string;
}) {
  return (
    <div
      className={`border border-outline-variant p-u-md rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 bg-white ${className}`}
    >
      <div className="mb-2 flex justify-between items-center">
        <span className="text-label-sm text-secondary px-2 py-0.5 rounded-full bg-secondary-container/60">
          {item.daysElapsed}일 경과
        </span>
        <span className="material-symbols-outlined text-secondary text-sm">
          schedule
        </span>
      </div>
      <h3 className="text-title-lg text-on-surface mb-4">{item.title}</h3>
      <div className="mb-6">
        <div className="flex justify-between text-[10px] font-bold text-outline mb-1">
          <span>회고 시점 도달</span>
          <span>100%</span>
        </div>
        <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
          <div className="bg-secondary h-full w-full" />
        </div>
      </div>
      <div className="space-y-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <p className="text-body-md text-on-surface-variant">
            내 선택: {item.choiceSummary}
          </p>
        </div>
        <p className="text-label-md text-outline leading-relaxed">
          {item.note}
        </p>
      </div>
      <Link
        href={`/capsule?decisionId=${item.id}`}
        className="w-full bg-secondary hover:bg-secondary/90 text-on-secondary text-label-md py-4 rounded-xl flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-200 active:scale-95 group"
      >
        <span>지금 바로 회고하기</span>
        <span className="hidden sm:inline text-xs opacity-70">(30초면 충분해요)</span>
        <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
          edit_note
        </span>
      </Link>
    </div>
  );
});
