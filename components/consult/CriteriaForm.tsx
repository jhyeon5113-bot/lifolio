"use client";

import { useState } from "react";

export function CriteriaForm({
  question,
  choices,
  locked,
  answer,
  onSubmit,
}: {
  question: string;
  choices: string[];
  locked: boolean;
  answer?: string[];
  onSubmit: (criteria: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [text, setText] = useState("");

  if (locked) {
    return (
      <div className="p-5 bg-white rounded-r-2xl rounded-bl-2xl shadow-sm border border-outline-variant/20">
        <p className="text-on-surface text-body-md mb-2">{question}</p>
        <p className="text-sm text-primary font-medium">{(answer ?? []).join(", ")}</p>
      </div>
    );
  }

  const toggle = (choice: string) => {
    setSelected((prev) =>
      prev.includes(choice) ? prev.filter((c) => c !== choice) : [...prev, choice],
    );
  };

  const submit = () => {
    const custom = text.trim();
    const all = custom ? [...selected, custom] : selected;
    if (all.length === 0) return;
    onSubmit(all);
  };

  return (
    <div className="p-5 bg-white rounded-r-2xl rounded-bl-2xl shadow-sm border border-outline-variant/20 space-y-4">
      <p className="text-on-surface text-body-md">{question}</p>
      <div className="flex flex-wrap gap-2">
        {choices.map((choice) => (
          <button
            key={choice}
            type="button"
            onClick={() => toggle(choice)}
            className={`px-4 py-2 rounded-full text-label-md transition-colors ${
              selected.includes(choice)
                ? "bg-primary text-on-primary"
                : "bg-white border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {choice}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="직접 입력"
        aria-label="판단 기준 직접 입력"
        className="w-full px-3 py-2 text-sm bg-white border border-outline-variant/40 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
      />
      <button
        type="button"
        onClick={submit}
        disabled={selected.length === 0 && !text.trim()}
        className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-container transition-colors active:scale-95 disabled:opacity-40"
      >
        다음
      </button>
    </div>
  );
}
