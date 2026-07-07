"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Fab } from "@/components/Fab";
import { TimeCapsuleModal } from "@/components/TimeCapsuleModal";
import {
  activeDecisions,
  currentUser,
  decisionQualityTrend,
  pendingReflection,
} from "@/lib/mock-data";

const DISMISS_KEY = "lifolio_capsule_dismissed";

export default function HomePage() {
  const [showCapsuleModal, setShowCapsuleModal] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY) !== "1") {
      const timer = setTimeout(() => setShowCapsuleModal(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissModal = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setShowCapsuleModal(false);
  };

  return (
    <>
      <Header />
      <main className="pt-24 max-w-container-max mx-auto px-4 md:px-gutter">
        <section className="mb-8">
          <Link
            href="/consult"
            className="bg-primary-container text-on-primary-container p-6 rounded-2xl shadow-lg border border-primary/20 flex items-center justify-between group cursor-pointer hover:bg-primary transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-white fill">
                  psychology
                </span>
              </div>
              <div>
                <h3 className="text-title-lg text-white mb-1">
                  새로운 고민 시작하기
                </h3>
                <p className="text-label-md text-on-primary-container/80">
                  AI와 함께 최선의 선택을 찾아보세요
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-white text-3xl group-hover:translate-x-2 transition-transform">
              arrow_forward
            </span>
          </Link>
        </section>

        <section className="mb-10">
          <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-surface tracking-tight leading-snug">
            안녕하세요, <span className="text-primary">{currentUser.name}</span>
            님.
            <br />
            기록은 더 나은 선택으로 이어집니다.
          </h1>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Pending reflection */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary fill">
                pending_actions
              </span>
              <h2 className="text-label-sm uppercase tracking-wider text-outline">
                회고 대기 중
              </h2>
            </div>
            <div className="border border-outline-variant p-u-md rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 flex-grow bg-white">
              <div className="mb-2 flex justify-between items-center">
                <span className="text-label-sm text-secondary px-2 py-0.5 rounded-full bg-secondary-container/60">
                  결정 후 {pendingReflection.daysElapsed}일 경과
                </span>
                <span className="material-symbols-outlined text-secondary text-sm">
                  schedule
                </span>
              </div>
              <h3 className="text-title-lg text-on-surface mb-4">
                {pendingReflection.title}
              </h3>
              <div className="mb-6">
                <div className="flex justify-between text-[10px] font-bold text-outline mb-1">
                  <span>회고 시점 도달</span>
                  <span>100%</span>
                </div>
                <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full w-full" />
                </div>
              </div>
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <p className="text-body-md text-on-surface-variant">
                    내 선택: {pendingReflection.choiceSummary}
                  </p>
                </div>
                <p className="text-label-md text-outline leading-relaxed">
                  {pendingReflection.note}
                </p>
              </div>
              <Link
                href="/capsule"
                className="w-full bg-secondary hover:bg-secondary/90 text-on-secondary text-label-md py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 group"
              >
                <span>지금 바로 회고하기</span>
                <span className="text-xs opacity-70">(30초면 충분해요)</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                  edit_note
                </span>
              </Link>
            </div>
          </div>

          {/* Active decisions */}
          <div className="lg:col-span-8">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary fill">
                  analytics
                </span>
                <h2 className="text-label-sm uppercase tracking-wider text-outline">
                  진행 중인 의사결정
                </h2>
              </div>
              <Link
                href="/history"
                className="text-label-md text-primary-container flex items-center gap-1 hover:underline"
              >
                전체보기{" "}
                <span className="material-symbols-outlined text-sm">
                  chevron_right
                </span>
              </Link>
            </div>
            <div className="flex overflow-x-auto gap-u-md hide-scrollbar pb-4 snap-x">
              {activeDecisions.map((decision) => (
                <div
                  key={decision.id}
                  className={`min-w-[280px] md:min-w-[340px] snap-start bg-white border border-outline-variant p-u-md rounded-xl shadow-sm flex flex-col justify-between ${
                    decision.status === "waiting" ? "opacity-70" : ""
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                        <span className="material-symbols-outlined text-secondary">
                          {decision.icon}
                        </span>
                      </div>
                      <span className="text-label-sm text-on-surface-variant bg-surface-container-high px-3 py-1 rounded-full">
                        {decision.badge}
                      </span>
                    </div>
                    <h3 className="text-title-lg text-on-surface mb-2">
                      {decision.title}
                    </h3>
                    <p className="text-body-md text-on-surface-variant mb-6 line-clamp-2">
                      {decision.description}
                    </p>
                  </div>
                  <div className="w-full bg-surface-container-low h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-secondary h-full"
                      style={{ width: `${decision.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="mt-gutter">
          <div className="relative overflow-hidden rounded-2xl bg-inverse-surface text-white p-u-md md:p-u-lg flex flex-col md:flex-row items-center gap-6 shadow-lg">
            <div className="relative z-10 w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-3xl text-white fill">
                psychology
              </span>
            </div>
            <div className="relative z-10 text-center md:text-left">
              <h4 className="text-label-sm text-primary-fixed mb-1 uppercase tracking-widest">
                오늘의 AI 인사이트
              </h4>
              <p className="text-body-lg leading-snug max-w-2xl">
                &ldquo;최근 3개월간, 감정적일 때의 선택보다{" "}
                <span className="text-secondary-fixed font-bold underline underline-offset-4 decoration-2">
                  논리적 분석 시 만족도가 40% 더 높았습니다.
                </span>
                &rdquo;
              </p>
            </div>
            <Link
              href="/report"
              className="relative z-10 ml-auto hidden md:block bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 px-6 py-2 rounded-full text-label-md transition-colors"
            >
              인사이트 리포트 보기
            </Link>
          </div>
        </section>

        <section className="mt-gutter mb-12">
          <div className="bg-white rounded-xl border border-outline-variant p-u-md overflow-hidden">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h4 className="text-label-sm text-outline mb-1">
                  결정 품질 추이
                </h4>
                <p className="text-headline-md text-on-surface">
                  종합 지수 78.4
                </p>
              </div>
              <div className="text-right">
                <span className="text-secondary font-bold">+12%</span>
                <p className="text-label-sm text-outline">지난주 대비</p>
              </div>
            </div>
            <div className="flex items-end gap-2 h-32">
              {decisionQualityTrend.map((value, index) => {
                const isPeak = value === Math.max(...decisionQualityTrend);
                return (
                  <div
                    key={index}
                    className={`flex-1 rounded-t-sm transition-all cursor-pointer group relative ${
                      isPeak
                        ? "bg-primary"
                        : "bg-surface-container-high hover:bg-primary"
                    }`}
                    style={{ height: `${value}%` }}
                  >
                    <div
                      className={`absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold transition-opacity ${
                        isPeak ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Fab />
      {showCapsuleModal && (
        <TimeCapsuleModal
          reflection={pendingReflection}
          onClose={dismissModal}
        />
      )}
    </>
  );
}
