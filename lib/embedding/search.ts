import { prisma } from "@/lib/prisma";

// CaseEmbedding.embedding is declared Unsupported("vector(1536)") in the
// Prisma schema — pgvector isn't a type Prisma Client models natively, so
// both reading and writing it have to go through raw SQL. The vector
// literal is passed as a bound parameter (not string-concatenated into the
// query), same as any other $queryRaw/$executeRaw argument.

export interface EmbeddingMatch {
  caseId: string;
  distance: number;
}

// Nearest neighbors by cosine distance (pgvector's `<=>` operator — 0 is
// identical, 2 is opposite), ascending, so index 0 is the closest match.
// No AI re-ranking on top of this for MVP — this ordering is the final
// result the caller uses.
export async function findNearestCaseEmbeddings(
  queryEmbedding: number[],
  limit: number,
): Promise<EmbeddingMatch[]> {
  const vectorLiteral = `[${queryEmbedding.join(",")}]`;
  return prisma.$queryRaw<EmbeddingMatch[]>`
    SELECT "caseId", ("embedding" <=> ${vectorLiteral}::vector) AS distance
    FROM "CaseEmbedding"
    ORDER BY "embedding" <=> ${vectorLiteral}::vector
    LIMIT ${limit}
  `;
}

// Upsert since a case's embedding is only ever (re)computed once, at
// approval time — but stays idempotent in case the same case ever needs
// re-embedding (e.g. after a provider/model switch, via the backfill script).
export async function storeCaseEmbedding(caseId: string, embedding: number[]): Promise<void> {
  const vectorLiteral = `[${embedding.join(",")}]`;
  await prisma.$executeRaw`
    INSERT INTO "CaseEmbedding" ("id", "caseId", "embedding", "createdAt")
    VALUES (gen_random_uuid()::text, ${caseId}, ${vectorLiteral}::vector, now())
    ON CONFLICT ("caseId") DO UPDATE SET "embedding" = EXCLUDED."embedding"
  `;
}
