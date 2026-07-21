"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : { unreadCount: 0 }))
      .then(({ unreadCount }: { unreadCount: number }) => setUnreadCount(unreadCount))
      .catch(() => {});
  }, []);

  return (
    <Link
      href="/notifications"
      className="relative p-2 rounded-full hover:bg-surface-container-high/50 transition-colors active:scale-95 duration-200"
      aria-label={unreadCount > 0 ? `알림 · 읽지 않은 알림 ${unreadCount}건` : "알림"}
    >
      <span className="material-symbols-outlined text-primary">notifications</span>
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
