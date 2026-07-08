import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { libraryCaseDetails } from "@/lib/mock-data";

export default async function LibraryCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = libraryCaseDetails[id];

  if (!detail) {
    notFound();
  }

  return (
    <>
      <Header showSearch />
      <main className="pt-24 pb-8 px-4 md:px-grid-margin max-w-4xl mx-auto space-y-8">
        <Link
          href="/library"
          className="material-symbols-outlined text-primary hover:bg-primary/5 p-2 rounded-full transition-colors active:scale-95 duration-200 -ml-2 inline-flex w-fit"
          aria-label="뒤로가기"
        >
          arrow_back
        </Link>

        {/* Header section */}
        <section>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-label-md rounded-full">
              {detail.tag}
            </span>
            <span className="text-on-surface-variant text-label-md">
              {detail.date}
            </span>
          </div>
          <h1 className="text-headline-lg text-primary mb-2">{detail.title}</h1>
          <p className="text-body-lg text-on-surface-variant leading-relaxed">
            {detail.subtitle}
          </p>
        </section>

        <div className="grid grid-cols-1 gap-6">
          {/* Context */}
          <div className="glass-card rounded-xl p-8 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined">menu_book</span>
              <h2 className="text-headline-md">고민의 배경 & 구체적인 상황</h2>
            </div>
            <div className="space-y-4 text-on-surface leading-relaxed">
              {detail.contextParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {detail.options.map((option) => (
              <div
                key={option.label}
                className={`glass-card rounded-xl p-6 border-l-4 ${
                  option.accent === "primary"
                    ? "border-primary"
                    : "border-secondary"
                }`}
              >
                <span
                  className={`font-bold text-sm uppercase tracking-wider mb-2 block ${
                    option.accent === "primary" ? "text-primary" : "text-secondary"
                  }`}
                >
                  {option.label}
                </span>
                <h3 className="text-headline-md mb-3 text-primary">
                  {option.title}
                </h3>
                <ul className="space-y-2 text-on-surface-variant">
                  {option.points.map((point) => (
                    <li key={point.text} className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-sm mt-1">
                        {point.icon}
                      </span>
                      {point.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Decision logic */}
          <div className="rounded-xl p-8 shadow-[0_4px_20px_rgba(26,35,126,0.04)] bg-primary text-white space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">psychology</span>
              <h2 className="text-headline-md">최종 선택 & 판단 기준</h2>
            </div>
            <p className="text-body-lg">
              나의 선택:{" "}
              <strong className="text-secondary-fixed">
                {detail.chosenOptionLabel}
              </strong>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              {detail.criteria.map((criterion) => (
                <div key={criterion.label} className="bg-white/10 p-4 rounded-lg">
                  <span className="text-secondary-fixed text-xs font-bold block mb-1">
                    {criterion.label}
                  </span>
                  <p className="text-sm">{criterion.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Expectation vs fear */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-headline-md mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  visibility
                </span>{" "}
                예상했던 결과
              </h3>
              <p className="text-on-surface-variant leading-relaxed">
                {detail.expectation}
              </p>
            </div>
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-headline-md mb-4 flex items-center gap-2 text-error">
                <span className="material-symbols-outlined">
                  sentiment_dissatisfied
                </span>{" "}
                불안 요소
              </h3>
              <p className="text-on-surface-variant leading-relaxed">
                {detail.fear}
              </p>
            </div>
          </div>

          {/* Results */}
          <div className="glass-card rounded-xl p-8 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined">insights</span>
                <h2 className="text-headline-md">선택 이후 결과</h2>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-on-surface-variant block uppercase font-bold">
                  만족도 점수
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl text-display-lg text-primary">
                    {detail.satisfactionScore}
                  </span>
                  <span className="text-body-md text-on-surface-variant">
                    / 100
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6 bg-surface-container rounded-lg italic text-on-surface">
              &ldquo;{detail.outcomeQuote}&rdquo;
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-outline-variant">
              <div>
                <h4 className="text-label-md text-primary mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">
                    history
                  </span>{" "}
                  같은 상황이라면?
                </h4>
                <p className="text-sm text-on-surface-variant">
                  {detail.sameChoiceAgain}
                </p>
              </div>
              <div>
                <h4 className="text-label-md text-primary mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">
                    difference
                  </span>{" "}
                  예상과 실제의 차이
                </h4>
                <p className="text-sm text-on-surface-variant">
                  {detail.expectationGap}
                </p>
              </div>
            </div>
          </div>

          {/* Message for others */}
          <div className="glass-card rounded-xl p-8 space-y-6">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined">format_quote</span>
              <h2 className="text-headline-md">다른 사용자를 위한 한마디</h2>
            </div>
            <div className="p-6 bg-surface-container-highest rounded-lg italic text-on-surface">
              &ldquo;{detail.messageForOthers}&rdquo;
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-8">
          <Link
            href="/library"
            className="flex items-center gap-2 px-8 py-3 bg-surface border border-outline-variant text-on-surface rounded-full hover:bg-primary/5 transition-all active:scale-95 duration-150"
          >
            <span className="material-symbols-outlined">keyboard_return</span>
            <span className="text-label-md">사례 목록으로 돌아가기</span>
          </Link>
        </div>
      </main>
    </>
  );
}
