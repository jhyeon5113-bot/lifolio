"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { currentUser } from "@/lib/mock-data";
import { isAdminEmail } from "@/lib/admin";
import { NotificationBell } from "@/components/NotificationBell";

export function Header({ showSearch = false }: { showSearch?: boolean }) {
  const { data: session } = useSession();
  const avatarUrl = session?.user?.image ?? currentUser.avatarUrl;
  const userName = session?.user?.name ?? currentUser.name;
  const isAdmin = isAdminEmail(session?.user?.email);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([
      fetch("/api/admin/library-submissions/count").then((res) => (res.ok ? res.json() : { count: 0 })),
      fetch("/api/admin/library-updates/count").then((res) => (res.ok ? res.json() : { count: 0 })),
    ])
      .then(([submissions, updates]: [{ count: number }, { count: number }]) =>
        setPendingReviewCount(submissions.count + updates.count),
      )
      .catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [accountMenuOpen]);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-[0_40px_40px_rgba(0,6,102,0.06)]">
      <div className="flex justify-between items-center px-gutter h-16 w-full max-w-container-max mx-auto">
        <div className="flex items-center gap-4">
          <div className="relative" ref={accountMenuRef}>
            <button
              type="button"
              onClick={() => setAccountMenuOpen((open) => !open)}
              className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center overflow-hidden relative"
              aria-label={`${userName}님으로 로그인됨 · 계정 메뉴 열기`}
              aria-expanded={accountMenuOpen}
              title="계정 메뉴"
            >
              <Image
                src={avatarUrl}
                alt={userName}
                fill
                sizes="36px"
                className="object-cover"
              />
            </button>
            {accountMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-40 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,6,102,0.12)] border border-outline-variant/20 py-1.5 z-50">
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    signOut({ callbackUrl: "/login" });
                  }}
                  className="w-full text-left px-4 py-2.5 text-label-md text-on-surface hover:bg-surface-container transition-colors"
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
          <Link href="/home" className="text-headline-md font-bold text-primary">
            Lifolio
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin/library-review"
              className="relative p-2 rounded-full hover:bg-surface-container-high/50 transition-colors active:scale-95 duration-200"
              aria-label={
                pendingReviewCount > 0
                  ? `라이브러리 검토 (관리자) · 대기 중인 항목 ${pendingReviewCount}건`
                  : "라이브러리 검토 (관리자)"
              }
              title="라이브러리 검토"
            >
              <span className="material-symbols-outlined text-primary">
                fact_check
              </span>
              {pendingReviewCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingReviewCount > 99 ? "99+" : pendingReviewCount}
                </span>
              )}
            </Link>
          )}
          {showSearch && (
            <button
              type="button"
              className="p-2 rounded-full hover:bg-surface-container-high/50 transition-colors active:scale-95 duration-200"
              aria-label="검색"
            >
              <span className="material-symbols-outlined text-on-surface-variant">
                search
              </span>
            </button>
          )}
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
