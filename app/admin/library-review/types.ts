export interface LibrarySubmission {
  id: string;
  decisionId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  title: string;
  category: string;
  background: string;
  situation: string;
  options: string[];
  finalChoice: string;
  criteria: string[];
  expectedOutcome: string;
  anxieties: string[];
  actualOutcome: string;
  satisfaction: number;
  wouldChooseAgain: string;
  chooseAgainReason: string | null;
  outcomeGap: string;
  adviceForOthers: string;
  subtitle: string;
  detailTag: string;
  tags: string;
  authorInitials: string;
  submittedAt: string;
}

// A follow-up reflection on a decision whose case is already live in the
// public library — pending approval before it's appended to that card.
export interface LibraryCaseUpdateItem {
  id: string;
  decisionId: string;
  decisionTitle: string;
  content: string;
  monthsAfterLabel: string;
  submittedAt: string;
}
