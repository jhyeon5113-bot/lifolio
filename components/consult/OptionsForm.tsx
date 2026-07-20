"use client";

import { useState } from "react";

export function OptionsForm({
  question,
  locked,
  answer,
  onSubmit,
}: {
  question: string;
  locked: boolean;
  answer?: string[];
  onSubmit: (options: string[]) => void;
}) {
  const [options, setOptions] = useState<string[]>(["", ""]);

  if (locked) {
    return (
      <div className="p-5 bg-white rounded-r-2xl rounded-bl-2xl shadow-sm border border-outline-variant/20">
        <p className="text-on-surface text-body-md mb-2">{question}</p>
        <p className="text-sm text-primary font-medium">{(answer ?? []).join(" vs ")}</p>
      </div>
    );
  }

  const validCount = options.map((o) => o.trim()).filter(Boolean).length;

  return (
    <div className="p-5 bg-white rounded-r-2xl rounded-bl-2xl shadow-sm border border-outline-variant/20 space-y-4">
      <p className="text-on-surface text-body-md">{question}</p>
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={option}
              onChange={(event) => {
                const next = [...options];
                next[index] = event.target.value;
                setOptions(next);
              }}
              placeholder={`선택지 ${index + 1}`}
              aria-label={`선택지 ${index + 1}`}
              className="flex-1 px-3 py-2 text-sm bg-white border border-outline-variant/40 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => setOptions(options.filter((_, i) => i !== index))}
                aria-label="선택지 삭제"
                className="material-symbols-outlined text-outline-variant hover:text-error transition-colors"
              >
                close
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setOptions([...options, ""])}
          className="text-label-md text-primary hover:underline"
        >
          + 선택지 추가
        </button>
      </div>
      <button
        type="button"
        onClick={() => onSubmit(options.map((o) => o.trim()).filter(Boolean))}
        disabled={validCount < 2}
        className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-container transition-colors active:scale-95 disabled:opacity-40"
      >
        다음
      </button>
      {validCount < 2 && (
        <p className="text-[12px] text-error">선택지는 최소 2개 이상 입력해주세요.</p>
      )}
    </div>
  );
}
