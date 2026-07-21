// Single entry point the rest of the app should import from — never reach
// into stub-provider.ts directly. Swapping in a real LLM later means adding
// a new provider file and changing only the branch below.

import type { AIProvider } from "./types";
import { stubProvider } from "./stub-provider";

export function getAIProvider(): AIProvider {
  // No provider is wired up yet (decision pending — see PRD Part 3 chat).
  // Once one is, branch on an env var here, e.g.:
  //   if (process.env.ANTHROPIC_API_KEY) return anthropicProvider;
  return stubProvider;
}

export type {
  AIProvider,
  DecisionCategory,
  DecisionDnaInput,
  DecisionDnaLevel1Output,
  DecisionStructureInput,
  DecisionStructureOutput,
  DecisionTraitInput,
  DecisionTraitOutput,
  DraftReviewInput,
  DraftReviewIssue,
  DraftReviewOutput,
  MissingInfoInput,
  MissingInfoOutput,
  MissingInfoQuestion,
  SimilarityExplanationInput,
  SimilarityExplanationOutput,
  StructuredField,
} from "./types";
