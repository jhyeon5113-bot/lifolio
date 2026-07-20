"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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

function formatSentAt(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  return sameDay
    ? `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
    : `${date.getMonth() + 1}.${date.getDate()}`;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { permission, subscribe } = usePushSubscription();

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : { notifications: [], unreadCount: 0 }))
      .then(({ notifications, unreadCount }: { notifications: NotificationItem[]; unreadCount: number }) => {
        setNotifications(notifications);
        setUnreadCount(unreadCount);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })));
      fetch("/api/notifications/read-all", { method: "POST" }).catch(() => {
        // Best-effort — worst case the badge reappears as unread next load.
      });
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-surface-container-high/50 transition-colors active:scale-95 duration-200"
        aria-label={unreadCount > 0 ? `알림 · 읽지 않은 알림 ${unreadCount}건` : "알림"}
        aria-expanded={open}
      >
        <span className="material-symbols-outlined text-primary">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[70vh] overflow-y-auto bg-white rounded-xl shadow-[0_8px_24px_rgba(0,6,102,0.12)] border border-outline-variant/20 z-50">
          {permission === "default" && (
            <div className="p-4 border-b border-outline-variant/20 bg-primary-container/10">
              <p className="text-label-sm text-on-surface-variant mb-2">
                브라우저 알림을 켜면 중요한 순간을 놓치지 않아요.
              </p>
              <button
                type="button"
                onClick={() => subscribe()}
                className="text-label-sm text-primary font-bold hover:underline"
              >
                푸시 알림 켜기
              </button>
            </div>
          )}

          {notifications.length === 0 ? (
            <p className="text-body-md text-on-surface-variant text-center py-10 px-4">
              새로운 알림이 없어요.
            </p>
          ) : (
            <ul>
              {notifications.map((notification) => {
                const content = (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-label-md text-on-surface font-bold">{notification.title}</p>
                      <span className="text-[10px] text-on-surface-variant/60 whitespace-nowrap shrink-0">
                        {formatSentAt(notification.sentAt)}
                      </span>
                    </div>
                    <p className="text-body-md text-on-surface-variant mt-1 line-clamp-2">{notification.body}</p>
                  </>
                );
                return (
                  <li key={notification.id} className="border-b border-outline-variant/10 last:border-b-0">
                    {notification.linkUrl ? (
                      <Link
                        href={notification.linkUrl}
                        onClick={() => setOpen(false)}
                        className={`block px-4 py-3 hover:bg-surface-container transition-colors ${
                          notification.readAt ? "" : "bg-primary-container/5"
                        }`}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className={`px-4 py-3 ${notification.readAt ? "" : "bg-primary-container/5"}`}>{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
