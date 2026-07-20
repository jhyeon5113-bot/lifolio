// Pure, side-effect-free presentation data for the "진행 중인 의사결정" check-in
// feature — kept separate from lib/active-decisions-data.ts (Prisma-dependent)
// so Client Components can import this without dragging server-only code
// into the browser bundle.

export type DecisionCheckInStatus = "ON_TRACK" | "DIFFERENT" | "WORRIED" | "PAUSED" | "ALMOST_DONE";

export const CHECK_IN_OPTIONS: { value: DecisionCheckInStatus; emoji: string; label: string }[] = [
  { value: "ON_TRACK", emoji: "😊", label: "잘 진행되고 있어요." },
  { value: "DIFFERENT", emoji: "😐", label: "예상과 조금 달라졌어요." },
  { value: "WORRIED", emoji: "😕", label: "고민이 생겼어요." },
  { value: "PAUSED", emoji: "⏸", label: "잠시 멈춰두었어요." },
  { value: "ALMOST_DONE", emoji: "🏁", label: "거의 마무리됐어요." },
];

// Card display is text-only, no emoji — the bottom sheet options keep the emoji.
export function getCheckInLabel(status: DecisionCheckInStatus): string {
  return CHECK_IN_OPTIONS.find((option) => option.value === status)?.label ?? "";
}
