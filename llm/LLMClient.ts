import { Schema, Part } from "@google/genai";
import { TaskModelCategory } from "./modelRouter";

export interface TextCall {
  task?: TaskModelCategory;
  model?: string;
  systemInstruction?: string;
  prompt: string | Part[];
  temperature?: number;
  maxOutputTokens?: number;
  signal?: AbortSignal;
}

export interface JsonCall<T> extends TextCall {
  schema: Schema;
  schemaName?: string;
}

export interface GroundedCall {
  task?: TaskModelCategory;
  model?: string;
  systemInstruction?: string;
  prompt: string;
  signal?: AbortSignal;
}

export interface GroundedSource {
  uri: string;
  title: string;
}

export interface GroundedResult {
  text: string;
  sources: GroundedSource[];
}

export interface ImageCall {
  task?: 'imageFast' | 'imageHQ';
  model?: string;
  prompt: string;
  aspectRatio?: "16:9" | "9:16" | "1:1" | "4:3" | "3:4";
  signal?: AbortSignal;
}

export interface ImageEditCall {
  task?: 'imageFast' | 'imageHQ';
  model?: string;
  base64Image: string;
  mimeType?: string;
  prompt: string;
  signal?: AbortSignal;
}

export interface LLMClient {
  generateText(call: TextCall): Promise<{ text: string; modelUsed: string }>;
  generateJson<T>(call: JsonCall<T>): Promise<{ data: T; modelUsed: string }>;
  generateGrounded(call: GroundedCall): Promise<GroundedResult & { modelUsed: string }>;
  generateImage(call: ImageCall): Promise<{ dataUrl: string; modelUsed: string }>;
  editImage(call: ImageEditCall): Promise<{ dataUrl: string; modelUsed: string }>;
}
