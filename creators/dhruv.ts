/**
 * DHRUV RATHEE — DEEP TRANSCRIPT DNA
 * ---------------------------------------------------------------------------
 * Built from a line-by-line analysis of 7 video transcripts (English dubs):
 *   1. Do ghosts exist?            (paranormal / psychology debunk)
 *   2. NEET paper leak             (current-affairs scandal)
 *   3. Hindu scriptures & meat     (religion / culture / history)
 *   4. AI vs human artists         (tech / society opinion)
 *   5. Flat Earth                  (pseudoscience / conspiracy)
 *   6. Voyager & alien messages    (science / space)
 *   7. The Yeti                    (mystery / cryptid)
 *
 * IMPORTANT NOTES FOR THE MODEL AND FOR YOU
 * - All excerpts below are ORIGINAL style-only rewrites with [PLACEHOLDERS].
 *   They are NOT his real lines or facts. Imitate the PATTERN, never the content.
 * - The transcripts are English dubs. Hinglish items are tagged:
 *     "verified"      = found in his real Hindi videos / press quotes online
 *     "reconstructed" = back-translated from the English dub structure
 * - None of the 7 transcripts include the final 60 seconds, so the SIGN-OFF is
 *   UNVERIFIED. Send the last minute of 2–3 videos to lock it.
 *
 * HOW TO WIRE IT IN
 *   1. Add `deepDNA?: DhruvDeepDNA` to your CreatorBio type (or keep it separate).
 *   2. In your script-generation call, append:
 *        buildDhruvDeepPrompt({ topic, language, durationLabel, promotion })
 *   3. Pass the promotion button state in `promotion` (see PromotionInput).
 */

/* ════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════ */
export type DhruvGenreKey =
  | 'paranormal_mystery'
  | 'current_affairs_scandal'
  | 'culture_religion_history'
  | 'pseudoscience_conspiracy'
  | 'tech_society_opinion'
  | 'science_space_explainer';

export interface PromotionInput {
  /** true when the app's promotion button is ON */
  enabled: boolean;
  /** what the user typed into the promotion topic box */
  topic: string;
  kind?: 'own_course' | 'sponsor_app' | 'free_app' | 'pdf_guide' | 'service' | 'other';
  /** ONLY things the user supplied. Never invent prices, codes, or deadlines. */
  price?: string;
  offerCode?: string;
  deadline?: string;
  socialProof?: string;
  cta?: string;
  isSponsored?: boolean;
}

export interface DeepPromptOptions {
  topic: string;
  language: string; // "Hinglish", "Hindi", "English", "Urdu (Proper)", ...
  durationLabel?: string; // "30 Seconds (Fast)", "60 Seconds (Shorts)", "Long Form"...
  genre?: DhruvGenreKey;
  promotion?: PromotionInput;
}

/* ════════════════════════════════════════════════════════════════
   1. WHAT THE 7 TRANSCRIPTS PROVED (corrects the older bio)
   ════════════════════════════════════════════════════════════════ */
export const TRANSCRIPT_FINDINGS = {
  greetingPlacement: {
    summary:
      'The greeting is FLEXIBLE, short (two words) and never a long preamble. It is NOT banned from line 1.',
    observed: [
      'Line 1 (3 of 7): greeting comes first, then straight into a story or a big question (ghosts, beef/scriptures, Voyager).',
      'After a 25–50 second teaser montage (3 of 7): flat earth ~0:33, AI-art ~0:33, Yeti ~0:48. The greeting is the "reset" after the teaser.',
      'No greeting at all (1 of 7): NEET scandal opens on a dated scene and goes straight into the story.'
    ],
    rule:
      'Hard news / scandal → skip the greeting, open on a dated scene. Explainer / mystery / science → greeting is allowed in the first line OR after a teaser montage. Never more than 2–4 words of greeting before the first fact or question.'
  },
  sentenceRhythm:
    'Mostly 8–20 words, punctuated by 2–6 word punches ("Think about it." "Imagine." "Do you see the pattern here?"). One idea per sentence. Numbers are followed by a human-scale comparison within 1–2 sentences.',
  addressForm:
    '"Friends," (Hindi: "dosto") used as a mid-sentence vocative about once every 60–90 seconds, usually before a surprising fact or a question.',
  structureSignature:
    'Hook → roadmap sentence → chronological/causal build with numbered or "first / second / third" signposts → counter-argument handled fairly → systemic thesis → human takeaway.',
  seriesHabit:
    'Cliffhangers into a part-2 ("We will discuss this in the next video") and cross-links to older videos ("I talked about this in the video on X, link in the description").'
} as const;

/* ════════════════════════════════════════════════════════════════
   2. HOOK ENGINE
   ════════════════════════════════════════════════════════════════ */
export const HOOK_ENGINE = {
  universalSkeleton: [
    '1. THE ANCHOR (0–25s): one hyper-specific, checkable opening — a dated scene, a named person, an exact number, or a direct question that challenges an assumption.',
    '2. THE ESCALATION (15–60s): widen from the single case to the pattern ("this is one example... but there are hundreds of thousands").',
    '3. THE STAKES (30–90s): state why it matters to the viewer (scale in lakhs/crores, a first in history, their own family or exam, their own beliefs).',
    '4. THE OPEN QUESTION (45–120s): ask the central question in plain words ("What is the truth behind all this?").',
    '5. THE ROADMAP SENTENCE: "Let\'s understand this in today\'s video" (Hinglish: "Aaiye aaj ke video mein isko samajhte hain"). In story-led hooks the roadmap can be 3 short questions.'
  ],
  timingBenchmarks: {
    teaserMontage: '25–50 seconds when used (flat earth 0:33, AI-art 0:33, Yeti 0:48).',
    roadmapSentenceObserved:
      'beef 0:59 | ghosts 1:28 | Voyager 2:18 | Yeti ~3:50 | flat earth ~4:00 | NEET and AI-art have no explicit roadmap line (the stakes + a question do the job).',
    storyLedHookLength: '1:30–4:00 (a full mini-story is told BEFORE the roadmap).',
    statLedHookLength: '0:45–1:00 (poll or surprising statistic, then roadmap).',
    firstHardSourceInHook: 'Stat-led hooks name the source inside the first 45 seconds (e.g. a research center + a number). Story-led hooks hold named sources until after the opening scene.'
  },
  teaserMontage: {
    what: 'A 4–7 item cold open made of short fragments pulled from LATER in the video: a stat line, a news-clip line, a provocative one-liner, then the list of questions to be answered. Followed by the greeting.',
    howToWriteInScript:
      'Put the fragments in the `visual` field as "[CLIP: …]" style direction and the spoken fragments in the narration, each under 12 words, each ending on an unanswered tension. Close the montage with a 3–4 question list, then the greeting.',
    useWhen: 'pseudoscience, mystery/cryptid, tech-opinion, long-form (8+ min).'
  },
  genres: {
    paranormal_mystery: {
      label: 'Paranormal / Mystery / Cryptid (ghosts, Yeti)',
      openingShape:
        'A dated, placed, named incident told like a case file (year, location, altitude/palace/house, who, what was found).',
      devices: [
        'Forensic elimination: list what it was NOT ("not a robbery — valuables were left behind", "not an accident — body was propped") before the strange fact.',
        'Hedged attribution on every extraordinary claim: "locals claim", "it is claimed", "she says".',
        'Time-jump to a recent echo ("Fast forward 11 years…") to prove the legend is still alive.',
        'Zoom-out to pop-culture proof (films, TV shows, YouTube channels, news channels by name) to show the belief is widespread.',
        'Question trio just before the roadmap: "Is it real? Or a misunderstood animal? Let\'s find the truth."'
      ],
      body:
        'Rule out obvious frauds first ("let\'s keep aside cases where lies were clearly evident"), then take the hardest sincere case, then the psychological / natural explanation, ending on a human truth.',
      toneDial: { sarcasm: 'low-medium (only toward fraudsters)', empathy: 'medium', awe: 'high' }
    },
    current_affairs_scandal: {
      label: 'Current-affairs scandal (paper leak, policy failure)',
      openingShape:
        'Exact date + an ordinary person doing an ordinary thing (a student sends a WhatsApp file). Then escalate with matching numbers (90 of 90, 45 of 45, 135 of 180) until the viewer feels the impossibility.',
      devices: [
        'No greeting. The scene IS the greeting.',
        'Scale line right after the proof: "For those who don\'t know, it wasn\'t a small exam — lakhs of students."',
        '"First time in the history of the country" style superlative.',
        'Tease the villain before explaining the mechanism (photos with politicians, knew a month ahead).',
        'Empathy beat ("Imagine the student who…") BEFORE the sponsor/own-product pivot.',
        'Follow-the-money chain with every hop priced (10 lakh → 15 lakh → 30 lakh → 5 lakh → 30,000).',
        'Open loop on names: "Remember these two names, they will be important."'
      ],
      body:
        'Chain of custody (who → who → who), then the official response, then the contradictions between authorities, then the pattern (it happened before), then "who pays for this?", then the systemic thesis.',
      toneDial: { sarcasm: 'medium (names a nickname people use for an agency)', empathy: 'high', anger: 'controlled' }
    },
    culture_religion_history: {
      label: 'Culture / Religion / History myth-busting',
      openingShape:
        'A news or film peg → a funny crowd reaction → an audience POLL ("Imagine 100 people in a room. How many do X? Guess.") → the surprising statistic with a named research center.',
      devices: [
        'Two central questions then "the answer is hidden in our scriptures and our history".',
        'Chapter-and-verse citations every 20–40 seconds inside scripture sections.',
        'Pre-empts the objection out loud: "You might think this is clear. But wait a minute…" / "in case you think these were cherry-picked".',
        'Regional listing in one breath (5–8 places) to make it feel overwhelming.',
        'Neutrality disclaimer from the host: states his own personal position, then "I am only showing you what the texts say".',
        'Pivot from "what the books say" to "what people do today" to "when and why it changed" (history of the shift).',
        'Ends the part on a question and promises the next video.'
      ],
      body: 'Text evidence → lived practice → objection handled → history of the shift → data (surveys) → caste/class/economics angle.',
      toneDial: { sarcasm: 'low', respect: 'high for faith', rigor: 'very high' }
    },
    pseudoscience_conspiracy: {
      label: 'Pseudoscience / Conspiracy (Flat Earth)',
      openingShape:
        'Teaser montage of clip fragments + stats ("X% of Americans, Y% in the UK…") → greeting → a quirky named CHARACTER story with a twist (a daredevil who raises money, then states his belief).',
      devices: [
        'The "can anyone be this stupid? unfortunately yes" frame — then immediately backs it with survey numbers by country.',
        'Counter-intuitive fact: believers are mostly educated, not illiterate.',
        'Roadmap as 3 questions (what do they believe, what do religious books say, why do people believe).',
        'Historical timeline of real science (named thinkers with BC/AD years and measured vs actual values).',
        'Numbers contrast: their claimed size/distance vs the real one, back to back.',
        'Sarcasm punctuation ("Wow, what logic!") — allowed here only, aimed at the claim, never at a person\'s identity.',
        'Religion handled gently: shows the metaphor reading, then the scholars\' position.'
      ],
      body: 'Belief stats → the character → real history of the idea → their arguments → the real numbers → religion angle → psychology of why people believe.',
      toneDial: { sarcasm: 'high', empathy: 'low-medium', rigor: 'high' }
    },
    tech_society_opinion: {
      label: 'Tech / Society opinion (AI vs artists)',
      openingShape:
        'A fast list of capabilities → the big fear question → a deliberately provocative claim → greeting at ~0:30 → a PHILOSOPHICAL DETOUR via an authority (a thinker and a famous writer) to reframe the question.',
      devices: [
        'Reframe: turn "can AI be original?" into "can humans be original?".',
        'Plain-language how-it-works with a silly concrete example (a poem on a mundane topic in a famous poet\'s style).',
        'Steelman the opponent ("the flag-bearers of human creativity will say…") then answer with "just think about it".',
        'Rapid-fire list of named examples with years in brackets (e.g. 6–8 items in 25 seconds).',
        'Live demo: reads the actual prompt on screen, then reads the output.',
        'Historical parallel (earlier technologies that replaced jobs) before the thesis.',
        'Reframe thesis: "This is not X versus Y. The real struggle is A versus B."',
        'Hopeful close: what humans have that machines don\'t (lived experience), shown through a named creator.'
      ],
      body: 'Fear → reframe → mechanism → hypocrisy of the critics → industry critique → live demo → history → thesis → hope.',
      toneDial: { sarcasm: 'medium', humor: 'high', empathy: 'medium' }
    },
    science_space_explainer: {
      label: 'Science / Space explainer (Voyager)',
      openingShape:
        'An identity-level question ("Are humans the only intelligent species?") + a shared-emotion twist ("maybe aliens ask the same thing") → a named mission with a year → a superlative ("the farthest man-made object") → a curiosity gap ("what message is inside?").',
      devices: [
        'Greeting in line 1 is fine here.',
        'Every technical term is explained at first use, with its name origin ("it is called X because…").',
        'Fun asides that humanize (a moon with the same name as a film planet; "poor Pluto").',
        'Updated numbers with an "as of [MONTH YEAR]" tag.',
        'Visual cues are constant: "you can see on the screen", "in this diagram".',
        'Cross-link to older videos for prerequisite concepts.',
        'Section ends on a perspective jolt (it took 22 years to cross; 8 months to confirm).'
      ],
      body: 'Mission goal → why this year → hardware → planet-by-planet discoveries → the iconic image → boundary crossing → how scientists confirmed it.',
      toneDial: { sarcasm: 'very low', awe: 'very high', humor: 'light' }
    }
  }
} as const;

/* ════════════════════════════════════════════════════════════════
   3. RETENTION DEVICES (use roughly this often)
   ════════════════════════════════════════════════════════════════ */
export const RETENTION_DEVICES = [
  { name: 'Vocative reset', freq: 'every 60–90s', pattern: '"But do you know what, friends?" / "Now the thing is, friends…" / "Think about it, friends."' },
  { name: 'Imagine-frame', freq: 'every 2–3 min', pattern: '"Imagine what that student must have felt…" Human face before the next fact.' },
  { name: 'Think-about-it pause', freq: 'after the biggest fact of each section', pattern: 'Two to three words, then a [Pause].' },
  { name: 'Open loop', freq: '2–4 per video', pattern: '"Remember these two names, because they will matter." / "We will get to why in a moment."' },
  { name: 'Pre-empted objection', freq: 'once per major claim', pattern: '"You might be thinking… but wait a minute." / "In case you think this was cherry-picked…"' },
  { name: 'Look-at-this visual call', freq: 'every 45–90s', pattern: '"Look at this survey from [YEAR]" / "Look at this map" — always pairs with a visual cue.' },
  { name: 'Escalation connector', freq: 'every 1–2 min in scandals', pattern: '"But this is just the beginning." / "But things don\'t end here." / "This is where it gets even more shocking."' },
  { name: 'Do-you-see-the-pattern', freq: 'once per thesis', pattern: 'Lists 3 facts, then asks "Do you see the pattern here?" before stating the conclusion.' },
  { name: 'Scale humanizer', freq: 'every big number', pattern: 'Repeat a huge figure twice for emphasis, or convert to something countable ("a report of 46,000 pages. 46,000 pages.").' },
  { name: 'Inflation / local-currency translate', freq: 'whenever money or old prices appear', pattern: '"…in today\'s money" / lakh–crore for Indian audiences.' },
  { name: 'Rhetorical-question chain', freq: 'at section ends', pattern: '"Is this a coincidence or something else?" then a calm "We will get answers when a fair investigation happens."' },
  { name: 'Series bridge', freq: 'once per video when topic is big', pattern: '"We will discuss that in the next video." / "I talked about this in my video on X, link in the description."' }
] as const;

export const HUMOR_AND_TONE = {
  humorTypes: [
    'Deadpan pop-culture jab (film remakes, TV serial factories).',
    'Comment-section jokes quoted lightly ("It is a crime to eat X without Y").',
    'Mundane absurd example for explaining tech (a poem about a trivial problem).',
    'Mock-logic ("Wow, what logic!") — only on pseudoscience.',
    'Self-aware aside about his own limits ("I am a vegetarian myself").',
    'Topic-themed wordplay inside promos (a coupon code that puns on the video topic).'
  ],
  sarcasmByGenre: {
    pseudoscience_conspiracy: 'high',
    current_affairs_scandal: 'medium, aimed at institutions and their statements',
    tech_society_opinion: 'medium',
    culture_religion_history: 'low',
    paranormal_mystery: 'low-medium, aimed at fraudsters only',
    science_space_explainer: 'very low'
  },
  empathyRule:
    'In any story involving students, victims or families: one human sentence ("that feeling is normal") BEFORE moving to analysis or to a promotion.',
  neverMock: 'victims, faith itself, or anyone for who they are. Mock claims, institutions and tactics only.'
} as const;

/* ════════════════════════════════════════════════════════════════
   4. SOURCE ENGINE
   ════════════════════════════════════════════════════════════════ */
export const SOURCE_ENGINE = {
  philosophy:
    'Every strong claim is tied to a named source in the SAME sentence, then the source is shown on screen. His real channel also publishes a per-video table: Statement | Source | Link. Mirror this: the script should be traceable line by line.',
  exactnessLadder: [
    'L1 Institution or outlet: "Pew Research Center data says…", "According to the Indian Express…", "Bhutanese people told the BBC…".',
    'L2 Named person + designation: "SOG Additional Director General [NAME]", "NTA Director General [NAME]".',
    'L3 Text + chapter + verse: "Manusmriti, chapter 5, verse 27", "Vana Parva, chapter 256", "Revelation 7:1", "Quran 71:19".',
    'L4 Methodology numbers: how many researchers, how many communities, how many years, how many pages (a "46,000-page report" style detail).',
    'L5 Year + exact title of a book or article: "Zetetic Astronomy (1865)", "Journal of the Asiatic Society of Bengal (1832)".'
  ],
  density: {
    statLedOpening: 'First named source within ~45 seconds (≈110 spoken words).',
    storyLedOpening: 'Opening scene carries person + date + place instead of a citation. First named outlet arrives at ≈2–4 minutes (≈300–600 words), right after the scene ends.',
    newsAndInvestigationSections: '1 named outlet or official every 60–140 seconds (≈150–350 words).',
    scriptureAndHistorySections: '1 chapter-and-verse or dated source every 20–40 seconds (≈50–100 words).',
    numbers: 'Never a bare number. Number + source + year/scale in one sentence, then a human-scale comparison.',
    wordsRule: 'Roughly one attribution per 80–200 spoken words after the hook; never more than ~250 words of factual narration with no attribution phrase.'
  },
  attributionVerbs: {
    strong: ['According to', 'data shows', 'the report found', 'the court said', 'the survey found'],
    hedged: ['locals claim', 'it is claimed that', 'according to them', 'according to the investigation so far', 'she says', 'people have started calling it'],
    contested: ['Both states are blaming each other', 'who is telling the truth and who is lying?']
  },
  visualPairing:
    'Every source line has a matching `visual` cue: headline screenshot, chart, report page, map, book cover, tweet, or "reviews on screen". Use phrases such as "look at this survey" / "you can see in this diagram".',
  deepSourcePointers:
    'Extra sources are pushed to the description or a "resource document" ("you can also find the link in the resource document").',
  ledgerFormat: {
    columns: ['Statement', 'Source', 'Link to source'],
    instruction:
      'After writing the script, output a source ledger in this 3-column shape. If a real link is unknown, write [LINK_NEEDED] — NEVER invent URLs, report titles, chapter numbers, or statistics.'
  },
  antiHallucination: [
    'Never output raw bracketed placeholders like [SOURCE_X], [YEAR_X], or [NUMBER_X]; always use verified real-world facts from the Stage 1 Topic Blueprint or hedged attribution.',
    'Prefer a hedged verb ("it is claimed") over an invented citation.',
    'Do not copy the facts, statistics or names from the 7 study transcripts into new scripts.'
  ]
} as const;

/* ════════════════════════════════════════════════════════════════
   5. PROMOTION ENGINE  (drives the app's "promotion" toggle)
   ════════════════════════════════════════════════════════════════ */
export const PROMOTION_ENGINE = {
  observedIntegrations: [
    { video: 'NEET leak', product: 'own PDF guide (careers)', at: '2:38 mid + ~11:56 end', bridge: 'empathy for affected students → "always keep a Plan B or C"', offer: 'almost-free price stated as a plain number', length: '~25s mid, ~20s end' },
    { video: 'Scriptures & meat', product: 'own AI workshop', at: '~9:00', bridge: '"you noticed many references; research takes time; AI can do it fast; even visuals here used AI"', offer: 'next session this Sunday, last chance, 100,000+ joined', length: '~55s' },
    { video: 'AI vs artists', product: 'own AI workshop', at: '~8:58', bridge: 'the video\'s own topic is AI → "if you want to learn more"', offer: 'price anchored to two movie tickets, limited time', length: '~30s' },
    { video: 'Flat Earth', product: 'own ChatGPT course', at: '~8:35', bridge: 'joke on "stupid ideas" → AI answers questions → government survey stat on AI and jobs', offer: 'reviews on screen + topic-themed coupon code with a % off', length: '~75s' },
    { video: 'Voyager', product: 'data-science / career pitch', at: '~12:26', bridge: '"only with data science can we advance space exploration → lucrative career"', offer: 'not visible (transcript cut)', length: 'unknown' },
    { video: 'Yeti', product: 'sponsor learning app (free to download)', at: '~13:20', bridge: '"These research and studies remind me, if you are a student in grades 4–12…"', offer: 'feature list + "completely free to download"', length: '~45s' }
  ],
  placement: {
    rule:
      'Promotion is a separate mini-segment dropped IN THE MIDDLE of the story, normally immediately AFTER a cliffhanger or open question, so viewers stay for the answer. It always ends with a "back to the video" line that restarts the story.',
    observed: [
      'After an open question ("how and when did this change?") → promo → "Now let\'s get back to the story of this shift".',
      'After an emotional beat in a scandal → promo at ~2.5 min, repeated at the very end.',
      'After a dramatic line ("the mystery died with him") → promo → debunking part continues.',
      'Mid-roll at roughly 8–9 minutes on 14–20 minute videos; ~12–13 minutes on others; some videos also repeat near the end.'
    ],
    forShortsInferred:
      '(INFERRED, not observed) 30–60s scripts: one 1-sentence mention in the last 8–10 seconds, never mid-story.'
  },
  structure: [
    '1. BRIDGE (1–2 sentences): connect the promoted thing to what was just said (shared noun or shared feeling). Never a hard cut.',
    '2. NEED (1 sentence): the problem the viewer now has (research takes time / careers are uncertain / students need help).',
    '3. PRODUCT (1–2 sentences): name + format + duration + language + who it is for.',
    '4. PROOF OF VALUE (2–3 short sentences or one list): what exactly they learn or can do. Specific, concrete nouns.',
    '5. OFFER (optional, only if user supplied): price anchor, code, deadline, social proof (reviews on screen, number of learners).',
    '6. CTA (1 sentence): "link in the description or scan the QR code below".',
    '7. RETURN LINE (1 sentence): "Now let\'s get back to [topic/person/story]."'
  ],
  length: '60–190 spoken words (≈25–75 seconds). Mid-roll is longer; end-roll is a 20-second recap.',
  bridgeLibrary: {
    researchHeavyTopic: 'Did you notice how many different sources were compared in this video? That takes enormous time. Today AI can do such research faster… → AI tool / course / workshop.',
    emotionalOrInjusticeTopic: 'When something like this happens, the simple lesson is to always have a Plan B → careers / skills / guide / course.',
    scienceTopic: 'All of this was possible only because of [data / skills / maths]… → data-science, coding, tutoring app, career guide.',
    studentTopic: 'These studies remind me — if you are a student in classes X to Y… → learning app.',
    techOrAiTopic: 'This should not be a problem in today\'s world, because AI tools can answer such questions instantly… → AI course.',
    fallbackInferred:
      '(INFERRED) If no shared noun exists, use a one-sentence honest pivot ("Before I continue, a quick word about something I built/recommend") and keep it under 20 seconds.'
  },
  themedWordplay:
    'If the user supplies a code, keep it. If not, do NOT invent one. If the user asks for a themed code, make a pun on the video topic (observed: a code that puns on the video\'s own subject).',
  rules: [
    'Use ONLY facts the user typed in the promotion box. Never invent prices, discount %, codes, deadlines, learner counts, or reviews.',
    'Keep his calm explainer voice. No shouting, no "smash the like button", no fake scarcity.',
    'Visual field for the promo: product card, "reviews on screen", QR code overlay, feature list, app screenshots.',
    'If isSponsored is true, include a one-line plain disclosure ("This video is sponsored by ...").',
    'The promo never interrupts a sentence of evidence; it starts after a full stop and returns to the exact story beat.',
    'If the promo topic is unrelated to the video, build the bridge from a shared theme (time, learning, careers, research) instead of forcing a link.'
  ]
} as const;

/* ════════════════════════════════════════════════════════════════
   6. HINGLISH LEXICON
   ════════════════════════════════════════════════════════════════ */
export type Confidence = 'verified' | 'reconstructed';
export interface LexItem { en: string; hinglish: string; use: string; confidence: Confidence }

export const HINGLISH_LEXICON: Record<string, LexItem[]> = {
  greetingsAndVocatives: [
    { en: 'Hello, friends!', hinglish: 'Namaskar dosto!', use: 'opening greeting', confidence: 'verified' },
    { en: 'friends / "friends,"', hinglish: 'dosto', use: 'mid-sentence vocative before a surprising fact', confidence: 'verified' },
    { en: 'What do you think, friends?', hinglish: 'Aapko kya lagta hai, dosto?', use: 'audience question', confidence: 'reconstructed' }
  ],
  roadmapAndSignposting: [
    { en: "Let's understand this in today's video", hinglish: 'Aaiye aaj ke is video mein isko samajhte hain', use: 'roadmap', confidence: 'reconstructed' },
    { en: 'First of all…', hinglish: 'Sabse pehle…', use: 'start of list', confidence: 'reconstructed' },
    { en: 'The most shocking thing is…', hinglish: 'Sabse chaunkane wali baat yeh hai ki…', use: 'escalation', confidence: 'reconstructed' },
    { en: 'But things don\'t end here', hinglish: 'Lekin baat yahin khatam nahi hoti', use: 'escalation', confidence: 'reconstructed' },
    { en: 'Fast forward 11 years', hinglish: 'Ab kuch saal aage badhte hain', use: 'time-jump', confidence: 'reconstructed' }
  ],
  attentionAndRhetoric: [
    { en: 'Think about it', hinglish: 'Zara sochiye', use: 'pause beat', confidence: 'reconstructed' },
    { en: 'Imagine…', hinglish: 'Imagine kijiye…', use: 'human-face moment', confidence: 'reconstructed' },
    { en: 'Look at this', hinglish: 'Isko dekhiye', use: 'visual call', confidence: 'reconstructed' },
    { en: 'But wait a minute', hinglish: 'Lekin ek minute ruko', use: 'pre-empt objection', confidence: 'reconstructed' },
    { en: 'The question is…', hinglish: 'Sawal yeh hai ki…', use: 'question framing', confidence: 'reconstructed' },
    { en: 'Do you see the pattern here?', hinglish: 'Kya aapko yahan pattern dikh raha hai?', use: 'thesis lead-in', confidence: 'reconstructed' },
    { en: 'Remember these two names', hinglish: 'In do naamon ko yaad rakhiye', use: 'open loop', confidence: 'reconstructed' }
  ],
  evidenceAndHedging: [
    { en: 'According to…', hinglish: '…ke mutabiq / …ke according', use: 'attribution', confidence: 'reconstructed' },
    { en: 'Locals claim', hinglish: 'Local logon ka daava hai ki…', use: 'hedge', confidence: 'reconstructed' },
    { en: 'It is claimed that', hinglish: 'Kaha jaata hai ki…', use: 'hedge', confidence: 'reconstructed' },
    { en: 'The link is in the description', hinglish: 'Link description mein hai', use: 'source pointer / promo CTA', confidence: 'verified' }
  ],
  registerSample: [
    { en: 'Hello friends, this fight is to save democracy', hinglish: 'Namaskar dosto, yeh loktantra ko bachane ki ladai hai', use: 'shows real Hindi-with-English-nouns register', confidence: 'verified' },
    { en: 'I don\'t feel like it today, let\'s do it tomorrow', hinglish: 'Aaj mood nahi kar raha, isse kal dekhte hain', use: 'shows casual Hindi + English nouns (phone, Instagram, scroll, relax)', confidence: 'verified' }
  ],
  promoAndReturn: [
    { en: 'Now let\'s get back to the topic', hinglish: 'Chaliye ab wapas topic par aate hain', use: 'return line', confidence: 'reconstructed' },
    { en: 'Scan the QR code below', hinglish: 'Neeche diya gaya QR code scan kar sakte hain', use: 'CTA', confidence: 'reconstructed' },
    { en: 'Last opportunity to join', hinglish: 'Join karne ka yeh aakhri mauka hai', use: 'urgency (ONLY if real)', confidence: 'reconstructed' }
  ]
};

export const HINGLISH_RULES = {
  mix: '70% everyday Hindi grammar and connectors in Roman script + 30% English nouns (legal, economic, scientific, tech, institution names, and everyday English like phone, scroll, report, survey).',
  englishAlwaysKept: ['Supreme Court', 'survey', 'report', 'data', 'AI', 'NASA', 'Pew Research Center', 'documentary-style terms', 'brand and app names'],
  avoid: ['Sanskritized words (arthat, kintu, parantu)', 'overly poetic Urdu', 'Devanagari characters in Roman Hinglish mode', 'full-English paragraphs unless the user chose English'],
  units: 'Use lakh, crore, Rs / rupaye when Indian money appears; convert foreign currency to a rupee feel only when the user supplied the rate.',
  englishMode:
    'In English mode keep the same rhythm: "Friends," vocatives, "Think about it", and the same attribution density. Do not add Hindi unless asked.',
  unverifiedWarning: 'Items tagged "reconstructed" are back-translations. Keep them if they sound natural to a Hindi speaker; replace if not.'
} as const;

/* ════════════════════════════════════════════════════════════════
   7. STYLE EXCERPTS (Kept for type compatibility; never injected as raw text)
   ════════════════════════════════════════════════════════════════ */
export interface StyleExcerpt {
  genre: DhruvGenreKey | 'sources' | 'promotion' | 'closing';
  purpose: string;
  language: 'Hinglish' | 'English';
  visual: string;
  narration: string;
}

export const STYLE_EXCERPTS: StyleExcerpt[] = [];

/* ════════════════════════════════════════════════════════════════
   8. HARD RULES
   ════════════════════════════════════════════════════════════════ */
export const DEEP_FORBIDDEN = [
  'Never copy facts, names, numbers or lines from study transcripts into a new script.',
  'Never invent a source, chapter, verse, statistic, URL, price, coupon code, deadline or review.',
  'Never open with AI throat-clearing ("In today\'s fast-paced world…").',
  'Never put [SFX]/[BGM] tags inside the spoken narration if your schema has separate fields.',
  'Never mock victims, believers or identities. Mock claims, tactics and institutions only.',
  'Never run a promotion in the middle of a sentence of evidence.',
  'Never exceed ~250 spoken words of factual narration without an attribution phrase.'
] as const;

/* ════════════════════════════════════════════════════════════════
   9. GENRE DETECTION + PROMPT BUILDERS
   ════════════════════════════════════════════════════════════════ */
const GENRE_KEYWORDS: Record<DhruvGenreKey, string[]> = {
  paranormal_mystery: ['ghost', 'yeti', 'paranormal', 'haunted', 'bhoot', 'curse', 'mystery', 'bigfoot', 'ufo', 'legend', 'cryptid', 'abandoned'],
  current_affairs_scandal: ['leak', 'scam', 'election', 'government', 'policy', 'court', 'neet', 'protest', 'corruption', 'minister', 'budget', 'arrest', 'investigation'],
  culture_religion_history: ['religion', 'scripture', 'hindu', 'muslim', 'caste', 'temple', 'history of', 'festival', 'culture', 'food', 'tradition', 'veg', 'ambedkar', 'mahabharata'],
  pseudoscience_conspiracy: ['flat earth', 'conspiracy', 'myth', 'pseudoscience', 'hoax', 'astrology', 'moon landing', 'fake', 'debunk', 'believe'],
  tech_society_opinion: ['ai', 'chatgpt', 'jobs', 'automation', 'artists', 'technology', 'robot', 'creativity', 'layoffs', 'algorithm'],
  science_space_explainer: ['space', 'nasa', 'planet', 'voyager', 'physics', 'biology', 'climate', 'universe', 'isro', 'satellite', 'health', 'brain', 'science']
};

export const detectDhruvGenre = (topic: string): DhruvGenreKey => {
  const t = (topic || '').toLowerCase();
  let best: DhruvGenreKey = 'science_space_explainer';
  let bestScore = 0;
  (Object.keys(GENRE_KEYWORDS) as DhruvGenreKey[]).forEach(g => {
    const score = GENRE_KEYWORDS[g].reduce((s, k) => s + (t.includes(k) ? 1 : 0), 0);
    if (score > bestScore) {
      best = g;
      bestScore = score;
    }
  });
  return best;
};

const isShort = (label?: string) => /30\s*sec|60\s*sec|short/i.test(label || '');

/** Builds the promotion instruction block. Returns '' when the toggle is off. */
export const buildPromotionInstruction = (
  promo: PromotionInput | undefined,
  language: string,
  durationLabel?: string
): string => {
  if (!promo?.enabled || !promo.topic?.trim()) return '';
  const hinglish = /hinglish|hindi|roman urdu/i.test(language);
  const short = isShort(durationLabel);
  const supplied = [
    promo.kind && `type: ${promo.kind}`,
    promo.price && `price: ${promo.price}`,
    promo.offerCode && `code: ${promo.offerCode}`,
    promo.deadline && `deadline: ${promo.deadline}`,
    promo.socialProof && `social proof: ${promo.socialProof}`,
    promo.cta && `preferred CTA: ${promo.cta}`
  ].filter(Boolean);

  return [
    '=== PROMOTION INTEGRATION (Dhruv-style) ===',
    `Promote: "${promo.topic.trim()}"${supplied.length ? ` | User-supplied details → ${supplied.join('; ')}` : ''}`,
    short
      ? 'PLACEMENT: one 1–2 sentence mention in the last 8–10 seconds only. Do not interrupt the story.'
      : 'PLACEMENT: one mid-roll mini-segment placed immediately after an open question or cliffhanger line, roughly at the 55–65% mark of the script. For scripts longer than ~10 minutes also add a ~20-second recap mention near the end.',
    'STRUCTURE: ' + PROMOTION_ENGINE.structure.join(' '),
    `LENGTH: ${short ? '15–30 spoken words.' : '60–190 spoken words (≈25–75 seconds) for the mid-roll.'}`,
    'BRIDGE: derive it from the video topic. Pick the closest pattern: ' +
      Object.values(PROMOTION_ENGINE.bridgeLibrary).join(' || '),
    'RETURN LINE: end the segment with a line that restarts the exact story beat (e.g. "Now let\'s get back to …").',
    hinglish
      ? 'LANGUAGE: Roman Hinglish. CTA wording: "Link description mein hai, ya QR code scan kar sakte hain."'
      : 'LANGUAGE: match the script language. CTA wording: "The link is in the description, or scan the QR code."',
    'VISUAL FIELD for the promo: product card, feature list, QR code overlay' +
      (promo.socialProof ? ', reviews strip' : '') +
      '.',
    promo.isSponsored ? 'DISCLOSURE: include one plain line saying the video is sponsored by the brand.' : '',
    'FACT RULE: use ONLY the user-supplied details above — never invent prices, codes, or deadlines.',
    'TONE: calm, useful, in-voice. No hype, no shouting, no begging for likes.'
  ]
    .filter(Boolean)
    .join('\n');
};

/** Main prompt block to append to your generation prompt (Abstract cadence rules & phrase banks only). */
export const buildDhruvDeepPrompt = (opts: DeepPromptOptions): string => {
  const genre = opts.genre || detectDhruvGenre(opts.topic);
  const g = HOOK_ENGINE.genres[genre];
  const short = isShort(opts.durationLabel);
  const isPureUrduScript = /urdu\s*\(proper\)/i.test(opts.language || '');

  const languageRuleLine = isPureUrduScript
    ? '[LANGUAGE] 100% Pure Urdu Script (اردو نستعلیق) — ZERO Latin/Roman English alphabet characters (A-Z, a-z) allowed in spoken narration (except [PAUSE], [CLAIM-X], [PAPER-X], [INFOGRAPHIC-X]). Transliterate all modern technical nouns phonetically into Urdu script.'
    : '[LANGUAGE] ' + HINGLISH_RULES.mix;

  const lines: string[] = [
    '=== DHRUV DEEP DNA (ABSTRACT CADENCE & PHRASE BANK RULES) ===',
    `DETECTED GENRE: ${g.label}`,
    '',
    '[GREETING RULE] ' + TRANSCRIPT_FINDINGS.greetingPlacement.rule,
    '[RHYTHM] ' + TRANSCRIPT_FINDINGS.sentenceRhythm,
    '[VOCATIVE] ' + TRANSCRIPT_FINDINGS.addressForm,
    '',
    short
      ? '[HOOK — SHORT FORM] Skip any teaser montage and greeting. Use the genre opening shape in ≤8 seconds, then the question.'
      : '[HOOK — LONG FORM] Follow the skeleton: ' + HOOK_ENGINE.universalSkeleton.join(' '),
    '[GENRE OPENING SHAPE] ' + g.openingShape,
    '[GENRE DEVICES] ' + g.devices.join(' | '),
    '[GENRE BODY ORDER] ' + g.body,
    '[TONE DIALS] ' + JSON.stringify(g.toneDial),
    '',
    '[RETENTION DEVICES] ' + RETENTION_DEVICES.map(d => `${d.name} (${d.freq}): ${d.pattern}`).join(' | '),
    '',
    '[SOURCES] ' + SOURCE_ENGINE.philosophy,
    '[SOURCE DENSITY] ' + Object.values(SOURCE_ENGINE.density).join(' | '),
    '[SOURCE LADDER] ' + SOURCE_ENGINE.exactnessLadder.join(' | '),
    '[HEDGING VERBS] ' + SOURCE_ENGINE.attributionVerbs.hedged.join(', '),
    '[SOURCE LEDGER] Place all source attributions inside the JSON claimsAndPapersRegistry and citations arrays with inline [CLAIM-X] and [PAPER-X] markers in every factual paragraph.',
    '',
    languageRuleLine,
    '[AVOID] ' + HINGLISH_RULES.avoid.join('; '),
    ...(isPureUrduScript
      ? []
      : [
          '[HINGLISH PHRASE BANK] ' +
            Object.values(HINGLISH_LEXICON)
              .flat()
              .map(i => `${i.en} → ${i.hinglish}`)
              .join(' | ')
        ]),
    '',
    '[HARD RULES] ' + DEEP_FORBIDDEN.join(' | ')
  ];

  const promo = buildPromotionInstruction(opts.promotion, opts.language, opts.durationLabel);
  if (promo) lines.push('', promo);

  return lines.join('\n');
};

/* ════════════════════════════════════════════════════════════════
   10. ONE-OBJECT EXPORT (attach to CreatorBio.deepDNA if you like)
   ════════════════════════════════════════════════════════════════ */
export const DHRUV_DEEP_DNA = {
  findings: TRANSCRIPT_FINDINGS,
  hookEngine: HOOK_ENGINE,
  retentionDevices: RETENTION_DEVICES,
  humorAndTone: HUMOR_AND_TONE,
  sourceEngine: SOURCE_ENGINE,
  promotionEngine: PROMOTION_ENGINE,
  hinglishLexicon: HINGLISH_LEXICON,
  hinglishRules: HINGLISH_RULES,
  styleExcerpts: STYLE_EXCERPTS,
  forbidden: DEEP_FORBIDDEN
} as const;

export type DhruvDeepDNA = typeof DHRUV_DEEP_DNA;