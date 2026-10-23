

export interface CreatorPromptEngine {
  linguisticRules: string[];
  signaturePhrases: {
    greeting: string;
    openLoops: string[];
    dataCitations: string[];
    signOff: string;
  };
  structuralBlueprint: {
    stage: string;
    instruction: string;
  }[];
  negativeConstraints: string[];
  fewShotExamples: {
    context: string;
    sampleText: string;
  }[];
}

export interface CreatorBio {
  id?: string;
  name: string;
  handle: string;
  avatarUrl: string;
  archetype: string;
  tagline: string;
  color: string;
  hex: string;
  philosophy: {
    coreBeliefs: string[];
    contentGoal: string;
  };
  voice: {
    tone: string;
    pacing: string;
    emotionalRange: string;
    vocabulary: string | string[];
    signaturePhrases?: string[];
  };
  structure: {
    hookStyle: string;
    bodyStructure: string;
    closingStyle: string;
  };
  research: {
    methodology: string;
    bias: string;
    preferredSources: string[];
  };
  signaturePhrases?: string[];
  styleCues?: string[];
  hookRules?: {
    use: string[];
    avoid: string[];
    firstLineShape: string;
  };
  workflow?: {
    stages: {
      name: string;
      purpose: string;
      sharePct: number;
      rules: string[];
    }[];
    durationOverrides?: Record<string, string[]>;
  };
  closingRules?: {
    use: string[];
    avoid: string[];
  };
  evidenceRules?: {
    mustCite: boolean;
    citeStyle: string;
    sourcePriority: string[];
  };
  languageRules?: {
    defaultMix: string;
    urduHindiNotes: string;
  };
  forbiddenPatterns?: string[];
  autoMatch?: {
    bestFor: string[];
    notFor: string[];
    keywords: string[];
  };
  blendRole?: {
    asSecondaryContribute: string[];
    asSecondaryNever: string[];
  };
  deepGenreEngine?: {
    genreBlueprints: Record<
      string,
      {
        label: string;
        triggers: string[];
        stages: string[];
        reservedKeywords: string[];
      }
    >;
    schemaFewShotExamples: {
      genre: string;
      context: string;
      visual: string;
      audio: string;
      narration: string;
    }[];
  };
  promptEngine?: CreatorPromptEngine;
  deepDNA?: unknown;
  researchConfig?: CreatorResearchConfig;
}

export interface CreatorResearchScalingTier {
  minClaims?: number;
  maxClaims?: number;
  minPapers?: number;
  maxPapers?: number;
  minInfographics: number;
  visualAssets: string;
  vocabularyDensity: string;
}

export interface CreatorResearchConfig {
  requiresLiveResearch: boolean;
  citationStyle: 'explicit-verbal-and-visual' | 'grounded-narrative' | 'minimal';
  domainLexiconEnforcement: string;
  scalingRules: {
    short1Min: CreatorResearchScalingTier;
    standard5Min: CreatorResearchScalingTier;
    deep20Min: CreatorResearchScalingTier;
  };
}

export interface ScientificGlossaryItem {
  term: string;
  simpleDefinition: string;
  usedInTimestamp: string;
}

export interface VerifiedClaimOrPaperItem {
  id: string; // e.g., "CLAIM-1", "PAPER-1"
  type: 'article_claim' | 'research_paper' | string;
  spokenSentenceInScript: string;
  sourceTitle: string;
  institutionOrJournal: string;
  publicationYear: string;
  deepVerificationDetails: string;
  sourceUrl?: string;
  isGroundedUrl?: boolean;
}

export interface InfographicBlueprintItem {
  id: string; // e.g., "INFOGRAPHIC-1"
  timestamp: string;
  chartType: 'Line Graph' | 'Bar Comparison' | 'Biological Mechanism Diagram' | 'Map' | 'Flow Diagram' | string;
  onScreenTitle: string;
  dataPoints: string[];
  sourceCitationOnScreen: string;
  editorAnimationNotes: string;
}

export interface ResearchPayload {
  scriptTitle?: string;
  estimatedDurationMinutes?: number;
  scriptMarkdown?: string;
  scientificGlossary: ScientificGlossaryItem[];
  claimsAndPapersRegistry: VerifiedClaimOrPaperItem[];
  infographicsBlueprint: InfographicBlueprintItem[];
  groundingChunks?: { title: string; uri: string }[];
}

export interface CreatorProfile {
  id: string;
  name: string;
  style: string;
  color: string; // Tailwind color class logic
  hex: string;   // For inline styles
  avatarUrl: string;
  systemPrompt: string; // Legacy field, kept for compatibility but populated from bio
  bio: CreatorBio; // New Deep Profile
  researchConfig?: CreatorResearchConfig; // Additive Live Research & Claim-Trigger Config
  isPremium?: boolean;
  locked?: boolean;
}

export interface Citation {
  id: string;
  type: 'News' | 'Research' | 'Report' | 'Public Data' | 'Official';
  sourceName: string;
  context: string;
  url?: string;
  reliabilityScore?: 'High' | 'Medium' | 'Low';
  isVerified?: boolean;
}

export interface ScriptSegment {
  visual: string;
  audio: string;
  isWeak?: boolean;
  rewriteSuggestion?: string;
  generatedImageUrl?: string; // For Visual Preview
  hasImage?: boolean; // Stored in localStorage instead of base64 image data
  isGeneratingImage?: boolean;
  leakedPlaceholders?: string[];
}

export interface HookOption {
  id: string;
  type: 'Mystery' | 'Controversy' | 'Relatable Story';
  visual: string;
  audio: string;
  score: number;
  reasoning: string;
}

export interface StyleAudit {
  hookMatchesRules: boolean;
  structureFollowsWorkflow: boolean;
  closingMatchesRules: boolean;
  noForbiddenPatterns: boolean;
  notes: string;
}

export interface ScriptPackage {
  title: string;
  detectedIntent: string;
  targetAudience: string;
  segments: ScriptSegment[];
  ctas: string[];
  citations?: Citation[]; // Added citations
  retentionVersion?: ScriptSegment[];
  styleAudit?: StyleAudit;
  // Auto Creator Metadata
  autoCreatorSelection?: {
    selectedId: string;
    confidence?: number;
    reason: string;
    alternatives?: string[]; // List of other creators considered
  };
  // Blend Metadata
  blendMetadata?: {
      primaryCreator: string;
      secondaryCreators: string[];
      blendRatio: string;
  };
  // Additive Live Research, Claim-Trigger & Infographic Payload
  researchPayload?: ResearchPayload;
  scientificGlossary?: ScientificGlossaryItem[];
  claimsAndPapersRegistry?: VerifiedClaimOrPaperItem[];
  infographicsBlueprint?: InfographicBlueprintItem[];
}

export interface EnhancementLog {
  improvedFields: string[];
  summary: string;
  originalSegments?: ScriptSegment[]; // For rollback
  enhancedSegments?: ScriptSegment[];
}

// --- NEW FEATURE TYPES ---

export interface SimulationPersona {
  id: string;
  demographic: string;
  reaction: string;
  dropPointTime: string;
  emotionalTrigger: string;
}

export interface SimulationResult {
  retentionHeatmap: { second: number; score: number; comment?: string }[];
  personas: SimulationPersona[];
  microFixes: { original: string; fix: string; impact: string }[];
  predictedRetention: number;
}

export interface ProductionScene {
  id: string;
  timeStart: string;
  duration: string;
  cameraDirection: string; // Closeup, Wide, Montage
  audioCue: string; // Music mood, SFX
  visualPrompt: string;
  onScreenText: string;
}

export interface DirectorPlan {
  scenes: ProductionScene[];
  thumbnails: { description: string; textOverlay: string; score: number }[];
  editingNotes: string;
  musicMood: string;
}

export interface ExperimentVariant {
  id: string;
  type: 'Hook A/B' | 'Tone Shift' | 'Length';
  content: ScriptData;
  predictedWinner: boolean;
  confidence: number;
  reason: string;
}

export interface ScriptData extends ScriptPackage {
  id?: string;
  topic: string;
  type: 'Long Form' | 'Shorts/Reels' | 'TikTok' | 'Instagram' | 'LinkedIn' | 'YouTube Long Form' | 'YouTube Shorts' | 'Instagram Reels' | 'LinkedIn Video' | 'Podcast Intro' | string;
  duration: string; // Persisted duration for logic checks
  language?: string; // Added for language persistence
  createdAt?: string;
  creatorId?: string;
  creatorName?: string;
  creatorStyle?: string;
  // Flattened for easier UI access (optional, but keeping consistent with previous state)
  autoCreatorUsed?: boolean;
  autoCreatorReason?: string;
  selectedCreatorName?: string;
  enhancementLog?: EnhancementLog; // New Insight Boost Data
  
  // New Feature Data
  simulation?: SimulationResult;
  directorPlan?: DirectorPlan;
  experiments?: ExperimentVariant[];
  
  // Canvas Mode Data
  userEditedScript?: string; // Stores the flat-text version from Canvas
  lastEditedAt?: string;
  isDemo?: boolean;

  // Dual / Multi-Language Support
  secondaryLanguage?: string;
  translations?: Record<string, TranslatedScriptVariant>;
}

export interface TranslatedScriptVariant {
  language: string;
  title: string;
  segments: {
    visual: string;
    audio: string;
  }[];
  ctas?: string[];
  translatedAt: string;
}

export interface AnalysisData {
  hookScore: number;
  viralityLabel: 'Low' | 'Medium' | 'Viral';
  retentionData: { time: string; retention: number }[];
  suggestions: string[];
  dropOffPrediction?: string;
  // New Enhanced Metrics
  truthScore?: number; 
  monetizationRisks?: string[];
  safetyFlags?: { severity: 'low' | 'medium' | 'high'; reason: string }[];
}

export interface SavedScript extends ScriptData {
  id: string;
  createdAt: string;
  creatorId: string;
  creatorName: string;
  creatorStyle: string;
  analysis?: AnalysisData;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  content: string;
}

export enum AppState {
  IDLE,
  GENERATING_HOOKS,
  CHOOSING_HOOK,
  GENERATING_SCRIPT,
  ANALYZING,
  READY
}

export type UserPlan = 'free' | 'pro';
export type SidebarView = 'studio' | 'history' | 'templates';
export type WritingMode = 'manual' | 'auto' | 'blend';

export interface UsageStats {
  date: string;
  count: number;
}

export interface ReferenceImage {
  id: string;
  data: string; // base64 string
  mimeType: string;
  previewUrl: string; // object URL for UI
}

export interface BlendConfig {
    primaryCreatorId: string;
    secondaryCreatorIds: string[];
}

export interface GeneratorConfig {
  topicOrScript: string;
  duration: string;
  language: string;
  expertise: 'Beginner' | 'Intermediate' | 'Expert';
  platform: string;
  rewriteAggressiveness: 'Low' | 'Medium' | 'High';
  transformationType: 'Full Rewrite' | 'Hook Focus' | 'Retention Optimization' | 'Tone Shift' | 'Fix Weaknesses';
  
  writingMode: WritingMode; // Replaces isAutoCreator
  selectedStyleId: string; // Acts as Manual Selection OR Primary Blend Selection
  blendConfig: BlendConfig; // For Blend Mode
  
  // New Fields
  templateId?: string;
  templateOutline?: string;
  arabicDialect?: string;
  sponsorInfo?: {
      enabled: boolean;
      name: string;
      product: string;
      message: string;
      disclosure?: boolean;
  };
  referenceImages?: ReferenceImage[]; // Multimodal Support
  enableDualScript?: boolean;
  secondaryLanguage?: string;
  subGenreId?: string;
}

export interface TopicSuggestion {
  refinedTopic: string;
  reason: string;
  type: 'Angle' | 'Clarity' | 'Depth';
}

export interface TypographyConfig {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  isCustomFont?: boolean;
  customFontUrl?: string;
}

export interface AudioConfig {
  tone: string;
  speed: string;
  deliveryStyle: string;
}

export interface AudioDialogueData {
  dialogue: string;
}

export interface CanvasHistoryState {
    past: string[];
    present: string;
    future: string[];
}

export interface YoutubeTitle {
  text: string;
  ctrScore: number;
  pattern: 'Explanation' | 'Investigation' | 'Curiosity' | 'Shock' | 'List';
  thumbnailText: string;
  reasoning: string;
}

// --- MODULE 1: SHORTS / CLIPPER STUDIO TYPES ---

export interface ShortClipperStyleBlueprint {
  id: string;
  name: string;
  handle: string;
  archetype: string;
  tone: string;
  vocalCadence: string;
  transitions: string;
  signatureTransitions: string[];
  analogyRule: string;
  analogyStyle: string;
  authorityFraming: string;
  numericFormatting: string;
  avoidList: string[];
  forbiddenPhrases?: string[];
  fewShotExamples?: string[];
  languageRule: string;
  profile?: CreatorProfile;
  researchConfig?: CreatorResearchConfig;
}

export type CreatorStyleSchema = ShortClipperStyleBlueprint;

export interface VerticalStoryboardFrame {
  id: string;
  timeRange: string;
  visualPrompt: string;
  captionOverlay: string;
  generatedImageUrl?: string;
  isGeneratingImage?: boolean;
}

export interface ExtractedViralShort {
  id: string;
  title: string;
  extractionRationale: string;
  hook0to3s: string;
  escalation3to15s: string;
  climax15to50s: string;
  infiniteLoop50to60s: string;
  fullSpokenScript: string;
  wordCount: number;
  estimatedSeconds: number;
  sectionTimings?: {
    hookRange: string;
    hookWords: number;
    escalationRange: string;
    escalationWords: number;
    climaxRange: string;
    climaxWords: number;
    loopRange: string;
    loopWords: number;
  };
  loopBridgePreview?: string;
  storyboardFrames: VerticalStoryboardFrame[];
}

export interface ShortsClipperPackage {
  sourceSummary: string;
  creatorApplied: string;
  creatorBlueprintUsed?: ShortClipperStyleBlueprint;
  shorts: ExtractedViralShort[];
}

// --- MODULE 2 & 3: SCRATCH VOICEOVER & SFX/BGM CUE MAPPER TYPES ---

export interface SpokenRuntimeMetrics {
  spokenWords: number;
  baseWpm: number;
  effectiveWpm: number;
  commaAndDashCount: number;
  sentenceEndCount: number;
  paragraphAndPauseCount: number;
  totalEstimatedSeconds: number;
  formattedRuntime: string;
  sceneTimings: {
    sceneIndex: number;
    cleanText: string;
    wordCount: number;
    durationSeconds: number;
    startSecond: number;
    endSecond: number;
  }[];
}

// --- MODULE 4: DEVIL'S ADVOCATE & BIAS BALANCER TYPES ---

export interface BiasVulnerabilityItem {
  id: string;
  sentenceOrClaim: string;
  issueType: 'Unverified Claim' | 'Loaded Framing' | 'Selection Bias' | 'Logical Leap';
  explanation: string;
  severity: 'Low Risk' | 'Medium Risk' | 'High Backlash Risk (Comment Section Magnet)';
  suggestedNeutralFix: string;
}

export type BiasVulnerabilityFlag = BiasVulnerabilityItem;

export interface SteelmanAndRebuttalPair {
  id: string;
  opposingSchoolOfThought: string;
  steelmanCounterArgument: string;
  supportingEvidenceAndData: string;
  counterSourceTitle?: string;
  counterSourceUrl?: string;
  creatorDefenseAndRebuttal: string;
  defenseCounterStatistics: string;
  defenseSourceTitle?: string;
  defenseSourceUrl?: string;
}

export type SteelmanRebuttalPair = SteelmanAndRebuttalPair;

export interface BulletproofBridgeBlock {
  id: string;
  label: string;
  targetPlacement: string;
  scriptParagraph: string;
  disarmsCriticism: string;
}

export interface DevilsAdvocateReport {
  inputSummary: string;
  overallObjectivityScore: number;
  vulnerabilities: BiasVulnerabilityItem[];
  steelmanAndRebuttalMatrix: SteelmanAndRebuttalPair[];
  bulletproofBridgeBlocks: BulletproofBridgeBlock[];
  groundedSources: { title: string; uri: string }[];
}