export type ErrorClassification =
  | 'invalid_api_key'
  | 'rate_limit'
  | 'quota_exhausted'
  | 'model_unavailable'
  | 'unsupported_combination'
  | 'safety_block'
  | 'bad_request'
  | 'server'
  | 'network'
  | 'unknown';

export class LLMError extends Error {
  public readonly classification: ErrorClassification;
  public readonly status?: number;
  public readonly causeError?: unknown;

  constructor(message: string, classification: ErrorClassification, status?: number, causeError?: unknown) {
    super(message);
    this.name = 'LLMError';
    this.classification = classification;
    this.status = status;
    this.causeError = causeError;
  }
}

export const classifyError = (error: unknown): ErrorClassification => {
  if (!error) return 'unknown';
  if (error instanceof LLMError) return error.classification;

  const errObj = error as Record<string, unknown>;
  const status = Number(errObj.status || errObj.code || 0);
  const msg = String(errObj.message || JSON.stringify(error)).toLowerCase();

  if (
    status === 401 ||
    status === 403 ||
    msg.includes('api_key_invalid') ||
    msg.includes('api key not valid') ||
    msg.includes('invalid api key') ||
    msg.includes('unauthenticated') ||
    msg.includes('no valid gemini api key')
  ) {
    return 'invalid_api_key';
  }

  if (
    msg.includes('safety') ||
    msg.includes('blocked by safety') ||
    msg.includes('finish_reason_safety') ||
    msg.includes('prohibited_content')
  ) {
    return 'safety_block';
  }

  if (
    msg.includes('quota exceeded') ||
    msg.includes('daily limit') ||
    msg.includes('billing') ||
    msg.includes('exceeded your current quota') ||
    (msg.includes('quota') && !msg.includes('per minute') && !msg.includes('retry'))
  ) {
    return 'quota_exhausted';
  }

  if (
    status === 429 ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('retry-after')
  ) {
    return 'rate_limit';
  }

  if (
    status === 404 ||
    msg.includes('404') ||
    msg.includes('not_found') ||
    msg.includes('model not found') ||
    msg.includes('no longer available') ||
    msg.includes('is not found for api version') ||
    msg.includes('permission_denied') ||
    msg.includes('not supported for generatecontent')
  ) {
    return 'model_unavailable';
  }

  if (
    (status === 400 || msg.includes('400') || msg.includes('invalid_argument')) &&
    (msg.includes('not supported') ||
      msg.includes('unsupported') ||
      msg.includes('tool use with a response mime type') ||
      msg.includes('search grounding is not supported') ||
      msg.includes('cannot be used together'))
  ) {
    return 'unsupported_combination';
  }

  if (status === 400 || msg.includes('invalid_argument') || msg.includes('bad request')) {
    return 'bad_request';
  }

  if (
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    msg.includes('503') ||
    msg.includes('500') ||
    msg.includes('overloaded') ||
    msg.includes('internal error') ||
    msg.includes('unavailable')
  ) {
    return 'server';
  }

  if (
    msg.includes('network') ||
    msg.includes('failed to fetch') ||
    msg.includes('econnreset') ||
    msg.includes('timeout')
  ) {
    return 'network';
  }

  return 'unknown';
};

export const isRetryableClassification = (kind: ErrorClassification): boolean =>
  kind === 'rate_limit' || kind === 'server' || kind === 'network';

export const isModelFallbackEligible = (error: unknown): boolean => {
  const kind = classifyError(error);
  if (kind === 'invalid_api_key' || kind === 'safety_block') return false;
  if (
    kind === 'model_unavailable' ||
    kind === 'unsupported_combination' ||
    kind === 'bad_request' ||
    kind === 'quota_exhausted' ||
    kind === 'rate_limit'
  ) {
    return true;
  }
  const msg = String((error as any)?.message || error || '').toLowerCase();
  return (
    msg.includes('model') ||
    msg.includes('not found') ||
    msg.includes('not supported') ||
    msg.includes('permission') ||
    msg.includes('invalid argument') ||
    msg.includes('quota') ||
    msg.includes('limit: 0')
  );
};

export const toFriendlyLLMError = (error: unknown): LLMError => {
  if (error instanceof LLMError) return error;
  const kind = classifyError(error);
  const errObj = error as Record<string, unknown> | undefined;
  const status = Number(errObj?.status || errObj?.code || 0) || undefined;
  const rawMsg = error instanceof Error ? error.message : String(error || 'Unknown error');

  switch (kind) {
    case 'invalid_api_key':
      return new LLMError(
        'Invalid Gemini API key. Please open Settings and paste a valid key from Google AI Studio.',
        kind,
        status,
        error
      );
    case 'quota_exhausted':
      return new LLMError(
        'API quota exhausted for this key. Please check your plan/billing or try another key in Settings.',
        kind,
        status,
        error
      );
    case 'safety_block':
      return new LLMError(
        "We couldn't generate this content as phrased due to safety filters. Try rephrasing sensitive details.",
        kind,
        status,
        error
      );
    case 'rate_limit':
      return new LLMError(
        'Rate limit reached. Please wait a few seconds and try again.',
        kind,
        status,
        error
      );
    default:
      return new LLMError(rawMsg, kind, status, error);
  }
};
