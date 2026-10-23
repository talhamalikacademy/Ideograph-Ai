import {
  ScriptData,
  AnalysisData,
  Citation,
  TopicSuggestion,
  SimulationResult
} from "../types";
import { CREATORS } from "../constants";
import { compileCreatorVoiceCard } from "../creator-intelligence/CreatorDNA";
import {
  createGeminiClient,
  runGroundedJson,
  sanitizeCitationsFromSources
} from "../llm";
import {
  topicSuggestionSchema,
  analysisSchema,
  simulationSchema,
  citationsSchema
} from "./schemas";

export const analyzeTopicWithGemini = async (
  topic: string,
  platform: string,
  apiKey?: string,
  signal?: AbortSignal
): Promise<TopicSuggestion[]> => {
  const prompt = `
    User wants to make a video about "${topic}" for ${platform}.
    Use Google Search to find trending angles and recent news related to this topic.
    Suggest 3 refined angles likely to go viral.
  `;

  const { data } = await runGroundedJson<{ suggestions?: TopicSuggestion[] }>({
    prompt,
    schema: topicSuggestionSchema,
    apiKey,
    signal
  });

  return data.suggestions || [];
};

export const analyzeScriptWithGemini = async (
  script: ScriptData,
  apiKey?: string,
  signal?: AbortSignal
): Promise<AnalysisData> => {
  const client = createGeminiClient(apiKey);

  const creator = CREATORS.find(
    c => c.id === script.creatorId || c.name === script.creatorName
  );
  const creatorContext = creator ? compileCreatorVoiceCard(creator) : "";

  const prompt = `
    Analyze this script for viral potential, retention risks, stylistic fidelity, and factual integrity.
    ${creatorContext}
    Script: ${JSON.stringify(script.segments)}
  `;

  const { data } = await client.generateJson<AnalysisData>({
    task: 'analysis',
    prompt,
    schema: analysisSchema,
    signal
  });

  return data;
};

export const simulateAudienceResponse = async (
  script: ScriptData,
  apiKey?: string,
  signal?: AbortSignal
): Promise<SimulationResult> => {
  const client = createGeminiClient(apiKey);

  const prompt = `Simulate audience reaction for this script (${script.creatorName || "Creator"} style on "${script.topic}"). Script: ${JSON.stringify(script.segments)}`;

  const { data } = await client.generateJson<SimulationResult>({
    task: 'analysis',
    prompt,
    schema: simulationSchema,
    signal
  });

  return data;
};

export const generateEvidenceMap = async (
  script: ScriptData,
  apiKey?: string,
  signal?: AbortSignal
): Promise<Citation[]> => {
  const prompt = `
    Identify factual, statistical, historical, or scientific claims in this script about "${script.topic}" and verify them using Google Search.
    Do NOT invent or guess URLs. Only report real institutional, news, or academic sources.
    Script: ${JSON.stringify(script.segments)}
  `;

  const { data, sources } = await runGroundedJson<{ citations?: Citation[] }>({
    prompt,
    schema: citationsSchema,
    apiKey,
    signal
  });

  return sanitizeCitationsFromSources(data.citations || [], sources);
};
