"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { LibraryCaseCard } from "@/components/LibraryCaseCard";
import { LoadError } from "@/components/LoadError";
import { libraryFilters } from "@/lib/mock-data";
import type { DecisionCaseDetail } from "@/lib/types";
import { useSavedCases } from "@/lib/useSavedCases";
import { useLikedCases } from "@/lib/useLikedCases";
import { useLibraryData } from "@/lib/useLibraryData";

// Not a real decision_cases category — matched by case ID membership
// (my own approved LibraryCaseSubmission rows) instead of category string,
// so it's kept out of the shared `libraryFilters` list used by other pages.
const MY_DECISIONS_FILTER = "나의 의사결정";

function detailSearchText(detail: DecisionCaseDetail | undefined): string {
  if (!detail) return "";
  return [
    detail.title,
    detail.subtitle,
    ...detail.contextParagraphs,
    ...detail.options.flatMap((option) => [
      option.title,
      ...option.points.map((point) => point.text),
    ]),
    detail.chosenOptionLabel,
    ...detail.criteria.map((criterion) => criterion.text),
    detail.expectation,
    detail.fear,
    detail.outcomeQuote,
    detail.sameChoiceAgain,
    detail.expectationGap,
    detail.messageForOthers ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

export default function LibraryPage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(libraryFilters[0]);
  const [myCaseIds, setMyCaseIds] = useState<Set<string>>(new Set());
  const { isSaved, toggleSaved } = useSavedCases();
  const { isLiked, toggleLiked } = useLikedCases();
  const { cases: libraryCases, details: libraryCaseDetails, error: libraryError, retry: retryLibrary } = useLibraryData();

  const filters = useMemo(() => [...libraryFilters, MY_DECISIONS_FILTER], []);

  useEffect(() => {
    fetch("/api/library/mine")
      .then((res) => (res.ok ? res.json() : { caseIds: [] }))
      .then(({ caseIds }: { caseIds: string[] }) => setMyCaseIds(new Set(caseIds)))
      .catch(() => {});
  }, []);

  // Precompute each case's full detail-page text once, so typing in the
  // search box doesn't re-flatten every detail record on every keystroke.
  const searchIndex = useMemo(() => {
    const index: Record<string, string> = {};
    for (const item of libraryCases) {
      index[item.id] = detailSearchText(libraryCaseDetails[item.id]);
    }
    return index;
  }, [libraryCases, libraryCaseDetails]);

  const visibleCases = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return libraryCases.filter((item) => {
      const matchesFilter =
        activeFilter === libraryFilters[0]
          ? true
          : activeFilter === MY_DECISIONS_FILTER
            ? myCaseIds.has(item.id)
            : item.category === activeFilter;
      const matchesQuery =
        normalizedQuery === "" ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.tags.toLowerCase().includes(normalizedQuery) ||
        searchIndex[item.id]?.includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [query, activeFilter, searchIndex, libraryCases, myCaseIds]);

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
              aria-label="고민 키워드 검색"
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </section>

        <section className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
          {filters.map((filter) => {
            const isMine = filter === MY_DECISIONS_FILTER;
            const isActive = activeFilter === filter;
            const className = isMine
              ? `px-5 py-2 rounded-full text-label-md whitespace-nowrap transition-colors border ${
                  isActive
                    ? "bg-secondary-container text-on-secondary-container border-secondary/30"
                    : "bg-secondary-container/40 text-secondary border-secondary/20 hover:bg-secondary-container/60"
                }`
              : `px-5 py-2 rounded-full text-label-md whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-primary text-on-primary"
                    : "bg-white border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
                }`;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={className}
              >
                {filter}
              </button>
            );
          })}
        </section>

        <div className="flex w-full -mt-4 !mb-3 justify-end">
          <Link
            href="/library/saved"
            className="text-sm text-primary font-medium underline underline-offset-4 decoration-primary/30"
          >
            저장된 의사결정
          </Link>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 !mt-3">
          {libraryError ? (
            <LoadError className="col-span-full" onRetry={retryLibrary} />
          ) : (
            <>
              {visibleCases.map((item) => (
                <LibraryCaseCard
                  key={item.id}
                  item={item}
                  hasDetail={Boolean(libraryCaseDetails[item.id])}
                  saved={isSaved(item.id)}
                  onToggleSave={toggleSaved}
                  liked={isLiked(item.id)}
                  onToggleLike={toggleLiked}
                />
              ))}
              {visibleCases.length === 0 && (
                <p className="col-span-full text-center text-on-surface-variant py-12">
                  조건에 맞는 사례가 아직 없습니다.
                </p>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}
