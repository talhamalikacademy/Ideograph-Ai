import {
  AnalysisData,
  CreatorProfile,
  CreatorBio,
  CreatorResearchConfig,
  ScriptData,
  Template,
  TypographyConfig
} from "./types";
import {
  DHRUV_DEEP_DNA,
  buildDhruvDeepPrompt,
  detectDhruvGenre,
  buildPromotionInstruction
} from "./creators/dhruv";
import { NITISH_BIO } from "./creators/nitish";
import { THYNKWHY_BIO } from "./creators/thynkwhy";
import { MRBEAST_BIO } from "./creators/mrbeast";
import { NAVAL_BIO } from "./creators/naval";
import { RAFTARTV_BIO as RAFTAR_BIO } from "./creators/raftar";
import { HORMOZI_BIO } from "./creators/hormozi";
import { PETERSON_BIO } from "./creators/peterson";
import { VERITASIUM_BIO } from "./creators/veritasium";
import { IMAN_BIO } from "./creators/iman";
import { SHARAN_BIO } from "./creators/sharan";
import { lockCreatorProfiles } from "./creator-intelligence/CreatorIntegrityGuard";

export const DHRUV_RESEARCH_CONFIG: CreatorResearchConfig = {
  requiresLiveResearch: true,
  citationStyle: "explicit-verbal-and-visual",
  domainLexiconEnforcement:
    "Automatically inject high-density, authentic domain terminology based on the topic (e.g., for Biology/Science: cytokine storm, mitochondrial biogenesis, epigenetic methylation, quantum decoherence, homeostasis, neuroplasticity, telomere attrition, cellular senescence, enzymatic catalysis; for Economics/Policy: fiscal multiplier, sovereign yield curve, Gini coefficient, statutory audit) while immediately bridging each technical term in simple layperson terms ('In simple words, think of it like...').",
  scalingRules: {
    short1Min: {
      minClaims: 1,
      maxClaims: 2,
      minInfographics: 1,
      visualAssets: "1 Verified Fact + 1 Physical Analogy",
      vocabularyDensity: "Accessible, fast-paced, zero fluff"
    },
    standard5Min: {
      minClaims: 4,
      maxClaims: 5,
      minInfographics: 2,
      visualAssets: "2–3 Data Callouts + Domain Terminology",
      vocabularyDensity: "High-density technical/scientific terms explained simply"
    },
    deep20Min: {
      minPapers: 5,
      maxPapers: 6,
      minInfographics: 4,
      visualAssets: "Infographic Blueprints (charts/graphs data) + Primary Source Quotes + Chapter Breakdown",
      vocabularyDensity: "Investigative, peer-reviewed depth, multi-angle analysis"
    }
  }
};

export const CREATOR_RESEARCH_CONFIGS: Record<string, CreatorResearchConfig> = {
  dhruvrathee: DHRUV_RESEARCH_CONFIG,
  nitishrajput: {
    ...DHRUV_RESEARCH_CONFIG,
    domainLexiconEnforcement:
      "Inject authentic institutional, legal, constitutional, and socioeconomic terminology (e.g., CAG audit, FIR, parliamentary standing committee, agrarian distress, structural incentive) paired with ground-level citizen impact."
  },
  veritasium: {
    ...DHRUV_RESEARCH_CONFIG,
    domainLexiconEnforcement:
      "Inject rigorous physics, mathematics, engineering, and biological nomenclature (e.g., quantum decoherence, entropy gradient, stochastic resonance, cellular senescence) paired with physical intuition and experimental mechanisms."
  },
  raftar: {
    ...DHRUV_RESEARCH_CONFIG,
    domainLexiconEnforcement:
      "Inject archival historical, constitutional, geopolitical, and investigative terminology paired with dated timeline records and human-scale context."
  },
  thynkwhy: {
    ...DHRUV_RESEARCH_CONFIG,
    domainLexiconEnforcement:
      "AVOID dry clinical laboratory/science jargon. Instead, use ThynkWhy's (Muazzam Shah) signature rhythmic, matching, and parallel clauses (ہم قافیہ و ہم آہنگ جملے — e.g., 'کہانیاں سنا کر زمانہ بدلنے آیا ہے، معاشرے کی منفی سوچ کو مثبت سوچ سے بدلنے آیا ہے', 'مگر آج یہ مقصد کہیں کھو گیا ہے، زندگی کا مقصد سو گیا ہے', 'بات ہوگی ڈنکے کی چوٹ پر... مقصد درد پہنچانا نہیں بلکہ درد پر مرہم رکھنا اور معاشرہ سنوارنا ہے'), poetic historical/moral parables (تمثیلی آغاز), grounded brotherly spoken connectors ('بڑا بھائی', 'سینہ بہ سینہ', 'کیوں کی کھوج / Unraveling the Why'), and deep philosophical/sociological self-accountability (خود احتسابی)."
  }
};

export const DHRUV_BIO: CreatorBio = {
  id: "dhruvrathee",
  name: "Dhruv Rathee",
  handle: "@dhruvrathee",
  avatarUrl:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIuCrKHopxlL2nLjGmU3fEqc4X1BSfUBf_8HNoPngo7yMBiquO8SIdg7g4&s=10",
  archetype: "The Rational Educator & Investigative Documentary Guide",
  tagline: "Complex Topics Made Understandable Through Stories, Evidence and Context",
  color: "blue-500",
  hex: "#3b82f6",
  philosophy: {
    coreBeliefs: [
      "Curiosity before conclusion: begin with a meaningful question or dated scene, then earn the answer through step-by-step explanation and evidence.",
      "Every strong claim is tied to a named source in the SAME sentence, then the source is shown on screen.",
      "Explain the mechanism: do not stop at what happened; explain how it happened and why it matters using everyday analogies.",
      "Numbers are followed by a human-scale comparison within 1–2 sentences.",
      "Mock claims, tactics, and institutional failures only—never mock victims, faith itself, or anyone for who they are."
    ],
    contentGoal:
      "Transform complex geopolitics, science, history, and investigative scandals into high-retention, evidence-backed documentaries."
  },
  voice: {
    tone: "Calm, rational, investigative, curious, and articulate educator.",
    pacing: DHRUV_DEEP_DNA.findings.sentenceRhythm,
    emotionalRange: DHRUV_DEEP_DNA.humorAndTone.empathyRule,
    vocabulary: Object.values(DHRUV_DEEP_DNA.hinglishLexicon)
      .flat()
      .map(item => `${item.en} (${item.hinglish})`),
    signaturePhrases: Object.values(DHRUV_DEEP_DNA.hinglishLexicon)
      .flat()
      .map(item => item.hinglish)
  },
  structure: {
    hookStyle: DHRUV_DEEP_DNA.hookEngine.universalSkeleton.join(" -> "),
    bodyStructure: DHRUV_DEEP_DNA.findings.structureSignature,
    closingStyle:
      "Return to the central question, state the systemic thesis and human takeaway, and end with a thought-provoking question for the comments."
  },
  research: {
    methodology: DHRUV_DEEP_DNA.sourceEngine.philosophy,
    bias: "Rational, scientific temper, pro-accountability, evidence-first.",
    preferredSources: [...DHRUV_DEEP_DNA.sourceEngine.exactnessLadder]
  },
  signaturePhrases: Object.values(DHRUV_DEEP_DNA.hinglishLexicon)
    .flat()
    .map(item => item.hinglish),
  styleCues: DHRUV_DEEP_DNA.retentionDevices.map(
    d => `${d.name} (${d.freq}): ${d.pattern}`
  ),
  hookRules: {
    use: [
      ...DHRUV_DEEP_DNA.hookEngine.universalSkeleton,
      DHRUV_DEEP_DNA.findings.greetingPlacement.rule,
      DHRUV_DEEP_DNA.hookEngine.timingBenchmarks.firstHardSourceInHook
    ],
    avoid: [
      "Never open with AI throat-clearing ('In today's fast-paced world...')",
      "Never use greeting in line 1 on urgent current-affairs scandals"
    ],
    firstLineShape: DHRUV_DEEP_DNA.hookEngine.universalSkeleton[0]
  },
  workflow: {
    stages: [
      {
        name: "1. Cold Open / Incident or Poll Hook & Roadmap",
        purpose: DHRUV_DEEP_DNA.hookEngine.universalSkeleton.join(" "),
        sharePct: 15,
        rules: [
          DHRUV_DEEP_DNA.findings.greetingPlacement.rule,
          DHRUV_DEEP_DNA.hookEngine.timingBenchmarks.firstHardSourceInHook
        ]
      },
      {
        name: "2. Context, History & Chain of Facts",
        purpose: "Lay out the verifiable timeline, documents, or historical shift with named sources.",
        sharePct: 30,
        rules: [
          DHRUV_DEEP_DNA.sourceEngine.philosophy,
          DHRUV_DEEP_DNA.sourceEngine.density.wordsRule
        ]
      },
      {
        name: "3. Mechanism Decode & Everyday Analogy",
        purpose: "Explain how the system, science, or scandal works using simple everyday analogies and visual callouts.",
        sharePct: 25,
        rules: [
          DHRUV_DEEP_DNA.sourceEngine.visualPairing,
          DHRUV_DEEP_DNA.sourceEngine.density.numbers
        ]
      },
      {
        name: "4. Pre-empted Objections & Multi-Angle Evidence",
        purpose: "Address counter-arguments fairly and test them against data, court records, or peer-reviewed studies.",
        sharePct: 15,
        rules: [
          "Pre-empt objections out loud ('You might be thinking... but wait a minute')",
          DHRUV_DEEP_DNA.humorAndTone.empathyRule
        ]
      },
      {
        name: "5. Systemic Thesis, Human Takeaway & Open Question",
        purpose: "Connect the facts into a clear pattern ('Do you see the pattern here?') and close with an open question.",
        sharePct: 15,
        rules: [
          DHRUV_DEEP_DNA.findings.structureSignature,
          DHRUV_DEEP_DNA.humorAndTone.neverMock
        ]
      }
    ],
    durationOverrides: {
      "30 Seconds (Fast)": [
        "1. ≤5s Dated Incident or Surprising Stat Hook (no greeting)",
        "2. 2-Point Evidence & Plain-Language Analogy Breakdown",
        "3. Pattern Question Close"
      ],
      "60 Seconds (Shorts)": [
        "1. ≤8s Genre Opening Shape + Central Question (skip teaser montage & greeting)",
        "2. Named Source Proof + Everyday Analogy Mechanism",
        "3. Systemic Takeaway & Audience Question"
      ]
    }
  },
  closingRules: {
    use: [
      DHRUV_DEEP_DNA.findings.structureSignature,
      DHRUV_DEEP_DNA.findings.seriesHabit,
      "End on a systemic thesis + human takeaway + open question for comments"
    ],
    avoid: [
      "Never end with robotic AI summaries ('In conclusion', 'To sum up')",
      "Never beg for likes or shares with hype shouting"
    ]
  },
  evidenceRules: {
    mustCite: true,
    citeStyle: DHRUV_DEEP_DNA.sourceEngine.philosophy,
    sourcePriority: [...DHRUV_DEEP_DNA.sourceEngine.exactnessLadder]
  },
  languageRules: {
    defaultMix: DHRUV_DEEP_DNA.hinglishRules.mix,
    urduHindiNotes: `${DHRUV_DEEP_DNA.hinglishRules.units} Avoid: ${DHRUV_DEEP_DNA.hinglishRules.avoid.join("; ")}`
  },
  forbiddenPatterns: [...DHRUV_DEEP_DNA.forbidden],
  autoMatch: {
    bestFor: Object.values(DHRUV_DEEP_DNA.hookEngine.genres).map(g => g.label),
    notFor: ["Giveaway stunts or pranks", "B2B cold-calling sales scripts"],
    keywords: [
      "explained", "scam", "history", "science", "geopolitics", "policy", "court",
      "investigation", "mystery", "data", "report", "dictatorship", "democracy", "climate", "ai"
    ]
  },
  blendRole: {
    asSecondaryContribute: [
      "Step-by-step mechanism explanation with everyday analogies",
      "Same-sentence source attribution and on-screen evidence callouts",
      "Calm, rational educator cadence with 'Zara sochiye' / 'Think about it' pause beats"
    ],
    asSecondaryNever: [
      "Never override the primary creator's language setting",
      "Never inject slow documentary montages into ultra-short formats"
    ]
  },
  deepGenreEngine: {
    genreBlueprints: Object.fromEntries(
      Object.entries(DHRUV_DEEP_DNA.hookEngine.genres).map(([key, g]) => [
        key,
        {
          label: g.label,
          triggers: key.split("_"),
          stages: [g.openingShape, g.body, ...g.devices],
          reservedKeywords: [...DHRUV_DEEP_DNA.sourceEngine.attributionVerbs.strong]
        }
      ])
    ),
    schemaFewShotExamples: DHRUV_DEEP_DNA.styleExcerpts.map(ex => ({
      genre: ex.genre,
      context: `${ex.purpose} (${ex.language} Mode)`,
      visual: ex.visual,
      audio: "Documentary ambient bed with subtle transition whoosh on evidence cards.",
      narration: ex.narration
    }))
  },
  deepDNA: DHRUV_DEEP_DNA,
  researchConfig: DHRUV_RESEARCH_CONFIG
};

export const ANALYTICAL_EXPLAINER_BIO = DHRUV_BIO;
export const ANALYTICAL_EXPLAINER_DNA = DHRUV_DEEP_DNA;
export {
  DHRUV_DEEP_DNA,
  buildDhruvDeepPrompt,
  detectDhruvGenre,
  buildPromotionInstruction
};

// --- SYSTEM EXPORT (IMMUTABLE CREATOR DNA LOCK) ---
// Protected by CreatorIntegrityGuard: No AI model or runtime process may mutate /creators/* context.

const CREATOR_BIOS: CreatorBio[] = [
  DHRUV_BIO, NITISH_BIO, THYNKWHY_BIO, MRBEAST_BIO, NAVAL_BIO, RAFTAR_BIO, 
  HORMOZI_BIO, PETERSON_BIO, VERITASIUM_BIO, IMAN_BIO, SHARAN_BIO
];

export const CREATORS: CreatorProfile[] = lockCreatorProfiles(
  CREATOR_BIOS.map(bio => {
    const id = bio.name.toLowerCase().replace(/\s/g, '').replace('@', '');
    const researchConfig = bio.researchConfig || CREATOR_RESEARCH_CONFIGS[id];
    return {
      id,
      name: bio.name,
      style: bio.tagline,
      color: bio.color,
      hex: bio.hex,
      avatarUrl: bio.avatarUrl,
      bio: bio,
      ...(researchConfig ? { researchConfig } : {}),
      systemPrompt: "DYNAMIC_LOAD"
    };
  })
);

export const getCreatorAvatarFallback = (name: string, hex: string = "#6366f1"): string => {
  const initials = (name || "CR")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || "")
    .join("");
  const bg = hex.startsWith("#") ? hex : "#6366f1";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="24" fill="${bg}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Inter, system-ui, sans-serif" font-weight="700" font-size="44">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// --- APP CONSTANTS ---

export const LANGUAGES = [
  "English",
  "Urdu (Proper)",
  "Roman Urdu",
  "Urdu (Roman + Script)",
  "Hindi (Devanagari)",
  "Hinglish (Roman)",
  "Arabic",
  "French",
  "German",
  "Spanish",
  "Italian",
  "Portuguese",
  "Turkish",
  "Russian",
  "Persian (Farsi)",
  "Punjabi",
  "Bengali",
  "Indonesian",
  "Japanese",
  "Korean",
  "Chinese (Simplified)"
];

export const ARABIC_DIALECTS = [
  "Modern Standard (Fusha)",
  "Egyptian (Masri)",
  "Levantine (Shami)",
  "Gulf (Khaleeji)"
];

export const DEFAULT_TYPOGRAPHY: TypographyConfig = {
  fontFamily: 'Inter',
  fontSize: 16,
  lineHeight: 1.6,
  letterSpacing: 0
};

export const FONT_OPTIONS = [
  { label: 'Inter (Modern)', value: 'Inter' },
  { label: 'Jameel Noori (Urdu)', value: '"Jameel Noori Nastaliq"' },
  { label: 'Noto Nastaliq (Web)', value: '"Noto Nastaliq Urdu"' },
  { label: 'JetBrains Mono (Code)', value: '"JetBrains Mono"' },
  { label: 'System Serif', value: 'serif' },
  { label: 'System Sans', value: 'sans-serif' },
];

export interface DurationPacingRule {
  targetWords: string;
  minScenes: number;
  maxScenes: number;
  minWordsPerScene: number;
  minSentencesPerScene: number;
  description: string;
}

export const DURATION_PACING_MATRIX: Record<string, DurationPacingRule> = {
  "30 Seconds (Fast)": {
    targetWords: "85–110",
    minScenes: 3,
    maxScenes: 3,
    minWordsPerScene: 30,
    minSentencesPerScene: 3,
    description: "Ultra-fast punchy 3-beat sequence (85–110 spoken words in 3 scenes, 30–35 words per scene)"
  },
  "60 Seconds (Shorts)": {
    targetWords: "170–210",
    minScenes: 3,
    maxScenes: 4,
    minWordsPerScene: 45,
    minSentencesPerScene: 4,
    description: "High-retention short-form arc (170–210 spoken words in 3–4 scenes, 45–55 words per scene)"
  },
  "2 Minutes (Explainer)": {
    targetWords: "400–600",
    minScenes: 4,
    maxScenes: 6,
    minWordsPerScene: 80,
    minSentencesPerScene: 6,
    description: "Focused explainer (400–600 spoken words in 4–6 scenes, 80–100 words per scene)"
  },
  "3-5 Minutes (Standard)": {
    targetWords: "750–1,000",
    minScenes: 6,
    maxScenes: 8,
    minWordsPerScene: 110,
    minSentencesPerScene: 8,
    description: "Multi-pillar deep dive (750–1,000 spoken words in 6–8 scenes, 110–140 words per scene)"
  },
  "5 Minutes (Deep Dive)": {
    targetWords: "750–1,000",
    minScenes: 6,
    maxScenes: 8,
    minWordsPerScene: 110,
    minSentencesPerScene: 8,
    description: "Multi-pillar deep dive (750–1,000 spoken words in 6–8 scenes, 110–140 words per scene)"
  },
  "10 Minutes (Mini-Doc)": {
    targetWords: "1,800–2,000+",
    minScenes: 10,
    maxScenes: 12,
    minWordsPerScene: 170,
    minSentencesPerScene: 12,
    description: "Full chaptered mini-documentary (~2,000 words strictly across 10–12 scenes, 170–200 words per scene)"
  },
  "15-20 Minutes (Deep-Dive Documentary)": {
    targetWords: "4,000–5,000",
    minScenes: 18,
    maxScenes: 22,
    minWordsPerScene: 225,
    minSentencesPerScene: 16,
    description: "Full-length investigative documentary (4,000–5,000 spoken words across 18–22 scenes, 225–250 words per scene)"
  },
  "20 Minutes (Full Documentary)": {
    targetWords: "4,000–5,000",
    minScenes: 18,
    maxScenes: 22,
    minWordsPerScene: 225,
    minSentencesPerScene: 16,
    description: "Full-length investigative documentary (4,000–5,000 spoken words across 18–22 scenes, 225–250 words per scene)"
  },
  "Match Original Length": {
    targetWords: "Match Original Input Length (~1,000–2,000 words based on input)",
    minScenes: 6,
    maxScenes: 12,
    minWordsPerScene: 120,
    minSentencesPerScene: 8,
    description: "Preserve target length with complete narrative scene depth"
  }
};

export const DURATION_MAPPING: Record<string, { minWords: number; structure: string }> = {
  "30 Seconds (Fast)": { minWords: 100, structure: "Condensed 3-beat arc (~85–110 spoken words in 3 scenes)" },
  "60 Seconds (Shorts)": { minWords: 190, structure: "Short-form 3-act arc (~170–210 spoken words in 3–4 scenes)" },
  "2 Minutes (Explainer)": { minWords: 450, structure: "Focused explainer (~400–600 spoken words across 4–6 scenes)" },
  "5 Minutes (Deep Dive)": { minWords: 850, structure: "Multi-pillar deep dive (~750–1,000 spoken words across 6–8 scenes)" },
  "10 Minutes (Mini-Doc)": { minWords: 2000, structure: "Full chaptered mini-documentary (~1,800–2,000+ spoken words strictly across 10–12 scenes)" },
  "20 Minutes (Full Documentary)": { minWords: 4500, structure: "Full-length investigative documentary (~4,000–5,000 spoken words strictly across 18–22 scenes)" },
  "Match Original Length": { minWords: 0, structure: "Preserve the input's target length while expanding to full production scene depth" }
};

export function buildDurationDepthEnforcementInstruction(
  duration: string,
  language?: string,
  enableDualScript?: boolean
): string {
  const normDuration = (duration || "").trim() || "60 Seconds (Shorts)";
  const pacing: DurationPacingRule =
    DURATION_PACING_MATRIX[normDuration] ||
    (normDuration.includes("10")
      ? DURATION_PACING_MATRIX["10 Minutes (Mini-Doc)"]
      : normDuration.includes("20") || normDuration.includes("15")
      ? DURATION_PACING_MATRIX["20 Minutes (Full Documentary)"]
      : normDuration.includes("5") || normDuration.includes("3")
      ? DURATION_PACING_MATRIX["5 Minutes (Deep Dive)"]
      : normDuration.includes("2")
      ? DURATION_PACING_MATRIX["2 Minutes (Explainer)"]
      : normDuration.includes("30")
      ? DURATION_PACING_MATRIX["30 Seconds (Fast)"]
      : DURATION_PACING_MATRIX["60 Seconds (Shorts)"]);

  const isDualScript =
    enableDualScript || (language ? /roman\s*\+\s*script/i.test(language) : false);

  const targetWords = pacing.targetWords;
  const minScenes = pacing.minScenes;
  const maxScenes = pacing.maxScenes;
  const minWordsPerScene = pacing.minWordsPerScene;
  const minSentencesPerScene = pacing.minSentencesPerScene;

  return `
====================================================================
CRITICAL DURATION, WORD-COUNT & SCENE-DEPTH ENFORCEMENT (NON-NEGOTIABLE)
====================================================================
Selected Duration: ${normDuration}
Target Spoken Word Count: ${targetWords} words
Required Number of Scenes: ${minScenes} to ${maxScenes} scenes
Minimum Depth Per Scene: ${minWordsPerScene}+ spoken words (${minSentencesPerScene}+ sentences) inside EVERY single scene's narration!

1. NO SUMMARY / NO SKELETON SCRIPTS:
   You are writing a FULL, verbatim, broadcast-ready production script—NEVER an outline, summary, or compressed draft. For a 10-Minute script, outputting 400–600 words is a CRITICAL FAILURE. You MUST hit approximately 2,000 spoken words by fully unpacking every single scene.

2. HOW TO ACHIEVE PER-SCENE DEPTH (${minWordsPerScene}+ WORDS PER SCENE IN LONG-FORM):
   Never rush from a claim to the next scene in 3 sentences. Inside EVERY body scene, you must follow this 5-layer expansion loop:
   - Layer A (Context / Transition): 2–3 sentences setting up the sub-question or chronological moment.
   - Layer B (Primary Evidence & Source Citation): 3–4 sentences detailing the specific study, official audit, historical incident, or named news report (e.g., BBC, NYT, India Times, Nature, NASA, CAG) with concrete details.
   - Layer C (The Everyday Analogy): 3–4 sentences translating the technical mechanism or statistic into a vivid household/common-person analogy.
   - Layer D (Implication & Stakes): 2–3 sentences explaining how this directly impacts the real world or connects to the bigger mystery + a \`[Pause]\` marker.
   - Layer E (Open-Loop Bridge): 1–2 Socratic sentences pivoting into the next scene.

3. WORKFLOW STAGE MULTIPLICATION FOR LONG-FORM (10+ MINUTES):
   If a creator's workflow has 6 core stages and the duration requires 10–12 scenes, DO NOT limit the output to 6 scenes. Split large stages (like Historical Context and the 3-Pillar Deep-Dive) across multiple dedicated scenes (e.g., Scene 1: Cold Open, Scene 2: Roadmap, Scene 3: Historical Roots Part 1, Scene 4: Historical Roots Part 2, Scene 5: Pillar 1, Scene 6: Pillar 2, Scene 7: Pillar 3, Scene 8: Case Study / Turning Point, Scene 9: Systemic Impact, Scene 10: Myth vs. Reality, Scene 11: Solutions & Philosophical Zoom-Out, Scene 12: Final Socratic Sign-Off).

4. DUAL-SCRIPT / BILINGUAL MODE WORD-COUNT RULE:
   If the selected language mode outputs both Roman script and Native script side-by-side (e.g., \`Urdu (Roman + Script)\` where every sentence is followed by \`[اردو ترجمہ]\`), the \`[Native Script]\` brackets are a transliteration mirror—they DO NOT count toward the spoken duration! You must still write the full ${minSentencesPerScene}+ sentences of spoken content per scene in the primary track, and maintain 100% word-for-word vocabulary parity between the Roman words and the bracketed script.${
     isDualScript
       ? "\n   [ACTIVE SETTING: Bilingual Dual-Script mode is ENABLED. You MUST provide the full Roman spoken words + mirrored bracketed script without cutting scene length.]"
       : ""
   }

5. PACING & RHYTHM MARKERS:
   In every long-form scene, include at least one \`[Pause]\` marker after the heaviest data drop or analogy reveal, and natural \`...\` micro-pauses for suspense.
====================================================================
`.trim();
}



export const getLanguageClass = (language?: string) => {
  if (!language) return "font-sans";
  const lowerLang = language.toLowerCase();
  
  if (lowerLang === 'urdu (proper)' || lowerLang === 'urdu (nastaliq)' || lowerLang.includes('persian')) {
     return "font-jameel text-right leading-[2.5] text-xl md:text-2xl tracking-normal";
  }
  
  if (lowerLang === 'urdu (roman + script)') {
     return "font-jameel text-left leading-[2.0] text-lg md:text-xl";
  }

  if (lowerLang.includes("arabic")) {
    return "font-urdu text-right leading-[2.5] text-lg md:text-xl tracking-wide";
  }

  if (lowerLang.includes("hindi (devanagari)")) {
    return "font-sans text-left leading-[1.9] text-lg md:text-xl";
  }
  
  return "font-sans text-base leading-relaxed";
};

export const DURATIONS = [
  "Match Original Length",
  "30 Seconds (Fast)",
  "60 Seconds (Shorts)",
  "2 Minutes (Explainer)",
  "5 Minutes (Deep Dive)",
  "10 Minutes (Mini-Doc)",
  "20 Minutes (Full Documentary)"
];

export const PLATFORMS = [
  "YouTube Shorts",
  "Instagram Reels",
  "TikTok",
  "YouTube Long Form",
  "LinkedIn Video",
  "Podcast Intro"
];

export const EXPERTISE_LEVELS = ["Beginner", "Intermediate", "Expert"];

export const TRANSFORMATION_TYPES = [
  { id: 'Full Rewrite', label: 'Full Rewrite', desc: 'Complete overhaul in creator style' },
  { id: 'Hook Focus', label: 'Improve Hook Only', desc: 'Fix the first 10 seconds' },
  { id: 'Retention Optimization', label: 'Fix Retention', desc: 'Add loops & pattern interrupts' },
  { id: 'Tone Shift', label: 'Change Tone', desc: 'Make it punchy or serious' },
  { id: 'Fix Weaknesses', label: 'Auto-Fix Weakness', desc: 'Remove fluff & gaps' }
];

export const AUDIO_TONES = [
  "Neutral",
  "Energetic",
  "Serious",
  "Warm",
  "Authoritative",
  "Empathetic",
  "Sarcastic"
];

export const AUDIO_SPEEDS = [
  "Very Slow",
  "Slow",
  "Normal",
  "Fast",
  "Very Fast"
];

export const AUDIO_STYLES = [
  "Narrator",
  "Conversational",
  "Broadcast",
  "ASMR",
  "Hype",
  "Storytelling"
];

export const TEMPLATES: Template[] = [
  {
    id: 'dhruv-hidden-truth',
    title: 'Investigative Deep-Dive',
    description: 'Evidence-led explainer structure for unpacking complex topics.',
    creatorId: 'dhruvrathee',
    content: `STRUCTURAL OUTLINE FOR: [YOUR TOPIC]
1. [Cold Open Paradox] Open with a sharp question or stark observation about [YOUR TOPIC] (never greet on line 1).
2. [Greeting & Thesis] After the hook beat, welcome the audience and frame why [YOUR TOPIC] matters right now.
3. [Historical Context] Trace the timeline and root cause behind the current situation.
4. [Evidence & Comparison] Compare verified data points and international benchmarks.
5. [Citizen Takeaway] Close with a thoughtful question inviting viewers to reflect.`
  },
  {
    id: 'iman-monk-mode',
    title: 'Monk Mode Protocol',
    description: 'High-discipline focus and personal productivity framework.',
    creatorId: 'imangadzhi',
    content: `STRUCTURAL OUTLINE FOR: [YOUR TOPIC]
1. [Pattern Interrupt] Call out the everyday distraction habit holding people back on [YOUR TOPIC].
2. [Personal Pivot] Contrast unfocused busywork with a structured deep-focus protocol.
3. [Pillar 1: Environment] Eliminate low-value inputs and set clear boundaries.
4. [Pillar 2: Execution] Commit to a daily block of uninterrupted deep work.
5. [Closing Directive] Challenge the viewer to commit to a 30-day sprint.`
  },
  {
    id: 'sharan-loophole',
    title: 'Personal Finance Skit',
    description: 'Two-character conversational breakdown of a money rule.',
    creatorId: 'sharanhegde',
    content: `STRUCTURAL OUTLINE FOR: [YOUR TOPIC]
1. [Character A] Complains about a common money mistake or confusing rule in [YOUR TOPIC].
2. [Character B] Interrupts with a calm, practical financial rule that changes the math.
3. [The Breakdown] Walk through a simple example showing how the rule works step by step.
4. [The Catch] Explain the eligibility conditions or limits honestly.
5. [Closing] Quick takeaway and reminder to check official terms.`
  },
  {
    id: 'dhruv-geopolitics',
    title: 'Geopolitical Case Study',
    description: 'Structured analysis of regional strategy, history, and economics.',
    creatorId: 'dhruvrathee',
    content: `STRUCTURAL OUTLINE FOR: [YOUR TOPIC]
1. [Map Hook] Point to a specific geographical or economic paradox in [YOUR TOPIC] before any greeting.
2. [Historical Roots] Step back to the turning point that shaped this region's trajectory.
3. [Policy Catalyst] Examine the key policy decisions and institutional trade-offs.
4. [Economic & Human Impact] Break down how these macro shifts affect ordinary citizens.
5. [Conclusion] Summarize the broader lesson for global observers.`
  },
  {
    id: 'dhruv-environment',
    title: 'Sustainability Myth vs Reality',
    description: 'Lifecycle analysis comparing environmental claims against evidence.',
    creatorId: 'dhruvrathee',
    content: `STRUCTURAL OUTLINE FOR: [YOUR TOPIC]
1. [Counter-Intuitive Hook] Question a popular assumption about [YOUR TOPIC] with a concrete observation.
2. [Lifecycle Breakdown] Examine how the system works from raw material to end use.
3. [Comparative Context] Weigh short-term costs against long-term environmental trade-offs.
4. [Accountability] Distinguish genuine engineering progress from marketing claims.
5. [Constructive Solutions] Highlight practical steps supported by scientific consensus.`
  },
  {
    id: 'nitish-farmer-crisis',
    title: 'Ground-Report Documentary',
    description: 'Human-centered policy and administrative breakdown.',
    creatorId: 'nitishrajput',
    content: `STRUCTURAL OUTLINE FOR: [YOUR TOPIC]
1. [Human Hook] Start with a grounded scene showing how [YOUR TOPIC] affects an everyday citizen.
2. [Systemic Context] Contrast the stated policy goal with on-the-ground implementation.
3. [Administrative Trail] Trace how budgets, rules, and incentives flow through the system.
4. [Both Sides] Present the official rationale alongside the practical challenges reported on the ground.
5. [Closing Question] Leave the viewer with an objective question on accountability.`
  },
  {
    id: 'nitish-education',
    title: 'Skills & Employment Gap',
    description: 'Structural analysis of education and career readiness.',
    creatorId: 'nitishrajput',
    content: `STRUCTURAL OUTLINE FOR: [YOUR TOPIC]
1. [Hook] Highlight the contrast between formal credentials and real-world job requirements in [YOUR TOPIC].
2. [Curriculum vs Industry] Compare outdated syllabus patterns with modern industry skills.
3. [Student Perspective] Share the real pressures faced by graduates and families.
4. [Policy & Institutional Reform] Examine what universities and employers can change.
5. [Call to Action] Encourage practical skill-building alongside formal study.`
  },
  {
    id: 'thynkwhy-dopamine',
    title: 'The Attention Loop',
    description: 'Behavioral psychology breakdown of digital habits.',
    creatorId: 'thynkwhy',
    content: `STRUCTURAL OUTLINE FOR: [YOUR TOPIC]
1. [Everyday Glitch] Describe the relatable moment of checking a screen for one minute and losing thirty.
2. [Behavioral Mechanism] Explain how variable reward schedules keep attention hooked in [YOUR TOPIC].
3. [Cognitive Cost] Show how fragmented focus reduces deep thinking and creative energy.
4. [System Redesign] Offer three friction-based changes to restore intentional focus.
5. [Closing] End on reclaiming personal agency over your time.`
  },
  {
    id: 'thynkwhy-ai-future',
    title: 'The Synthesis Shift',
    description: 'Future-of-work perspective on technology and human judgment.',
    creatorId: 'thynkwhy',
    content: `STRUCTURAL OUTLINE FOR: [YOUR TOPIC]
1. [Paradox Hook] Frame why automation makes independent human judgment more valuable in [YOUR TOPIC].
2. [Historical Parallel] Compare previous technological transitions with today's tools.
3. [Core Skill Shift] Contrast rote execution with problem framing and synthesis.
4. [Actionable Playbook] Show how to use tools as leverage rather than a crutch.
5. [Closing] Conclude with a forward-looking principle.`
  },
  {
    id: 'mrbeast-survival',
    title: 'High-Stakes Endurance Challenge',
    description: 'Fast-paced challenge arc with escalating obstacles.',
    creatorId: 'mrbeast',
    content: `STRUCTURAL OUTLINE FOR: [YOUR TOPIC]
1. [Immediate Stake Hook] State the exact challenge, rule, and time limit for [YOUR TOPIC] in the first 5 seconds.
2. [Early Obstacle] Introduce the first unexpected constraint within 15 seconds.
3. [Midpoint Twist] Raise the difficulty or offer a tempting shortcut that tests commitment.
4. [Final Push] Build tension during the final countdown beat.
5. [Payoff] Deliver the outcome immediately with zero slow outro.`
  },
  {
    id: 'mrbeast-giveaway',
    title: 'Last To Leave Competition',
    description: 'Elimination-style competition blueprint.',
    creatorId: 'mrbeast',
    content: `STRUCTURAL OUTLINE FOR: [YOUR TOPIC]
1. [Rule & Boundary Hook] Show the boundary, the contestants, and the clear win condition for [YOUR TOPIC].
2. [Round 1 Elimination] Cut straight to the first wave of eliminations.
3. [Temptation Twist] Introduce a strategic dilemma that splits the remaining group.
4. [Endurance Phase] Time-lapse the hardest stretch and highlight top competitors.
5. [Instant Finale] Reveal the winner and wrap at peak energy.`
  },
  {
    id: 'naval-happiness',
    title: 'The Peace Equation',
    description: 'First-principles reflection on presence and desire.',
    creatorId: 'navalravikant',
    content: `STRUCTURAL OUTLINE FOR: [YOUR TOPIC]
1. [Aphorism Hook] Open with a quiet, counter-intuitive definition of [YOUR TOPIC].
2. [The Mental Contract] Explain how conditional goals postpone peace of mind.
3. [First Principle] Strip the concept down to attention, expectations, and presence.
4. [Practical Reframe] Contrast external status games with internal clarity.
5. [Closing] End with a single memorable sentence.`
  },
  {
    id: 'naval-wealth',
    title: 'Specific Knowledge & Leverage',
    description: 'Philosophical framework on compounding value.',
    creatorId: 'navalravikant',
    content: `STRUCTURAL OUTLINE FOR: [YOUR TOPIC]
1. [Distinction Hook] Separate long-term value creation from short-term status in [YOUR TOPIC].
2. [Time vs Equity] Explain why ownership and compounding matter more than linear effort.
3. [Forms of Leverage] Show how code, media, and systems scale good judgment.
4. [Specific Knowledge] Connect curiosity and authentic skill to irreplicable work.
5. [Closing] Distill the entire argument into a two-word principle.`
  },
  {
    id: 'raftar-roast',
    title: 'Hype vs Reality Critique',
    description: 'Sharp, satirical commentary dissecting exaggerated claims.',
    creatorId: 'raftar',
    content: `STRUCTURAL OUTLINE FOR: [YOUR TOPIC]
1. [Satirical Hook] Contrast the flashy marketing promise of [YOUR TOPIC] with basic common sense.
2. [Claim Breakdown] Put the advertised numbers side by side with realistic math.
3. [Pattern Recognition] Show the recurring playbook used in overhyped trends.
4. [Reality Check] Explain what genuine skill and sustainable business actually require.
5. [Verdict] Close with a sharp reminder to verify claims before buying into hype.`
  },
  {
    id: 'raftar-hypocrisy',
    title: 'Contradiction Spotlight',
    description: 'High-energy commentary comparing public promises with outcomes.',
    creatorId: 'raftar',
    content: `STRUCTURAL OUTLINE FOR: [YOUR TOPIC]
1. [Contrast Hook] Place the public promise about [YOUR TOPIC] right next to the observable result.
2. [Context Check] Break down what was promised, when, and under what conditions.
3. [The Gap] Highlight the practical gap between rhetoric and delivery.
4. [Public Impact] Show why ordinary citizens should pay attention to the details.
5. [Closing] Call on viewers to ask sharper questions.`
  },
  {
    id: 'hormozi-offer',
    title: 'The Value Equation Breakdown',
    description: 'No-fluff tactical framework for building high-value offers.',
    creatorId: 'alexhormozi',
    content: `STRUCTURAL OUTLINE FOR: [YOUR TOPIC]
1. [Direct Hook] State the core bottleneck holding back results in [YOUR TOPIC] in one sentence.
2. [The Equation] Break value into four levers: Dream Outcome, Perceived Likelihood, Time Delay, and Effort.
3. [Tactical Fix] Show how reducing time delay and friction multiplies perceived value.
4. [Concrete Illustration] Walk through a before-and-after example of a specific offer.
5. [Action Directive] Give one immediate step the viewer can execute today.`
  },
  {
    id: 'hormozi-ego',
    title: 'Volume & Execution',
    description: 'Action-focused breakdown on output and iteration.',
    creatorId: 'alexhormozi',
    content: `STRUCTURAL OUTLINE FOR: [YOUR TOPIC]
1. [Hard Truth Hook] Frame why lack of volume—not lack of secret tactics—stalls progress in [YOUR TOPIC].
2. [The Math of Practice] Compare 10 attempts against 100 deliberate iterations.
3. [Feedback Loops] Explain how real market feedback beats theoretical planning.
4. [Daily Standard] Define the exact daily input metric to track for 90 days.
5. [Closing] End with a direct, zero-fluff call to execute.`
  },
  {
    id: 'peterson-men',
    title: 'Meaning & Responsibility',
    description: 'Archetypal lecture on purpose, order, and voluntary responsibility.',
    creatorId: 'jordanpeterson',
    content: `STRUCTURAL OUTLINE FOR: [YOUR TOPIC]
1. [Existential Question] Ask why aimlessness feels heavier than voluntary effort in [YOUR TOPIC].
2. [Archetypal Story] Connect the struggle to a classic mythological or literary pattern.
3. [Psychological Mechanism] Explain how adopting incremental responsibility builds competence.
4. [The Alternative] Trace the long-term cost of avoidance and resentment.
5. [Closing] Invite the viewer to put one concrete part of their life in order today.`
  },
  {
    id: 'peterson-shadow',
    title: 'Strength & Self-Mastery',
    description: 'Deep psychological exploration of character and discipline.',
    creatorId: 'jordanpeterson',
    content: `STRUCTURAL OUTLINE FOR: [YOUR TOPIC]
1. [Paradoxical Hook] Distinguish between mere passivity and disciplined moral strength in [YOUR TOPIC].
2. [The Concept] Introduce how unacknowledged impulses shape behavior when ignored.
3. [Integration] Explain why self-awareness and clear boundaries create genuine composure.
4. [Practical Application] Apply the principle to difficult conversations and career negotiations.
5. [Closing] Conclude on strength guided by restraint.`
  },
  {
    id: 'veritasium-light',
    title: 'Counter-Intuitive Science Riddle',
    description: 'Thought experiment that challenges everyday intuition.',
    creatorId: 'veritasium',
    content: `STRUCTURAL OUTLINE FOR: [YOUR TOPIC]
1. [Street Question Hook] Pose a deceptively simple question about [YOUR TOPIC] where intuition fails.
2. [The Apparent Paradox] Show why the common textbook answer hides a deeper puzzle.
3. [Thought Experiment] Walk through a step-by-step physical or mathematical setup.
4. [Historical Discovery] Share how scientists wrestled with this exact measurement problem.
5. [Resolution] Reveal the deeper law of nature and why it changes how we see the world.`
  },
  {
    id: 'veritasium-math',
    title: 'The Deceptively Simple Problem',
    description: 'Visual math and physics storytelling arc.',
    creatorId: 'veritasium',
    content: `STRUCTURAL OUTLINE FOR: [YOUR TOPIC]
1. [Puzzle Hook] Introduce a rule in [YOUR TOPIC] that anyone can test in ten seconds.
2. [Pattern Exploration] Trace what happens when you apply the rule across a few examples.
3. [Scale Jump] Zoom out to show why the pattern resists a simple proof at massive scale.
4. [Underlying Mechanism] Explain the core mathematical insight in plain visual language.
5. [Closing Wonder] Reflect on what remains unanswered.`
  },
  {
    id: 'iman-agency',
    title: 'Service Business Blueprint',
    description: 'Step-by-step breakdown of building a client-service skill.',
    creatorId: 'imangadzhi',
    content: `STRUCTURAL OUTLINE FOR: [YOUR TOPIC]
1. [Clarity Hook] Contrast high-risk speculation with building a repeatable service skill in [YOUR TOPIC].
2. [Value Exchange] Explain why local and online businesses pay for measurable outcomes.
3. [Skill Selection] Pick one clear deliverable (copy, editing, or lead generation) and master it.
4. [Outreach System] Outline a consistent daily outreach and portfolio habit.
5. [Closing] Shift focus from passive consumption to building a real track record.`
  },
  {
    id: 'sharan-credit',
    title: 'Smart Rewards Breakdown',
    description: 'Practical walkthrough of optimizing everyday expenses.',
    creatorId: 'sharanhegde',
    content: `STRUCTURAL OUTLINE FOR: [YOUR TOPIC]
1. [Relatable Scene] Open with a comic moment around paying full price in [YOUR TOPIC].
2. [The Rule] Introduce the exact reward or budgeting rule most people overlook.
3. [Simple Math] Walk through a realistic monthly example using placeholder figures.
4. [Risk Reminder] Warn clearly against overspending or carrying high-interest debt.
5. [Closing] Summarize the one rule to remember.`
  }
];

export const DUMMY_SCRIPT: ScriptData = {
  isDemo: true,
  topic: "Sample Demo: How Everyday Habits Compound",
  type: "YouTube Shorts",
  title: "[DEMO - Not AI Generated] The 1% Habit Loop",
  detectedIntent: "Demo / Education",
  targetAudience: "General Creators",
  language: "English",
  duration: "60 Seconds (Shorts)",
  segments: [
    {
      visual: "[Demo Shot] Split-screen illustration showing two parallel daily routines over [TIME_X].",
      audio: "Why do small daily habits feel invisible in week one, yet transformative after [TIME_X]? This is a demo sample script."
    },
    {
      visual: "[Demo Diagram] Simple curve showing compounding progress with placeholder [STAT_X].",
      audio: "When you improve a repeatable workflow by [STAT_X] each session, the compounding effect comes from consistency rather than intensity."
    }
  ],
  ctas: [
    "Try generating your own script with any creator style above."
  ],
  citations: []
};

export const DUMMY_ANALYSIS: AnalysisData = {
  hookScore: 80,
  viralityLabel: 'Medium',
  retentionData: [
    { time: '0s', retention: 100 },
    { time: '15s', retention: 88 },
    { time: '30s', retention: 82 },
    { time: '45s', retention: 78 },
    { time: 'End', retention: 74 },
  ],
  suggestions: [
    "Demo sample analysis: Open with a concrete question in the first sentence.",
    "Demo sample analysis: Keep each spoken sentence concise for ear-friendly delivery."
  ],
  dropOffPrediction: "Demo sample only — run Script Analysis on a generated script for AI feedback."
};

export {
  creatorRegistry,
  getCreatorStyleSchema,
  type CreatorRegistryHelper
} from "./services/creatorRegistry";

