// Pure, server/client-agnostic helpers over trait scores — kept separate
// from lib/trait-repo.ts (which pulls in Prisma/pg) so Client Components
// like ReportTabs can import these without dragging server-only code into
// the browser bundle.

export interface TraitScores {
  rational: number;
  emotional: number;
  longTerm: number;
  shortTerm: number;
  planned: number;
  executionFocused: number;
}

// "이성적 장기 계획형" style label — each pair is complementary (sums to
// 100), so comparing either side of a pair is equivalent.
export function generateTraitLabel(profile: TraitScores): string {
  const first = profile.rational >= profile.emotional ? "이성적" : "감성적";
  const second = profile.longTerm >= profile.shortTerm ? "장기" : "단기";
  const third = profile.planned >= profile.executionFocused ? "계획" : "실행";
  return `${first} ${second} ${third}형`;
}

export function generateTraitDescription(profile: TraitScores): string {
  const reasoning = profile.rational >= profile.emotional
    ? "논리적 근거를 중요하게 생각하고"
    : "마음이 가는 방향을 중요하게 생각하고";
  const horizon = profile.longTerm >= profile.shortTerm
    ? "장기적인 관점에서 신중하게 바라보며"
    : "눈앞의 상황에 집중해서 판단하며";
  const pace = profile.planned >= profile.executionFocused
    ? "충분히 계획한 뒤 결정하는 편이에요."
    : "결정한 뒤 빠르게 실행에 옮기는 편이에요.";
  return `결정을 내릴 때 ${reasoning}, ${horizon} ${pace}`;
}
