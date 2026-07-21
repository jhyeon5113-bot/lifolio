import type { DecisionCategory, DraftReviewIssue } from "@/lib/ai";
import type { LibraryCase } from "@/lib/types";
import type { OptionExpectation } from "@/components/consult/OptionExpectationsForm";

export interface StructuredDraft {
  category: DecisionCategory;
  // Written once by structureDecision when the consult starts and never
  // regenerated — carried on the draft (rather than a separate fetch) so
  // it's still around whenever the loop finally reaches the summary step,
  // however many turns later that is. Same for title.
  title: string;
  summary: string;
  background: string;
  situation: string;
  options: string[];
  criteria: string[];
  concerns: string[];
}

export interface SimilarCaseMatch {
  case: LibraryCase;
  reason: string;
}

export type ConsultMessage =
  | { id: string; role: "user"; kind: "text"; content: string }
  | { id: string; role: "ai"; kind: "text"; content: string }
  | { id: string; role: "ai"; kind: "typing" }
  | { id: string; role: "ai"; kind: "optionsQuestion"; question: string; answer?: string[]; locked: boolean }
  | {
      id: string;
      role: "ai";
      kind: "optionExpectations";
      options: string[];
      answer?: OptionExpectation[];
      locked: boolean;
    }
  | {
      id: string;
      role: "ai";
      kind: "criteriaQuestion";
      question: string;
      choices: string[];
      answer?: string[];
      locked: boolean;
    }
  | {
      id: string;
      role: "ai";
      kind: "summary";
      summary: string;
      options: string[];
      matches: SimilarCaseMatch[];
      chosen?: string;
      confidence?: number;
      locked: boolean;
    }
  | {
      id: string;
      role: "ai";
      kind: "draftReviewQuestions";
      issues: DraftReviewIssue[];
      answer?: Record<string, string>;
      locked: boolean;
    }
  | { id: string; role: "ai"; kind: "reflectionDate"; answer?: string; locked: boolean };
