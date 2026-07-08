"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { libraryCaseDetails, libraryCases, libraryFilters } from "@/lib/mock-data";

export default function LibraryPage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(libraryFilters[0]);

  const visibleCases = useMemo(() => {
    return libraryCases.filter((item) => {
      const matchesFilter =
        activeFilter === libraryFilters[0] || item.tags.includes(activeFilter);
      const matchesQuery =
        query.trim() === "" ||
        item.title.includes(query) ||
        item.tags.includes(query);
      return matchesFilter && matchesQuery;
    });
  }, [query, activeFilter]);

  return (
    <>
      <Header />
      <main className="pt-24 max-w-container-max mx-auto px-margin-mobile md:px-grid-margin space-y-section-gap-mobile md:space-y-section-gap-desktop">
        <section className="space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-headline-lg text-primary">
              의사결정 라이브러리
            </h2>
            <p className="text-body-md text-on-surface-variant">
              다른 이들의 선택을 통해 나의 길을 발견하세요.
            </p>
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">
                search
              </span>
            </div>
            <input
              className="w-full pl-12 pr-6 py-4 bg-white border border-outline-variant/30 rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-body-md"
              placeholder="고민 키워드를 검색해보세요 (예: 스타트업)"
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="backdrop-blur-md rounded-xl p-4 flex items-center justify-between border border-primary/10 bg-primary/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-white fill">
                  auto_awesome
                </span>
              </div>
              <div>
                <p className="text-label-md text-primary">AI 맞춤 추천</p>
                <p className="text-[12px] text-on-surface-variant">
                  현재 나의 고민과 가장 비슷한 케이스를 분석합니다.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="bg-primary/70 text-white w-12 h-12 rounded-xl text-[12px] hover:scale-105 transition-transform active:scale-95 shadow-md flex flex-col items-center justify-center leading-tight font-medium"
            >
              <span>추천</span>
              <span>받기</span>
            </button>
          </div>
        </section>

        <section className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
          {libraryFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-2 rounded-full text-label-md whitespace-nowrap transition-colors ${
                activeFilter === filter
                  ? "bg-primary text-on-primary"
                  : "bg-white border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {filter}
            </button>
          ))}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 !mt-8">
          {visibleCases.map((item) => {
            const hasDetail = Boolean(libraryCaseDetails[item.id]);
            const cardClassName = `group bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(26,35,126,0.04)] hover:shadow-[0_12px_24px_rgba(26,35,126,0.08)] transition-all flex flex-col h-full border border-outline-variant/20 p-6 ${hasDetail ? "cursor-pointer" : ""}`;
            const cardContent = (
              <>
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-primary tracking-wide">
                    {item.tags}
                  </span>
                  <h3 className="text-[20px] text-on-surface group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  className="text-on-surface-variant/40 hover:text-primary transition-colors"
                  aria-label="북마크"
                >
                  <span className="material-symbols-outlined">bookmark</span>
                </button>
              </div>

              <div className="space-y-3 flex-1">
                {item.steps.map((step, index) => (
                  <div key={step.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-2.5 h-2.5 rounded-full mt-1.5 ${step.dotColor}`}
                      />
                      {index < item.steps.length - 1 && (
                        <div className="w-0.5 flex-1 bg-outline-variant/20" />
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-outline uppercase tracking-wider">
                        {step.label}
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        {step.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${item.authorAvatarColor}`}
                  >
                    {item.authorInitials}
                  </div>
                  <span className="text-xs text-on-surface-variant font-medium">
                    익명의 사용자
                  </span>
                </div>
                <div className="flex items-center gap-3 text-on-surface-variant/70">
                  <span className="flex items-center gap-1 text-[11px]">
                    <span className="material-symbols-outlined text-[14px]">
                      visibility
                    </span>{" "}
                    {item.views}
                  </span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <span className="material-symbols-outlined text-[14px]">
                      favorite
                    </span>{" "}
                    {item.likes}
                  </span>
                </div>
              </div>
              </>
            );

            return hasDetail ? (
              <Link key={item.id} href={`/library/${item.id}`} className={cardClassName}>
                {cardContent}
              </Link>
            ) : (
              <div key={item.id} className={cardClassName}>
                {cardContent}
              </div>
            );
          })}
          {visibleCases.length === 0 && (
            <p className="col-span-full text-center text-on-surface-variant py-12">
              조건에 맞는 사례가 아직 없습니다.
            </p>
          )}
        </section>
      </main>
    </>
  );
}
