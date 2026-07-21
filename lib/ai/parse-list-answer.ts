// Splits a free-text answer like "휴학이랑 계속 다니기" or "성장, 안정성" into
// discrete items. Used wherever a single conversational answer is expected
// to contain more than one value (options, and free-text criteria/concerns).
// Conjunction words must be surrounded by whitespace so they don't match
// mid-word (e.g. the "하고" inside "휴학하고").
const SEPARATORS = /\s*,\s*|、|\s+(?:또는|이랑|랑|하고|그리고|vs\.?|or)\s+/gi;

export function parseListAnswer(text: string): string[] {
  return text
    .split(SEPARATORS)
    .map((s) => s.trim())
    .filter(Boolean);
}
