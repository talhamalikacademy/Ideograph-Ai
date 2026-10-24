import { Type, Schema } from "@google/genai";
import {
  Dossier,
  FactCard,
  ScriptClaimItem,
  ClaimRiskStatus,
  EvidenceInsertionSuggestion,
  WrittenChapterResult
} from "../types";
import { getAiClient, isAbortError, cleanAndParseJSON } from "./aiClient";
import { extractCardsFromUserText } from "./sourceService";

const extractedClaimsBatchSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    claims: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          chapterNumber: { type: Type.NUMBER },
          sentenceText: {
            type: Type.STRING,
            description: "Exact sentence or clause from the script containing the factual claim."
          },
          claimSummary: {
            type: Type.STRING,
            description: "Concise summary of the checkable factual claim."
          },
          claimType: {
            type: Type.STRING,
            enum: ["number", "date", "event", "causal", "quote", "named_allegation"]
          },
          inlineCitationId: {
            type: Type.STRING,
            description: "Inline tag like F1, Q1, or B1 if present in the sentence."
          },
          involvesNamedPersonOrOrg: {
            type: Type.BOOLEAN,
            description: "True if the claim accuses or attributes controversial actions to a specific named person or company."
          },
          riskLevel: {
            type: Type.STRING,
            enum: ["high", "medium", "low"]
          }
        },
        required: [
          "chapterNumber",
          "sentenceText",
          "claimSummary",
          "claimType",
          "involvesNamedPersonOrOrg",
          "riskLevel"
        ]
      }
    }
  },
  required: ["claims"]
};

const groundedClaimCheckSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    verdicts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          claimId: { type: Type.STRING },
          status: {
            type: Type.STRING,
            enum: ["verified", "needs_source", "weak", "high_risk"]
          },
          verifiedFigureOrCorrection: { type: Type.STRING },
          sourceTitle: { type: Type.STRING },
          sourceUrl: { type: Type.STRING },
          softenedRewrite: { type: Type.STRING }
        },
        required: ["claimId", "status", "softenedRewrite"]
      }
    }
  },
  required: ["verdicts"]
};

const claimFixSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    proposedSentence: {
      type: Type.STRING,
      description: "The rewritten sentence ready to replace the original sentence in the script."
    },
    explanation: {
      type: Type.STRING,
      description: "1-sentence explanation of what was changed."
    }
  },
  required: ["proposedSentence", "explanation"]
};

const evidenceInsertionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          chapterNumber: { type: Type.NUMBER },
          chapterTitle: { type: Type.STRING },
          factId: { type: Type.STRING },
          originalParagraph: {
            type: Type.STRING,
            description: "Exact existing paragraph or sentence from the script where this evidence fits best."
          },
          proposedParagraph: {
            type: Type.STRING,
            description: "Updated paragraph weaving in the new fact and its [F#] tag naturally."
          },
          reason: {
            type: Type.STRING,
            description: "Why this new source strengthens this specific paragraph."
          }
        },
        required: ["chapterNumber", "chapterTitle", "factId", "originalParagraph", "proposedParagraph", "reason"]
      }
    }
  },
  required: ["suggestions"]
};

/**
 * Exhaustively extracts checkable claims (~3 per minute) from the script, matches against the Dossier,
 * runs grounded verification on unmatched medium/high-risk claims, and flags named persons/companies.
 */
export async function extractAndVerifyClaims(options: {
  scriptText: string;
  chapters?: WrittenChapterResult[];
  dossier?: Dossier | null;
  durationMinutes: number;
  flagNamedPersons?: boolean;
  apiKey?: string;
  onProgress?: (label: string, percent: number) => void;
  signal?: AbortSignal;
}): Promise<ScriptClaimItem[]> {
  const {
    scriptText,
    chapters = [],
    dossier,
    durationMinutes,
    flagNamedPersons = true,
    apiKey,
    onProgress,
    signal
  } = options;

  const ai = getAiClient(apiKey);
  const targetClaimsCount = Math.max(12, Math.min(95, Math.round(durationMinutes * 3)));

  onProgress?.(`Scanning script for ~${targetClaimsCount} checkable factual claims...`, 15);

  const chapterBlocks =
    chapters.length > 0
      ? chapters.map(c => `=== CHAPTER ${c.chapterNumber}: ${c.title} ===\n${c.text}`).join("\n\n")
      : scriptText;

  const extractPrompt = `
    You are a Senior Documentary Fact-Checker. Extract up to ${targetClaimsCount} checkable factual claims from this script.
    Checkable claims include:
    - Exact numbers, percentages, money figures, or rankings ("number")
    - Historical or recent dates and timelines ("date")
    - Specific documented events or policy actions ("event")
    - Cause-and-effect assertions ("causal")
    - Direct quotes or attributed statements ("quote")
    - Allegations or criticisms naming a specific person, official, or corporation ("named_allegation")

    SCRIPT TO AUDIT:
    ${chapterBlocks.slice(0, 36000)}

    Return each claim with its exact sentenceText from the script, chapterNumber, claimType, inlineCitationId (e.g. "F1", "Q1", "B1" if cited), involvesNamedPersonOrOrg boolean, and riskLevel.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: extractPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: extractedClaimsBatchSchema,
      temperature: 0.2,
      abortSignal: signal
    }
  });

  const parsed = cleanAndParseJSON(response.text || "{}") as {
    claims?: Array<{
      chapterNumber?: number;
      sentenceText?: string;
      claimSummary?: string;
      claimType?: "number" | "date" | "event" | "causal" | "quote" | "named_allegation";
      inlineCitationId?: string;
      involvesNamedPersonOrOrg?: boolean;
      riskLevel?: "high" | "medium" | "low";
    }>;
  };

  const rawClaims = parsed.claims || [];
  const dossierFacts = dossier?.facts || [];
  const dossierQuotes = dossier?.quotes || [];
  const dossierBooks = dossier?.books || [];

  onProgress?.(`Matching ${rawClaims.length} claims against your approved research dossier...`, 45);

  const initialItems: ScriptClaimItem[] = rawClaims.map((c, idx) => {
    const cleanInlineId = (c.inlineCitationId || "").replace(/[\[\]\s]/g, "");
    const sentenceMatchId = c.sentenceText?.match(/\[([FQB]\d+)\]/)?.[1];
    const lookupId = cleanInlineId || sentenceMatchId;

    let matchedFact = lookupId ? dossierFacts.find(f => f.id === lookupId) : undefined;
    const matchedQuote = lookupId ? dossierQuotes.find(q => q.id === lookupId) : undefined;
    const matchedBook = lookupId ? dossierBooks.find(b => b.id === lookupId) : undefined;

    // Fuzzy fallback match against dossier facts if no explicit tag
    if (!matchedFact && !matchedQuote && !matchedBook && c.sentenceText) {
      const sentenceLower = c.sentenceText.toLowerCase();
      matchedFact = dossierFacts.find(
        f =>
          (f.value && f.value.length > 2 && sentenceLower.includes(f.value.toLowerCase())) ||
          sentenceLower.includes(f.claim.slice(0, 28).toLowerCase())
      );
    }

    const hasDossierMatch = Boolean(matchedFact || matchedQuote || matchedBook);
    const isNamedAllegation =
      Boolean(flagNamedPersons) &&
      (Boolean(c.involvesNamedPersonOrOrg) || c.claimType === "named_allegation");

    let status: ClaimRiskStatus = "needs_source";
    if (hasDossierMatch) {
      status = "verified";
    } else if (c.riskLevel === "high" || isNamedAllegation) {
      status = "high_risk";
    } else if (c.riskLevel === "medium") {
      status = "needs_source";
    } else {
      status = "weak";
    }

    const sourceTitle =
      matchedFact?.source.title || matchedQuote?.source.title || matchedBook?.title || undefined;
    const sourceUrl = matchedFact?.source.url || matchedQuote?.source.url || undefined;

    return {
      id: `CLM-${idx + 1}`,
      chapterNumber: c.chapterNumber || 1,
      sentenceText: (c.sentenceText || "").trim(),
      claimText: (c.claimSummary || c.sentenceText || "").trim(),
      claimType: c.claimType || "event",
      status,
      editorReviewRequired: isNamedAllegation,
      matchedDossierFactId: matchedFact?.id || matchedQuote?.id || matchedBook?.id,
      verifiedReplacementFigure: matchedFact?.value,
      sourceTitle,
      sourceUrl
    };
  });

  // Step 2: Run grounded verification on up to 12 unmatched high/medium risk claims
  const unmatchedRisky = initialItems
    .filter(item => item.status !== "verified")
    .slice(0, 12);

  if (unmatchedRisky.length > 0) {
    onProgress?.(
      `Running live Google Search verification on ${unmatchedRisky.length} uncited claims...`,
      75
    );

    try {
      const verifyPrompt = `
        Use Google Search grounding to verify these ${unmatchedRisky.length} uncited documentary script claims.
        For each claimId:
        - Set status to "verified" if confirmed by credible web sources, "weak" if exaggerated/disputed, or "high_risk" if contradicted or unsubstantiated.
        - Provide verifiedFigureOrCorrection if a more accurate number/date exists.
        - Provide a safe softenedRewrite of the sentence.

        CLAIMS TO CHECK:
        ${unmatchedRisky
          .map(u => `- [${u.id}] Sentence: "${u.sentenceText}" | Claim: ${u.claimText}`)
          .join("\n")}
      `;

      const verifyRes = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: verifyPrompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.2,
          abortSignal: signal
        }
      });

      const structuredRes = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Convert this verification report into the exact JSON schema:\n\n${verifyRes.text || ""}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: groundedClaimCheckSchema,
          temperature: 0.1,
          abortSignal: signal
        }
      });

      const parsedVerdicts = cleanAndParseJSON(structuredRes.text || "{}") as {
        verdicts?: Array<{
          claimId?: string;
          status?: ClaimRiskStatus;
          verifiedFigureOrCorrection?: string;
          sourceTitle?: string;
          sourceUrl?: string;
          softenedRewrite?: string;
        }>;
      };

      const verdictMap = new Map(
        (parsedVerdicts.verdicts || []).map(v => [v.claimId || "", v])
      );

      initialItems.forEach(item => {
        const verdict = verdictMap.get(item.id);
        if (verdict) {
          if (verdict.status) item.status = verdict.status;
          if (verdict.verifiedFigureOrCorrection) {
            item.verifiedReplacementFigure = verdict.verifiedFigureOrCorrection;
          }
          if (verdict.sourceTitle) item.sourceTitle = verdict.sourceTitle;
          if (verdict.sourceUrl) item.sourceUrl = verdict.sourceUrl;
          if (verdict.softenedRewrite) item.proposedRewrite = verdict.softenedRewrite;
        }
      });
    } catch (err) {
      if (isAbortError(err)) throw err;
      console.warn("Grounded claim check fallback:", err);
    }
  }

  onProgress?.("Claim verification complete.", 100);
  return initialItems;
}

/**
 * Generates a concrete sentence diff preview for one of the 5 Claim Check fix actions:
 * 'soften' | 'replace_figure' | 'add_source' | 'remove' | 'mark_opinion'
 */
export async function generateClaimFixDiff(options: {
  claim: ScriptClaimItem;
  action: "soften" | "replace_figure" | "add_source" | "remove" | "mark_opinion";
  dossier?: Dossier | null;
  apiKey?: string;
  signal?: AbortSignal;
}): Promise<{ proposedSentence: string; explanation: string }> {
  const { claim, action, dossier, apiKey, signal } = options;

  if (action === "remove") {
    return {
      proposedSentence: "",
      explanation: "Removes this unverified sentence cleanly from the chapter."
    };
  }

  const ai = getAiClient(apiKey);
  const matchedFact =
    claim.matchedDossierFactId && dossier
      ? dossier.facts.find(f => f.id === claim.matchedDossierFactId)
      : dossier?.facts[0];

  const actionInstructions: Record<string, string> = {
    soften:
      "Soften absolute or risky wording using responsible journalistic qualifiers ('According to available estimates...', 'Analysts point out that...', 'Reports suggest...') while keeping the narrative flow natural.",
    replace_figure: `Replace the unverified figure or date with the verified figure (${
      claim.verifiedReplacementFigure ||
      matchedFact?.value ||
      matchedFact?.claim ||
      "verified official data"
    }) and cite [${matchedFact?.id || "F1"}].`,
    add_source: `Explicitly attribute this claim in the spoken narration to its source (${
      claim.sourceTitle || matchedFact?.source.title || "documented reports"
    })${matchedFact ? ` with inline tag [${matchedFact.id}]` : ""}.`,
    mark_opinion:
      "Reframe this statement clearly as an analytical perspective or interpretation ('Critics argue that...', 'From one perspective...') rather than an undisputed hard statistic."
  };

  const prompt = `
    Rewrite this single documentary script sentence according to the instruction below.
    ORIGINAL SENTENCE:
    "${claim.sentenceText}"

    INSTRUCTION (${action}):
    ${actionInstructions[action] || actionInstructions.soften}

    Keep the same language and tone as the original sentence.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: claimFixSchema,
      temperature: 0.25,
      abortSignal: signal
    }
  });

  const parsed = cleanAndParseJSON(response.text || "{}") as {
    proposedSentence?: string;
    explanation?: string;
  };

  return {
    proposedSentence: (parsed.proposedSentence || claim.sentenceText).trim(),
    explanation: parsed.explanation || `Applied '${action}' revision to sentence.`
  };
}

/**
 * Post-Script "Add Evidence" engine: Extracts FactCards from a newly uploaded/pasted source
 * AFTER the script is written, and suggests 2–4 targeted paragraph rewrites with Accept/Skip.
 */
export async function analyzeUploadedSourceForScript(options: {
  sourceTitle: string;
  sourceText: string;
  scriptText: string;
  chapters?: WrittenChapterResult[];
  existingFactCount: number;
  topic: string;
  apiKey?: string;
  signal?: AbortSignal;
}): Promise<{
  extractedFacts: FactCard[];
  suggestions: EvidenceInsertionSuggestion[];
}> {
  const {
    sourceTitle,
    sourceText,
    scriptText,
    chapters = [],
    existingFactCount,
    topic,
    apiKey,
    signal
  } = options;

  const ai = getAiClient(apiKey);

  // 1. Extract verifiable FactCards from the new source
  const extracted = await extractCardsFromUserText({
    sourceTitle,
    text: sourceText,
    origin: "user_upload",
    apiKey,
    signal
  });

  const newFacts = extracted.facts.map((f, idx) => ({
    ...f,
    id: `F${existingFactCount + idx + 1}`,
    status: "approved" as const
  }));

  if (newFacts.length === 0) {
    return { extractedFacts: [], suggestions: [] };
  }

  // 2. Find the best 2–4 paragraphs in the existing script to weave these new facts into
  const scriptContext =
    chapters.length > 0
      ? chapters.map(c => `=== CHAPTER ${c.chapterNumber}: ${c.title} ===\n${c.text}`).join("\n\n")
      : scriptText;

  const prompt = `
    A writer just uploaded a new source ("${sourceTitle}") after finishing their script on "${topic}".
    NEW VERIFIED FACTS FROM THIS SOURCE:
    ${newFacts.map(f => `- [${f.id}] ${f.claim}${f.value ? ` (${f.value})` : ""} | Snippet: "${f.snippet}"`).join("\n")}

    EXISTING SCRIPT:
    ${scriptContext.slice(0, 32000)}

    Find 2 to 4 exact paragraphs or sentences in the existing script where weaving in one of these new facts ([F#]) will make the argument stronger or replace a weaker claim.
    CRITICAL: 'originalParagraph' MUST be an exact substring from the existing script so it can be replaced cleanly on 1-click Accept.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: evidenceInsertionSchema,
      temperature: 0.25,
      abortSignal: signal
    }
  });

  const parsed = cleanAndParseJSON(response.text || "{}") as {
    suggestions?: Array<{
      chapterNumber?: number;
      chapterTitle?: string;
      factId?: string;
      originalParagraph?: string;
      proposedParagraph?: string;
      reason?: string;
    }>;
  };

  const suggestions: EvidenceInsertionSuggestion[] = (parsed.suggestions || []).map((s, idx) => {
    const matchedFact = newFacts.find(f => f.id === s.factId) || newFacts[idx % newFacts.length];
    return {
      id: `INS-${Date.now()}-${idx + 1}`,
      chapterNumber: s.chapterNumber || 1,
      chapterTitle: s.chapterTitle || `Chapter ${s.chapterNumber || 1}`,
      newFact: matchedFact,
      originalParagraph: (s.originalParagraph || "").trim(),
      proposedParagraph: (s.proposedParagraph || "").trim(),
      reason: s.reason || `Integrates verified evidence [${matchedFact.id}] from ${sourceTitle}.`,
      status: "pending"
    };
  });

  return {
    extractedFacts: newFacts,
    suggestions
  };
}
