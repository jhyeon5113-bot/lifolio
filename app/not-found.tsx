import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="material-symbols-outlined text-4xl text-outline">
        search_off
      </span>
      <h1 className="text-headline-md text-primary">
        페이지를 찾을 수 없어요
      </h1>
      <p className="text-body-md text-on-surface-variant max-w-[400px]">
        요청하신 페이지가 존재하지 않거나 삭제되었어요.
      </p>
      <Link
        href="/home"
        className="mt-2 px-6 py-3 bg-primary text-white rounded-xl text-label-md active:scale-95 transition-all"
      >
        홈으로 돌아가기
      </Link>
    </main>
  );
}
