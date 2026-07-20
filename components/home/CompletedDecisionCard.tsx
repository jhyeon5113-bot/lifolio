import { memo } from "react";
import type { CompletedDecisionView } from "@/lib/active-decisions-data";

export const CompletedDecisionCard = memo(function CompletedDecisionCard({
  decision,
  onTimelineClick,
  className = "",
}: {
  decision: CompletedDecisionView;
  onTimelineClick: (decision: { id: string; title: string }) => void;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-outline-variant p-u-md rounded-xl shadow-sm ${className}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-[76px] h-[76px] rounded-2xl bg-surface-container flex items-center justify-center">
          <span className="material-symbols-outlined text-secondary text-3xl">
            {decision.icon}
          </span>
        </div>
        <span className="text-label-sm text-on-surface-variant bg-surface-container-high px-3 py-1 rounded-full whitespace-nowrap">
          {decision.completedDate} 완료
        </span>
      </div>
      <h3 className="text-title-lg text-on-surface mb-2">{decision.title}</h3>
      <p className="text-body-md text-on-surface-variant mb-6 line-clamp-2">
        {decision.description}
      </p>
      <button
        type="button"
        onClick={() => onTimelineClick({ id: decision.id, title: decision.title })}
        className="w-full py-3.5 text-label-md text-secondary border border-secondary/30 rounded-xl flex items-center justify-center gap-2 hover:bg-secondary/5 transition-colors active:scale-95"
      >
        다시 되돌아보기
        <span className="material-symbols-outlined text-sm">history</span>
      </button>
    </div>
  );
});
