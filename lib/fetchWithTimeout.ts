const DEFAULT_TIMEOUT_MS = 20_000;

// A hung request otherwise leaves the caller waiting forever (e.g. a
// "typing..." indicator that never resolves). AbortError surfaces as a
// normal thrown error, so existing try/catch blocks around fetch already
// handle it without any extra code at the call site.
export function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeout));
}
