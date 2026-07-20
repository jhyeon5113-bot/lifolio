"use client";

import { useState } from "react";

export interface OptionExpectation {
  title: string;
  expectedPositive: string;
  expectedNegative: string;
}

export function OptionExpectationsForm({
  options,
  locked,
  answer,
  onSubmit,
}: {
  options: string[];
  locked: boolean;
  answer?: OptionExpectation[];
  onSubmit: (expectations: OptionExpectation[]) => void;
}) {
  const [values, setValues] = useState<OptionExpectation[]>(
    options.map((title) => ({ title, expectedPositive: "", expectedNegative: "" })),
  );

  if (locked) {
    return (
      <div className="p-5 bg-white rounded-r-2xl rounded-bl-2xl shadow-sm border border-outline-variant/20 space-y-4">
        <p className="text-on-surface text-body-md">
          각 선택지에서 기대되는 점과 걱정되는 점을 알려주세요.
        </p>
        {(answer ?? []).map((item) => (
          <div key={item.title} className="space-y-1">
            <p className="text-sm font-bold text-primary">{item.title}</p>
            <p className="text-sm text-on-surface-variant">기대: {item.expectedPositive}</p>
            <p className="text-sm text-on-surface-variant">걱정: {item.expectedNegative}</p>
          </div>
        ))}
      </div>
    );
  }

  const update = (index: number, key: "expectedPositive" | "expectedNegative", value: string) => {
    const next = [...values];
    next[index] = { ...next[index], [key]: value };
    setValues(next);
  };

  const allFilled = values.every((v) => v.expectedPositive.trim() && v.expectedNegative.trim());

  return (
    <div className="p-5 bg-white rounded-r-2xl rounded-bl-2xl shadow-sm border border-outline-variant/20 space-y-5">
      <p className="text-on-surface text-body-md">
        각 선택지에서 기대되는 점과 걱정되는 점을 알려주세요.
      </p>
      {values.map((item, index) => (
        <div
          key={item.title}
          className="space-y-2 pb-4 border-b border-outline-variant/10 last:border-0 last:pb-0"
        >
          <p className="text-[11px] font-bold text-outline uppercase tracking-wider">
            {item.title}
          </p>
          <textarea
            value={item.expectedPositive}
            onChange={(event) => update(index, "expectedPositive", event.target.value)}
            placeholder="기대되는 점"
            rows={2}
            className="w-full p-3 text-sm bg-white border border-outline-variant/40 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
          />
          <textarea
            value={item.expectedNegative}
            onChange={(event) => update(index, "expectedNegative", event.target.value)}
            placeholder="걱정되는 점"
            rows={2}
            className="w-full p-3 text-sm bg-white border border-outline-variant/40 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onSubmit(
            values.map((v) => ({
              ...v,
              expectedPositive: v.expectedPositive.trim(),
              expectedNegative: v.expectedNegative.trim(),
            })),
          )
        }
        disabled={!allFilled}
        className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-container transition-colors active:scale-95 disabled:opacity-40"
      >
        다음
      </button>
    </div>
  );
}
