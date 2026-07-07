"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { PendingReflection } from "@/lib/types";

export function TimeCapsuleModal({
  reflection,
  onClose,
}: {
  reflection: PendingReflection;
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/20 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md animate-pop">
        <div className="relative flex flex-col items-center mb-[-40px] z-10">
          <div className="glass-card p-6 rounded-2xl shadow-xl border border-white/40 mb-6 relative">
            <p className="text-body-lg text-primary text-center leading-relaxed">
              안녕하세요! {Math.round(reflection.daysElapsed / 30)}개월 전
              결정하신 <br />
              <span className="font-bold text-tertiary">
                &lsquo;{reflection.decisionLabel}&rsquo;
              </span>
              , <br />
              지금 돌아볼 시간입니다.
            </p>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[15px] border-t-surface/80" />
          </div>
          <div className="w-32 h-32 animate-float">
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-primary to-primary-container p-1 shadow-2xl overflow-hidden">
              <div className="relative w-full h-full rounded-full bg-surface border-4 border-primary-container/20 overflow-hidden">
                <Image
                  src="/mascot-writing.png"
                  alt="기록하는 Lifolio 마스코트"
                  fill
                  sizes="128px"
                  className="object-cover scale-110"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-3xl p-8 pt-16 shadow-[0_20px_50px_rgba(0,6,102,0.12)] border border-primary-fixed/30 flex flex-col items-center">
          <h2 className="text-headline-md text-primary mb-2">미완료된 회고</h2>
          <p className="text-body-md text-on-surface-variant text-center mb-8">
            기록은 당신을 성장시킵니다. <br />
            잠시 멈춰서 그때의 나를 마주해보세요.
          </p>
          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={() => router.push("/capsule")}
              className="w-full py-4 bg-primary text-on-primary rounded-xl text-label-md shadow-lg shadow-primary/20 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>지금 바로 회고하기</span>
              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-4 bg-transparent text-on-surface-variant rounded-xl text-label-md hover:bg-surface-container-high transition-colors active:scale-95"
            >
              나중에 하기
            </button>
          </div>
        </div>
        <div className="absolute top-20 -left-4 w-12 h-12 rounded-full bg-secondary-fixed-dim/40 blur-xl pointer-events-none" />
        <div className="absolute bottom-20 -right-4 w-16 h-16 rounded-full bg-primary-fixed/40 blur-xl pointer-events-none" />
      </div>
    </div>
  );
}
