"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { LoadError } from "@/components/LoadError";
import { usePushSubscription } from "@/lib/notifications/usePushSubscription";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  linkUrl: string | null;
  sentAt: string;
  readAt: string | null;
}

const IMPORTANT_TYPES = new Set(["REFLECTION_DUE", "REPORT_LEVEL_UP"]);

const TYPE_ICONS: Record<string, string> = {
  REFLECTION_DUE: "schedule",
  REPORT_LEVEL_UP: "insights",
  LIBRARY_PUBLISHED: "auto_stories",
  IN_PROGRESS_REMINDER: "edit_note",
  STATUS_UPDATE_NUDGE: "update",
  FOLLOW_UP_REFLECTION: "history",
};

function formatSentAt(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  return sameDay
    ? `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
    : `${date.getMonth() + 1}.${date.getDate()}`;
}

function NotificationRow({ notification, emphasized }: { notification: NotificationItem; emphasized: boolean }) {
  const icon = TYPE_ICONS[notification.type] ?? "notifications";
  const content = (
    <div className="flex gap-3">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          emphasized ? "bg-primary-fixed" : "bg-secondary-container"
        }`}
      >
        <span
          className={`material-symbols-outlined text-[18px] ${
            emphasized ? "text-on-primary-fixed" : "text-on-secondary-container"
          }`}
        >
          {icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-label-md text-on-surface font-bold">{notification.title}</span>
          {!notification.readAt && (
            <span className="text-[10px] font-bold text-white bg-error rounded-full px-1.5 py-0.5 leading-none">
              NEW
            </span>
          )}
          <span className="ml-auto text-[11px] text-on-surface-variant/70 whitespace-nowrap shrink-0">
            {formatSentAt(notification.sentAt)}
          </span>
        </div>
        <p className={`text-on-surface-variant mt-1 line-clamp-2 ${emphasized ? "text-body-md" : "text-label-sm"}`}>
          {notification.body}
        </p>
      </div>
    </div>
  );

  const wrapperClass = emphasized
    ? "block bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-4"
    : "block py-3";

  return notification.linkUrl ? (
    <Link href={notification.linkUrl} className={`${wrapperClass} hover:bg-surface-container transition-colors`}>
      {content}
    </Link>
  ) : (
    <div className={wrapperClass}>{content}</div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const { permission, subscribe } = usePushSubscription();
  const [testPushState, setTestPushState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  const handleTestPush = async () => {
    setTestPushState("sending");
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      setTestPushState(res.ok ? "sent" : "failed");
    } catch {
      setTestPushState("failed");
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(({ notifications }: { notifications: NotificationItem[] }) => {
        if (cancelled) return;
        setNotifications(notifications);
        if (notifications.some((n) => !n.readAt)) {
          fetch("/api/notifications/read-all", { method: "POST" }).catch(() => {
            // Best-effort — worst case the badge reappears as unread next load.
          });
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const important = notifications.filter((n) => IMPORTANT_TYPES.has(n.type));
  const rest = notifications.filter((n) => !IMPORTANT_TYPES.has(n.type));

  return (
    <>
      <Header />
      <main className="pt-24 pb-24 px-4 md:px-gutter max-w-container-max mx-auto">
        <Link
          href="/home"
          aria-label="홈으로"
          className="text-primary hover:bg-primary/5 rounded-full transition-colors active:scale-95 duration-200 -ml-2 inline-flex items-center justify-center w-fit p-2 mb-6"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>

        <section className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary fill">notifications</span>
            <h1 className="text-headline-lg text-primary">알림센터</h1>
          </div>
          <p className="text-body-md text-on-surface-variant">놓치기 쉬운 순간들을 모아뒀어요.</p>
        </section>

        {permission === "default" && (
          <div className="mb-8 p-4 rounded-2xl bg-primary-container/10 border border-outline-variant/20 flex items-center justify-between gap-4">
            <p className="text-label-sm text-on-surface-variant">
              브라우저 알림을 켜면 중요한 순간을 놓치지 않아요.
            </p>
            <button
              type="button"
              onClick={() => subscribe()}
              className="text-label-sm text-primary font-bold hover:underline shrink-0"
            >
              푸시 알림 켜기
            </button>
          </div>
        )}

        {permission === "granted" && (
          <div className="mb-8 p-4 rounded-2xl bg-primary-container/10 border border-outline-variant/20 flex items-center justify-between gap-4">
            <p className="text-label-sm text-on-surface-variant">
              {testPushState === "sent"
                ? "테스트 알림을 보냈어요. 잠시 후 도착하는지 확인해보세요."
                : testPushState === "failed"
                  ? "전송에 실패했어요. 다시 시도해주세요."
                  : "푸시 알림이 실제로 오는지 확인해보세요."}
            </p>
            <button
              type="button"
              onClick={handleTestPush}
              disabled={testPushState === "sending"}
              className="text-label-sm text-primary font-bold hover:underline shrink-0 disabled:opacity-50"
            >
              {testPushState === "sending" ? "보내는 중..." : "테스트 알림 보내기"}
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-body-md text-on-surface-variant text-center py-16">불러오는 중...</p>
        ) : error ? (
          <LoadError onRetry={() => setAttempt((n) => n + 1)} />
        ) : notifications.length === 0 ? (
          <p className="text-body-md text-on-surface-variant text-center py-16">새로운 알림이 없어요.</p>
        ) : (
          <>
            {important.length > 0 && (
              <section className="mb-8">
                <h2 className="text-label-md text-primary font-bold tracking-wide mb-3">중요한 알림</h2>
                <div className="flex flex-col gap-2.5">
                  {important.map((notification) => (
                    <NotificationRow key={notification.id} notification={notification} emphasized />
                  ))}
                </div>
              </section>
            )}

            {rest.length > 0 && (
              <section>
                <h2 className="text-label-md text-on-surface-variant font-bold tracking-wide mb-1">알림 더 보기</h2>
                <div className="flex flex-col divide-y divide-outline-variant/10">
                  {rest.map((notification) => (
                    <NotificationRow key={notification.id} notification={notification} emphasized={false} />
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
