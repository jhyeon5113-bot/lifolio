"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SplashPage() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 50);
    const redirectTimer = setTimeout(() => router.push("/login"), 2600);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <main
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#1a237e" }}
    >
      <div
        className="flex flex-col items-center justify-center transition-all duration-1000 ease-in-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(1.02)",
        }}
      >
        <div className="text-center">
          <h1
            className="text-display-lg tracking-[0.25em] md:text-[64px] transition-all duration-1000"
            style={{ color: "#fdf9f0" }}
          >
            Lifolio
          </h1>
          <p
            className="mt-4 text-label-md tracking-widest opacity-80"
            style={{ color: "#d8c4a6" }}
          >
            Every decision builds your life
          </p>
        </div>
        <div className="relative mt-16 w-[120px] h-[2px] rounded-full overflow-hidden bg-white/10">
          <div
            className="h-full bg-white/70 rounded-full"
            style={{
              width: visible ? "100%" : "0%",
              transition: "width 2.2s cubic-bezier(0.65, 0, 0.35, 1)",
            }}
          />
        </div>
      </div>
    </main>
  );
}
