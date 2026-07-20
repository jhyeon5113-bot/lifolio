"use client";

import { CHECK_IN_OPTIONS, type DecisionCheckInStatus } from "@/lib/decision-status-presentation";
import { useEscapeToClose } from "@/lib/useEscapeToClose";

export function DecisionStatusSheet({
  onSelect,
  onClose,
}: {
  onSelect: (status: DecisionCheckInStatus) => void;
  onClose: () => void;
}) {
  useEscapeToClose(onClose);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-primary/20 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface rounded-t-3xl p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] shadow-[0_-20px_50px_rgba(0,6,102,0.12)] animate-pop"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-outline-variant rounded-full mx-auto mb-6" />
        <h2 className="text-headline-md text-primary text-center mb-6">
          지금 이 결정은 어떻게 되고 있나요?
        </h2>
        <div className="flex flex-col gap-3">
          {CHECK_IN_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl border border-outline-variant/30 bg-white hover:border-primary hover:bg-primary/5 transition-all active:scale-95 text-left"
            >
              <span className="text-2xl">{option.emoji}</span>
              <span className="text-body-lg text-on-surface">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
