// Shared domain types for Lifolio.
// These mirror the shape the Supabase schema will eventually take
// (decisions, reflections, library_cases, report_snapshots tables),
// so the mock data below can be swapped for real queries later
// without changing the page components.

export type DecisionStatus = "active" | "waiting" | "pending_reflection";

export interface ActiveDecision {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge: string;
  progress: number;
  status: DecisionStatus;
}

export interface PendingReflection {
  id: string;
  title: string;
  daysElapsed: number;
  choiceSummary: string;
  note: string;
  decisionLabel: string;
}

export interface HistoryEntry {
  id: string;
  date: string;
  tag: string;
  title: string;
  context: string;
  why: string;
  outcome: string;
}

export interface LibraryStep {
  label: string;
  value: string;
  dotColor: string;
}

export interface LibraryCase {
  id: string;
  tags: string;
  title: string;
  steps: LibraryStep[];
  authorInitials: string;
  authorAvatarColor: string;
  views: string;
  likes: string;
}

export interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
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
  messageForOthers: string;
}
