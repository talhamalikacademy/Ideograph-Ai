import { createGeminiClient } from "../llm";

export const generateVisualPreview = async (
  prompt: string,
  apiKey?: string,
  signal?: AbortSignal
): Promise<string> => {
  const client = createGeminiClient(apiKey);
  const { dataUrl } = await client.generateImage({
    task: 'imageFast',
    prompt,
    signal
  });
  return dataUrl;
};

export const editGeneratedImage = async (
  base64Image: string,
  prompt: string,
  apiKey?: string,
  signal?: AbortSignal
): Promise<string> => {
  const client = createGeminiClient(apiKey);
  const { dataUrl } = await client.editImage({
    task: 'imageFast',
    base64Image,
    prompt,
    signal
  });
  return dataUrl;
};

export const VERTICAL_SAFE_ZONE_PROMPT_RULE =
  "Vertical 9:16 mobile framing, primary subject centered in the middle third of the frame, clean uncluttered negative space in the top 15% and bottom 25% to leave safe zones for mobile captions and Shorts UI overlays.";

export const generateVerticalVisualPreview = async (
  prompt: string,
  apiKey?: string,
  signal?: AbortSignal
): Promise<string> => {
  const client = createGeminiClient(apiKey);
  const fullVerticalPrompt = `${prompt.trim()}. ${VERTICAL_SAFE_ZONE_PROMPT_RULE}`;
  const { dataUrl } = await client.generateImage({
    task: 'imageFast',
    prompt: fullVerticalPrompt,
    aspectRatio: '9:16',
    signal
  });
  return dataUrl;
};

