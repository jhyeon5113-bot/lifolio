import Link from "next/link";

export function Fab() {
  return (
    <Link
      href="/consult"
      className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] md:bottom-28 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-[0px_8px_30px_rgba(26,35,126,0.3)] flex items-center justify-center transition-all duration-300 hover:w-40 group z-40 overflow-hidden"
    >
      <span className="material-symbols-outlined transition-transform group-hover:rotate-90">
        add
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-label-md group-hover:max-w-xs group-hover:ml-2 transition-all duration-300">
        New Decision
      </span>
    </Link>
  );
}
