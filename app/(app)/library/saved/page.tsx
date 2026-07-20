"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LibraryCaseCard } from "@/components/LibraryCaseCard";
import { LoadError } from "@/components/LoadError";
import { libraryFilters } from "@/lib/mock-data";
import { useSavedCases } from "@/lib/useSavedCases";
import { useLikedCases } from "@/lib/useLikedCases";
import { useLibraryData } from "@/lib/useLibraryData";

export default function SavedDecisionsPage() {
  const [activeFilter, setActiveFilter] = useState(libraryFilters[0]);
  const { savedIds, isSaved, toggleSaved } = useSavedCases();
  const { isLiked, toggleLiked } = useLikedCases();
  const { cases: libraryCases, details: libraryCaseDetails, error: libraryError, retry: retryLibrary } = useLibraryData();

  const savedCases = useMemo(() => {
    return libraryCases.filter((item) => {
      const matchesSaved = savedIds.has(item.id);
      const matchesFilter =
        activeFilter === libraryFilters[0] || item.category === activeFilter;
      return matchesSaved && matchesFilter;
    });
  }, [savedIds, activeFilter, libraryCases]);

  return (
    <div className="bg-background min-h-screen">
      <header className="sticky top-0 z-50 w-full h-16 flex justify-between items-center px-6 bg-surface/80 backdrop-blur-md shadow-[0_4px_20px_rgba(26,35,126,0.04)]">
        <Link
          href="/library"
          className="flex items-center justify-center w-10 h-10 hover:opacity-80 transition-opacity active:scale-95"
          aria-label="뒤로가기"
        >
          <span className="material-symbols-outlined text-primary">
            arrow_back
          </span>
        </Link>
        <h1 className="text-headline-md text-primary tracking-tight">
          저장된 의사결정
        </h1>
        <div className="w-10 h-10" />
      </header>

      <main className="max-w-[1200px] mx-auto px-6 mt-6 pb-16">
        <div className="flex overflow-x-auto gap-3 pb-6 hide-scrollbar -mx-6 px-6">
          {libraryFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full text-label-md transition-all ${
                activeFilter === filter
                  ? "bg-primary text-white shadow-lg shadow-primary/10"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-variant/50"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {libraryError ? (
            <LoadError onRetry={retryLibrary} />
          ) : (
            <>
              {savedCases.map((item) => (
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
              {savedCases.length === 0 && (
                <p className="text-center text-on-surface-variant py-12">
                  아직 저장된 의사결정이 없습니다.
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
