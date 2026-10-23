import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import {
  LLMClient,
  TextCall,
  JsonCall,
  GroundedCall,
  GroundedResult,
  GroundedSource,
  ImageCall,
  ImageEditCall
} from "./LLMClient";
import { getModelsForTask, routeWithModelFallback } from "./modelRouter";
import { retryWithBackoff } from "./retry";
import { parseJSON, validateSchemaShape } from "./json";
import { classifyError, toFriendlyLLMError } from "./errors";
import { resolveApiKey } from "../services/apiKey";

export function extractGroundingSources(response: GenerateContentResponse): GroundedSource[] {
  const metadata = (response as unknown as {
    candidates?: Array<{
      groundingMetadata?: {
        groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
        groundingSupports?: Array<{
          segment?: { text?: string };
          groundingChunkIndices?: number[];
        }>;
      };
    }>;
  })?.candidates?.[0]?.groundingMetadata;

  const chunks = metadata?.groundingChunks || [];
  const supports = metadata?.groundingSupports || [];

  const sources: GroundedSource[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const uri = chunk?.web?.uri?.trim();
    const matchedSupport = supports.find(s =>
      Array.isArray(s.groundingChunkIndices) && s.groundingChunkIndices.includes(i)
    );
    const title =
      chunk?.web?.title?.trim() ||
      matchedSupport?.segment?.text?.trim()?.slice(0, 90) ||
      "";
    if (uri && /^https?:\/\//i.test(uri) && !seen.has(uri)) {
      seen.add(uri);
      sources.push({ uri, title });
    }
  }
  return sources;
}

export class GeminiClient implements LLMClient {
  private readonly genAI: GoogleGenAI;

  constructor(apiKey?: string) {
    const resolvedKey = resolveApiKey(apiKey);
    this.genAI = new GoogleGenAI({ apiKey: resolvedKey });
  }

  async generateText(call: TextCall): Promise<{ text: string; modelUsed: string }> {
    const models = getModelsForTask(call.task ?? 'text', call.model);
    return retryWithBackoff(
      async () => {
        const { result, modelUsed } = await routeWithModelFallback(models, model =>
          this.genAI.models.generateContent({
            model,
            contents: call.prompt,
            config: {
              ...(call.systemInstruction ? { systemInstruction: call.systemInstruction } : {}),
              ...(call.temperature !== undefined ? { temperature: call.temperature } : {}),
              ...(call.maxOutputTokens !== undefined ? { maxOutputTokens: call.maxOutputTokens } : {}),
              ...(call.signal ? { abortSignal: call.signal } : {})
            }
          })
        );
        return { text: result.text || "", modelUsed };
      },
      { retries: 3, baseDelayMs: 2000, signal: call.signal }
    );
  }

  async generateJson<T>(call: JsonCall<T>): Promise<{ data: T; modelUsed: string }> {
    const models = getModelsForTask(call.task ?? 'text', call.model);
    const effectiveMaxOutputTokens = call.maxOutputTokens ?? (call.task === 'script' ? 16384 : undefined);
    return retryWithBackoff(
      async () => {
        const { result, modelUsed } = await routeWithModelFallback(models, async model => {
          const response = await this.genAI.models.generateContent({
            model,
            contents: call.prompt,
            config: {
              ...(call.systemInstruction ? { systemInstruction: call.systemInstruction } : {}),
              responseMimeType: "application/json",
              responseSchema: call.schema,
              ...(call.temperature !== undefined ? { temperature: call.temperature } : {}),
              ...(effectiveMaxOutputTokens !== undefined ? { maxOutputTokens: effectiveMaxOutputTokens } : {}),
              ...(call.signal ? { abortSignal: call.signal } : {})
            }
          });
          const parsed = parseJSON<T>(response.text || "{}");
          const validation = validateSchemaShape(parsed, call.schema);
          if (!validation.valid) {
            // Single self-repair attempt if top-level required fields are missing
            const repairPrompt = `The previous JSON response was missing required fields: [${validation.missing.join(
              ", "
            )}]. Return a valid, complete JSON object satisfying all required schema fields.`;
            const repairedResponse = await this.genAI.models.generateContent({
              model,
              contents:
                typeof call.prompt === "string"
                  ? `${call.prompt}\n\n[SCHEMA REPAIR NOTICE]: ${repairPrompt}`
                  : [...call.prompt, { text: `\n\n[SCHEMA REPAIR NOTICE]: ${repairPrompt}` }],
              config: {
                ...(call.systemInstruction ? { systemInstruction: call.systemInstruction } : {}),
                responseMimeType: "application/json",
                responseSchema: call.schema,
                ...(call.temperature !== undefined ? { temperature: call.temperature } : {}),
                ...(effectiveMaxOutputTokens !== undefined ? { maxOutputTokens: effectiveMaxOutputTokens } : {}),
                ...(call.signal ? { abortSignal: call.signal } : {})
              }
            });
            return parseJSON<T>(repairedResponse.text || "{}");
          }
          return parsed;
        });
        return { data: result, modelUsed };
      },
      { retries: 2, baseDelayMs: 2500, signal: call.signal }
    );
  }

  async generateGrounded(call: GroundedCall): Promise<GroundedResult & { modelUsed: string }> {
    const models = getModelsForTask(call.task ?? 'grounded', call.model);
    return retryWithBackoff(
      async () => {
        const { result, modelUsed } = await routeWithModelFallback(models, model =>
          this.genAI.models.generateContent({
            model,
            contents: call.prompt,
            config: {
              ...(call.systemInstruction ? { systemInstruction: call.systemInstruction } : {}),
              tools: [{ googleSearch: {} }],
              ...(call.signal ? { abortSignal: call.signal } : {})
            }
          })
        );
        return {
          text: result.text || "",
          sources: extractGroundingSources(result),
          modelUsed
        };
      },
      { retries: 2, baseDelayMs: 2500, signal: call.signal }
    );
  }

  async generateImage(call: ImageCall): Promise<{ dataUrl: string; modelUsed: string }> {
    const models = getModelsForTask(call.task ?? 'imageFast', call.model);
    const validAspectRatios = ["16:9", "9:16", "1:1", "4:3", "3:4"];
    const ratio = call.aspectRatio && validAspectRatios.includes(call.aspectRatio) ? call.aspectRatio : undefined;

    return retryWithBackoff(
      async () => {
        const { result, modelUsed } = await routeWithModelFallback(models, async model => {
          const response = await this.genAI.models.generateContent({
            model,
            contents: { parts: [{ text: call.prompt }] },
            ...(ratio
              ? {
                  config: {
                    imageConfig: { aspectRatio: ratio },
                    ...(call.signal ? { abortSignal: call.signal } : {})
                  }
                }
              : call.signal
                ? { config: { abortSignal: call.signal } }
                : {})
          });

          const parts = response.candidates?.[0]?.content?.parts;
          if (parts) {
            for (const part of parts) {
              if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
              }
            }
          }
          throw toFriendlyLLMError(new Error("No image generated."));
        });
        return { dataUrl: result, modelUsed };
      },
      { retries: 2, baseDelayMs: 2000, signal: call.signal }
    );
  }

  async editImage(call: ImageEditCall): Promise<{ dataUrl: string; modelUsed: string }> {
    const models = getModelsForTask(call.task ?? 'imageFast', call.model);
    const cleanBase64 = call.base64Image.split(",")[1] || call.base64Image;
    const mimeType = call.mimeType || "image/png";

    return retryWithBackoff(
      async () => {
        const { result, modelUsed } = await routeWithModelFallback(models, async model => {
          const response = await this.genAI.models.generateContent({
            model,
            contents: {
              parts: [
                { inlineData: { data: cleanBase64, mimeType } },
                { text: "Generate an edited version of this image. " + call.prompt }
              ]
            },
            ...(call.signal ? { config: { abortSignal: call.signal } } : {})
          });

          const parts = response.candidates?.[0]?.content?.parts;
          if (parts) {
            for (const part of parts) {
              if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
              } else if (part.text) {
                console.warn("Model returned text instead of image:", part.text);
              }
            }
          }
          throw toFriendlyLLMError(new Error("No edited image generated. The model may have refused the request."));
        });
        return { dataUrl: result, modelUsed };
      },
      { retries: 2, baseDelayMs: 2000, signal: call.signal }
    );
  }

  /**
   * Executes a Google Search grounded call that returns structured JSON.
   * Implements the "Doubt Cleaner" Safeguard:
   * - Does NOT set `responseMimeType: "application/json"` on the `googleSearch` tool call so the API never throws a validation conflict or returns empty backticks.
   * - Instructs the model to wrap the JSON output inside ```json ... ``` blocks and extracts it via regex (`text.match(/```json\n([\s\S]*?)\n```/)` / `parseJSON`) while capturing `response.candidates[0]?.groundingMetadata`.
   * - If the raw grounded text is missing required schema fields, falls back to a schema-enforced synthesis pass while retaining the grounded URLs.
   */
  async generateGroundedJson<T>(options: {
    prompt: string | any[];
    schema?: JsonCall<T>["schema"];
    systemInstruction?: string;
    temperature?: number;
    maxOutputTokens?: number;
    signal?: AbortSignal;
  }): Promise<{ data: T; sources: GroundedSource[]; modelUsed: string }> {
    const schemaInstruction = `

[CRITICAL OUTPUT FORMAT REQUIREMENTS]:
1. Return your entire response as a valid JSON object wrapped in \`\`\`json ... \`\`\` code block.
2. The root object MUST contain:
   - "title": (string) video title
   - "segments": array of { "visual": string, "audio": string } for each scene
   - "claimsAndPapersRegistry": array of { "id": "CLAIM-1", "type": "article_claim"|"research_paper", "spokenSentenceInScript": string, "sourceTitle": string, "institutionOrJournal": string, "publicationYear": string, "deepVerificationDetails": string, "sourceUrl": string }
   - "infographicsBlueprint": array of { "id": "INFOGRAPHIC-1", "timestamp": string, "chartType": string, "onScreenTitle": string, "dataPoints": string[], "sourceCitationOnScreen": string, "editorAnimationNotes": string }
   - "scientificGlossary": array of { "term": string, "simpleDefinition": string, "usedInTimestamp": string }
3. CRITICAL: In spoken dialogue or narration, use single quotes (e.g. 'quote') for dialogue quotes to maintain strictly valid JSON strings.
4. Do NOT output any markdown table, source ledger, or commentary outside the JSON block. Output ONLY the JSON object.`;

    const groundedContents =
      typeof options.prompt === "string"
        ? `${options.prompt}${schemaInstruction}`
        : [...options.prompt, { text: schemaInstruction }];

    const models = getModelsForTask('grounded');

    return retryWithBackoff(
      async () => {
        const { result, modelUsed } = await routeWithModelFallback(models, async model => {
          const groundedRes = await this.genAI.models.generateContent({
            model,
            contents: groundedContents,
            config: {
              ...(options.systemInstruction ? { systemInstruction: options.systemInstruction } : {}),
              tools: [{ googleSearch: {} }],
              ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
              ...(options.maxOutputTokens !== undefined ? { maxOutputTokens: options.maxOutputTokens } : {}),
              ...(options.signal ? { abortSignal: options.signal } : {})
            }
          });

          const sources = extractGroundingSources(groundedRes);
          const rawText = groundedRes.text || "";

          // Fast-path: parse JSON directly from the grounded response
          try {
            const parsed = parseJSON<T>(rawText);
            const validation = validateSchemaShape(parsed, options.schema);
            if (validation.valid) {
              return { data: parsed, sources };
            }
          } catch (parseErr) {
            console.warn("[GeminiClient] Grounded first-pass parse failed, synthesizing schema:", parseErr);
          }

          // Step 2 Fallback: Structure grounded findings into strict JSON schema while preserving grounded sources
          const synthesisPrompt = `
You are converting the following researched documentary findings into our strict JSON schema.

[VERIFIED WEB SEARCH FINDINGS]
${rawText.slice(0, 15000)}

[GROUNDED SOURCES]
${sources.map((s, idx) => `${idx + 1}. ${s.title} — ${s.uri}`).join("\n")}

Format this completely into the requested JSON schema with title, segments, claimsAndPapersRegistry, infographicsBlueprint, and scientificGlossary.`;

          const synthesisContents =
            typeof options.prompt === "string"
              ? `${options.prompt}\n\n${synthesisPrompt}`
              : [...options.prompt, { text: synthesisPrompt }];

          const jsonRes = await this.genAI.models.generateContent({
            model,
            contents: synthesisContents,
            config: {
              ...(options.systemInstruction ? { systemInstruction: options.systemInstruction } : {}),
              responseMimeType: "application/json",
              ...(options.schema ? { responseSchema: options.schema } : {}),
              ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
              ...(options.maxOutputTokens !== undefined ? { maxOutputTokens: options.maxOutputTokens } : {}),
              ...(options.signal ? { abortSignal: options.signal } : {})
            }
          });

          return {
            data: parseJSON<T>(jsonRes.text || "{}"),
            sources
          };
        });

        return {
          data: result.data,
          sources: result.sources,
          modelUsed
        };
      },
      { retries: 1, baseDelayMs: 1500, signal: options.signal }
    );
  }

  /**
   * Synthesizes WAV speech audio using Gemini TTS (`gemini-2.5-flash-preview-tts`).
   * Automatically wraps raw 16-bit 24kHz mono PCM audio (`audio/L16` / `audio/pcm`) in a standard
   * 44-byte RIFF/WAVE header so browser `<audio>` elements and `.wav` downloads work natively.
   */
  async generateSpeech(options: {
    text: string;
    voiceName?: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' | string;
    styleDirection?: string;
    signal?: AbortSignal;
  }): Promise<{ audioDataUrl: string; base64Audio: string; mimeType: string; modelUsed: string }> {
    const models = getModelsForTask('audio');
    const selectedVoice = options.voiceName || 'Kore';
    const promptText = options.styleDirection
      ? `Say in a ${options.styleDirection} tone: ${options.text}`
      : options.text;

    return retryWithBackoff(
      async () => {
        const { result, modelUsed } = await routeWithModelFallback(models, async model => {
          const response = await this.genAI.models.generateContent({
            model,
            contents: [
              {
                role: "user",
                parts: [{ text: promptText }]
              }
            ],
            config: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: selectedVoice }
                }
              },
              ...(options.signal ? { abortSignal: options.signal } : {})
            }
          });

          const parts = response.candidates?.[0]?.content?.parts;
          if (parts) {
            for (const part of parts) {
              if (part.inlineData && part.inlineData.data) {
                const rawMime = (part.inlineData.mimeType || "").toLowerCase();
                const isRawPcm =
                  rawMime.includes("l16") ||
                  rawMime.includes("pcm") ||
                  !rawMime.includes("wav");
                const wavBase64 = isRawPcm
                  ? wrapPcm16InWavHeaderBase64(part.inlineData.data, 24000)
                  : part.inlineData.data;
                return {
                  base64Audio: wavBase64,
                  mimeType: "audio/wav",
                  audioDataUrl: `data:audio/wav;base64,${wavBase64}`
                };
              }
            }
          }
          throw toFriendlyLLMError(new Error("No audio generated by Gemini TTS."));
        });

        return {
          ...result,
          modelUsed
        };
      },
      { retries: 2, baseDelayMs: 2000, signal: options.signal }
    );
  }
}

/**
 * Prepends a standard 44-byte RIFF/WAVE header (16-bit mono PCM at 24kHz) to raw PCM base64 bytes.
 */
function wrapPcm16InWavHeaderBase64(pcmBase64: string, sampleRate: number = 24000): string {
  try {
    const binaryStr =
      typeof atob === "function"
        ? atob(pcmBase64)
        : Buffer.from(pcmBase64, "base64").toString("binary");
    const pcmLen = binaryStr.length;
    if (
      pcmLen >= 4 &&
      binaryStr.charCodeAt(0) === 0x52 && // 'R'
      binaryStr.charCodeAt(1) === 0x49 && // 'I'
      binaryStr.charCodeAt(2) === 0x46 && // 'F'
      binaryStr.charCodeAt(3) === 0x46    // 'F'
    ) {
      return pcmBase64;
    }

    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const wavBuffer = new ArrayBuffer(44 + pcmLen);
    const view = new DataView(wavBuffer);

    const writeAscii = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeAscii(0, "RIFF");
    view.setUint32(4, 36 + pcmLen, true);
    writeAscii(8, "WAVE");
    writeAscii(12, "fmt ");
    view.setUint32(16, 16, true); // PCM chunk size
    view.setUint16(20, 1, true);  // AudioFormat = 1 (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeAscii(36, "data");
    view.setUint32(40, pcmLen, true);

    const wavBytes = new Uint8Array(wavBuffer);
    for (let i = 0; i < pcmLen; i++) {
      wavBytes[44 + i] = binaryStr.charCodeAt(i);
    }

    if (typeof btoa === "function") {
      let outBin = "";
      const chunkSize = 0x8000;
      for (let i = 0; i < wavBytes.length; i += chunkSize) {
        outBin += String.fromCharCode.apply(
          null,
          Array.from(wavBytes.subarray(i, i + chunkSize))
        );
      }
      return btoa(outBin);
    }
    return Buffer.from(wavBytes).toString("base64");
  } catch {
    return pcmBase64;
  }
}

export function createGeminiClient(apiKey?: string): GeminiClient {
  return new GeminiClient(apiKey);
}

