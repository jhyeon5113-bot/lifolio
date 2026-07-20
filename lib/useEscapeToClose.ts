"use client";

import { useEffect } from "react";

/** Closes a modal/sheet on Escape — keyboard users otherwise have no way out short of Tab-cycling to a close control. */
export function useEscapeToClose(onClose: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
}
