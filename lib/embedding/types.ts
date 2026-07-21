// Embedding provider contract — deliberately provider-agnostic. Which
// Embedding API (OpenAI, Gemini, etc.) to use hasn't been decided yet, so
// nothing here or in any call site should assume a specific model or
// vector dimension beyond what's already fixed in the DB schema (see
// CaseEmbedding in prisma/schema.prisma).
export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
}
