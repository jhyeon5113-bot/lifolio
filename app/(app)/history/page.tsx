"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Fab } from "@/components/Fab";
import { historyEntries, historyFilters } from "@/lib/mock-data";

export default function HistoryPage() {
  const [activeFilter, setActiveFilter] = useState(historyFilters[0]);

  const visibleEntries =
    activeFilter === historyFilters[0]
      ? historyEntries
      : historyEntries.filter((entry) => entry.tag === activeFilter);

  return (
    <>
      <Header showSearch />
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

        <div className="flex gap-3 mb-10 overflow-x-auto hide-scrollbar pb-2">
          {historyFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-2 rounded-full text-label-md whitespace-nowrap transition-colors active:scale-95 ${
                activeFilter === filter
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

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
                          {entry.tag}
                        </span>
                        <span className="md:hidden text-label-md text-on-surface-variant">
                          {entry.date}
                        </span>
                      </div>
                      <h3 className="text-headline-md text-primary mb-6">
                        {entry.title}
                      </h3>
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-secondary text-label-md uppercase tracking-wider mb-2">
                            Context
                          </h4>
                          <p className="text-body-md text-on-surface">
                            {entry.context}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-secondary text-label-md uppercase tracking-wider mb-2">
                            Why
                          </h4>
                          <p className="text-body-md text-on-surface">
                            {entry.why}
                          </p>
                        </div>
                        <div className="pt-4 border-t border-outline-variant/20">
                          <h4 className="text-primary text-label-md uppercase tracking-wider mb-2">
                            Outcome
                          </h4>
                          <p className="text-body-md text-on-surface font-semibold italic">
                            &ldquo;{entry.outcome}&rdquo;
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

        <div className="mt-20 text-center py-12 border-t border-outline-variant/10">
          <span className="material-symbols-outlined text-4xl text-outline-variant mb-4 block">
            history_edu
          </span>
          <p className="text-label-md text-on-surface-variant">
            이전의 모든 기록은 아카이브에 보관되어 있습니다.
          </p>
          <button
            type="button"
            className="mt-4 text-label-md text-primary underline"
          >
            과거 기록 모두 보기
          </button>
        </div>
      </main>
      <Fab />
    </>
  );
}
