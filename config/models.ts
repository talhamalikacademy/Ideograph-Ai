import {
  type ErrorClassification,
  classifyError,
  isModelFallbackEligible
} from "../llm/errors";

export type { ErrorClassification };
export { classifyError, isModelFallbackEligible };

export const MODELS = {
  text: ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-flash-latest"],
  script: ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-flash-latest"],
  analysis: ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-flash-latest"],
  imageHQ: [
    "gemini-nano-banana-2.1",
    "gemini-3.1-flash-lite-image",
    "gemini-2.5-flash-image",
    "gemini-3-pro-image",
    "gemini-3-pro-image-preview"
  ],
  imageFast: [
    "gemini-3.1-flash-lite-image",
    "gemini-2.5-flash-image",
    "gemini-nano-banana-2.1",
    "gemini-3-pro-image-preview"
  ],
  audio: [
    "gemini-3.8-flash-tts",
    "gemini-3.8-flash-lite-tts",
    "gemini-2.5-flash-preview-tts"
  ]
};

export const FAST_MODEL = MODELS.text[0] || "gemini-3-flash-preview";
export const STRONG_MODEL = MODELS.script[0] || "gemini-3-flash-preview";


export async function callWithModelFallback<T>(
  models: string[],
  run: (model: string) => Promise<T>
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      return await run(model);
    } catch (error: unknown) {
      lastError = error;
      if (i < models.length - 1 && isModelFallbackEligible(error)) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.warn(
          `[ModelFallback] Model "${model}" unavailable or unsupported (${errMsg}). Falling back to "${models[i + 1]}"...`
        );
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}
