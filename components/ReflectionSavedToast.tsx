"use client";

import { useEscapeToClose } from "@/lib/useEscapeToClose";

export function ReflectionSavedToast({
  onEdit,
  onClose,
}: {
  onEdit: () => void;
  onClose: () => void;
}) {
  useEscapeToClose(onClose);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 px-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-lg flex flex-col items-center text-center gap-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          <p className="text-body-lg text-on-surface mb-1">
            회고가 저장되었습니다.
          </p>
          <p className="text-label-md text-outline">
            [5분 동안 수정 가능]
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <button
            type="button"
            onClick={onEdit}
            className="w-full py-3 text-label-md text-on-primary bg-primary rounded-xl active:scale-95 transition-all"
          >
            수정하러 가기
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 text-label-md text-on-surface-variant active:scale-95 transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
