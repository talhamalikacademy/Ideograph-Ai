import {
  CreatorProfile,
  CreatorStyleSchema,
  ShortClipperStyleBlueprint
} from "../types";
import { CREATORS, CREATOR_RESEARCH_CONFIGS } from "../constants";
import { resolveCreatorBio } from "../creator-intelligence/CreatorDNA";

const TELEPROMPTER_NUMERIC_RULE =
  "Write all numbers in clean, punchy digits with explicit units (e.g., '300,000 kilometers per second', '8 minutes and 20 seconds', '₹50,000 crore') for instant teleprompter readability—never spell out long numbers as words.";

const GLOBAL_SHORT_AVOID_RULES = [
  "Never start a Short with greetings like 'Namaskar dosto', 'Hello friends', 'Welcome back', or 'Hey guys'.",
  "Never invent robotic authority filler like 'official NASA astrophysics data' for basic textbook concepts.",
  "Never break the grammatical sentence bridge between [INFINITE LOOP ENDING] and [HOOK].",
  "Never summarize the entire 15-minute video; isolate 1 core paradox or mechanism per Short."
];

interface CreatorStylePreset {
  aliases: string[];
  tone: string;
  vocalCadence: string;
  transitions: string;
  signatureTransitions: string[];
  analogyRule: string;
  authorityFraming: string;
  avoidList: string[];
  fewShotExamples: string[];
}

const CREATOR_PRESET_OVERRIDES: Record<string, CreatorStylePreset> = {
  dhruvrathee: {
    aliases: [
      "dhruv",
      "dhruvrathee",
      "@dhruvrathee",
      "analytical-explainer",
      "@analytical-explainer",
      "evidence-leddocumentaryexplainer"
    ],
    tone: "Rational, investigative, urgent, Socratic, and crystal-clear educator.",
    vocalCadence:
      "150 WPM (2.5 words/second) rhythmic, articulate cadence. Alternates between rapid 6–9 word factual beats and a deliberate [Pause] right before the scientific or investigative reveal.",
    transitions:
      "Let's understand the science behind this step-by-step / Here is where it gets really interesting / Lekin sawal yeh uthta hai ki... / Aaiye isko ek simple example se samajhte hain",
    signatureTransitions: [
      "Let's understand the science behind this step-by-step",
      "Here is where it gets really interesting",
      "Lekin sawal yeh uthta hai ki...",
      "Aaiye isko ek simple example se samajhte hain",
      "Iske peeche ka asli kaaran samajhne ke liye..."
    ],
    analogyRule:
      "Always explain complex mechanisms using a tangible, everyday physical phenomenon (e.g., ripples in a pond for gravitational waves, a moving train for relativity, or a household budget for macroeconomics) that visually matches the physics or real-world impact. Never dump raw numbers without an immediate 'Aam Insaan' everyday analogy.",
    authorityFraming:
      "Never invent robotic filler like 'official NASA astrophysics data' for basic textbook concepts. Cite specific laws (e.g., 'Einstein's theory of general relativity', 'Newton's law of universal gravitation') for science, and specific documented reports (Supreme Court rulings, CAG audits, IPCC reports, peer-reviewed journals) only for geopolitics, policy, or history.",
    avoidList: [
      "Avoid partisan screaming, emotional melodrama, or unverified WhatsApp-university rumors.",
      "Avoid fake authority phrases like 'official NASA astrophysics data' on basic physics.",
      "Avoid opening a Short with 'Namaskar dosto'—jump straight into the 7–9 word curiosity hook.",
      "Avoid passive essay openings that spoil the conclusion in sentence 1; use a Direct Micro-Test or Dated Incident.",
      "Avoid textbook Urdu phrases like 'مستقل طور پر' (use 'ہمیشہ کے لیے / permanently') or flat hook endings like 'آئیے اسے سمجھتے ہیں' (always attach the evidence medium: 'آئیے اس کے پیچھے کی سائنس / ریسرچ کو step-by-step سمجھتے ہیں').",
      "Avoid spelling out large numbers in words ('three hundred thousand'); use clean digits ('300,000')."
    ],
    fewShotExamples: [
      "دوستو، ذرا سچ بتائیے—آخری بار آپ نے بنا ChatGPT یا AI کی مدد لیے، خود اپنے دماغ سے کوئی ای میل یا اسائنمنٹ کب لکھا تھا؟ [Pause] شاید یاد بھی نہیں آ رہا ہوگا! آج چاہے کوئی چھوٹا سا میسج لکھنا ہو، ہوم ورک کرنا ہو یا کوئی پرابلم سالو (solve) کرنی ہو، ہم اپنا دماغ چلانے کے بجائے سیدھا AI کھول لیتے ہیں۔ لیکن ایک منٹ رکو... کیا یہ سہولت ہمارے دماغ کو اندر ہی اندر ہمیشہ کے لیے سلو (slow) اور کمزور بنا رہی ہے؟ نیورو سائنسدان (Neuroscientists) اس خطرے کو 'Cognitive Offloading' کہہ رہے ہیں۔ آئیے آج کی اس ویڈیو میں پوری ریسرچ کے ساتھ سمجھتے ہیں کہ AI آپ کے دماغ کے ساتھ اصل میں کر کیا رہا ہے!",
      "کیا آپ نے نوٹ کیا ہے کہ جب سے ChatGPT آیا ہے، ہمارا دماغ کتنی جلدی تھکنے لگا ہے؟ [Pause] آج ایک چھوٹی سی ای میل لکھنی ہو، اسائنمنٹ بنانا ہو یا کوئی بیسک پرابلم سالو کرنی ہو—ہم خود سوچنے کے بجائے سارا کام AI پر ڈال دیتے ہیں۔ لیکن سائنسدانوں کی نئی ریسرچ ایک بہت ہی ڈراؤنی وارننگ دے رہی ہے: کیا AI واقعی انسانی دماغ کو ہمیشہ کے لیے سلو (slow) اور ڈل (dull) بنا رہا ہے؟ آئیے اس کے پیچھے کی سائنس کو step-by-step سمجھتے ہیں۔",
      "Imagine dropping a heavy bowling ball onto a stretched trampoline—that exact curve in the fabric is how the Sun bends space around Earth.",
      "Let's understand the science behind this step-by-step: light travels at 300,000 kilometers per second, which means sunlight takes 8 minutes and 20 seconds to reach your eyes."
    ]
  },

  nitishrajput: {
    aliases: ["nitish", "nitishrajput", "@nitishrajput"],
    tone: "Deep, resonant, grounded, empathetic, and unflinchingly systemic.",
    vocalCadence:
      "150 WPM (2.5 words/second) measured, hard-hitting documentary cadence with deliberate [Pause] beats after human-impact revelations.",
    transitions:
      "Lekin kahani ka asli chehra kuch aur hai / Ground report ke mutabiq / Ab zara iske peeche ke system ko samajhiye / Asli haqeeqat tab saamne aati hai jab...",
    signatureTransitions: [
      "Lekin kahani ka asli chehra kuch aur hai",
      "Ground report ke mutabiq",
      "Ab zara iske peeche ke system ko samajhiye",
      "Asli haqeeqat tab saamne aati hai jab..."
    ],
    analogyRule:
      "Always connect institutional or policy failures to the lived reality of a single common citizen, farmer, or daily-wage worker so the viewer feels the human cost of the system.",
    authorityFraming:
      "Never use generic AI authority filler. Anchor claims in documented ground reports, official FIRs, parliamentary committee records, and verified social audits.",
    avoidList: [
      "Avoid superficial hype or cheerful influencer slang.",
      "Avoid blaming helpless individuals when the structural incentive is broken.",
      "Avoid robotic citations like 'official government data says' without naming the exact commission or ground reality."
    ],
    fewShotExamples: [
      "Kagazon par yeh yojana 100% kamyab dikhti hai, lekin zameen par khade us kisaan se puchiye jiske haath mein aaj bhi sirf intezaar hai.",
      "Ab zara iske peeche ke system ko samajhiye: jab zimmedari har table par banti jaati hai, toh insaaf kisi ek darwaze par nahi milta."
    ]
  },

  thynkwhy: {
    aliases: ["thynkwhy", "@thynkwhy"],
    tone: "Sharp, introspective, psychologically piercing, and culturally self-aware.",
    vocalCadence:
      "150 WPM (2.5 words/second) incisive social-autopsy cadence contrasting everyday street behavior with deeper psychological conditioning.",
    transitions:
      "Zara ruk kar sochiye / Asal masla degree ka nahi, sha'oor ka hai / Jab hum is pattern ko kareeb se dekhte hain / Yeh sirf ek aadat nahi, poori psychology hai",
    signatureTransitions: [
      "Zara ruk kar sochiye",
      "Asal masla degree ka nahi, sha'oor ka hai",
      "Jab hum is pattern ko kareeb se dekhte hain",
      "Yeh sirf ek aadat nahi, poori psychology hai"
    ],
    analogyRule:
      "Always contrast a familiar everyday street or household habit (like breaking a traffic queue or late-night chai-hotel debates) with a global civic or psychological case study.",
    authorityFraming:
      "Cite behavioral psychology principles, urban civic case studies, and observable societal patterns—never use robotic corporate filler or partisan slogans.",
    avoidList: [
      "Avoid party-political blame games; focus on civic behavior, psychology, and sha'oor (awareness).",
      "Avoid preachy lecturing; use inclusive 'we/hum' self-reflection."
    ],
    fewShotExamples: [
      "Hum har roz laakhon ki gaadi mein baith kar ₹10 ke kachre ko sadak par phenk dete hain—kyunki degree toh mil gayi, magar sha'oor peeche chhoot gaya."
    ]
  },

  mrbeast: {
    aliases: ["mrbeast", "@mrbeast"],
    tone: "Hyper-energetic, high-stakes, immediate, visual, and action-obsessed.",
    vocalCadence:
      "150 WPM (2.5 words/second) ultra-tight, zero-fluff staccato delivery where every sentence escalates the stakes or visual payoff.",
    transitions:
      "And that's just the beginning / But here is the crazy part / Within 10 seconds / If this fails, everything is over",
    signatureTransitions: [
      "And that's just the beginning",
      "But here is the crazy part",
      "Within 10 seconds",
      "Wait until you see what happens next"
    ],
    analogyRule:
      "Always translate scale into concrete, jaw-dropping physical comparisons (e.g., 'enough force to crush 100 cars at once' or 'wider than 50 football fields').",
    authorityFraming:
      "Prove scale through direct physical demonstration and exact measurable numbers rather than academic jargon or textbook citations.",
    avoidList: [
      "Avoid slow philosophical rambling or multi-clause academic sentences.",
      "Avoid abstract descriptions that cannot be visualized on camera in under 2 seconds."
    ],
    fewShotExamples: [
      "Right behind this wall is a force strong enough to vaporize 10,000 tons of solid steel in 1 second!"
    ]
  },

  navalravikant: {
    aliases: ["naval", "navalravikant", "@naval"],
    tone: "Calm, aphoristic, first-principles, razor-sharp, and timeless.",
    vocalCadence:
      "150 WPM (2.5 words/second) clean, aphoristic cadence where every sentence stands alone like a physical law.",
    transitions:
      "Think about it from first principles / Here is the fundamental truth / Play long-term games / The leverage lies in...",
    signatureTransitions: [
      "Think about it from first principles",
      "Here is the fundamental truth",
      "Once you understand how compounding works",
      "The real leverage lies in..."
    ],
    analogyRule:
      "Explain human behavior, wealth, and society using physics, code/media leverage, or evolutionary game-theory analogies (e.g., compounding interest vs. thermal equilibrium).",
    authorityFraming:
      "Ground insights in first-principles physics, microeconomics, and game theory—never rely on appeal-to-authority name-dropping or fake statistics.",
    avoidList: [
      "Avoid hustle-bro yelling, fake urgency, or get-rich-quick clichés.",
      "Avoid bloated filler adjectives; every word must carry philosophical or economic weight."
    ],
    fewShotExamples: [
      "Desire is a contract you make with yourself to be unhappy until you get what you want."
    ]
  },

  raftar: {
    aliases: ["raftar", "raftartv", "@raftartv"],
    tone: "Investigative, cinematic, historically anchored, and power-structure focused.",
    vocalCadence:
      "150 WPM (2.5 words/second) dramatic investigative chronicle cadence that connects historical turning points to present-day power realities.",
    transitions:
      "Tareekh ke panno ko palat kar dekhein toh / Asal khel parde ke peeche shuru hua / Lekin is faisle ki keemat kisne chukai?",
    signatureTransitions: [
      "Tareekh ke panno ko palat kar dekhein toh",
      "Asal khel parde ke peeche shuru hua",
      "Lekin is faisle ki keemat kisne chukai?",
      "Yeh kahani us daur se shuru hoti hai jab..."
    ],
    analogyRule:
      "Connect complex power struggles, economic crises, or institutional shifts to a clear chess-board or household power dynamic that exposes who wins and who pays the price.",
    authorityFraming:
      "Attribute claims to documented historical archives, declassified records, constitutional amendments, and named economic reports.",
    avoidList: [
      "Avoid unverified conspiracy theories or partisan sloganeering.",
      "Avoid vague generalizations without specific years, numbers, or institutional actors."
    ],
    fewShotExamples: [
      "Tareekh गवाह hai ki jab bhi taqat ek kamre mein band hoti hai, uska bojh sadak par khade aam shahri ko uthana padta hai."
    ]
  },

  alexhormozi: {
    aliases: ["hormozi", "alexhormozi", "@hormozi"],
    tone: "Direct, operator-grade, mathematical, zero-excuse, and high-value.",
    vocalCadence:
      "150 WPM (2.5 words/second) punchy operator cadence built on short conditional sentences ('If you do X, you get Y') and concrete math.",
    transitions:
      "Here is the math / Let's break down the equation / Most people get this backwards / The bottleneck is simple",
    signatureTransitions: [
      "Here is the math",
      "Let's break down the equation",
      "Most people get this completely backwards",
      "The constraint is simple"
    ],
    analogyRule:
      "Explain every concept as an input-output equation or a gym-rep / bottleneck analogy (Dream Outcome vs. Time Delay and Effort).",
    authorityFraming:
      "Use clean unit economics, conversion ratios, and volume-of-reps logic—never invent fake academic studies or fluffy motivational quotes.",
    avoidList: [
      "Avoid vague mindset fluff without a measurable action or ratio.",
      "Avoid inventing personal P&L numbers not present in the source script."
    ],
    fewShotExamples: [
      "Here is the math: if you double the speed of the result and cut the effort in half, the value doesn't double—it multiplies by 4."
    ]
  },

  jordanpeterson: {
    aliases: ["peterson", "jordanpeterson", "@jordanpeterson"],
    tone: "Intense, clinical, mythological, precise, and morally urgent.",
    vocalCadence:
      "150 WPM (2.5 words/second) deliberate, high-gravity cadence that escalates from a small behavioral detail to an existential law of order and chaos.",
    transitions:
      "And you might think, well, what does that really mean? / Look at the psychological mechanism here / It's no trivial matter / At the deepest level of analysis",
    signatureTransitions: [
      "Look at the psychological mechanism here",
      "It's no trivial matter",
      "At the deepest level of analysis",
      "And that's where order collapses into chaos"
    ],
    analogyRule:
      "Map technical or societal crises onto evolutionary biology, clinical psychology, or archetypal order-versus-chaos structures.",
    authorityFraming:
      "Cite clinical psychology, neuroscience, evolutionary biology, and historical totalitarian case studies—never use shallow pop-psychology buzzwords.",
    avoidList: [
      "Avoid casual slang, flippant humor, or superficial listicles.",
      "Avoid robotic AI filler phrases."
    ],
    fewShotExamples: [
      "When you ignore a small crack in the foundation of truth, you don't just get a mistake—you invite the entire structure to collapse into chaos."
    ]
  },

  veritasium: {
    aliases: ["veritasium", "@veritasium"],
    tone: "Inquisitive, counter-intuitive, experimental, and wonder-driven.",
    vocalCadence:
      "150 WPM (2.5 words/second) crisp scientific-mystery cadence that starts with a common misconception and flips it with a physical demonstration.",
    transitions:
      "Now your intuition probably tells you / But when we actually test the physics / Here is the counter-intuitive truth / Look closely at what happens at the atomic scale",
    signatureTransitions: [
      "Now your intuition probably tells you",
      "But when we actually test the physics",
      "Here is the counter-intuitive truth",
      "Look closely at what happens next"
    ],
    analogyRule:
      "Always pair abstract physics or math with a tactile, visual experiment (e.g., a slinky dropped from a roof, dominoes chain-reacting, or water waves interfering).",
    authorityFraming:
      "Cite fundamental laws of physics (thermodynamics, electromagnetism, relativity) and real experimental measurements—never use fake filler like 'official NASA data says'.",
    avoidList: [
      "Avoid dry textbook recitation without a counter-intuitive paradox first.",
      "Avoid fake authority buzzwords on basic physics principles."
    ],
    fewShotExamples: [
      "Your intuition tells you the bottom of this falling slinky should drop immediately—but physics says it stays frozen in mid-air until the wave catches up!"
    ]
  },

  imangadzhi: {
    aliases: ["iman", "imangadzhi", "@imangadzhi"],
    tone: "Measured, cinematic, contrarian, disciplined, and status-aware.",
    vocalCadence:
      "150 WPM (2.5 words/second) composed, cinematic voiceover cadence with sharp contrasts between default conditioning and deliberate focus.",
    transitions:
      "Here is what nobody tells you / Step back and look at the incentives / While 99% of people are distracted by / The protocol is simple",
    signatureTransitions: [
      "Here is what nobody tells you",
      "Step back and look at the incentives",
      "While 99% of people are distracted by...",
      "The protocol is simple"
    ],
    analogyRule:
      "Contrast modern dopamine traps and broken institutional defaults with high-focus 'monk-mode' systems and clear economic leverage.",
    authorityFraming:
      "Ground claims in observable market incentives, attention economics, and behavioral discipline—never invent fake income screenshots or conspiracy theories.",
    avoidList: [
      "Avoid loud, frantic hype or begging for attention.",
      "Avoid contemptuous language toward ordinary workers; critique systems and incentives instead."
    ],
    fewShotExamples: [
      "When an entire system is engineered to monetize your distraction every 3 seconds, focus stops being a habit—it becomes your greatest unfair advantage."
    ]
  },

  sharanhegde: {
    aliases: ["sharan", "sharanhegde", "@financewithsharan"],
    tone: "Witty, sharp, consumer-first, relatable, and financially savvy.",
    vocalCadence:
      "150 WPM (2.5 words/second) snappy conversational skit-to-breakdown cadence that exposes hidden financial traps with quick numbers.",
    transitions:
      "Wait, don't sign that yet! / Here is the hidden loophole banks won't tell you / Let's do the actual math / That one clause costs you...",
    signatureTransitions: [
      "Wait, don't sign that yet!",
      "Here is the hidden loophole banks won't tell you",
      "Let's do the actual math",
      "Here is how you actually save that money"
    ],
    analogyRule:
      "Translate complex tax codes, inflation, or macro-finance into a relatable everyday bill, EMI trap, or shopping checkout comparison with exact numbers.",
    authorityFraming:
      "Cite specific tax sections, RBI guidelines, or exact compound-interest math rather than generic 'financial experts say' filler.",
    avoidList: [
      "Avoid boring textbook accounting jargon without an immediate real-money example.",
      "Avoid reckless financial advice; always highlight the real math and hidden conditions."
    ],
    fewShotExamples: [
      "You think a 1% fee sounds tiny, right? Over 20 years of compounding, that 'tiny' 1% quietly eats ₹28 lakh straight out of your retirement!"
    ]
  }
};

/**
 * Builds a complete, structured CreatorStyleSchema for a given CreatorProfile,
 * merging read-only CreatorBio intelligence with ShortClipper's strict 2.5 WPS & authority rules.
 */
const buildCreatorStyleSchema = (profile: CreatorProfile): CreatorStyleSchema => {
  const bio = resolveCreatorBio(profile);
  const cleanId = profile.id.toLowerCase().replace(/\s+/g, "").replace("@", "");

  const preset =
    CREATOR_PRESET_OVERRIDES[cleanId] ||
    Object.values(CREATOR_PRESET_OVERRIDES).find(p =>
      p.aliases.includes(cleanId)
    );

  const bioSignaturePhrases = (bio.signaturePhrases || []).filter(
    p => !/namaskar|hello|welcome|milte hain|dhanyawad/i.test(p)
  );

  const signatureTransitions =
    preset?.signatureTransitions && preset.signatureTransitions.length > 0
      ? Array.from(new Set([...preset.signatureTransitions, ...bioSignaturePhrases]))
      : bioSignaturePhrases.length > 0
      ? bioSignaturePhrases
      : [
          "Let's understand the mechanism behind this step-by-step",
          "Here is where it gets really interesting"
        ];

  const transitions =
    preset?.transitions || signatureTransitions.slice(0, 4).join(" / ");

  const analogyCue = (bio.styleCues || []).find(c =>
    /analogy|scale|example|aam insaan|everyday/i.test(c)
  );

  const analogyRule =
    preset?.analogyRule ||
    (analogyCue
      ? `${analogyCue} Always ground abstract concepts in a tangible, everyday physical phenomenon.`
      : "Always explain complex mechanisms using a tangible, everyday physical phenomenon (e.g., ripples in a pond, a moving train) that visually matches the physics.");

  const preferredSources = (bio.research?.preferredSources || []).join(", ");

  const authorityFraming =
    preset?.authorityFraming ||
    `Never invent robotic filler like "official NASA astrophysics data" for basic concepts. Cite specific natural laws for science, and authentic sources (${
      preferredSources || bio.research?.methodology || "verified primary records"
    }) only when citing empirical data, geopolitics, or history.`;

  const avoidList = Array.from(
    new Set([
      ...(preset?.avoidList || []),
      ...(bio.forbiddenPatterns || []),
      ...(bio.hookRules?.avoid || []),
      ...GLOBAL_SHORT_AVOID_RULES
    ])
  );

  const fewShotExamples =
    preset?.fewShotExamples && preset.fewShotExamples.length > 0
      ? preset.fewShotExamples
      : bioSignaturePhrases.slice(0, 2);

  const researchConfig =
    profile.researchConfig ||
    bio.researchConfig ||
    CREATOR_RESEARCH_CONFIGS[cleanId];

  return {
    id: profile.id,
    name: bio.name || profile.name,
    handle: bio.handle || `@${profile.id}`,
    archetype: bio.archetype || profile.style,
    tone: preset?.tone || bio.voice?.tone || "Curious, objective, urgent, and clear.",
    vocalCadence:
      preset?.vocalCadence ||
      bio.voice?.pacing ||
      "150 WPM (2.5 words/second) punchy cadence with crisp declarative sentences.",
    transitions,
    signatureTransitions,
    analogyRule,
    analogyStyle: analogyRule,
    authorityFraming,
    numericFormatting: TELEPROMPTER_NUMERIC_RULE,
    avoidList,
    forbiddenPhrases: avoidList,
    fewShotExamples,
    languageRule:
      bio.languageRules?.defaultMix ||
      "Match the user's selected output language with 100% authentic spoken rhythm.",
    profile,
    ...(researchConfig ? { researchConfig } : {})
  };
};

let cachedRegistryMap: Readonly<Record<string, CreatorStyleSchema>> | null = null;

/**
 * Indexed lookup map of all CreatorStyleSchemas keyed by canonical ID and common aliases.
 */
const ensureRegistryMap = (): Readonly<Record<string, CreatorStyleSchema>> => {
  if (cachedRegistryMap) {
    return cachedRegistryMap;
  }

  const map: Record<string, CreatorStyleSchema> = {};

  for (const creator of CREATORS || []) {
    const schema = Object.freeze(buildCreatorStyleSchema(creator));
    const canonicalKey = creator.id.toLowerCase().replace(/\s+/g, "").replace("@", "");
    map[canonicalKey] = schema;
    map[creator.id] = schema;

    if (creator.bio?.id) {
      map[creator.bio.id.toLowerCase()] = schema;
    }

    const preset =
      CREATOR_PRESET_OVERRIDES[canonicalKey] ||
      Object.values(CREATOR_PRESET_OVERRIDES).find(p =>
        p.aliases.includes(canonicalKey)
      );

    if (preset) {
      for (const alias of preset.aliases) {
        map[alias.toLowerCase().replace("@", "")] = schema;
      }
    }
  }

  cachedRegistryMap = Object.freeze(map);
  return cachedRegistryMap;
};

/**
 * Resolves the full CreatorStyleSchema (including vocalCadence, analogyRule, authorityFraming,
 * avoidList, transitions, fewShotExamples, and profile) from a creator ID, CreatorProfile, or existing schema.
 */
export const getCreatorStyleSchema = (
  creatorOrId?: CreatorProfile | ShortClipperStyleBlueprint | string | null
): CreatorStyleSchema => {
  const registry = ensureRegistryMap();
  const defaultSchema = registry[CREATORS[0].id];

  if (!creatorOrId) {
    return defaultSchema;
  }

  if (typeof creatorOrId === "string") {
    const cleanKey = creatorOrId.toLowerCase().replace(/\s+/g, "").replace("@", "");
    if (registry[cleanKey]) {
      return registry[cleanKey];
    }
    const matchedCreator = CREATORS.find(
      c =>
        c.id === cleanKey ||
        c.name.toLowerCase().replace(/\s+/g, "") === cleanKey ||
        c.id.includes(cleanKey) ||
        cleanKey.includes(c.id)
    );
    if (matchedCreator && registry[matchedCreator.id]) {
      return registry[matchedCreator.id];
    }
    return defaultSchema;
  }

  // Already a full CreatorStyleSchema / ShortClipperStyleBlueprint
  if (
    "vocalCadence" in creatorOrId &&
    "analogyRule" in creatorOrId &&
    "authorityFraming" in creatorOrId &&
    Array.isArray(creatorOrId.avoidList)
  ) {
    const existingKey = creatorOrId.id
      ?.toLowerCase()
      .replace(/\s+/g, "")
      .replace("@", "");
    const base = existingKey ? registry[existingKey] : undefined;
    return {
      ...(base || defaultSchema),
      ...creatorOrId,
      profile:
        creatorOrId.profile ||
        base?.profile ||
        CREATORS.find(c => c.id === creatorOrId.id) ||
        CREATORS[0]
    };
  }

  // It's a CreatorProfile object
  const profileKey = creatorOrId.id
    ?.toLowerCase()
    .replace(/\s+/g, "")
    .replace("@", "");
  if (profileKey && registry[profileKey]) {
    return registry[profileKey];
  }

  return buildCreatorStyleSchema(creatorOrId as CreatorProfile);
};

export interface CreatorRegistryHelper {
  readonly byId: Readonly<Record<string, CreatorStyleSchema>>;
  get: (
    creatorOrId?: CreatorProfile | ShortClipperStyleBlueprint | string | null
  ) => CreatorStyleSchema;
  getAll: () => CreatorStyleSchema[];
  has: (id: string) => boolean;
  [creatorKey: string]:
    | CreatorStyleSchema
    | Readonly<Record<string, CreatorStyleSchema>>
    | ((...args: any[]) => any);
}

const baseRegistryTarget: Record<string, any> = {
  get: getCreatorStyleSchema,
  getAll: (): CreatorStyleSchema[] => {
    const reg = ensureRegistryMap();
    return CREATORS.map(c => reg[c.id]);
  },
  has: (id: string): boolean => {
    const reg = ensureRegistryMap();
    const clean = (id || "").toLowerCase().replace(/\s+/g, "").replace("@", "");
    return Boolean(reg[clean]);
  }
};

/**
 * Unified `creatorRegistry` helper:
 * Supports both direct property lookup (`creatorRegistry.dhruvrathee`, `creatorRegistry[selectedId]`)
 * and structured helper methods (`creatorRegistry.get(creatorOrId)`, `creatorRegistry.getAll()`).
 */
export const creatorRegistry: CreatorRegistryHelper = new Proxy(
  baseRegistryTarget as CreatorRegistryHelper,
  {
    get(target, prop: string | symbol) {
      if (typeof prop === "symbol") {
        return Reflect.get(target, prop);
      }
      if (prop in target) {
        return target[prop];
      }
      if (prop === "byId") {
        return ensureRegistryMap();
      }
      const reg = ensureRegistryMap();
      const cleanKey = prop.toLowerCase().replace(/\s+/g, "").replace("@", "");
      return reg[prop] || reg[cleanKey];
    },
    ownKeys(target) {
      const reg = ensureRegistryMap();
      return Array.from(new Set([...Object.keys(target), "byId", ...Object.keys(reg)]));
    },
    getOwnPropertyDescriptor(target, prop: string | symbol) {
      if (typeof prop === "string") {
        const reg = ensureRegistryMap();
        if (prop in reg) {
          return {
            enumerable: true,
            configurable: true,
            value: reg[prop]
          };
        }
      }
      return Object.getOwnPropertyDescriptor(target, prop);
    }
  }
);

