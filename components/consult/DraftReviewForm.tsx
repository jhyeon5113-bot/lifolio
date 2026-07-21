"use client";

import { useState } from "react";
import type { DraftReviewIssue } from "@/lib/ai";

export function DraftReviewForm({
  issues,
  locked,
  answer,
  onSubmit,
}: {
  issues: DraftReviewIssue[];
  locked: boolean;
  answer?: Record<string, string>;
  onSubmit: (answers: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(issues.map((issue) => [issue.field, ""])),
  );

  if (locked) {
    return (
      <div className="p-5 bg-white rounded-r-2xl rounded-bl-2xl shadow-sm border border-outline-variant/20 space-y-4">
        <p className="text-on-surface text-body-md">
          조금만 더 알려주시면 더 정확한 사례를 추천할 수 있어요.
        </p>
        {issues.map((issue, index) => (
          <div key={issue.field} className="space-y-1">
            <p className="text-sm font-bold text-primary">
              {index + 1}. {issue.question}
            </p>
            <p className="text-sm text-on-surface-variant">{answer?.[issue.field]}</p>
          </div>
        ))}
      </div>
    );
  }

  const update = (field: string, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const allFilled = issues.every((issue) => values[issue.field]?.trim());

  return (
    <div className="p-5 bg-white rounded-r-2xl rounded-bl-2xl shadow-sm border border-outline-variant/20 space-y-5">
      <p className="text-on-surface text-body-md">
        조금만 더 알려주시면 더 정확한 사례를 추천할 수 있어요.
      </p>
      {issues.map((issue, index) => (
        <div
          key={issue.field}
          className="space-y-2 pb-4 border-b border-outline-variant/10 last:border-0 last:pb-0"
        >
          <p className="text-[11px] font-bold text-outline uppercase tracking-wider">
            {index + 1}. {issue.question}
          </p>
          <textarea
            value={values[issue.field] ?? ""}
            onChange={(event) => update(issue.field, event.target.value)}
            rows={2}
            className="w-full p-3 text-sm bg-white border border-outline-variant/40 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onSubmit(Object.fromEntries(issues.map((issue) => [issue.field, values[issue.field].trim()])))
        }
        disabled={!allFilled}
        className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-container transition-colors active:scale-95 disabled:opacity-40"
      >
        다음
      </button>
    </div>
  );
}
