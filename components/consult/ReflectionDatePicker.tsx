"use client";

import { useState } from "react";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameDay(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

export function ReflectionDatePicker({
  locked,
  answer,
  onSelect,
}: {
  locked: boolean;
  answer?: string;
  onSelect: (date: Date | null) => void;
}) {
  const today = startOfDay(new Date());
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<Date | null>(null);

  if (locked) {
    return (
      <div className="p-5 bg-white rounded-r-2xl rounded-bl-2xl shadow-sm border border-outline-variant/20">
        <p className="text-sm text-primary font-medium">{answer}</p>
      </div>
    );
  }

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const canGoPrevMonth = new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <div className="p-5 bg-white rounded-r-2xl rounded-bl-2xl shadow-sm border border-outline-variant/20 space-y-4 w-full max-w-sm">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => canGoPrevMonth && setViewDate(new Date(year, month - 1, 1))}
          disabled={!canGoPrevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container disabled:opacity-30 transition-colors"
          aria-label="이전 달"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        <p className="text-label-md font-bold text-primary">
          {year}년 {month + 1}월
        </p>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
          aria-label="다음 달"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className="text-[11px] text-outline font-bold py-1">
            {weekday}
          </span>
        ))}
        {cells.map((date, index) => {
          if (!date) return <span key={index} />;
          const disabled = date.getTime() < today.getTime();
          const isSelected = selected !== null && sameDay(date, selected);
          return (
            <button
              key={index}
              type="button"
              disabled={disabled}
              onClick={() => setSelected(date)}
              className={`aspect-square rounded-full text-sm transition-colors ${
                isSelected
                  ? "bg-primary text-on-primary font-bold"
                  : disabled
                    ? "text-outline-variant"
                    : "text-on-surface hover:bg-surface-container"
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="flex-1 py-2.5 text-label-md text-on-surface-variant border border-outline-variant/30 rounded-lg hover:bg-surface-container transition-colors"
        >
          나중에 정할게요
        </button>
        <button
          type="button"
          onClick={() => selected && onSelect(selected)}
          disabled={!selected}
          className="flex-1 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-container transition-colors disabled:opacity-40"
        >
          이 날짜로 할게요
        </button>
      </div>
    </div>
  );
}
