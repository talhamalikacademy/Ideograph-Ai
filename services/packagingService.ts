import {
  CreatorProfile,
  ScriptData,
  HookOption,
  DirectorPlan,
  ExperimentVariant,
  YoutubeTitle
} from "../types";
import { ThumbnailEngine } from "../creator-intelligence/ThumbnailEngine";
import { compileCreatorVoiceCard } from "../creator-intelligence/CreatorDNA";
import { createGeminiClient } from "../llm";
import {
  viralTitlesSchema,
  hooksSchema,
  directorPlanSchema,
  experimentVariantsSchema
} from "./schemas";
import {
  executePreGenerationRules,
  getHookCalibrationDirective,
  sanitizeCreatorVocabulary
} from "./preGenerationRules";

export const generateViralTitles = async (
  script: ScriptData,
  creator: CreatorProfile,
  languageMode: string,
  apiKey?: string,
  signal?: AbortSignal
): Promise<YoutubeTitle[]> => {
  const client = createGeminiClient(apiKey);
  const voiceCard = compileCreatorVoiceCard(creator);
  const preGenRules = executePreGenerationRules({
    creator,
    targetLanguage: languageMode
  });

  const prompt = `
    ${preGenRules}

    Generate 10 high-CTR video titles and matching 2-4 word thumbnail text overlays for a video about "${script.topic}".

    ${voiceCard}

    Script Opening Context: "${script.segments[0]?.audio?.substring(0, 180) || script.title || script.topic}"
    
    LANGUAGE REQUIREMENT: ${languageMode}
    - If 'Hinglish', mix conversational Hindi/Urdu hooks with sharp English keywords in Latin script.
    - If 'Urdu/Hindi', use authentic high-impact phrasing for viral reach.
    
    CRITICAL STYLE alignment:
    - Titles MUST reflect ${creator.name}'s archetype (${creator.bio.archetype}), hookStyle (${creator.bio.structure.hookStyle}), and contentGoal (${creator.bio.philosophy.contentGoal}).
    - Respect ${creator.name}'s forbiddenPatterns (e.g., if the creator forbids juvenile clickbait screaming, use investigative curiosity gaps or stark paradoxes instead).
  `;

  const { data } = await client.generateJson<{ titles?: YoutubeTitle[] }>({
    task: 'text',
    prompt,
    schema: viralTitlesSchema,
    temperature: 0.85,
    signal
  });

  return (data.titles || []).map(t => ({
    ...t,
    title: sanitizeCreatorVocabulary(t.title, creator),
    thumbnailText: t.thumbnailText
      ? sanitizeCreatorVocabulary(t.thumbnailText, creator)
      : t.thumbnailText
  }));
};

export const generateThumbnail = async (
  script: ScriptData,
  creator: CreatorProfile,
  textOverlay: string,
  languageMode: string,
  aspectRatio: string,
  apiKey?: string,
  signal?: AbortSignal
): Promise<string> => {
  const client = createGeminiClient(apiKey);

  const imagePrompt = ThumbnailEngine.constructPrompt(
    creator,
    script.topic,
    textOverlay,
    languageMode,
    aspectRatio
  );

  const validAspectRatios = ["16:9", "9:16", "1:1", "4:3", "3:4"] as const;
  const ratio = (validAspectRatios as readonly string[]).includes(aspectRatio)
    ? (aspectRatio as (typeof validAspectRatios)[number])
    : "16:9";

  const { dataUrl } = await client.generateImage({
    task: 'imageHQ',
    prompt: imagePrompt,
    aspectRatio: ratio,
    signal
  });

  return dataUrl;
};

export const generateViralHooksWithGemini = async (
  script: ScriptData,
  creator: CreatorProfile,
  apiKey?: string,
  signal?: AbortSignal
): Promise<HookOption[]> => {
  const client = createGeminiClient(apiKey);
  const voiceCard = compileCreatorVoiceCard(creator);
  const preGenRules = executePreGenerationRules({
    creator,
    targetLanguage: script.language
  });
  const hookCalibration = getHookCalibrationDirective(
    creator,
    script.duration || "5 Minutes (Standard)",
    script.language || "English",
    script.topic
  );

  const prompt = `
    ${preGenRules}

    ${hookCalibration}

    Generate 3 distinct, 10/10 high-retention viral hook options for this script on "${script.topic}" strictly tailored to ${creator.name}'s persona:
    - Hook Option 1 (Visceral Declarative Fact + Inverse Contrast Framing — True "Dark Side of ChatGPT" Style): Open at [00:00] with a high-stakes statement of fact + "Jitna zyada [X]... utni hi kam [Y]" contrast frame -> Immediate Proof Pivot ("Aur dosto, yeh baat main apni taraf se hawa mein nahi keh raha—MIT aur Microsoft ki latest research studies mein...") -> 3 everyday actions outsourced -> Evidence-Medium Roadmap ("Aaiye aaj ki is video mein poori scientific research ke saath iske peeche ki science ko step-by-step samajhte hain.").
    - Hook Option 2 (Hyper-Specific Dated Incident / Case-File Anchor): Dated scene or experiment ("MIT Media Lab ke researchers ne participants ko 3 groups mein divide kar ke EEG brain scan kiya...") + shocking finding + Authority Trigger + Evidence-Medium Roadmap.
    - Hook Option 3 (Counter-Intuitive Paradox + Pattern Interrupt): Sharp contrast statement challenging a popular belief + 3 concrete everyday habits + Research Warning + Step-by-Step Science Roadmap.

    ${voiceCard}

    Current Opening Segments: ${JSON.stringify(script.segments.slice(0, 2))}

    REQUIREMENTS:
    - Every hook option MUST obey ${creator.name}'s Hook Style (${creator.bio.structure.hookStyle}), Hook Rules, and the Layer-2 Forensic Hook Architecture Matrix above.
    - NEVER open with a weak morning-show question ("Kya aap ne note kiya hai...") or domestic laziness complaints ("thakne laga hai", "zara sach batayein", "susti", "kaahil").
    - Never end a hook with a flat "آئیے اسے سمجھتے ہیں / Aaiye isay samajhte hain"—always attach the evidence medium (scientific research, neuroscience, data).
    - Never use formal textbook words like "مستقل طور پر / mustaqil taur par" (use "ہمیشہ کے لیے / permanently").
    - Provide concrete Visual and Audio lines for each hook option.
  `;

  const { data } = await client.generateJson<{ hooks?: HookOption[] }>({
    task: 'text',
    prompt,
    schema: hooksSchema,
    signal
  });

  return (data.hooks || []).map(h => ({
    ...h,
    visual: sanitizeCreatorVocabulary(h.visual || "", creator),
    audio: sanitizeCreatorVocabulary(h.audio || "", creator)
  }));
};

export const generateDirectorPlan = async (
  script: ScriptData,
  apiKey?: string,
  signal?: AbortSignal
): Promise<DirectorPlan> => {
  const client = createGeminiClient(apiKey);

  const prompt = `Create a director's production plan for this script (${script.creatorName || "Creator"} style). Script: ${JSON.stringify(script.segments)}`;

  const { data } = await client.generateJson<DirectorPlan>({
    task: 'analysis',
    prompt,
    schema: directorPlanSchema,
    signal
  });

  return data;
};

export const generateExperimentVariants = async (
  script: ScriptData,
  creator: CreatorProfile,
  apiKey?: string,
  signal?: AbortSignal
): Promise<ExperimentVariant[]> => {
  const client = createGeminiClient(apiKey);
  const voiceCard = compileCreatorVoiceCard(creator);
  const preGenRules = executePreGenerationRules({
    creator,
    targetLanguage: script.language
  });

  const prompt = `
    ${preGenRules}

    Propose 3 high-impact A/B testing variants (Hook A/B, Tone Shift, Pacing/Structure) for this script while staying 100% faithful to ${creator.name}'s Creator DNA.

    ${voiceCard}

    Script: ${JSON.stringify(script.segments)}

    Ensure each variant tests a distinct angle allowable within ${creator.name}'s hookStyle (${creator.bio.structure.hookStyle}), emotionalRange (${creator.bio.voice.emotionalRange}), and research methodology (${creator.bio.research.methodology}).
  `;

  const { data } = await client.generateJson<{ variants?: ExperimentVariant[] }>({
    task: 'analysis',
    prompt,
    schema: experimentVariantsSchema,
    signal
  });

  return data.variants || [];
};
