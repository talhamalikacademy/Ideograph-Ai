import { MODELS } from "../config/models";
import { isModelFallbackEligible } from "./errors";

export type TaskModelCategory =
  | 'text'
  | 'script'
  | 'analysis'
  | 'grounded'
  | 'imageFast'
  | 'imageHQ'
  | 'audio';

export function getModelsForTask(task: TaskModelCategory = 'text', explicitModel?: string): string[] {
  if (explicitModel) {
    return [explicitModel, ...MODELS.text.filter(m => m !== explicitModel)];
  }
  switch (task) {
    case 'audio':
      return [...(MODELS.audio || ["gemini-3.8-flash-tts", "gemini-3.8-flash-lite-tts"])];
    case 'imageHQ':
      return [...MODELS.imageHQ];
    case 'imageFast':
      return [...MODELS.imageFast];
    case 'script':
      return [...(MODELS.script || MODELS.text)];
    case 'analysis':
      return [...(MODELS.analysis || MODELS.text)];
    case 'grounded':
    case 'text':
    default:
      return [...MODELS.text];
  }
}

export async function routeWithModelFallback<T>(
  models: string[],
  run: (model: string) => Promise<T>
): Promise<{ result: T; modelUsed: string }> {
  let lastError: unknown;
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const result = await run(model);
      return { result, modelUsed: model };
    } catch (error: unknown) {
      lastError = error;
      if (i < models.length - 1 && isModelFallbackEligible(error)) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.warn(
          `[ModelRouter] Model "${model}" unavailable or unsupported (${errMsg}). Falling back to "${models[i + 1]}"...`
        );
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}
