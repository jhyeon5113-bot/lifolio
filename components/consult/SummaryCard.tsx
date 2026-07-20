"use client";

import { useState } from "react";
import { LibraryCaseCard } from "@/components/LibraryCaseCard";
import type { SimilarCaseMatch } from "@/app/(app)/consult/types";

export function SummaryCard({
  summary,
  options,
  matches,
  chosen,
  confidence,
  locked,
  onSubmit,
  returnTo,
}: {
  summary: string;
  options: string[];
  matches: SimilarCaseMatch[];
  chosen?: string;
  confidence?: number;
  locked: boolean;
  onSubmit: (choice: string, confidence: number) => void;
  returnTo?: string;
}) {
  const [selected, setSelected] = useState(chosen ?? "");
  const [confidenceValue, setConfidenceValue] = useState(confidence ?? 70);

  return (
    <div className="p-5 bg-white rounded-r-2xl rounded-bl-2xl shadow-sm border border-outline-variant/20 space-y-5 w-full">
      <p className="text-on-surface text-body-md whitespace-pre-line">{summary}</p>

      {matches.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-outline uppercase tracking-wider">
            비슷한 고민을 했던 사람들
          </p>
          <div className="space-y-2">
            {matches.map((match) => (
              <div key={match.case.id} className="space-y-2">
                <LibraryCaseCard
                  item={match.case}
                  hasDetail
                  saved={false}
                  onToggleSave={() => {}}
                  liked={false}
                  onToggleLike={() => {}}
                  returnTo={returnTo}
                />
                <p className="text-sm text-primary px-1">{match.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 pt-4 border-t border-outline-variant/20">
        <p className="text-[11px] font-bold text-outline uppercase tracking-wider">
          최종적으로 어떤 선택을 하셨나요?
        </p>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              disabled={locked}
              onClick={() => setSelected(option)}
              className={`px-4 py-2 rounded-full text-label-md transition-colors disabled:opacity-70 ${
                selected === option
                  ? "bg-primary text-on-primary"
                  : "bg-white border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {locked ? (
          chosen && (
            <p className="text-sm text-primary font-medium">
              &ldquo;{chosen}&rdquo;을(를) 선택하셨어요 (확신도 {confidence}%)
            </p>
          )
        ) : (
          <>
            <div>
              <p className="text-xs text-on-surface-variant mb-1">
                확신도 {confidenceValue}%
              </p>
              <input
                type="range"
                min={0}
                max={100}
                value={confidenceValue}
                onChange={(event) => setConfidenceValue(Number(event.target.value))}
                aria-label="확신도"
                aria-valuetext={`${confidenceValue}%`}
                className="w-full accent-primary"
              />
            </div>
            <button
              type="button"
              onClick={() => selected && onSubmit(selected, confidenceValue)}
              disabled={!selected}
              className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-container transition-colors active:scale-95 disabled:opacity-40"
            >
              선택 확정하기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
