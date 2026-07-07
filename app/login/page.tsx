"use client";

import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-grid-margin py-section-gap-mobile md:py-section-gap-desktop overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-[60%] -right-[5%] w-[30%] h-[30%] rounded-full bg-secondary-container/30 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] text-center space-y-16">
        <header className="animate-slide-up space-y-4 pt-4">
          <div className="inline-flex items-center justify-center rounded-2xl bg-white shadow-[0px_4px_20px_rgba(26,35,126,0.04)] mb-2 p-4">
            <span className="material-symbols-outlined text-[32px] text-primary fill">
              psychology
            </span>
          </div>
          <h1 className="text-display-lg text-primary tracking-tight">
            Lifolio
          </h1>
          <p className="text-body-lg text-on-surface-variant/80 tracking-tight mx-auto leading-relaxed">
            Every decision builds your life
          </p>
        </header>

        <div
          className="animate-slide-up space-y-6"
          style={{ animationDelay: "0.2s" }}
        >
          <button
            type="button"
            onClick={() => router.push("/home")}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl text-label-md shadow-sm hover:shadow-md transition-all active:scale-95"
            style={{ backgroundColor: "#FEE500", color: "#191919" }}
          >
            <svg
              className="w-6 h-6 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 3c-4.97 0-9 3.118-9 6.963 0 2.5 1.69 4.685 4.237 5.955l-1.077 3.948c-.086.315.1.62.4.62.115 0 .227-.038.32-.11l4.73-3.125c.13.01.26.015.39.015 4.97 0 9-3.118 9-6.963 0-3.845-4.03-6.963-9-6.963z" />
            </svg>
            <span>카카오톡으로 시작하기</span>
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-grow bg-on-surface-variant/10" />
            <span className="text-[12px] text-on-surface-variant/40 uppercase tracking-widest">
              or
            </span>
            <div className="h-px flex-grow bg-on-surface-variant/10" />
          </div>

          <button
            type="button"
            onClick={() => router.push("/home")}
            className="w-full glass-card border border-outline-variant/30 text-on-surface-variant text-label-md py-4 px-6 rounded-xl hover:bg-white/80 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">mail</span>
            다른 이메일로 로그인
          </button>

          <p className="text-body-md text-on-surface-variant/60 pt-4">
            계정이 없으신가요?{" "}
            <button
              type="button"
              onClick={() => router.push("/home")}
              className="text-primary font-semibold hover:underline underline-offset-4"
            >
              회원가입
            </button>
          </p>
        </div>
      </div>

      <div className="hidden lg:block fixed bottom-12 right-12 opacity-40 hover:opacity-100 transition-opacity pointer-events-none select-none">
        <div className="flex items-center gap-3 text-label-md text-primary/40">
          <span
            className="material-symbols-outlined animate-bounce"
            style={{ animationDuration: "3s" }}
          >
            keyboard_double_arrow_down
          </span>
          <span className="tracking-widest uppercase text-[10px]">
            Lifestyle Journaling System
          </span>
        </div>
      </div>
    </main>
  );
}
