import { classifyError, isRetryableClassification, toFriendlyLLMError } from "./errors";

export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  signal?: AbortSignal;
}

const waitWithSignal = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Operation aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Operation aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retriesOrOptions: number | RetryOptions = 3,
  baseDelay = 2000
): Promise<T> {
  const opts: Required<Omit<RetryOptions, 'signal'>> & { signal?: AbortSignal } =
    typeof retriesOrOptions === 'number'
      ? { retries: retriesOrOptions, baseDelayMs: baseDelay, maxDelayMs: 15000 }
      : {
          retries: retriesOrOptions.retries ?? 3,
          baseDelayMs: retriesOrOptions.baseDelayMs ?? 2000,
          maxDelayMs: retriesOrOptions.maxDelayMs ?? 15000,
          signal: retriesOrOptions.signal
        };

  let lastError: unknown;
  for (let attempt = 0; attempt < opts.retries; attempt++) {
    if (opts.signal?.aborted) {
      throw new DOMException("Operation aborted", "AbortError");
    }
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;
      if ((error as { name?: string })?.name === "AbortError") {
        throw error;
      }
      const kind = classifyError(error);
      if (!isRetryableClassification(kind)) {
        throw toFriendlyLLMError(error);
      }
      if (attempt < opts.retries - 1) {
        const jitter = Math.floor(Math.random() * 450);
        const delay = Math.min(opts.maxDelayMs, opts.baseDelayMs * Math.pow(2, attempt) + jitter);
        await waitWithSignal(delay, opts.signal);
      }
    }
  }
  throw toFriendlyLLMError(lastError);
}
