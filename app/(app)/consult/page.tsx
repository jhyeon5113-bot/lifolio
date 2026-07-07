"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { consultQuickTopics } from "@/lib/mock-data";
import type { ChatMessage } from "@/lib/types";

const AI_FOLLOW_UP =
  "말씀해주신 고민의 핵심을 파악했습니다. 그 상황에서 당신이 느끼는 가장 큰 감정적 장애물은 무엇인가요? 조금 더 구체적으로 해결하고 싶은 지점을 짚어보겠습니다.";

export default function ConsultPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const idRef = useRef(0);

  const nextId = () => {
    idRef.current += 1;
    return `msg-${idRef.current}`;
  };

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", content: trimmed },
    ]);
    setInput("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "ai", content: AI_FOLLOW_UP },
      ]);
    }, 800);
  };

  return (
    <>
      <Header />
      <main className="flex-grow pt-24 pb-32 px-gutter w-full max-w-container-max mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-grid-gutter">
          {/* Left: AI interviewer presence */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high/50 transition-colors active:scale-95 duration-200 mb-2"
              aria-label="뒤로가기"
            >
              <span className="material-symbols-outlined text-primary">
                arrow_back
              </span>
            </button>
            <div className="glass-card rounded-xl p-8 shadow-[0_4px_20px_rgba(26,35,126,0.04)] flex flex-col items-center text-center">
              <div className="relative w-24 h-24 mb-6 mx-auto rounded-3xl bg-white shadow-md overflow-hidden animate-float">
                <Image
                  src="/mascot-magnifier.png"
                  alt="분석하는 Lifolio 마스코트"
                  fill
                  sizes="96px"
                  className="object-cover scale-110"
                />
              </div>
              <h1 className="text-headline-lg text-primary mb-4">
                구조화된 상담의 시작
              </h1>
              <p className="text-on-surface-variant text-body-lg leading-relaxed">
                복잡한 생각들을 정리할 준비가 되셨나요? <br />
                당신의 고민을 객관적인 시각으로 바라볼 수 있도록 돕겠습니다.
              </p>
              <div className="mt-12 grid grid-cols-2 gap-4 w-full">
                <div className="p-4 bg-white/40 rounded-lg text-left border border-white/20">
                  <span className="material-symbols-outlined text-secondary mb-2 block">
                    query_stats
                  </span>
                  <p className="text-label-md text-primary">논리적 분석</p>
                  <p className="text-[12px] text-on-surface-variant">
                    감정보다 사실 기반의 분석
                  </p>
                </div>
                <div className="p-4 bg-white/40 rounded-lg text-left border border-white/20">
                  <span className="material-symbols-outlined text-secondary mb-2 block">
                    visibility
                  </span>
                  <p className="text-label-md text-primary">다각도 조망</p>
                  <p className="text-[12px] text-on-surface-variant">
                    놓치기 쉬운 변수 확인
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-secondary-container/30 rounded-xl p-6 border border-secondary/10">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-secondary mt-1">
                  info
                </span>
                <div>
                  <h3 className="text-label-md text-on-secondary-container mb-1">
                    상담 가이드
                  </h3>
                  <p className="text-sm text-on-secondary-container opacity-80 leading-snug">
                    구체적인 상황일수록 AI가 더 정교한 질문을 던질 수
                    있습니다. 편안하게 당신의 이야기를 들려주세요.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Chat */}
          <div className="lg:col-span-7 flex flex-col h-full min-h-[600px]">
            <div className="flex-grow glass-card rounded-t-xl p-6 overflow-y-auto flex flex-col gap-6 shadow-[0_4px_20px_rgba(26,35,126,0.04)]">
              <div className="flex gap-4 max-w-[85%]">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary-container text-sm">
                    smart_toy
                  </span>
                </div>
                <div className="p-5 bg-white rounded-r-2xl rounded-bl-2xl shadow-sm border border-outline-variant/20">
                  <p className="text-primary text-body-lg mb-2">
                    안녕하세요. 당신의 사유 파트너입니다.
                  </p>
                  <p className="text-on-surface">
                    오늘 당신의 머릿속을 떠나지 않는 가장 큰 고민은
                    무엇인가요? 무엇이든 자유롭게 적어주세요.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 py-4">
                {consultQuickTopics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => sendMessage(topic)}
                    className="px-4 py-2 rounded-full border border-outline text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container hover:border-transparent transition-all active:scale-95 text-label-md"
                  >
                    {topic}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-6">
                {messages.map((message) =>
                  message.role === "user" ? (
                    <div
                      key={message.id}
                      className="flex justify-end gap-4 ml-auto max-w-[85%]"
                    >
                      <div className="p-5 bg-primary-container text-on-primary-container rounded-l-2xl rounded-br-2xl shadow-sm">
                        <p className="text-body-md">{message.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div key={message.id} className="flex gap-4 max-w-[85%]">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-primary-container text-sm">
                          smart_toy
                        </span>
                      </div>
                      <div className="p-5 bg-white rounded-r-2xl rounded-bl-2xl shadow-sm border border-outline-variant/20">
                        <p className="text-on-surface text-body-md">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="glass-card rounded-b-xl p-6 border-t border-outline-variant/10 shadow-[0_-4px_20px_rgba(26,35,126,0.04)]">
              <div className="relative group">
                <textarea
                  className="w-full p-5 bg-white rounded-xl border border-outline-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-body-md placeholder:text-on-surface-variant/50"
                  placeholder="여기에 당신의 고민을 적어주세요..."
                  rows={4}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage(input);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => sendMessage(input)}
                  className="absolute bottom-4 right-4 w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-primary-container active:scale-95 transition-all"
                  aria-label="전송"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
              <div className="flex justify-between items-center mt-4 px-2">
                <span className="text-[10px] text-on-surface-variant/60 flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                  <span className="material-symbols-outlined text-sm">
                    security
                  </span>
                  모든 대화는 암호화되어 안전하게 보호됩니다.
                </span>
                <div className="flex gap-4">
                  <button
                    type="button"
                    className="text-on-surface-variant hover:text-primary transition-colors"
                    aria-label="음성 입력"
                  >
                    <span className="material-symbols-outlined">mic</span>
                  </button>
                  <button
                    type="button"
                    className="text-on-surface-variant hover:text-primary transition-colors"
                    aria-label="파일 첨부"
                  >
                    <span className="material-symbols-outlined">
                      attach_file
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
