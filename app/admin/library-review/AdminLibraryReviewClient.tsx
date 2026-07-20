"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { LoadError } from "@/components/LoadError";
import { SubmissionCard } from "@/components/admin/SubmissionCard";
import { LibraryUpdateCard } from "@/components/admin/LibraryUpdateCard";
import type { LibrarySubmission, LibraryCaseUpdateItem } from "./types";

export function AdminLibraryReviewClient() {
  const [submissions, setSubmissions] = useState<LibrarySubmission[]>([]);
  const [updates, setUpdates] = useState<LibraryCaseUpdateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setLoadError(false);
    Promise.all([
      fetch("/api/admin/library-submissions").then((res) =>
        res.ok ? res.json() : Promise.reject(new Error(`${res.status}`)),
      ),
      fetch("/api/admin/library-updates").then((res) =>
        res.ok ? res.json() : Promise.reject(new Error(`${res.status}`)),
      ),
    ])
      .then(
        ([submissionsData, updatesData]: [
          { submissions: LibrarySubmission[] },
          { updates: LibraryCaseUpdateItem[] },
        ]) => {
          setSubmissions(submissionsData.submissions);
          setUpdates(updatesData.updates);
        },
      )
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleApprove = async (id: string, form: Record<string, unknown>) => {
    setActionError(null);
    try {
      const patchRes = await fetch(`/api/admin/library-submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, satisfaction: Number(form.satisfaction) }),
      });
      const approveRes = patchRes.ok
        ? await fetch(`/api/admin/library-submissions/${id}/approve`, { method: "POST" })
        : patchRes;
      if (!patchRes.ok || !approveRes.ok) {
        setActionError("승인 처리에 실패했어요. 잠시 후 다시 시도해주세요.");
        return;
      }
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setActionError("네트워크 오류로 승인하지 못했어요. 다시 시도해주세요.");
    }
  };

  const handleReject = async (id: string) => {
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/library-submissions/${id}/reject`, { method: "POST" });
      if (!res.ok) {
        setActionError("거부 처리에 실패했어요. 잠시 후 다시 시도해주세요.");
        return;
      }
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setActionError("네트워크 오류로 거부하지 못했어요. 다시 시도해주세요.");
    }
  };

  const handleApproveUpdate = async (id: string, content: string) => {
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/library-updates/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        setActionError("승인 처리에 실패했어요. 잠시 후 다시 시도해주세요.");
        return;
      }
      setUpdates((prev) => prev.filter((u) => u.id !== id));
    } catch {
      setActionError("네트워크 오류로 승인하지 못했어요. 다시 시도해주세요.");
    }
  };

  const handleRejectUpdate = async (id: string) => {
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/library-updates/${id}/reject`, { method: "POST" });
      if (!res.ok) {
        setActionError("거부 처리에 실패했어요. 잠시 후 다시 시도해주세요.");
        return;
      }
      setUpdates((prev) => prev.filter((u) => u.id !== id));
    } catch {
      setActionError("네트워크 오류로 거부하지 못했어요. 다시 시도해주세요.");
    }
  };

  return (
    <>
      <Header />
      <main className="pt-24 pb-24 px-gutter max-w-container-max mx-auto">
        <section className="mb-10">
          <h1 className="text-headline-lg text-primary mb-2">라이브러리 검토</h1>
          <p className="text-body-md text-on-surface-variant">
            회고까지 완료된 사용자 결정 중, 아직 라이브러리에 올라가지 않은 항목입니다. 내용을
            검토·수정한 뒤 승인하면 실제 Library 화면에 사례로 게시됩니다.
          </p>
        </section>

        {actionError && (
          <p className="mb-6 px-4 py-3 rounded-lg bg-error/10 text-error text-body-md">{actionError}</p>
        )}

        {loading ? (
          <p className="text-body-md text-on-surface-variant text-center py-16">불러오는 중...</p>
        ) : loadError ? (
          <LoadError onRetry={load} />
        ) : (
          <>
            {submissions.length === 0 && updates.length === 0 && (
              <p className="text-body-md text-on-surface-variant text-center py-16">
                검토할 항목이 없어요.
              </p>
            )}

            {submissions.length > 0 && (
              <div className="space-y-6 mb-12">
                {submissions.map((submission) => (
                  <SubmissionCard
                    key={submission.id}
                    submission={submission}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </div>
            )}

            {updates.length > 0 && (
              <section>
                <h2 className="text-headline-md text-primary mb-2">추가 회고 업데이트</h2>
                <p className="text-body-md text-on-surface-variant mb-6">
                  이미 라이브러리에 올라간 케이스에 사용자가 다시 회고한 내용입니다. 승인하면 해당
                  공개 카드에 이어서 표시됩니다.
                </p>
                <div className="space-y-6">
                  {updates.map((update) => (
                    <LibraryUpdateCard
                      key={update.id}
                      update={update}
                      onApprove={handleApproveUpdate}
                      onReject={handleRejectUpdate}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
