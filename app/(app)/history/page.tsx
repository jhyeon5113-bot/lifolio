"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Fab } from "@/components/Fab";
import { LoadError } from "@/components/LoadError";
import { DateRangePicker, type DateRange } from "@/components/history/DateRangePicker";
import type { HistoryEntryView, HistoryStatus } from "@/lib/history-data";

const ALL_CATEGORY = "전체";

const STATUS_STYLES: Record<HistoryStatus, string> = {
  "선택 완료": "bg-secondary-container text-on-secondary-container",
  "회고 대기": "bg-error/10 text-error",
  "회고 완료": "bg-primary text-on-primary",
};

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntryView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const [range, setRange] = useState<DateRange | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch("/api/decisions")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(({ entries }: { entries: HistoryEntryView[] }) => {
        if (!cancelled) setEntries(entries);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const categories = useMemo(() => {
    const distinct = Array.from(new Set(entries.map((entry) => entry.category)));
    return [ALL_CATEGORY, ...distinct];
  }, [entries]);

  const visibleEntries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return entries.filter((entry) => {
      if (activeCategory !== ALL_CATEGORY && entry.category !== activeCategory) return false;
      if (range) {
        const entryDate = new Date(entry.createdAt);
        if (entryDate < range.from || entryDate > endOfDay(range.to)) return false;
      }
      if (normalizedQuery) {
        const haystack = `${entry.title} ${entry.situation} ${entry.background} ${entry.finalChoice}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }
      return true;
    });
  }, [entries, activeCategory, range, searchQuery]);

  return (
    <>
      <Header showSearch onSearchChange={setSearchQuery} searchPlaceholder="결정 검색" />
      <main className="pt-24 px-gutter max-w-container-max mx-auto">
        <section className="mb-12">
          <h2 className="text-headline-lg text-primary mb-2">
            Decision History
          </h2>
          <p className="text-body-md text-on-surface-variant max-w-2xl">
            시간의 흐름에 따라 기록된 당신의 선택들입니다. 과거의 결정들을
            복기하며 미래의 더 나은 선택을 위한 통찰을 발견하세요.
          </p>
        </section>

        <div className="flex flex-wrap items-center gap-3 mb-10">
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2 rounded-full text-label-md whitespace-nowrap transition-colors active:scale-95 ${
                  activeCategory === category
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-high text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <DateRangePicker value={range} onChange={setRange} />
        </div>

        {loading ? (
          <p className="text-body-md text-on-surface-variant text-center py-16">불러오는 중...</p>
        ) : error ? (
          <LoadError onRetry={() => setAttempt((n) => n + 1)} />
        ) : visibleEntries.length === 0 ? (
          <p className="text-body-md text-on-surface-variant text-center py-16">
            {entries.length === 0
              ? "아직 확정된 결정이 없어요."
              : "선택한 조건에 맞는 결정이 없어요."}
          </p>
        ) : (
          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 hidden md:block bg-gradient-to-b from-transparent via-outline-variant to-transparent" />
            <div className="space-y-16 relative">
              {visibleEntries.map((entry, index) => {
                const isEven = index % 2 === 0;
                return (
                  <div
                    key={entry.id}
                    className={`relative flex flex-col md:items-center md:justify-between ${
                      isEven ? "md:flex-row" : "md:flex-row-reverse"
                    }`}
                  >
                    <div className="hidden md:block absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-surface shadow-sm z-10" />
                    <div className="w-full md:w-[45%] mb-4 md:mb-0">
                      <div
                        className={`hidden md:block mb-2 ${isEven ? "text-right" : "text-left"}`}
                      >
                        <span className="text-label-md text-primary opacity-60">
                          {entry.date}
                        </span>
                      </div>
                      <div className="glass-card rounded-xl p-8 hover:shadow-xl transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                          <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-label-md">
                            {entry.category}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="md:hidden text-label-md text-on-surface-variant">
                              {entry.date}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-label-sm whitespace-nowrap ${STATUS_STYLES[entry.status]}`}
                            >
                              {entry.status}
                            </span>
                          </div>
                        </div>
                        <h3 className="text-headline-md text-primary mb-6">
                          {entry.title}
                        </h3>
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-secondary text-label-md uppercase tracking-wider mb-2">
                              상황
                            </h4>
                            <p className="text-body-md text-on-surface">
                              {entry.situation}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-secondary text-label-md uppercase tracking-wider mb-2">
                              고민
                            </h4>
                            <p className="text-body-md text-on-surface">
                              {entry.background}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-secondary text-label-md uppercase tracking-wider mb-2">
                              선택
                            </h4>
                            <p className="text-body-md text-on-surface font-semibold">
                              {entry.finalChoice}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-secondary text-label-md uppercase tracking-wider mb-2">
                              결과
                            </h4>
                            <p
                              className={`text-body-md ${
                                entry.status === "회고 완료"
                                  ? "text-on-surface"
                                  : "text-on-surface-variant/50"
                              }`}
                            >
                              {entry.result}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-0 md:w-[45%]" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-20 text-center py-12 border-t border-outline-variant/10">
          <span className="material-symbols-outlined text-4xl text-outline-variant mb-4 block">
            history_edu
          </span>
          <p className="text-label-md text-on-surface-variant">
            이전의 모든 기록은 아카이브에 보관되어 있습니다.
          </p>
        </div>
      </main>
      <Fab />
    </>
  );
}
