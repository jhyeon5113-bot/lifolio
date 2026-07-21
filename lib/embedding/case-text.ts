// The exact text embedded for a library case OR a user's own consult draft
// — always built from pre-decision structured fields only. Never include
// reflection/outcome content (satisfaction, actual result, advice for
// others, etc.): recommendations must reflect the situation before a
// choice was made, not how it turned out.
export interface EmbeddableFields {
  title: string;
  category: string;
  background: string;
  situation: string;
  options: string[];
  criteria: string[];
  concerns: string[];
}

export function buildEmbeddingText(fields: EmbeddableFields): string {
  return [fields.title, fields.category, fields.background, fields.situation, ...fields.options, ...fields.criteria, ...fields.concerns]
    .filter((part) => part && part.trim())
    .join("\n");
}
