"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/history", label: "History", icon: "history" },
  { href: "/report", label: "Analytics", icon: "analytics" },
  { href: "/library", label: "Discovery", icon: "explore" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-margin-mobile pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] bg-surface/95 backdrop-blur-xl border-t border-outline-variant/10 shadow-[0_-4px_20px_rgba(0,6,102,0.04)]">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center px-4 py-1 active:scale-90 transition-transform duration-200 ${
                active
                  ? "bg-primary-container text-on-primary-container rounded-full"
                  : "text-on-surface-variant"
              }`}
            >
              <span
                className={`material-symbols-outlined ${active ? "fill" : ""}`}
              >
                {item.icon}
              </span>
              <span className="text-label-sm text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop floating pill nav */}
      <nav className="hidden md:flex fixed bottom-8 left-1/2 -translate-x-1/2 glass-card rounded-full px-4 py-2 items-center gap-2 shadow-2xl z-50">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-6 py-2 rounded-full transition-colors active:scale-95 ${
                active
                  ? "bg-primary text-on-primary shadow-lg"
                  : "hover:bg-surface-container-high text-on-surface-variant"
              }`}
            >
              <span
                className={`material-symbols-outlined ${active ? "fill" : ""}`}
              >
                {item.icon}
              </span>
              <span className="text-label-md">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
