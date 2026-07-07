import Image from "next/image";
import { currentUser } from "@/lib/mock-data";

export function Header({ showSearch = false }: { showSearch?: boolean }) {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-[0_40px_40px_rgba(0,6,102,0.06)]">
      <div className="flex justify-between items-center px-gutter h-16 w-full max-w-container-max mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center overflow-hidden relative">
            <Image
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              fill
              sizes="36px"
              className="object-cover"
            />
          </div>
          <span className="text-headline-md font-bold text-primary">Lifolio</span>
        </div>
        <div className="flex items-center gap-2">
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
          <button
            type="button"
            className="p-2 rounded-full hover:bg-surface-container-high/50 transition-colors active:scale-95 duration-200"
            aria-label="알림"
          >
            <span className="material-symbols-outlined text-primary">
              notifications
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
