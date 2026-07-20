import { memo, useState } from "react";
import Link from "next/link";
import type { LibraryCase } from "@/lib/types";

interface LibraryCaseCardProps {
  item: LibraryCase;
  hasDetail: boolean;
  saved: boolean;
  onToggleSave: (id: string) => void;
  liked: boolean;
  onToggleLike: (id: string) => void;
  /** Path the detail page's back link should return to, e.g. an in-progress /consult session. */
  returnTo?: string;
}

// Rendered in grids of a dozen+ on /library — memo so typing in the search
// box (which only changes which items are in the list, not their own props)
// doesn't re-render every still-visible card.
export const LibraryCaseCard = memo(function LibraryCaseCard({
  item,
  hasDetail,
  saved,
  onToggleSave,
  liked,
  onToggleLike,
  returnTo,
}: LibraryCaseCardProps) {
  // item.likeCount is the real server aggregate as of whenever the page's
  // case list was fetched — it doesn't move on its own when *this* viewer
  // toggles their own like afterward (no refetch happens), so adjust it
  // locally by how much `liked` has changed since this card first mounted.
  const [likedAtMount] = useState(liked);
  const displayedLikeCount = item.likeCount + (liked ? 1 : 0) - (likedAtMount ? 1 : 0);

  const cardClassName = `group bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(26,35,126,0.04)] hover:shadow-[0_12px_24px_rgba(26,35,126,0.08)] transition-all flex flex-col h-full border border-outline-variant/20 p-6 ${hasDetail ? "cursor-pointer" : ""}`;

  const cardContent = (
    <>
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <span className="text-xs font-bold text-primary tracking-wide">
            {item.tags}
          </span>
          <h3 className="text-[20px] text-on-surface group-hover:text-primary transition-colors">
            {item.title}
          </h3>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleSave(item.id);
          }}
          className={`transition-colors ${saved ? "text-primary" : "text-on-surface-variant/40 hover:text-primary"}`}
          aria-label={saved ? "저장 취소" : "북마크"}
          aria-pressed={saved}
        >
          <span className={`material-symbols-outlined ${saved ? "fill" : ""}`}>
            bookmark
          </span>
        </button>
      </div>

      <div className="space-y-3 flex-1">
        {item.steps.map((step, index) => (
          <div key={step.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-2.5 h-2.5 rounded-full mt-1.5 ${step.dotColor}`}
              />
              {index < item.steps.length - 1 && (
                <div className="w-0.5 flex-1 bg-outline-variant/20" />
              )}
            </div>
            <div>
              <p className="text-[11px] font-bold text-outline uppercase tracking-wider">
                {step.label}
              </p>
              <p className="text-sm text-on-surface-variant">{step.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${item.authorAvatarColor}`}
          >
            {item.authorInitials}
          </div>
          <span className="text-xs text-on-surface-variant font-medium">
            익명의 사용자
          </span>
        </div>
        <div className="flex items-center gap-3 text-on-surface-variant/70">
          <span className="flex items-center gap-1 text-[11px]">
            <span className="material-symbols-outlined text-[14px]">
              visibility
            </span>{" "}
            {item.viewCount}
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleLike(item.id);
            }}
            className="flex items-center gap-1 text-[11px] text-on-surface-variant/70"
            aria-label={liked ? "좋아요 취소" : "좋아요"}
            aria-pressed={liked}
          >
            <span className="grid text-[14px]">
              {liked && (
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined fill [grid-area:1/1] text-surface-container"
                >
                  favorite
                </span>
              )}
              <span className="material-symbols-outlined [grid-area:1/1]">
                favorite
              </span>
            </span>{" "}
            {displayedLikeCount}
          </button>
        </div>
      </div>
    </>
  );

  const href = returnTo
    ? `/library/${item.id}?returnTo=${encodeURIComponent(returnTo)}`
    : `/library/${item.id}`;

  return hasDetail ? (
    <Link href={href} className={cardClassName}>
      {cardContent}
    </Link>
  ) : (
    <div className={cardClassName}>{cardContent}</div>
  );
});
