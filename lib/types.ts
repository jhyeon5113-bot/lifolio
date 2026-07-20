// Shared domain types for Lifolio.
// These mirror the shape the Supabase schema will eventually take
// (decisions, reflections, library_cases, report_snapshots tables),
// so the mock data below can be swapped for real queries later
// without changing the page components.

export interface PendingReflection {
  id: string;
  title: string;
  /** Days since the user's scheduled reflection date (falls back to decision date if none was set). */
  daysElapsed: number;
  /** Days since the decision itself was made — used for "N일 전 결정하신" style copy. */
  decisionDaysAgo: number;
  choiceSummary: string;
  note: string;
  decisionLabel: string;
}

export interface LibraryStep {
  label: string;
  value: string;
  dotColor: string;
}

export interface LibraryCase {
  id: string;
  /** One of the `libraryFilters` values (used for exact-match filtering). */
  category: string;
  tags: string;
  title: string;
  steps: LibraryStep[];
  authorInitials: string;
  authorAvatarColor: string;
  /** Real server-tracked counts (CaseProfile.viewCount/likeCount) — not per-viewer, see lib/case-engagement.ts. */
  viewCount: number;
  likeCount: number;
}

export interface DecisionOption {
  label: string;
  title: string;
  points: { icon: string; text: string }[];
  accent: "secondary" | "primary";
}

export interface DecisionCaseDetail {
  id: string;
  tag: string;
  date: string;
  title: string;
  subtitle: string;
  contextParagraphs: string[];
  options: DecisionOption[];
  chosenOptionLabel: string;
  criteria: { label: string; text: string }[];
  expectation: string;
  fear: string;
  satisfactionScore: number;
  outcomeQuote: string;
  sameChoiceAgain: string;
  expectationGap: string;
  messageForOthers?: string;
  followUpUpdates?: { label: string; text: string }[];
}
