"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { pendingReflection } from "@/lib/mock-data";

const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBUkZ2t_ii-s10x_d3FsunUzoUA4qbdLlQ8ynKaoK2cI_FQCD_DMtzo59Ob6AXvUDsPgp5IrrYGOhZ-wpu7X-PokNNp2hyRaEYNZQbdUETyTjlx06yoJ0zy49XVyMgNPlVqUmegGxFMd7-4boUpPtZsishS7XMRgKUT1_U_t4JXJDy4U0skQWYWrDyuzazpJ6mY9qKPVY4pvhu639bdiSYQKQk9kP3YXiEr6WITYG6YK89o-uv1NLBl";

export default function CapsulePage() {
  const router = useRouter();
  const [satisfaction, setSatisfaction] = useState(85);
  const [choice, setChoice] = useState<"yes" | "no">("yes");
  const [reflection, setReflection] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => router.push("/home"), 500);
  };

  return (
    <>
      <Header />
      <main className="relative pt-16 pb-24 lg:pb-16 flex flex-col items-center">
        <div className="w-full max-w-container-max px-grid-margin mt-12 mb-16 flex flex-col gap-12 items-start">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary-container hover:opacity-80 transition-opacity active:scale-95"
          >
            <span className="material-symbols-outlined text-[24px]">
              arrow_back
            </span>
          </button>

          <div className="w-full flex flex-col lg:flex-row gap-12">
            {/* Left: Emotional context */}
            <div className="w-full lg:w-1/2 flex flex-col gap-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-label-md w-fit">
                <span className="material-symbols-outlined text-[16px]">
                  schedule
                </span>
                {Math.round(pendingReflection.daysElapsed / 30)}개월 전의 기록
              </div>
              <h2 className="text-headline-lg lg:text-[42px] leading-tight text-primary">
                {Math.round(pendingReflection.daysElapsed / 30)}개월 전 당신은
                성장을 기대하며 <br />
                <span className="text-secondary italic">
                  {pendingReflection.decisionLabel}
                </span>
                을 결정했습니다.
              </h2>
              <p className="text-body-lg text-on-surface-variant max-w-[500px]">
                시간이 흘러 타임캡슐이 열렸습니다. 그때의 다짐과 지금의
                감정은 어떤 차이가 있나요? 당신의 발자취를 돌아보며 현재를
                기록해보세요.
              </p>
              <div className="relative mt-4">
                <div className="relative overflow-hidden rounded-2xl h-80 shadow-2xl">
                  <Image
                    src={HERO_IMAGE}
                    alt="6개월 전의 기록"
                    fill
                    sizes="(min-width: 1024px) 500px, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8 text-white">
                    <span className="text-label-md opacity-80 uppercase tracking-widest">
                      Original Intent
                    </span>
                    <p className="text-headline-md mt-2">
                      &ldquo;나를 찾는 여행, 그리고 배움&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Reflection form */}
            <div className="w-full lg:w-1/2 glass-card rounded-3xl p-8 lg:p-10 shadow-[0_40px_80px_rgba(26,35,126,0.06)] flex flex-col gap-10 border border-white/40">
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-end">
                  <label className="text-headline-md text-primary" htmlFor="satisfaction">
                    지금은 어떠신가요?
                  </label>
                  <span className="text-display-lg text-secondary">
                    {satisfaction}
                  </span>
                </div>
                <div className="relative w-full h-8 flex items-center">
                  <div className="absolute w-full h-1.5 bg-surface-variant rounded-full" />
                  <div
                    className="absolute h-1.5 bg-primary rounded-full pointer-events-none"
                    style={{ width: `${satisfaction}%` }}
                  />
                  <input
                    id="satisfaction"
                    className="absolute w-full h-8 bg-transparent appearance-none z-10 cursor-pointer accent-primary"
                    max={100}
                    min={0}
                    type="range"
                    value={satisfaction}
                    onChange={(event) =>
                      setSatisfaction(Number(event.target.value))
                    }
                  />
                </div>
                <div className="flex justify-between text-label-md text-outline">
                  <span>아직은 낯설어요</span>
                  <span>기대 이상이에요</span>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <label className="text-headline-md text-primary">
                  다시 돌아가도 같은 결정을 하실 건가요?
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setChoice("yes")}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all active:scale-95 ${
                      choice === "yes"
                        ? "border-primary bg-primary/5"
                        : "border-surface-variant hover:border-primary bg-white/50"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[32px] mb-2 fill ${
                        choice === "yes" ? "text-primary" : "text-outline"
                      }`}
                    >
                      check_circle
                    </span>
                    <span
                      className={`text-label-md ${
                        choice === "yes" ? "text-primary" : "text-on-surface-variant"
                      }`}
                    >
                      네, 후회 없어요
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChoice("no")}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all active:scale-95 ${
                      choice === "no"
                        ? "border-error bg-error/5"
                        : "border-surface-variant hover:border-error bg-white/50"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[32px] mb-2 ${
                        choice === "no" ? "text-error fill" : "text-outline"
                      }`}
                    >
                      cancel
                    </span>
                    <span
                      className={`text-label-md ${
                        choice === "no" ? "text-error" : "text-on-surface-variant"
                      }`}
                    >
                      다른 선택을 할 것 같아요
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-headline-md text-primary" htmlFor="reflection">
                  예상과 실제의 차이
                </label>
                <div className="relative">
                  <textarea
                    id="reflection"
                    className="w-full bg-white/80 border border-outline-variant/30 rounded-2xl p-6 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-on-surface resize-none"
                    placeholder="6개월 전 예상했던 모습과 지금의 당신은 어떻게 다른가요?"
                    rows={4}
                    maxLength={500}
                    value={reflection}
                    onChange={(event) => setReflection(event.target.value)}
                  />
                  <div className="absolute bottom-4 right-4 text-outline text-[12px]">
                    {reflection.length} / 500
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-headline-md text-primary" htmlFor="message">
                    다른 사람을 위한 한마디
                  </label>
                  <p className="text-label-md text-on-surface-variant">
                    비슷한 고민을 하는 사람들에게 당신의 경험이 큰 힘이
                    됩니다.
                  </p>
                </div>
                <div className="relative">
                  <textarea
                    id="message"
                    className="w-full bg-white/80 border border-outline-variant/30 rounded-2xl p-6 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-on-surface resize-none"
                    placeholder="응원의 한마디나 팁을 자유롭게 적어주세요."
                    rows={3}
                    maxLength={200}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                  />
                  <div className="absolute bottom-4 right-4 text-outline text-[12px]">
                    {message.length} / 200
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-16 bg-primary text-on-primary rounded-xl text-headline-md shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all active:scale-95 duration-200 disabled:opacity-60"
              >
                {submitting ? "저장 중..." : "회고 완료하기"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
