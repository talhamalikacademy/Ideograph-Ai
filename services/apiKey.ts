export const CUSTOM_API_KEY_STORAGE_KEY = "ideograph.custom_gemini_api_key";

const INVALID_PLACEHOLDERS = new Set([
  "",
  "undefined",
  "null",
  "false",
  "placeholder",
  "placeholder_api_key",
  "your_api_key",
  "your_gemini_api_key",
  "aizasyyourgeminikeyhere",
  "aizasyyourgeminikeyhere..."
]);

export function isValidApiKeyString(candidate?: string | null): candidate is string {
  if (typeof candidate !== "string") return false;
  const trimmed = candidate.trim();
  if (trimmed.length < 16) return false;
  if (INVALID_PLACEHOLDERS.has(trimmed.toLowerCase())) return false;
  if (/^todo|placeholder|example/i.test(trimmed)) return false;
  return true;
}

export function getStoredApiKey(): string {
  if (typeof window === "undefined") return "";
  try {
    const saved =
      window.localStorage.getItem(CUSTOM_API_KEY_STORAGE_KEY) ||
      window.localStorage.getItem("ideograph.apiKey");
    return isValidApiKeyString(saved) ? saved.trim() : "";
  } catch {
    return "";
  }
}

export function saveStoredApiKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = key.trim();
    if (!trimmed) {
      window.localStorage.removeItem(CUSTOM_API_KEY_STORAGE_KEY);
      window.localStorage.removeItem("ideograph.apiKey");
    } else {
      window.localStorage.setItem(CUSTOM_API_KEY_STORAGE_KEY, trimmed);
      window.localStorage.setItem("ideograph.apiKey", trimmed);
    }
  } catch {
    // ignore storage errors
  }
}

export function getEnvApiKey(): string | undefined {
  const processKey =
    typeof process !== "undefined"
      ? process.env?.API_KEY?.trim() || process.env?.GEMINI_API_KEY?.trim()
      : undefined;
  if (isValidApiKeyString(processKey)) {
    return processKey.trim();
  }

  const viteKey =
    typeof import.meta !== "undefined"
      ? (import.meta as any).env?.VITE_API_KEY?.trim() ||
        (import.meta as any).env?.VITE_GEMINI_API_KEY?.trim()
      : undefined;
  if (isValidApiKeyString(viteKey)) {
    return viteKey.trim();
  }

  return undefined;
}

export type ApiKeySourceStatus = "custom" | "env" | "invalid_custom" | "missing";

export function getApiKeyStatus(userKey?: string): ApiKeySourceStatus {
  const rawUser = userKey?.trim() || "";
  if (rawUser.length > 0) {
    return isValidApiKeyString(rawUser) ? "custom" : "invalid_custom";
  }
  const stored = getStoredApiKey();
  if (isValidApiKeyString(stored)) {
    return "custom";
  }
  if (getEnvApiKey()) {
    return "env";
  }
  return "missing";
}

export function resolveApiKey(userKey?: string): string {
  const trimmedUser = userKey?.trim();
  if (isValidApiKeyString(trimmedUser)) {
    return trimmedUser;
  }

  const storedKey = getStoredApiKey();
  if (isValidApiKeyString(storedKey)) {
    return storedKey;
  }

  const envKey = getEnvApiKey();
  if (isValidApiKeyString(envKey)) {
    return envKey;
  }

  throw new Error(
    "No valid Gemini API key found. Please open Settings and paste a valid Gemini API key."
  );
}

export function hasConfiguredApiKey(userKey?: string): boolean {
  try {
    return Boolean(resolveApiKey(userKey));
  } catch {
    return false;
  }
}
