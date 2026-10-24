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

import { resolveCreatorResearchRegion } from "./researchTargets";

import { TOPIC_NICHES, TopicNiche } from "../creator-recipes/types";

export type VideoFormatCategory =
  | 'auto'
  | 'documentary'
  | 'challenge_entertainment'
  | 'business_finance'
  | 'science_philosophy';

export const detectTopicVideoCategory = (
  topicAndCriteria: string,
  creatorId?: string
): Exclude<VideoFormatCategory, 'auto'> => {
  const text = (topicAndCriteria || '').toLowerCase();
  const cId = (creatorId || '').toLowerCase();

  // 1. High-retention challenge & spectacle
  if (
    /\b(mrbeast|challenge|last to leave|survive|surviving|\$1 vs|\$10,000|\$100,000|\$1,000,000|24 hours|100 hours|50 hours|world's largest|extreme stunt|prank|i bought|i built|i spent|elimination|trapped in|giveaway|hide and seek|olympics)\b/i.test(
      text
    )
  ) {
    return 'challenge_entertainment';
  }

  // 2. Business, scaling, finance, investing, sales, startup, entrepreneurship
  if (
    /\b(scale|scaling|how to scale|business|businesses|startup|startups|entrepreneur|entrepreneurship|founder|sales|selling|revenue|profit|profits|margin|margins|marketing|funnel|conversion|leads|lead generation|client|clients|customer|customers|customer acquisition|b2b|saas|smma|agency|ecommerce|e-commerce|shopify|offer|offers|pricing|monetize|monetization|cashflow|investing|investor|stocks|stock market|wealth|crypto|real estate|dropshipping|cold call|cold email|growth playbook|hiring|operations|roi|cac|ltv|equity|venture capital|bootstrapped|hormozi|iman gadzhi|sharan hegde|how to get rich|millionaire|passive income|net worth|closing deals|high ticket)\b/i.test(
      text
    ) &&
    !/\b(scandal|mafia|cartel|corruption|state bank fraud|investigative documentary|water mafia|police raid)\b/i.test(text)
  ) {
    return 'business_finance';
  }

  // 3. Science, psychology, philosophy, logic, mental models
  if (
    /\b(science|scientific|quantum|physics|relativity|black hole|astrophysics|space|cosmos|universe|thermodynamics|paradox|evolution|biology|genetics|dna|neuroscience|brain|psychology|cognitive|philosophy|stoicism|stoic|meaning of life|archetype|jung|nietzsche|meditation|consciousness|veritasium|peterson|naval|habits|atomic habits|discipline|deep work|focus|logic|mental models|epistemology)\b/i.test(
      text
    )
  ) {
    return 'science_philosophy';
  }

  // 4. Documentary & investigative expose
  if (
    /\b(documentary|expose|exposé|mafia|cartel|scandal|crisis|politics|political|geopolitics|government|military|war|history|historical|underworld|gang|crime|terrorism|constitution|judiciary|supreme court|imf|debt|poverty|scarcity|water|electricity|ipp|smuggling|biography|untold story|taboo|society|protest|police|corruption|pakistan|india|middle east|cia|cold war|dark side)\b/i.test(
      text
    )
  ) {
    return 'documentary';
  }

  // Fallback to creator style if text is short/ambiguous
  if (cId.includes('mrbeast')) return 'challenge_entertainment';
  if (cId.includes('hormozi') || cId.includes('iman') || cId.includes('sharan')) return 'business_finance';
  if (cId.includes('veritasium') || cId.includes('naval') || cId.includes('peterson')) return 'science_philosophy';

  return 'documentary';
};

export const detectTopicNiche = (topicText: string): TopicNiche => {
  const text = (topicText || '').toLowerCase();
  if (!text.trim()) return 'Economy & business';

  // 1. Business & Economy
  if (
    /\b(scale|scaling|how to scale|business|businesses|startup|startups|founder|entrepreneur|sales|revenue|profit|margin|marketing|funnel|lead|leads|client|clients|customer|b2b|saas|smma|agency|ecommerce|shopify|offer|pricing|monetize|cashflow|investing|investor|stock|stocks|wealth|crypto|real estate|dropshipping|cold call|hormozi|iman|sharan|economy|inflation|gdp|tax|budget|pkr|rupee|dollar|market|high ticket)\b/i.test(
      text
    )
  ) {
    return 'Economy & business';
  }

  // 2. Tech & AI
  if (
    /\b(ai|artificial intelligence|machine learning|llm|chatgpt|openai|coding|software|developer|programming|algorithm|crypto|blockchain|web3|robot|robotics|gadget|iphone|apple|nvidia|silicon valley|cybersecurity|hacker|tech)\b/i.test(
      text
    )
  ) {
    return 'Tech & AI';
  }

  // 3. Science & Health
  if (
    /\b(science|physics|quantum|biology|chemistry|dna|genetics|evolution|neuroscience|brain|doctor|disease|health|medicine|diet|sleep|fitness|psychology|mental health|space|cosmos|universe|nasa|astronomy|black hole|veritasium)\b/i.test(
      text
    )
  ) {
    return 'Science & health';
  }

  // 4. Culture & Entertainment
  if (
    /\b(challenge|mrbeast|stunt|prank|survive|surviving|\$1 vs|prize|movie|cinema|hollywood|bollywood|netflix|music|song|actor|celebrity|gaming|game|minecraft|esports|pop culture|anime)\b/i.test(
      text
    )
  ) {
    return 'Culture & entertainment';
  }

  // 5. Society & Crime
  if (
    /\b(crime|murder|police|gang|underworld|mafia|cartel|drugs|smuggling|scam|fraud|prison|jail|court case|kidnapping|investigation|taboo|social issue|caste|dowry)\b/i.test(
      text
    )
  ) {
    return 'Society & crime';
  }

  // 6. History
  if (
    /\b(history|historical|ancient|empire|emperor|ottoman|mughal|british raj|world war|ww1|ww2|cold war|partition|1947|1971|civilization|archaeology|dynasty)\b/i.test(
      text
    )
  ) {
    return 'History';
  }

  // 7. Environment & Resources
  if (
    /\b(water|water table|climate|global warming|pollution|smog|flood|dam|agriculture|farmer|forest|deforestation|energy|solar|electricity|oil|gas|renewable)\b/i.test(
      text
    )
  ) {
    return 'Environment & resources';
  }

  // 8. Education & Careers
  if (
    /\b(career|job|jobs|interview|resume|college|university|student|degree|study|skills|productivity|habits|learning|school|exam)\b/i.test(
      text
    )
  ) {
    return 'Education & careers';
  }

  // 9. Politics & Governance
  if (
    /\b(politics|political|government|election|parliament|prime minister|president|military|army|constitution|supreme court|judiciary|policy|democracy|imf|corruption|protest)\b/i.test(
      text
    )
  ) {
    return 'Politics & governance';
  }

  return 'Economy & business';
};

export const analyzeTopicWithGemini = async (
  topic: string,
  platformOrRegion: string = 'Pakistan',
  apiKey?: string,
  signal?: AbortSignal,
  options?: {
    targetCriteria?: string;
    videoCategory?: VideoFormatCategory;
    creatorId?: string;
    region?: string;
  }
): Promise<TopicSuggestion[]> => {
  const combinedInput = options?.targetCriteria?.trim()
    ? `${topic}\nWhat should be inside this video: ${options.targetCriteria.trim()}`
    : topic;

  const resolvedScope = resolveCreatorResearchRegion(options?.creatorId, combinedInput);
  const region =
    options?.region ||
    (resolvedScope === 'india_and_global'
      ? 'India & Global'
      : resolvedScope === 'global'
      ? 'Global'
      : platformOrRegion || 'Pakistan');

  const category = options?.videoCategory && options.videoCategory !== 'auto'
    ? options.videoCategory
    : detectTopicVideoCategory(combinedInput, options?.creatorId);

  let lensListPrompt = '';
  let proofInstructionPrompt = '';

  if (category === 'business_finance') {
    lensListPrompt = `
    Select the 5 best-fitting high-ROI business & financial scaling lenses for this specific topic:
    1. Unit Economics & Pricing Model (Gross margins, pricing power, LTV/CAC, packaging high-ticket vs volume)
    2. The Bottleneck & Constraints (The exact operational or lead constraint preventing 10x scale)
    3. Customer Acquisition Engine (Outbound prospecting, warm outreach, content funnels, or paid traffic systems)
    4. Delivery Operations & Retention (Client fulfillment, churn prevention, SOPs, and hiring operators without chaos)
    5. The Contrarian Scale Playbook (Why standard guru advice fails and the proven mathematical framework)
    6. Actionable Math & Execution Steps (First 30-day playbook with real numbers and formulas)
    7. Scaling Traps & Failure Modes (Cashflow traps, premature scaling, and margin compression)
    `;
    proofInstructionPrompt = `For each angle, name verified industry benchmarks, financial models, SEC filings, operator case studies, or unit economics benchmarks.`;
  } else if (category === 'challenge_entertainment') {
    lensListPrompt = `
    Select the 5 best-fitting high-retention challenge & entertainment lenses for this specific topic:
    1. The 5-Second Impossible Hook (Immediate physical/financial premise, visual spectacle, and stakes)
    2. Round 1 Escalation & Shock (Early eliminations, unexpected obstacles, and immediate pacing)
    3. The High-Stakes Dilemma / Twist (Double-or-nothing ultimatum, traitor mechanics, or time crunch)
    4. The Psychological Breaking Point (Contestant exhaustion, moral test, or endurance wall)
    5. The Climax & Instant Winner Payoff (Ultimate showdown, explosive visual climax, and instant emotional reaction)
    `;
    proofInstructionPrompt = `For each angle, name concrete physical challenge rules, escalating stakes counters, or viewer tension mechanics.`;
  } else if (category === 'science_philosophy') {
    lensListPrompt = `
    Select the 5 best-fitting first-principles science & philosophy lenses for this specific topic:
    1. The Core Paradox (The counter-intuitive truth that defies human common sense)
    2. The First-Principles Mechanism (Step-by-step physical, biological, or psychological proof)
    3. The Crucial Breakthrough / Experiment (The historical experiment or pivotal data point that changed everything)
    4. Daily Life Mental Model (How this principle directly applies to personal decisions, habits, or focus)
    5. The Frontier & Future Horizon (Unsolved mysteries, next-generation implications, and thought experiments)
    `;
    proofInstructionPrompt = `For each angle, name peer-reviewed studies, laboratory experiments, or empirical data sources.`;
  } else {
    lensListPrompt = `
    Select the 5 best-fitting analytical lenses for this documentary / investigative topic:
    1. Who profits (financial incentives, beneficiaries, or business model)
    2. Effect on ordinary people (daily life impact, household cost, or human story)
    3. Why the system failed (policy gaps, institutional bottlenecks, or structural causes)
    4. Science and evidence (empirical data, mechanism, or technical breakdown)
    5. History (origins, key turning points, and how we got here)
    6. Solutions (what works elsewhere and practical steps forward)
    7. Future (what happens next if trends continue vs. change)
    `;
    proofInstructionPrompt = `
    For Indian creators/topics, cite Indian institutions (CAG, PRS, RBI, Parliamentary Records).
    For Pakistani creators/topics, cite Pakistani institutions (PIDE, PBS, KWSB).
    For Global topics, cite international bodies (World Bank, SEC, OECD).
    `;
  }

  const prompt = `
    The user is planning a video on the following topic:
    - TOPIC: "${combinedInput}"
    - FORMAT CATEGORY: "${category}"
    - FOCUS REGION: "${region}"

    ${lensListPrompt}

    Use Google Search grounding to tailor all 5 angles directly to "${topic}" and "${region}".
    Do NOT mention any YouTuber/creator names and do NOT use unrelated hard-coded examples.
    ${proofInstructionPrompt}

    For each of the 5 angles, return:
    - angleNumber (1 to 5)
    - angleCategory (the chosen lens label)
    - refinedTopic (a clear, compelling title for this angle)
    - reason (a 1-line promise explaining the core takeaway)
    - criteriaPoints (an array of EXACTLY 3 concrete key questions this angle will answer)
    - pakistaniOrGroundProofPreview (1 short line naming specific verified data sources, financial models, or institutional reports that can verify this angle)
    - type ('Angle' | 'Clarity' | 'Depth')
  `;

  const { data } = await runGroundedJson<{ suggestions?: TopicSuggestion[] }>({
    prompt,
    schema: topicSuggestionSchema,
    apiKey,
    signal
  });

  return (data.suggestions || []).map((s, idx) => ({
    ...s,
    angleNumber: s.angleNumber || idx + 1,
    lens: s.angleCategory,
    promise: s.reason,
    questions: s.criteriaPoints
  }));
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
