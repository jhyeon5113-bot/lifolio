"use client";

import { useEffect } from "react";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="material-symbols-outlined text-4xl text-error">
        error_outline
      </span>
      <h1 className="text-headline-md text-primary">
        문제가 발생했어요
      </h1>
      <p className="text-body-md text-on-surface-variant max-w-[400px]">
        페이지를 불러오는 중 예상치 못한 오류가 발생했어요. 다시 시도해주세요.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 px-6 py-3 bg-primary text-white rounded-xl text-label-md active:scale-95 transition-all"
      >
        다시 시도
      </button>
    </main>
  );
}
