// Single entry point the rest of the app should import from — never reach
// into stubProvider.ts directly. Swapping in a real LLM later means adding
// a new provider file and changing only the branch below.

import type { AIProvider } from "./types";
import { stubProvider } from "./stubProvider";

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
  DecisionSummaryInput,
  DecisionSummaryOutput,
  DecisionTraitInput,
  DecisionTraitOutput,
  MissingInfoInput,
  MissingInfoOutput,
  MissingInfoQuestion,
  NormalizeTermInput,
  NormalizeTermOutput,
  ReflectionAnalysisInput,
  ReflectionAnalysisOutput,
  SimilarityExplanationInput,
  SimilarityExplanationOutput,
  StructuredField,
} from "./types";
