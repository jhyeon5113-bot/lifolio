import { memo } from "react";
import Link from "next/link";
import type { ActiveDecisionView } from "@/lib/active-decisions-data";
import { getCheckInLabel } from "@/lib/decision-status-presentation";

// Rendered in a list on the home page, which re-renders on unrelated state
// changes (toasts, other sections' fetches) — memo keeps that from
// re-rendering every card when this one's own props haven't changed.
export const ActiveDecisionCard = memo(function ActiveDecisionCard({
  decision,
  onStatusUpdateClick,
  justUpdated = false,
  className = "",
}: {
  decision: ActiveDecisionView;
  onStatusUpdateClick: (decisionId: string) => void;
  justUpdated?: boolean;
  className?: string;
}) {
  const cardClassName = `bg-white border border-outline-variant p-u-md rounded-xl shadow-sm flex flex-col ${
    decision.clickable ? "justify-between hover:shadow-md transition-shadow" : "opacity-70"
  } ${className}`;

  const cardContent = (
    <>
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary">
              {decision.icon}
            </span>
          </div>
          <span className="text-label-sm text-on-surface-variant bg-surface-container-high px-3 py-1 rounded-full whitespace-nowrap">
            {decision.badge}
          </span>
        </div>
        <h3 className="text-title-lg text-on-surface mb-2">{decision.title}</h3>
        <p className="text-body-md text-on-surface-variant mb-6 line-clamp-2">
          {decision.description}
        </p>
        {!decision.clickable && (
          <div className="mb-3 pt-4 border-t border-outline-variant/20">
            <p className="text-label-sm text-outline uppercase tracking-wider mb-1">
              현재 상태
            </p>
            <p className="text-body-md text-on-surface mb-3">
              {decision.currentStatus ? getCheckInLabel(decision.currentStatus) : "아직 기록이 없어요."}
            </p>
            <button
              type="button"
              onClick={() => onStatusUpdateClick(decision.id)}
              disabled={justUpdated}
              className={`w-full py-2.5 text-label-md rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-1 ${
                justUpdated
                  ? "bg-secondary-container text-on-secondary-container"
                  : "text-primary border border-primary/30 hover:bg-primary/5"
              }`}
            >
              {justUpdated && (
                <span className="material-symbols-outlined text-[18px]">check</span>
              )}
              {justUpdated ? "업데이트 완료" : "상태 업데이트"}
            </button>
          </div>
        )}
      </div>
      <div className="w-full bg-surface-container-low h-1 rounded-full overflow-hidden">
        <div className="bg-secondary h-full" style={{ width: `${decision.progress}%` }} />
      </div>
    </>
  );

  return decision.clickable ? (
    <Link href={`/consult?decisionId=${decision.id}`} className={cardClassName}>
      {cardContent}
    </Link>
  ) : (
    <div className={cardClassName}>{cardContent}</div>
  );
});
