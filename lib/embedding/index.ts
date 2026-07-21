import type { EmbeddingProvider } from "./types";

// No provider is wired up yet — Embedding API (OpenAI/Gemini/etc.) hasn't
// been chosen. Returns null until one is; every call site (lib/cases-repo.ts,
// lib/library-review-repo.ts) must treat that as "embedding search isn't
// available yet" and fall back to non-embedding behavior rather than error.
// Swap in a real provider the same way lib/ai/index.ts does: add a new file
// next to this one and branch on an env var here.
export function getEmbeddingProvider(): EmbeddingProvider | null {
  return null;
}

export type { EmbeddingProvider };
