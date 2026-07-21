// Races a promise against a timeout so a hung downstream call (e.g. an AI
// provider that never responds) can't leave a request handler stuck.
export function withTimeout<T>(promise: Promise<T>, timeoutMs = 20_000, label = "operation"): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}
