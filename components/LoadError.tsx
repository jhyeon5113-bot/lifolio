export function LoadError({
  onRetry,
  message = "불러오지 못했어요.",
  className = "",
}: {
  onRetry: () => void;
  message?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center text-center gap-2 py-12 ${className}`}>
      <span className="material-symbols-outlined text-3xl text-error">
        error_outline
      </span>
      <p className="text-body-md text-on-surface-variant">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="text-label-md text-primary underline underline-offset-2 mt-1 active:scale-95 transition-transform"
      >
        다시 시도
      </button>
    </div>
  );
}
