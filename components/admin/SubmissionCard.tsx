"use client";

import { useState } from "react";
import type { LibrarySubmission } from "@/app/admin/library-review/types";

type EditableForm = Omit<
  LibrarySubmission,
  "id" | "decisionId" | "status" | "submittedAt" | "satisfaction" | "chooseAgainReason"
> & {
  satisfaction: string;
  chooseAgainReason: string;
};

function toForm(submission: LibrarySubmission): EditableForm {
  return {
    title: submission.title,
    category: submission.category,
    background: submission.background,
    situation: submission.situation,
    options: submission.options,
    finalChoice: submission.finalChoice,
    criteria: submission.criteria,
    expectedOutcome: submission.expectedOutcome,
    anxieties: submission.anxieties,
    actualOutcome: submission.actualOutcome,
    satisfaction: String(submission.satisfaction),
    wouldChooseAgain: submission.wouldChooseAgain,
    chooseAgainReason: submission.chooseAgainReason ?? "",
    outcomeGap: submission.outcomeGap,
    adviceForOthers: submission.adviceForOthers,
    subtitle: submission.subtitle,
    detailTag: submission.detailTag,
    tags: submission.tags,
    authorInitials: submission.authorInitials,
  };
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold text-outline uppercase tracking-wider mb-1 block">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={2}
          className="w-full p-2.5 text-sm bg-white border border-outline-variant/40 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full px-2.5 py-2 text-sm bg-white border border-outline-variant/40 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      )}
    </div>
  );
}

export function SubmissionCard({
  submission,
  onApprove,
  onReject,
}: {
  submission: LibrarySubmission;
  onApprove: (id: string, form: EditableForm) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}) {
  const [form, setForm] = useState<EditableForm>(toForm(submission));
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);

  const update = <K extends keyof EditableForm>(key: K, value: EditableForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleApprove = async () => {
    setBusy("approve");
    try {
      await onApprove(submission.id, form);
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async () => {
    setBusy("reject");
    try {
      await onReject(submission.id);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Field label="제목" value={form.title} onChange={(v) => update("title", v)} />
        </div>
        <span className="mt-6 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-label-sm whitespace-nowrap">
          {new Date(submission.submittedAt).toLocaleDateString("ko-KR")} 제출
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="카테고리" value={form.category} onChange={(v) => update("category", v)} />
        <Field label="태그" value={form.tags} onChange={(v) => update("tags", v)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="상세 태그" value={form.detailTag} onChange={(v) => update("detailTag", v)} />
        <Field label="작성자 이니셜" value={form.authorInitials} onChange={(v) => update("authorInitials", v)} />
      </div>
      <Field label="부제목" value={form.subtitle} onChange={(v) => update("subtitle", v)} multiline />

      <div className="pt-2 border-t border-outline-variant/10 space-y-4">
        <Field label="상황" value={form.situation} onChange={(v) => update("situation", v)} multiline />
        <Field label="고민" value={form.background} onChange={(v) => update("background", v)} multiline />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="선택지 (쉼표로 구분)"
            value={form.options.join(", ")}
            onChange={(v) => update("options", splitList(v))}
          />
          <Field label="최종 선택" value={form.finalChoice} onChange={(v) => update("finalChoice", v)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="판단 기준 (쉼표로 구분)"
            value={form.criteria.join(", ")}
            onChange={(v) => update("criteria", splitList(v))}
          />
          <Field
            label="불안 요소 (쉼표로 구분)"
            value={form.anxieties.join(", ")}
            onChange={(v) => update("anxieties", splitList(v))}
          />
        </div>
        <Field
          label="기대했던 결과"
          value={form.expectedOutcome}
          onChange={(v) => update("expectedOutcome", v)}
          multiline
        />
      </div>

      <div className="pt-2 border-t border-outline-variant/10 space-y-4">
        <Field label="실제 결과" value={form.actualOutcome} onChange={(v) => update("actualOutcome", v)} multiline />
        <div className="grid grid-cols-2 gap-3">
          <Field label="만족도 (0~100)" value={form.satisfaction} onChange={(v) => update("satisfaction", v)} />
          <div>
            <label className="text-[11px] font-bold text-outline uppercase tracking-wider mb-1 block">
              다시 선택할지
            </label>
            <select
              value={form.wouldChooseAgain}
              onChange={(event) => update("wouldChooseAgain", event.target.value)}
              className="w-full px-2.5 py-2 text-sm bg-white border border-outline-variant/40 rounded-lg"
            >
              <option value="yes">yes</option>
              <option value="no">no</option>
              <option value="depends">depends</option>
            </select>
          </div>
        </div>
        <Field
          label="다시 선택한 이유 (공개 카드의 &ldquo;같은 상황이라면?&rdquo;에 게시됨)"
          value={form.chooseAgainReason}
          onChange={(v) => update("chooseAgainReason", v)}
          multiline
        />
        <Field label="예상과의 차이" value={form.outcomeGap} onChange={(v) => update("outcomeGap", v)} multiline />
        <Field
          label="다른 사람을 위한 조언"
          value={form.adviceForOthers}
          onChange={(v) => update("adviceForOthers", v)}
          multiline
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
          {busy === "approve" ? "승인 중..." : "승인하고 라이브러리에 올리기"}
        </button>
      </div>
    </div>
  );
}
