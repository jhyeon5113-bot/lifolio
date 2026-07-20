"use client";

import { useState } from "react";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export interface DateRange {
  from: Date;
  to: Date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameDay(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

function formatRangeLabel(range: DateRange | null): string {
  if (!range) return "전체 기간";
  const short = (d: Date) => `${d.getMonth() + 1}.${d.getDate()}`;
  return `${range.from.getFullYear()}.${short(range.from)} - ${short(range.to)}`;
}

export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const today = startOfDay(new Date());
  const [viewDate, setViewDate] = useState(value?.from ?? new Date(today.getFullYear(), today.getMonth(), 1));
  const [draftStart, setDraftStart] = useState<Date | null>(value?.from ?? null);
  const [draftEnd, setDraftEnd] = useState<Date | null>(value?.to ?? null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const handleClickDay = (day: Date) => {
    if (!draftStart || (draftStart && draftEnd) || day < draftStart) {
      setDraftStart(day);
      setDraftEnd(null);
    } else {
      setDraftEnd(day);
    }
  };

  const apply = () => {
    if (draftStart) onChange({ from: draftStart, to: draftEnd ?? draftStart });
    setOpen(false);
  };

  const reset = () => {
    setDraftStart(null);
    setDraftEnd(null);
    onChange(null);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-outline-variant/40 text-label-sm text-on-surface-variant hover:bg-surface-container transition-colors whitespace-nowrap"
      >
        <span className="material-symbols-outlined text-[16px]">date_range</span>
        {formatRangeLabel(value)}
      </button>
      {open && (
        <div className="absolute z-20 mt-2 p-4 bg-white rounded-2xl shadow-xl border border-outline-variant/20 w-64">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
              aria-label="이전 달"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <p className="text-label-sm font-bold text-primary">
              {year}년 {month + 1}월
            </p>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
              aria-label="다음 달"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center mb-2">
            {WEEKDAYS.map((weekday) => (
              <span key={weekday} className="text-[10px] text-outline font-bold py-1">
                {weekday}
              </span>
            ))}
            {cells.map((day, index) => {
              if (!day) return <span key={index} />;
              const isStart = draftStart !== null && sameDay(day, draftStart);
              const isEnd = draftEnd !== null && sameDay(day, draftEnd);
              const within =
                draftStart !== null &&
                draftEnd !== null &&
                day.getTime() >= draftStart.getTime() &&
                day.getTime() <= draftEnd.getTime();
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleClickDay(day)}
                  className={`aspect-square rounded-full text-[12px] transition-colors ${
                    isStart || isEnd
                      ? "bg-primary text-on-primary font-bold"
                      : within
                        ? "bg-primary/15 text-primary"
                        : "text-on-surface hover:bg-surface-container"
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={reset}
              className="flex-1 py-2 text-[12px] text-on-surface-variant border border-outline-variant/30 rounded-lg hover:bg-surface-container transition-colors"
            >
              전체 기간
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={!draftStart}
              className="flex-1 py-2 text-[12px] bg-primary text-white rounded-lg disabled:opacity-40 hover:bg-primary-container transition-colors"
            >
              적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
