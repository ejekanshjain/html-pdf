type RetryContext = { attempt: number; lastError?: unknown }

export async function withRetry<T>(
  fn: (retryContext: RetryContext) => Promise<T>,
  tries = 3,
  delays = [1000, 5000]
): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < tries; i++) {
    try {
      return await fn({ attempt: i + 1, lastError })
    } catch (err) {
      lastError = err
      if (i < tries - 1) {
        await new Promise(res => setTimeout(res, delays[i] || 1000))
      }
    }
  }
  throw lastError
}
