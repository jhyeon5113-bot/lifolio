"use client";

import { useState } from "react";
import type { LibraryCaseUpdateItem } from "@/app/admin/library-review/types";

export function LibraryUpdateCard({
  update,
  onApprove,
  onReject,
}: {
  update: LibraryCaseUpdateItem;
  onApprove: (id: string, content: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}) {
  const [content, setContent] = useState(update.content);
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);

  const handleApprove = async () => {
    setBusy("approve");
    try {
      await onApprove(update.id, content);
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async () => {
    setBusy("reject");
    try {
      await onReject(update.id);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold text-outline uppercase tracking-wider mb-1">
            {update.decisionTitle} · {update.monthsAfterLabel} 추가 회고
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-label-sm whitespace-nowrap">
          {new Date(update.submittedAt).toLocaleDateString("ko-KR")} 제출
        </span>
      </div>

      <div>
        <label className="text-[11px] font-bold text-outline uppercase tracking-wider mb-1 block">
          추가될 내용
        </label>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={3}
          className="w-full p-2.5 text-sm bg-white border border-outline-variant/40 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleReject}
          disabled={busy !== null}
          className="flex-1 py-2.5 text-label-md text-error border border-error/30 rounded-lg hover:bg-error/5 transition-colors disabled:opacity-40"
        >
          {busy === "reject" ? "거부 중..." : "거부"}
        </button>
        <button
          type="button"
          onClick={handleApprove}
          disabled={busy !== null}
          className="flex-1 py-2.5 text-label-md bg-primary text-white rounded-lg hover:bg-primary-container transition-colors disabled:opacity-40"
        >
          {busy === "approve" ? "승인 중..." : "승인하고 카드에 추가하기"}
        </button>
      </div>
    </div>
  );
}
