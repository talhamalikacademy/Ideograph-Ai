import { CreatorBio } from "../types";

/**
 * ============================================================================
 * THYNKWHY — DEEP DNA + BIO (v4: Full 6-Transcript Forensic Corpus + Web Research)
 * ----------------------------------------------------------------------------
 * PROVENANCE TAGS USED IN THIS FILE
 *   VERIFIED  = visible in public channel metadata (titles, descriptions, bio, tagline)
 *   TV        = TRANSCRIPT-VERIFIED across the 6 supplied full/10-min transcripts:
 *                 T1 = "Thynk is the Key to Success" (Channel Manifesto / "Why" Philosophy, 20:37)
 *                 T2 = "Pakistan's No.1 Problem: Lack of Civic Sense" (~9:12 seen)
 *                 T3 = "Thynk Today: Sidhu Moosewala Hologram / Pepper's Ghost Explainer" (~12:40 seen)
 *                 T4 = "Save Gen Z Before It's Too Late | Hidden Truth of The Digital Pandemic" (24:10)
 *                 T5 = "Did Pakistan Lose the Battle Against India? | War History 1965–2025" (32:45)
 *                 T6 = "The Real Story of Raftar | Why Muazzam Shah Quit? | Exposed" (22:47)
 *   WV        = WEB-VERIFIED from public YouTube channel/video metadata
 *   ADAPTED   = architecture tuned for Pakistani investigative documentary & social autopsy voice
 * ============================================================================
 */

/* ════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════ */
export type ThynkGenreKey =
  | "civic_national_psychology"
  | "social_taboo_expose"
  | "habit_lifestyle_psychology"
  | "hidden_business_economy"
  | "education_career_mindset"
  | "global_comparison_nation_building"
  | "public_life_governance_behaviour"
  | "history_identity_myth"
  | "purpose_why_philosophy"
  | "creator_rise_fall_biography"
  | "family_story_drama"
  | "media_narrative_rebuttal"
  | "tech_myth_bust_news_explainer"
  // v4 additions (TV T5 & T6)
  | "geopolitics_military_history_narrative"
  | "insider_media_whistleblower_memoir";

export interface PromotionInput {
  enabled: boolean;
  topic: string;
  kind?: "own_course" | "sponsor_app" | "free_app" | "pdf_guide" | "service" | "other";
  price?: string;
  offerCode?: string;
  deadline?: string;
  socialProof?: string;
  cta?: string;
  isSponsored?: boolean;
}

export interface DeepPromptOptions {
  topic: string;
  language: string;
  durationLabel?: string;
  genre?: ThynkGenreKey;
  promotion?: PromotionInput;
  includeMetadata?: boolean;
}

export interface GenreBlueprint {
  label: string;
  triggers: string[];
  stages: string[];
  reservedKeywords: string[];
}

/* ════════════════════════════════════════════════════════════════
   0. SHARED BLUEPRINTS (Duration & Format Overrides)
   ════════════════════════════════════════════════════════════════ */
export const THYNK_SHORT_STAGES: Record<string, string[]> = {
  "30 Seconds (Fast)": [
    "1. 5-Second Scene/Paradox Hook (One relatable scene or historical flash, no greeting)",
    "2. The Core Truth + 'Jee Nahi!' Counter-Snap (Bust the common assumption in one sharp line and show the local mirror scene)",
    "3. Mirror-Turn Question (End with one sharp 'hum kya kar rahe hain?' question that loops to the hook)"
  ],
  "60 Seconds (Shorts)": [
    "1. 6-Second Uncomfortable-Question or Past-vs-Present Hook (Scene + question, no greeting)",
    "2. 2-Point Breakdown (Point 1: the psychological/systemic root cause + Point 2: one global, historical, or rupee-cost comparison)",
    "3. Mirror Turn & 'Sawaal' Close (One actionable step + one comment-worthy question)"
  ],
  "Thynk Today Explainer (8-13 min)": [
    "1. 0:00-0:09 Second-Person Instruction Open ('Kahani sunne se pehle ek kaam kijiye...') + paradox line 'yeh hai bhi aur nahi bhi'",
    "2. 0:09-1:00 Dated Event Stamp + Sensory Reveal (date, weekday, city, venue, ticket price, crowd reaction, lights-out reveal)",
    "3. 1:00-1:55 Reaction Split (what the crowd believed vs 'sach yeh hai ki dono galat hain') ending in the 3-question roadmap",
    "4. 1:55-2:20 Three-Question Roadmap + Channel Ident ('Aap dekh rahe hain Thynk Today') + cross-link to main channel",
    "5. 2:20-3:40 Concept Primer by Everyday Analogy (the true term explained with a cup / photo / household object)",
    "6. 3:40-5:45 Origin Story of the Trick (inventor vs showman, years, money, ironic punchline, 'toh clear ho gaya')",
    "7. 5:45-8:30 Modern Case Chain (3-4 dated cases with local-currency cost and viewership, one regional case)",
    "8. 8:30-10:00 Return to Hook Event + The Label Problem (desi brand-genericide analogy: photocopy/photostate, detergent/Surf)",
    "9. 10:00-11:50 Ethical Twist + Religious Lens With Balance (view some hold + scholars' caution + 'masla technology hai ya maqsad?')",
    "10. 11:50-end Future Twist + Open Loop ('baat yahan khatam nahi hoti, asal kahani to abhi shuru hoti hai')"
  ],
  "Channel Manifesto Intro (3-6 min)": [
    "1. 0:00-0:56 Parable Cold Open (elevated register, no greeting) ending on 'main aapki tawajjuh us ... ki janib dilana chahta hoon'",
    "2. 0:56-1:20 Turn Question ('kya aaj hum apne hisse ka kaam kar rahe hain?') + 'mere paas is sawal ka jawab hai'",
    "3. 1:20-2:08 'aaya hai' Manifesto (8-12 anaphoric rhymed promises) ending on the subscribe-and-spread ask",
    "4. 2:08-3:50 The Why Concept (replace I with Y; the English one-line quote; 'isi why ke peeche jannat bhi hai aur dozakh bhi')",
    "5. 3:50-4:30 Rhymed Exemplar Peak (2-3 couplets naming figures and the single why each acted on)",
    "6. 4:30-5:30 Mirror Challenge + Humility Pivot ('believe me, aapki zindagi ka koi why nahi' then 'in hastiyon ke saamne main khaaksar hoon') + 'Sawaal Woh Jo' Crescendo"
  ]
};

export const THYNK_GENRE_BLUEPRINTS: Record<ThynkGenreKey, GenreBlueprint> = {
  civic_national_psychology: {
    label: "Civic Sense, National Behaviour & Mob-Mentality Autopsy",
    triggers: [
      "civic sense", "sha'oor", "shaoor", "traffic", "queue", "littering", "hygiene", "law", "rules", "mob", "mob mentality",
      "public behaviour", "manners", "responsibility", "mu'ashra", "zehniyat", "rawayya", "tehzeeb", "nation", "respect", "discipline",
      "ignorant vs illiterate", "bystander effect", "mimetic behaviour", "dj truck", "wedding road block", "baraat", "mehndi noise",
      "14 august", "new year silencer", "shab-e-barat", "eid garbage", "minar-e-pakistan", "mob culture", "beach loot", "red light",
      "slow in fast lane", "dustbin", "literacy rate"
    ],
    stages: [
      "1. Everyday Scene or Classroom-Question Hook: Drop the viewer into a relatable moment or definitional question ('Ignorant aur illiterate mein kya farq hai?') and ask 'aap kya karte?'.",
      "2. Official-Stat vs Research Twist + Mission CTA: Contrast a flattering official stat with reality ('Kya aap confuse ho gaye?'), deliver the 25s mission-tied subscribe/sister-channel beat, then 'Chaliye wapas aate hain kahani ki taraf'.",
      "3. Domestic Mirror + 'Hum' Symptom Run: Define the concept via a household scene (mother praising a relative's tidy house), then run 6-8 rapid 'Hum...' sentences ending on irony.",
      "4. Root Causes via Named Psychology: Decode Bystander Effect ('yeh mera kaam nahi') and Mimetic Behaviour ('sab kar rahe hain toh main bhi'), each paired with a street scene.",
      "5. Global Mirror: Contrast an international honesty-system or reform with a local habit (e.g. mosque shoes / traffic).",
      "6. Mirror Turn & 'Sawaal' Close: Move from 'they' to 'we', give realistic daily actions, and close on a haunting question."
    ],
    reservedKeywords: [
      "Civic Sense (Sha'oor)", "Collective Responsibility", "Mob Mentality", "Educated but Unaware", "Rule of Law",
      "Dohra Maiyaar", "Ignorant vs Illiterate", "Bystander Effect", "Mimetic Behaviour", "Blame Game", "Showing Off Instead of Sha'oor"
    ]
  },

  social_taboo_expose: {
    label: "Social Taboo, Digital Pandemic & Undercover Ethical Exposé",
    triggers: [
      "taboo", "halala", "marriage", "divorce", "dowry", "honour", "stigma", "harassment", "mental health", "family pressure",
      "log kya kahenge", "hidden practice", "religious misuse", "women rights", "child marriage", "custom",
      "fake hakeem", "wedding night", "sexual health misinformation", "showbiz harassment", "khwaja sira", "transgender rights",
      "digital chakla", "gen z intimacy", "exploitation", "silence and fear", "soft porn", "sextortion", "blackmail", "onlyfans", "vulgarity"
    ],
    stages: [
      "1. Historical Crackdown vs Modern Reality OR 3-Character Convergence Hook (TV T4): Open with a historical raid/taboo scene contrasted with today ('Pehle kothey Makhsoos jagah the, ab ek click ki doori par hain'), then introduce 3 real/composite characters across different cities/countries and ask: 'In teeno mein common kya hai?'.",
      "2. Anonymous Insider Testimony / Undercover Team Test (TV T4): Introduce a face-blurred insider interview or an undercover experiment conducted by the Thynk team ('Yeh haqeeqat jaanne ke liye Thynk ki team ne ek tajurba kiya').",
      "3. Chronological Evolution of the Trap: Trace how the platform or custom shifted from innocent origins (e.g. 1992 internet -> Orkut -> Facebook -> Instagram photography -> 2019 TikTok / 2020 Reels) into an exploitation machine.",
      "4. The 'Jee Nahi!' Counter-Argument Snap: Anticipate the viewer's naive assumption ('Aapko lag raha hoga ke yeh paisa official monetization se aata hai? Jee nahi!') and expose the real dark economy.",
      "5. Data, FIA/Police Case Ledger & Billionaire Incentives: Stack 3-4 dated court/FIA arrest cases and quote platform founders on the 'Attention Economy' ('When something is free, you are the product').",
      "6. Natural-Law Analogy & Weaponized Solution (TV T4): Use the 'Qudrat ka Nizaam / Limits' metaphor (sun, moon, river overflowing its banks), reject escapism ('Apps delete karna maidan chhod kar bhaagna hai'), and show how to train the algorithm and protect the next generation."
    ],
    reservedKeywords: [
      "Taboo (Khamoshi ka parda)", "Digital Chakla", "Attention Economy", "When Something Is Free You Are The Product",
      "Soft-Core Gateway", "Sextortion", "Victim Dignity", "Qudrat Ka Nizaam (System of Limits)", "Don't Flee the Battlefield"
    ]
  },

  habit_lifestyle_psychology: {
    label: "Habit, Lifestyle & Social-Psychology Deep Dive",
    triggers: [
      "habit", "chai", "chai hotel", "late night", "addiction", "sleep", "social media", "scroll", "procrastination",
      "time waste", "escapism", "routine", "mobile", "youth lifestyle", "dopamine", "burnout", "reels", "gaming",
      "tiktok", "family vlogging", "views greed", "cringe content", "digital pandemic", "influencer culture", "easy money content"
    ],
    stages: [
      "1. Scene Hook: A familiar ritual at an odd hour or a dopamine trap ('dopamine kabhi zindagi ka maqsad nahi ho sakta', TV T1).",
      "2. What It Looks Like: Show the habit across different people (student, employee, parent) through quick scenes.",
      "3. The Hidden Need: Decode the psychological need (escape routine, subconscious conditioning, dopamine hijack) in plain words.",
      "4. The Real Cost in Hours & Months (TV T4): Convert daily screen/habit hours into months per year ('24 ghanton mein se 4 ghante = saal ke 12 mahino mein se 2 poore mahine!').",
      "5. Who Profits: Show the corporate ad-revenue or algorithmic design incentive that feeds on user attention.",
      "6. Replacement, Not Prohibition: Offer realistic alternatives and close with a mirror question."
    ],
    reservedKeywords: [
      "Escape Routine", "Dopamine vs Maqsad", "Subconscious Mind", "24 Hours = 2 Months A Year", "Attention Harvest", "Algorithmic Trap"
    ]
  },

  hidden_business_economy: {
    label: "Hidden Business, Informal Economy & Follow-the-Money Explainer",
    triggers: [
      "hidden business", "mafia", "scam", "black market", "informal economy", "business model", "tanker", "smuggling",
      "commission", "middleman", "fraud", "who profits", "paisa", "industry exposed", "illegal trade", "price",
      "fake hakeem", "showbiz industry exposed", "sponsorship economy", "creator economy", "digital chakla economy", "subscription platforms"
    ],
    stages: [
      "1. Surface Reality Hook: Start with the ordinary transaction everyone sees vs the hidden ledger behind it.",
      "2. Follow the Money: Trace the rupee/dollar tiers (e.g. '48% earn $5,000, 6% earn $150,000 — magar kya yeh sirf views ka paisa hai? Jee nahi!').",
      "3. The Undercover Test: Show how the supply chain operates step-by-step from DM/broker to payment.",
      "4. The Human Cost: Show who pays the real price with victim dignity intact.",
      "5. Legal & Global Parallel: Cite FIA/court records and international regulations.",
      "6. Consumer & Policy Takeaway: Actionable verification and reporting steps."
    ],
    reservedKeywords: [
      "Hidden Business", "Follow the Money", "Undercover Test", "Real Price", "Who Profits?", "Behind the Glamour"
    ]
  },

  education_career_mindset: {
    label: "Education, Parenting Subconscious & Youth Mindset",
    triggers: [
      "education", "degree", "literacy", "students", "youth", "career", "brain drain", "exam culture", "rote learning",
      "university", "unemployment", "skills", "critical thinking", "parents pressure", "taleem",
      "ignorant vs illiterate", "literacy rate 62%", "degree without consciousness", "subconscious mind", "toy hacker", "matric career pressure"
    ],
    stages: [
      "1. Contradiction or Childhood-Spark Hook (TV T1/T2): Open with a child opening a toy with a screwdriver or a university convocation paradox.",
      "2. Protecting the Subconscious Spark (TV T1): Explain how scolding a curious child shuts down the subconscious mind (where beliefs, habits, imagination and intuition live).",
      "3. The 'Matric Career Trap' & Academic Failure Pivot (TV T1): Show how culture forces every child into engineering/medical pipelines ('Jis raaste par aapka future nahi hai, woh aapko aage band milega').",
      "4. Skills & Sha'oor vs Mere Degrees: Contrast 'ignorant with a degree' against true consciousness (Edhi example).",
      "5. The 'Unlearn' Principle (TV T6): Teach the #1 rule of adapting to a new era: 'Sabse pehla usool hai Unlearn karna — pichli zindagi mein jo seekha hai bhool jao, naye ki jagah banao'.",
      "6. Actionable Blueprint for Parents, Students & Creators."
    ],
    reservedKeywords: [
      "Degree vs Sha'oor", "Subconscious Spark", "Unlearn to Relearn", "Ignorant vs Illiterate", "Closed Road Redirection"
    ]
  },

  global_comparison_nation_building: {
    label: "Global Case-Study Mirror: How Other Nations Rebuilt & Changed",
    triggers: [
      "japan", "singapore", "germany", "dubai", "south korea", "china", "rwanda", "scandinavia", "how did", "country changed",
      "developed nations", "case study", "compare", "kyun woh aage hain", "malaysia", "turkey",
      "hiroshima", "nagasaki", "post-war germany", "post-war japan", "south africa", "mandela", "martin luther king", "european honesty shops"
    ],
    stages: [
      "1. Contrast Hook: Place a Pakistani scene next to a foreign scene and ask 'farq kahan hai?'.",
      "2. The Ruin & The 'Why' (TV T1): Show that the foreign nation was once in ashes (Japan after Hiroshima, Germany after WWII) but their 'Why' was alive ('Zaroori hai ke aapka Why salamat ho, woh matti mein na mil gaya ho').",
      "3. The Turning Question They Asked: 'Hum kyun haare? Kyun na hum technology aur discipline mein khud ko manwayein?'.",
      "4. The Mechanism of Change: Enforcement, design, and collective habit.",
      "5. Evening-Chai Mirror in Pakistan (TV T1): Contrast their action with our habit of reading news over evening chai and waiting for someone else to fix the country.",
      "6. First Three Steps: Personal, community, institutional."
    ],
    reservedKeywords: [
      "Global Mirror", "Why Salamat Ho", "Hum Kyun Haare?", "Evening Chai Blame Game", "Change Yourself First"
    ]
  },

  public_life_governance_behaviour: {
    label: "Public Life, Everyday Institutions & the Citizen's Share",
    triggers: [
      "sifarish", "rishwat", "bribe", "protocol", "government office", "passport", "nadra", "bijli", "bill", "load shedding",
      "pani", "hospital", "school", "police", "traffic warden", "municipality", "tax", "queue at office", "red tape", "system",
      "vote for a biryani bag", "vote without asking why", "blaming the government over evening chai", "change yourself first"
    ],
    stages: [
      "1. Office-Counter or Rickshaw-Meter Hook (TV T5): A stuck file or the 1965 rickshaw driver whose meter was 'broken before, fixed during war'.",
      "2. The Citizen Side Map: Show how ordinary choices (voting for a biryani packet, sifarish, hoarding) feed institutional decay.",
      "3. Incentive Roots: Why shortcuts persist when wrong actions carry zero cost.",
      "4. Historical Proof We Can Be Different (TV T5): Remind the viewer that during September 1965, crime dropped, hoarders brought out grain, and shopkeepers lowered prices voluntarily.",
      "5. Counter-Narrative Test: 'System kharab hai, hum akele kya kar sakte hain?' tested against the 'Chidiya ka ek qatra' principle.",
      "6. Mirror Turn: 'Apni zaat mein tabdeeli layenge toh hukmaran bhi achha payenge'."
    ],
    reservedKeywords: [
      "Sifarish Culture", "Vote With a Why", "Rickshaw Meter Honesty", "Apne Hisse Ka Kaam", "Change Yourself First"
    ]
  },

  history_identity_myth: {
    label: "History, Nostalgia & National Narrative Check",
    triggers: [
      "history", "tareekh", "nostalgia", "golden age", "purana daur", "hero", "myth", "national narrative", "textbook",
      "identity", "pride", "legacy", "pehle zamane", "whatsapp history",
      "quaid-e-azam", "salahuddin ayyubi", "ottoman", "bay'at and karbala", "partition narrative", "1947 awakening"
    ],
    stages: [
      "1. Nostalgia or Memoir Hook: Open inside a dated diary/memoir scene (e.g. Qudratullah Shahab's memoir or a historical turning point).",
      "2. The Version We Were Told vs The Archive: Compare popular myth against primary diaries, command logs, and records.",
      "3. The Psychological Mechanism: Why societies cling to comforting myths or forget their real heroes.",
      "4. Global Parallel: How another nation documented and learned from its history.",
      "5. Pride With Accountability: Separate genuine sacrifice from state negligence ('Hamari riyasat ne tareekhi taur pe kotahi ki ke la-zawaal qissay film-band nahi kiye').",
      "6. Open Question Close."
    ],
    reservedKeywords: [
      "Primary Memoir", "Archive vs Myth", "Pride vs Accountability", "Unfilmed History"
    ]
  },

  purpose_why_philosophy: {
    label: "Purpose, 'Why' Philosophy & Mission-Led Storytelling",
    triggers: [
      "why", "purpose", "maqsad", "zindagi ka why", "meaning of life", "mission", "motivation", "channel intro", "manifesto",
      "my story", "struggle story", "think why", "thynk why", "apne hisse ka kaam", "bemaqsad zindagi", "kamyabi", "life direction",
      "content creator mindset", "from medical store to media", "i to y"
    ],
    stages: [
      "1. Parable Cold Open (TV T1): Sacred/historical parable in elevated register with delayed naming (the bird carrying one drop of water toward Namrud's fire), ending on 'Kya aaj hum apne hisse ka kaam kar rahe hain?'.",
      "2. The 'aaya hai' Manifesto: 8-12 short rhymed promises ending on 'aaya hai', landing the mission-tied subscribe ask.",
      "3. The 'I to Y' Philosophy & Nietzsche Quote: Replace 'I' with 'Y'; quote Friedrich Nietzsche in English then paraphrase in Urdu.",
      "4. Rhymed Why-Ladder of Exemplars: Prophets -> Karbala -> Ottomans -> Ayyubi -> Quaid -> MLK -> Mandela -> Steve Jobs -> Japan & Germany.",
      "5. Mirror Challenge & Humility Pivot: Challenge biryani-packet apathy, then shrink the narrator ('In hastiyon ke saamne main khaaksar hoon...').",
      "6. The 'Sawaal Woh Jo...' 7-Beat Climax Crescendo (TV T1 19:50): Close on the anaphoric 'Sawaal woh jo...' revolutionary crescendo."
    ],
    reservedKeywords: [
      "Think Why", "Strong Why", "Apne Hisse Ka Kaam", "Dard Par Marham", "I to Y", "Sawaal Woh Jo Inqilab Laye"
    ]
  },

  creator_rise_fall_biography: {
    label: "Creator / Celebrity Rise-and-Fall Biography & Lessons",
    triggers: [
      "rise and fall", "youtuber", "ducky bhai", "tiktoker", "influencer", "celebrity downfall", "controversy", "viral", "roast",
      "fame", "cancelled", "comeback", "creator lessons", "biography", "behind the fame", "pakistan's youtube king", "content creator journey"
    ],
    stages: [
      "1. Peak-Then-Question Hook: Show the height then stack three questions: 'Asal mein kya hua? Kahan se cheezein bigarna shuru hui? Kya yeh end hai ya naya aaghaz?'.",
      "2. Origin & Early Edge: Verified dates, early hustle, and what made them click.",
      "3. The Dopamine & Views Trap: Explain how algorithm incentives and 'views ki bhook' push creators across ethical lines.",
      "4. Turning Points: Dated events separating allegation ('ilzam') from verified record.",
      "5. Audience Mirror: 'Humne hi click kiya, humne hi sar par bithaya'.",
      "6. Lessons for Every Creator & Viewer."
    ],
    reservedKeywords: [
      "Rise & Fall", "Turning Point", "Dopamine vs Maqsad", "Views Greed", "Audience Complicity"
    ]
  },

  family_story_drama: {
    label: "Character-Led Family & Society Story (Documentary-Drama Case)",
    triggers: [
      "inheritance", "property dispute", "family crisis", "virasat", "jaidad", "sisters share", "brothers deny share", "in-laws", "saas bahu",
      "family business", "betrayal by relatives", "court case delays", "ghar ka jhagra", "father's sudden death"
    ],
    stages: [
      "1. In-Medias-Res Betrayal Scene: Open at the moment of rupture with a composite protagonist.",
      "2. Backstory of Effort: Build empathy for years of sacrifice.",
      "3. The Trigger Event: Death or legal loophole that unlocks greed.",
      "4. The Mirror Character: A second parallel case proving the crisis is national, not isolated.",
      "5. Law vs Lived Reality: Islamic/statutory inheritance law vs family excuses.",
      "6. Actionable Legal/Family Safeguards + Mirror Question."
    ],
    reservedKeywords: [
      "Blood Turns to Strangers", "Rightful Share", "Law vs Lived Reality", "Composite Story"
    ]
  },

  media_narrative_rebuttal: {
    label: "Film / Cross-Border Media Narrative Rebuttal & Fact-Check",
    triggers: [
      "movie", "film", "cinema", "propaganda", "narrative", "anti-pakistan narrative", "fact check", "reality vs fiction", "dhurandhar",
      "web series", "documentary rebuttal", "perception", "untold facts", "media bias", "pakistan's perspective", "film analysis", "godi media"
    ],
    stages: [
      "1. Hysterical Broadcast / Scene Collage Cold Open (TV T5): Open with a rapid montage of absurd media/film claims, then undercut with dry street satire ('Usi 5 rupay ke sikkay ki bulletproof jacket bana lein!').",
      "2. Respectful Cross-Border Disclaimer (TV T5): 'Pehle haath jod kar Indian/foreign viewers se guzarish karunga ke bura na maanein, because I know intelligent people there are also tired of Godi media/propaganda'.",
      "3. Narrative Warfare Thesis: 'Jangein sirf zameen aur aasman par nahi hotin, balkay qaumon ke zehno par narrative ke zariye ladi jaati hain'.",
      "4. Claim-by-Claim Geographic & Historical Fact-Check: Expose fake locations (e.g. 'Lalu Khet International Airport' where Lyari river flows, or 'Lahore Port' 1,000 km from the sea) and verify via third-party records (US DoD, Lockheed Martin, Economist, NYT).",
      "5. How Media Engineers Perception: Selective framing, omitted context, and manufactured hysteria.",
      "6. Our Own Mirror & Closing Question."
    ],
    reservedKeywords: [
      "Narrative Ki Jung", "Reality vs Propaganda", "Intelligent Viewers Disclaimer", "Third-Party Verification", "Not Against Any People"
    ]
  },

  tech_myth_bust_news_explainer: {
    label: "Thynk Today: News-Peg Tech Myth-Bust With Ethical Lens",
    triggers: [
      "hologram", "pepper's ghost", "ai", "deepfake", "technology", "dajjal", "dajjali technology", "viral event", "concert", "posthumous performance",
      "myth bust", "how does it work", "new gadget", "tech news", "explained", "trending", "sidhu moosewala", "volumetric display", "light field"
    ],
    stages: [
      "1. Instructional Cold Open: 'Kahani sunne se pehle ek kaam kijiye... apni aankhon par se bharose ki patti hata dijiye'.",
      "2. Dated Event Stamp: Exact date, weekday, city, venue, ticket price, lights-out reveal.",
      "3. Reaction Split & 3-Question Roadmap.",
      "4. Everyday-Object Analogy Primer (cup photo vs 3D).",
      "5. Origin Story & Irony ('Tamasha naya hai lekin madari wahi purana').",
      "6. Modern Case Chain & Rupee Conversion.",
      "7. Brand-Genericide Analogy ('Har photocopy ko photostate, har detergent ko Surf').",
      "8. Balanced Religious/Ethical Lens + Future AI Twist."
    ],
    reservedKeywords: [
      "Seeing Is Not Believing", "Pepper's Ghost", "Tamasha Naya Madari Purana", "Technology vs Maqsad"
    ]
  },

  /* ──────────────── v4 NEW GENRES (FROM T5 & T6) ──────────────── */

  geopolitics_military_history_narrative: {
    label: "Military History, Geopolitics & Tactical Kill-Chain Analysis (1965–2025 Style)",
    triggers: [
      "war", "1965", "1971", "2019", "2025", "operation sindoor", "operation swift retort", "rafale", "j10c", "pl15", "awacs",
      "mm alam", "aziz bhatti", "sarfraz rafiqui", "sajjad haider", "chawinda", "brb canal", "abhinandan", "pak india war",
      "air force", "dogfight", "bvr", "kill chain", "military history", "defence", "geopolitics"
    ],
    stages: [
      "1. Media Hysteria Montage -> Historical Radio Broadcast Cold Open (TV T5): Contrast chaotic TV war-mongering with the chilling gravity of 1965 Radio Pakistan ('Mere azeez hum-watno... jung shuru ho chuki hai').",
      "2. Personal Diplomatic Memoir Scene (TV T5): Ground the stakes in a human memoir (e.g. Qudratullah Shahab crying in Holland over BBC's false Lahore report until the Dutch host yells 'BBC lied!').",
      "3. The Asymmetric Goliath-vs-David Paradox (TV T5): 'Fauj zyada, economy zyada, weapons zyada — lekin jab jung shuru hoti hai toh bada mulk chhota kyun pad jata hai? Chaliye aaj ise decode karte hain — Let's think about it!'.",
      "4. Tactical Kill-Chain & Intelligence Breakdown (TV T5): Deconstruct the battle with exact timestamps ('6 aur 7 May ki darmiyani shab, raat 1 baj kar 5 minute'), force ratios (72 vs 42 jets), radar mechanics (AWACS + J-10C silent mode 'A-B-C Model'), and range miscalculations (150km assumed vs 200km actual PL-15 killing zone).",
      "5. Archival Hero Vignettes & Street Unity (TV T5): Weave 1965 ground realities — Major Aziz Bhatti at BRB Canal, Chawinda tank graveyard, M.M. Alam's 5 Hunters in under a minute, Squadron Leader Sarfraz Rafiqui's 'There is not to reason why, there is but to do and die', and citizens donating wedding dowries while rickshaw drivers fix their meters.",
      "6. The Final Doctrine Verdict (TV T5): 'It's not the plane, it's the pilot — it's the man, not the machine.'"
    ],
    reservedKeywords: [
      "Narrative Ki Jung", "A-B-C Kill Chain", "Killing Zone", "Intelligence Failure", "It's The Man Not The Machine",
      "Cobra Formation", "Silent Radar Lock", "Goliath vs Resolve"
    ]
  },

  insider_media_whistleblower_memoir: {
    label: "Insider Media Exposé, Corporate Takeovers & Institutional Memoir (Raftar / Samaa Style)",
    triggers: [
      "raftar", "samaa", "farhan mallick", "newsroom", "media exposed", "why i quit", "resignation", "tv channels", "journalism",
      "media mafia", "news anchor puppet", "ratings", "aleem khan", "behind the scenes", "whistleblower", "ghar ka bhedi"
    ],
    stages: [
      "1. 'Ghar Ka Bhedi' Whistleblower Hook (TV T6): Open with a direct insider promise ('Jitni tezi aur umeed ke saath aapne click kiya hai, be-fikr rahiye umeedein nahi todunga. Haan, Lanka hamesha ghar ke bhedi ne hi dhaayi hai! Aaj doodh ka doodh aur paani ka paani ho jaye').",
      "2. Dated Newsroom Rupture Scene (TV T6): Reconstruct the exact date and room where the resignation happened (e.g. 7 April 2022 inside Samaa's packed newsroom during an award ceremony) and play the resignation quote.",
      "3. Corporate Capture & 'Shah Se Barh Kar Wafadar' Diagnosis (TV T6): Explain how political/business tycoons buy TV channels and how sycophants impose 'choudhrahit' until the real driver jumps from the moving car ('Chalti gaadi se driver ne chhalang laga di').",
      "4. TV Fake World vs Digital Real World + The 'Unlearn' Law (TV T6): Contrast TV's manipulated rating meters with digital's brutal honesty (1,580 videos and only 12,000 subscribers frustration) and state the #1 rule: 'Sabse pehla usool hai Unlearn karna'.",
      "5. Naming the Unsung Builders & Reversing the 'Firaun' Label (TV T6): Credit the behind-the-scenes writers, narrators, and field reporters by name, then flip the rumor ('Log unhe Firaun kyun kehte hain? Woh log jo media card sirf bharam-baazi aur AC ki hawa khane ke liye banwate hain!').",
      "6. Poetic tribute / Prison Resilience + The 4-Word Mic-Drop Finale (TV T6): Deliver a rhythmic character portrait ('Dilkash jumlay / Qalam se maarta hai'), address the final question ('Aakhir chhoda kyun?'), and end on a 4-word punchline: 'Apni raftar badhane ke liye!'"
    ],
    reservedKeywords: [
      "Ghar Ka Bhedi", "Doodh Ka Doodh Paani Ka Paani", "Newsroom Decisions Are Not Made in Newsrooms",
      "Shah Se Barh Kar Shah Ke Wafadar", "Chalti Gaadi Se Driver Ki Chhalang", "Unlearn Principle", "Apni Raftar Badhane Ke Liye"
    ]
  }
};

/* ════════════════════════════════════════════════════════════════
   0a. COUNTER-ARGUMENT & QUESTIONING ENGINE (TV T1-T6 VERIFIED)
   ════════════════════════════════════════════════════════════════ */
export const THYNK_COUNTER_ARGUMENT_ARSENAL = {
  description:
    "How Muazzam Shah (ThynkWhy) anticipates viewer doubts, questions opposing narratives, and dismantles excuses across T1–T6. Never use dry textbook transitions; use these 6 live interrogation moves:",
  moves: [
    {
      id: "MOVE_1_RECORD_CORRECTION",
      name: "The Anticipated Objection + Record Correction (TV T4 4:54)",
      formula: "Haan main jaanta hoon aap kahenge ke [COMMON_BELIEF_X]... toh chaliye aapka record durust kiye deta hoon!",
      usage: "Use when the audience holds a popular half-truth about who started a trend or problem."
    },
    {
      id: "MOVE_2_JEE_NAHI_SNAP",
      name: "The False-Premise Setup + 'Jee Nahi!' Snap Denial (TV T4 1:39, 6:34, 7:05)",
      formula: "Aapko lag raha hoga ke [NAIVE_ASSUMPTION_X]? Jee nahi! [HARD_REALITY_Y]. Ab yahan samajhne ki zaroorat hai...",
      usage: "Use at least once per script to shatter a surface-level assumption with a sharp two-word 'Jee nahi!' before explaining the hidden mechanism."
    },
    {
      id: "MOVE_3_ABSURDITY_REDUCTIO",
      name: "The Street-Wit Absurdity Reductio (TV T5 0:28, 3:15, 10:38)",
      formula: "[QUOTE_OPPONENT_CLAIM] — अरे भाई, वहां [REAL_GEOGRAPHY_OR_PHYSICS] है! पता नहीं इन्हें वहां [FAKE_CLAIM] कैसे नज़र आ गया!",
      usage: "Use in rebuttals and geopolitics to expose propaganda using undeniable physical geography or everyday logic."
    },
    {
      id: "MOVE_4_FAIR_TEST_THEN_PIVOT",
      name: "The 'Log Kehte Hain' Empirical Test (TV T2 / T3)",
      formula: "Ab aap soch rahe honge ke bhai [OBJECTION_X]? Sunne mein baat theek lagti hai, magar zara [DATA_OR_ANALOGY_Y] dekhiye... Toh clear ho gaya aapko?",
      usage: "Use in explainers and social psychology when testing a cultural excuse against data or an everyday analogy."
    },
    {
      id: "MOVE_5_LABEL_REVERSAL",
      name: "The Rumor / Label Reversal ('Log unhe Firaun kyun kehte hain?', TV T6 10:18)",
      formula: "Jab main wahan gaya tab mujhe pata chala ke log [TARGET_X] ko [NEGATIVE_LABEL_Y] kyun kehte hain! Aur yeh kaun log hain? Yeh woh log hain jo [EXPOSED_HYPOCRISY_Z]!",
      usage: "Use in biographies and institutional exposés to bait a criticism and flip it back onto the corrupt system."
    },
    {
      id: "MOVE_6_SAWAAL_CRESCENDO",
      name: "The 'Sawaal Woh Jo...' 7-Beat Anaphoric Climax (TV T1 19:50-20:22)",
      formula: "Zaroori hai ke aapke andar ek soch paida ho, kyunke soch hi hoti hai jo paida karti hai sawaal! Sawaal woh jo aapko rokk de ghalat raah jaane se! Sawaal woh jo dikhaye naya rasta! Sawaal woh jo zalim ko bhi ghabra de!",
      usage: "Use at the philosophical climax of manifesto or social-awakening scripts."
    }
  ]
};

/** Schema-aligned few-shot examples (STYLE ONLY. Placeholders so the model never copies fake facts.) */
export const THYNK_SCHEMA_FEWSHOTS = [
  ...([
    {
      genre: "social_taboo_expose",
      context: "STYLE ONLY: Historical Raid vs Digital Era + 3-Character Convergence Hook (TV T4 structure, Roman Urdu Mode)",
      visual:
        "Archival 1980s night-raid reconstruction with sirens and blackout; hard cut to a glowing smartphone in a dark bedroom; split-screen silhouette of 3 characters in [CITY_A], [CITY_B], and [CITY_C].",
      audio: "Sirens fading into a single phone notification ping and a deep investigative bass drone.",
      narration:
        "Yeh daur tha [HISTORICAL_ERA_X] ka aur [LOCATION_X] mein grand operation chal raha tha. Us waqt toh woh dhanda band ho gaya... magar aaj wohi [METAPHOR_X] ghar-ghar pohanch chuka hai. Pehle woh makhsoos jagahon par hota tha, ab sirf ek click ki doori par hai! [Pause] Yeh sab kaise ho raha hai? Ise samajhne ke liye in teen kahaniyon ko samajhna hoga. Pehli shuru hoti hai [COUNTRY_A] se, jahan [AGE_A] saal ki [CHAR_A] aspataal mein hai. Doosri kahani hai [COUNTRY_B] ke [CHAR_B] ki. Aur teesri kahani hai [COUNTRY_C] ki [CHAR_C] ki, jo raaton-raat karor-pati ban gayi. Yeh teen kirdar jo teen alag-alag mulkon mein rehte hain... inmein common kya hai? Sirf ek kadi jo in teeno ko aapas mein jodti hai: [CORE_THESIS_NOUN]."
    },
    {
      genre: "social_taboo_expose",
      context: "STYLE ONLY: 'Jee Nahi!' Counter-Snap + Undercover Team Test (TV T4 structure, Roman Urdu Mode)",
      visual:
        "Blurred-face insider interview silhouette with voice-waveform graphic; cut to screen-recording of the team's undercover test chat with redacted numbers.",
      audio: "Tense investigative pulse, sharp glitch tick on 'Jee nahi!'.",
      narration:
        "Aapko lag raha hoga ke yeh laakhon rupay [PLATFORM_X] ki official monetization se mil rahe honge? Jee nahi! Itna paisa wahan se nahi milta. Haan main jaanta hoon aap kahenge ke shuruat toh [APP_Y] ne ki thi... toh chaliye aapka record durust kiye deta hoon. [Pause] Yeh haqeeqat jaanne ke liye Thynk ki team ne khud ek tajurba kiya. Hamari team ne aise hi ek account par rabta kiya... aur chand hi minutes mein poora rate-card aur kacha-chitha saamne aa gaya."
    },
    {
      genre: "geopolitics_military_history_narrative",
      context: "STYLE ONLY: Hysterical Media Montage -> 1965 Radio Gravity -> Asymmetric Paradox (TV T5 structure, Roman Urdu Mode)",
      visual:
        "Fast 4-way split screen of shouting TV anchors; hard cut to a vintage 1965 transistor radio at a crowded tea stall; then a strategic force-comparison map.",
      audio: "Chaotic broadcast noise cut to radio static, then a deep orchestral war-room drum.",
      narration:
        "Chai ke dhabon aur paan ki dukaano se lekar dafatir aur gharon tak... har jagah radio ke gird log hujoom lagaye bechaini se intezar mein the. Aur phir woh aawaz goonji: '[HISTORICAL_BROADCAST_QUOTE_X]'. [Pause] Yahan sochne ki baat yeh hai ke [COUNTRY_A] se kayi guna bada mulk—log zyada, fauj zyada, technology zyada, economy zyada—lekin jab maidan lagta hai toh unhe apna size kam kyun lagne lagta hai? Kyunke yeh khel nahi, jung hai! Yahan chaukay-chakkay nahi lagte, yahan jahaz girte hain aur faislay asmanon par hote hain. Chaliye aaj ise decode karte hain. Let's think about it!"
    },
    {
      genre: "geopolitics_military_history_narrative",
      context: "STYLE ONLY: Midnight BVR Kill-Chain & Range Deception Breakdown (TV T5 structure, Roman Urdu Mode)",
      visual:
        "3D tactical radar map showing 'A-B-C Model': AWACS at 400km locking target (A), J-10C firing in silent mode (B), and missile guidance cone expanding from 150km to 200km killing zone (C).",
      audio: "Radar sonar ping, jet afterburner roar, and a cold electronic lock tone.",
      narration:
        "Yeh kahani hai [DATE_X] ki darmiyani shab, raat [TIME_X] ki. [OPPONENT_X] ka khayal tha ke [WEAPON_X] sirf [RANGE_A] kilometer door tak fire kar sakta hai, isliye woh [RANGE_B] kilometer ke faasle par khud ko safe zone mein samajh rahe the. Halanke asal range [RANGE_C] kilometer thi! Yaani woh pehle hi killing zone ke andar the aur unhe khabar tak nahi thi! [Pause] Ise kehte hain 'A-B-C Model': Asset A ne 400 kilometer door se lock kiya, Asset B ne silent mode mein fire kiya, aur Asset C ne guide kiya. Aakhri dam tak unhe pata hi nahi chala ke un par fire ho chuka hai...Kyunke it's not the plane, it's the pilot—it's the man, not the machine!"
    },
    {
      genre: "insider_media_whistleblower_memoir",
      context: "STYLE ONLY: 'Ghar Ka Bhedi' Hook + Chalti Gaadi Se Driver Ki Chhalang + 4-Word Finale (TV T6 structure, Roman Urdu Mode)",
      visual:
        "Close-up of a press card dropping onto a desk; reconstruction of a crowded newsroom on [DATE_X]; kinetic typography on 'UNLEARN'.",
      audio: "Sharp typewriter clicks, newsroom murmur dropping into a solo cello.",
      narration:
        "Jitni tezi aur umeed ke saath aapne is video par click kiya hai, be-fikr rahiye aapki umeedein nahi todunga. Haan, Lanka hamesha ghar ke bhedi ne hi dhaayi hai! Main hi hoon woh jise pata hai ke aakhir [ORG_X] ke andar kya chal raha tha. Aaj doodh ka doodh aur paani ka paani ho jaye! [Pause] India aur Pakistan mein media ka almiya yehi raha hai ke yahan maalik ke saath khabron ki nauiyat bhi badal jaati hai. Kuch log shah se barh kar shah ke wafadar ban gaye... aur phir yun samjhein ke chalti hui gaadi se driver ne chhalang laga di! [Pause] Aur rahi aap logon ke us sawal ki baat ke aakhir maine woh idara kyun chhoda? Jawab sirf chaar lafzon ka hai: apni raftar badhane ke liye!"
    }
  ])
];

/* ════════════════════════════════════════════════════════════════
   0b. v4 STANDALONE DNA EXPORTS (URDU LEXICON + T1-T6 CORPUS)
   ════════════════════════════════════════════════════════════════ */
export const URDU_LEXICON = {
  addressTerms: {
    respectful: ["aap", "aap sab", "aap ka bhai (self-reference, T1)", "mere azeez hum-watno (historical quote only, T5)"],
    warmTags: ["bhai", "yaar", "dost", "boss", "mere bhai"],
    selfReference: [
      "aap ka bada bhai ('maidan mein aap ko jitwane aaya hai', T1)",
      "aap ka bhai yaar aap mein se hi hai (T1)",
      "main khaaksar (humility, T1)",
      "ghar ka bhedi (insider whistleblower, T6)"
    ],
    rule:
      "Use 'aap' for respect; drop one 'bhai/yaar/boss/dost' tag per 60-90 s at emphasis points only. Never 'tum log'."
  },

  connectors: [
    "lekin", "magar", "yaani", "kyunke", "isi liye", "phir bhi", "khair", "baharhaal", "chaliye", "toh", "ab zara ... ki taraf",
    "bilkul isi tarah", "jaise ke", "aur sabse bada sawal yeh hai", "asal baat yeh hai", "sunye zara gaur se", "albatta", "dar-asal"
  ],

  pivotFormulas: [
    "Haan main jaanta hoon aap kahenge ke ... toh chaliye aapka record durust kiye deta hoon! (T4 4:54)",
    "Aapko lag raha hoga ke ...? Jee nahi! Ab yahan samajhne ki zaroorat hai. (T4 6:34)",
    "Ab aap soch rahe honge ki bhai ...? Toh samajhiye ab is baat ko bhi. (T3 9:05)",
    "Khair, back to the point / Khair, wapas aate hain apni kahani ki taraf. (T2 1:39, T3 8:22, T6 11:21)",
    "Yeh batane se pehle chaliye [PLACE/STORY] chalte hain. (T4 1:33, T6 7:15)",
    "Toh clear ho gaya aapko? (T3 5:43)",
    "Baat yahan khatam nahi hoti. Asal kahani toh abhi shuru honi hai. (T3 11:49)",
    "Chaliye aaj ise decode karte hain — Let's think about it! (T5 5:20)",
    "Yeh toh bohat badi hastiyon ki dastaanein hain ... in ke saamne main khaaksar hoon. (T1 7:34)"
  ],

  /** Idioms & Streetwise Proverbs verified across T1–T6 (Unique to ThynkWhy; never used by Dhruv). */
  signatureIdiomsAndProverbs: [
    "Danke ki chot par baat hogi (T1)",
    "Dard pahunchana nahi, dard par marham rakhna hai (T1)",
    "Seena-ba-seena ilm badhane ka silsila (T1)",
    "Tamasha naya hai lekin madari wahi purana (T3)",
    "Tera kutta kutta, mera kutta Tommy / Dohra maiyaar (double standard)",
    "Lanka hamesha ghar ke bhedi ne hi dhaayi hai (T6)",
    "Doodh ka doodh aur paani ka paani ho jaye (T6)",
    "Shah se barh kar shah ke wafadar (T6)",
    "Chalti gaadi se driver ne chhalang laga di (T6)",
    "Sone ko aag mein jala kar kundan banana / Heere ko tarashna (T6)",
    "Baarish ke qatron ki tarah tip-tip karke girna (T5)",
    "Sone pe suhaga (T5)",
    "Boongi maarna (for absurd state/media propaganda claims, T5)"
  ],

  interjections: [
    "Jee haan!", "Jee nahi!", "Believe me", "Dekhein bhai", "Zara sochiye", "Is baat ko halka mat lena",
    "Yaqeen kijiye", "By God (T4)", "Let's think about it! (T5)", "Wait for the next video (T1)"
  ],

  englishInsertions: [
    "Why", "Think Why", "believe me", "value / devalue", "digital media group", "content creator", "documentary", "podcast",
    "subconscious mind", "dopamine", "algorithm", "attention economy", "when something is free you are the product",
    "soft porn", "sextortion", "monetization", "unlearn", "conflict of interest", "narrative", "killing zone", "safe zone",
    "intelligence failure", "kill chain", "silent mode", "dogfight", "it's the man not the machine", "bystander effect", "mimetic behaviour"
  ],

  conceptNouns: {
    sha_oor: "sha'oor (awareness / civic conscience)",
    mu_ashra: "mu'ashra (society)",
    maqsad: "maqsad / ba-maqsad / be-maqsad (purpose)",
    inqilab: "inqilab (revolution)",
    hissa: "apne hisse ka kaam (doing your share)",
    marham: "dard par marham (balm on the pain)",
    unlearn: "unlearn karna (forgetting old TV/legacy habits to master the new era, T6)",
    narrative_jung: "narrative ki jung (information & perception warfare, T5)",
    attention: "attention (the most expensive currency of the digital world, T4)",
    qudrat_nizaam: "qudrat ka nizaam / limit aur system (natural boundaries of sun, moon, river, T4)"
  },

  elevatedRegisterWords: [
    "shadeed", "tapish", "buland", "haulnaak", "manjaniq", "muqam", "hukm", "janib", "tawajjuh", "ada",
    "wujood", "zamana", "mu'ashra", "inqilab", "tasleem", "fateh", "but-shikan", "bay'at", "ummat",
    "saltanat", "sarzameen", "ta'meer", "ghayoor qaum", "hungami halat", "la-zawaal"
  ],

  captionNormalization: {
    "व्हाई / वाई / वाय / बाय": "Why",
    "थिंक / थिंग / THYMK": "Thynk",
    "मुआशरा": "mu'ashra",
    "मंजिनी": "manjaniq",
    "बस्करो": "Buskaro",
    "जजी / जसी": "Gen Z (T4, T5, T6 ASR repair)",
    "डिजिटल चकला": "Digital Chakla (T4)",
    "सेक्स टॉरशन": "sextortion (T4)",
    "लालू खेत / लेरी नदी": "Lalu Khet / Lyari Nadi (T5)",
    "चवंडा": "Chawinda (T5)",
    "एवक्स / जोक्स": "AWACS (Airborne Warning and Control System, T5)",
    "फिरौन मलिक": "Firaun Mallick / Pharaoh Mallick (T6)"
  } as Record<string, string>,

  spellingStandard: [
    "sha'oor", "mu'ashra", "zehniyat", "rawayya", "haqeeqat", "maqsad", "tawajjuh", "inqilab",
    "ba-maqsad", "be-maqsad", "Thynk", "ThynkWhy", "Thynk Today", "Thynk Voice", "Thynk Crime", "Thynk Kids"
  ]
};

/* ════════════════════════════════════════════════════════════════
   1. THE BIO (Original CreatorBio Shape Preserved + v4 Enhancements)
   ════════════════════════════════════════════════════════════════ */
export const THYNKWHY_BIO: CreatorBio = {
  id: "thynkwhy",
  name: "ThynkWhy",
  handle: "@thynkwhy",
  avatarUrl:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgTWk8j_-WrOt9ddtnlAvfpMsZPoPfWbqcQg&s",
  archetype: "The Pattern Breaker, Social Autopsy & Investigative Storyteller",
  tagline: "Analyze. Question. Thynk.",
  color: "lime-500",
  hex: "#84cc16",

  philosophy: {
    coreBeliefs: [
      "Sha'oor Over Sanad: A degree is not awareness. Education gives rank; sha'oor turns an unlettered person into an Edhi (T2).",
      "Replace I With Y (T1): Thinking begins when 'I' is replaced with 'Why'. A person or nation with a strong Why can bear almost any How.",
      "Do Your Share Like Ibrahim's Sparrow (T1): Even if one drop of water cannot extinguish Namrud's fire, God judges whether you did your share ('apne hisse ka kaam').",
      "Truth With Balm, Not Blades (T1): Speak bluntly ('danke ki chot par'), even if it stings, because the goal is 'dard par marham' and reforming society.",
      "Dopamine Is Not Purpose (T1): Viral applause, easy money, or screen addiction give temporary dopamine, never a life's 'Why'.",
      "Attention Is the Currency; When It's Free, You Are the Product (T4): Tech platforms harvest data and promote skin/outrage to hijack human attention.",
      "Qudrat Ka Nizaam Runs on Limits (T4): If the sun, moon, or river crosses its limit, disaster follows; human freedom without moral limits destroys families.",
      "Don't Flee the Battlefield of Technology (T4): Deleting apps is closing your eyes; the real solution is training the algorithm and building better content.",
      "Wars Are Fought on Minds Through Narrative (T5): Military hardware and size lose when an opponent fights with moral resolve, intelligence precision, and truth ('It's the man, not the machine').",
      "Unlearn to Master a New Era (T6): Legacy TV newsrooms are puppet shows run by owners' conflicts of interest; thriving in the digital world requires 'Unlearning' old habits first."
    ],
    contentGoal:
      "Transform any social taboo, national crisis, historical conflict, or institutional mystery into a gripping, cinema-grade Urdu/Hinglish/English documentary that hooks the viewer through multi-character storytelling, interrogates popular myths with 'Jee nahi!' and 'chaliye aapka record durust kiye deta hoon', backs every claim with undercover tests or primary records, and leaves the viewer with a life-changing 'Why?' question."
  },

  voice: {
    tone:
      "High-gravitas, emotionally resonant, street-smart yet deeply philosophical Pakistani documentary storyteller ('aapka bada bhai'). Combines literary Urdu grandeur at emotional peaks with blunt everyday truth ('danke ki chot par', 'boss', 'yaar'), sharp satirical wit when debunking propaganda ('5 rupay ke sikkay ki bulletproof jacket'), and protective empathy for victims.",
    pacing:
      "Dynamic 2-Gear Documentary Cadence (TV T1-T6): Gear 1 (Energetic Investigative & Narrative Runs) operates at 165-185 WPM using punchy 6-14 word clauses, rapid triads, and 'Jee nahi!' snap-rebuttals. Gear 2 (Sombre Parables, Victim Dignity & Philosophical Peaks) slows to 135-150 WPM with deliberate [Pause] beats. Uses rhythmic rhymed couplets ('Sone ko aag mein jala kar kundan بناتا hai...') only at tribute or manifesto climaxes.",
    vocabulary: [
      "Sha'oor (awareness)", "Mu'ashra (society)", "Zehniyat (mentality)", "Rawayya (behaviour)", "Haqeeqat (reality)",
      "Maqsad / Ba-maqsad / Be-maqsad", "Why / Strong Why", "Apne hisse ka kaam", "Dard par marham", "Danke ki chot par",
      "Jee haan!", "Jee nahi!", "Believe me", "Boss / Yaar / Bhai", "Khair", "Bystander effect", "Mimetic behaviour",
      "Subconscious mind", "Dopamine", "Attention economy", "Digital chakla", "Narrative ki jung", "Unlearn karna",
      "Lanka ghar ke bhedi ne dhaayi", "Doodh ka doodh paani ka paani", "Shah se barh kar shah ke wafadar", "Boongi maarna"
    ],
    emotionalRange:
      "Full cinematic spectrum: awe and reverence in parables (T1), brotherly warmth in personal struggle stories (T1/T6), protective moral urgency in youth/taboo exposés (T4), razor-sharp satire and patriotic pride in military/narrative rebuttals (T5), and soaring poetic intensity in character tributes and closing 'Sawaal' crescendos (T1/T6)."
  },

  structure: {
    hookStyle:
      "Five Verified ThynkWhy Cold-Open Archetypes (Zero Greeting in Line 1): " +
      "(1) THE PARABLE COLD OPEN (T1): 45s sensory parable with delayed naming of the sacred/historical figure, ending on 'Kya aaj hum apne hisse ka kaam kar rahe hain?'. " +
      "(2) THE PAST-RAID vs PRESENT-PANDEMIC + 3-CHARACTER CONVERGENCE HOOK (T4): Open with a historical crackdown, contrast with today ('ab ek click ki doori par hai'), then introduce 3 characters in 3 countries/cities and ask 'In teeno mein common kya hai?'. " +
      "(3) THE HYSTERIA-TO-HISTORY RADIO COLD OPEN (T5): Rapid montage of absurd opponent claims undercut with dry satire, cutting to a historic radio announcement and a personal memoir scene. " +
      "(4) THE 'GHAR KA BHEDI' WHISTLEBLOWER HOOK (T6): Direct insider promise ('Lanka hamesha ghar ke bhedi ne hi dhaayi hai... aaj doodh ka doodh aur paani ka paani ho jaye'). " +
      "(5) THE CLASSROOM / INSTRUCTIONAL PARADOX HOOK (T2/T3): A definitional question or viewer task ('Apni aankhon par se bharose ki patti hata dijiye').",
    bodyStructure:
      "Cold Open & Central Question -> Mission-Tied Subscribe & Sister-Channel Cross-Promo at ~60-120s ('Thynk akela nahi hai: Thynk Voice, Thynk Crime, Thynk Kids') -> 'Chaliye wapas aate hain kahani ki taraf' -> Chronological Origin or 3-Character Thread -> The 'Jee Nahi!' / 'Record Durust' Counter-Argument Snap -> Undercover Team Test or Primary Memoir/Technical Kill-Chain -> Psychological / Systemic Root Cause -> The Mirror Turn.",
    closingStyle:
      "Three Verified ThynkWhy Endings: " +
      "(1) THE 'SAWAAL WOH JO' ANAPHORIC CRESCENDO (T1): 5-7 rhythmic lines starting 'Sawaal woh jo...' building to 'Wait for the next video, agli video dekh kar aap hil jayenge!'. " +
      "(2) THE SYSTEM-OF-LIMITS & BATTLEFIELD CALL (T4): Natural-law analogy (sun, moon, river limits) + 'Apps se bhaagna maidan chhod kar bhaagna hai; inhein apna hathyaar banayein'. " +
      "(3) THE 4-WORD MIC-DROP PUNCHLINE (T6): Answer the central mystery kept open since minute 1 in a single 4-word sentence ('Apni raftar badhane ke liye!')."
  },

  research: {
    methodology:
      "Combine (1) multi-country human case studies (3-character convergence), (2) primary historical memoirs (e.g. Qudratullah Shahab), military/tactical telemetry (AWACS/BVR kill-chains), and dated FIA/court arrest records, (3) undercover team experiments ('Thynk ki team ne ek tajurba kiya') and anonymous whistleblower interviews, and (4) psychological/tech-founder principles (Nietzsche, Mark Zuckerberg/Elon Musk on the Attention Economy, Bystander & Mimetic psychology).",
    bias:
      "Purpose-driven ('Ba-maqsad'), socially protective, anti-hypocrisy, and sovereignty-proud yet self-critical: fiercely exposes domestic social decay, corrupt media seths, and foreign propaganda alike, while always protecting victims and innocent citizens across borders.",
    preferredSources: [
      "Primary historical memoirs (e.g., Qudratullah Shahab's Shahabnama), declassified military logs & international defense verifications (Lockheed Martin, US DoD, SIPRI)",
      "FIA Cyber Crime records, dated court sentences, and investigative newspaper reports (Times of India, Dawn, The Economist, NYT)",
      "First-hand undercover team stings and anonymised insider/whistleblower interviews",
      "Tech founder statements (Elon Musk, Mark Zuckerberg) & market size reports",
      "Pakistan Bureau of Statistics (PBS), Ministry of Education vs independent literacy research",
      "Named Hadith collections (Sahih Bukhari, Sahih Muslim, Ibn Majah) as attribution cards with scholarly caution"
    ]
  },

  signaturePhrases: [
    "Thynk Why?",
    "Kya aaj hum apne hisse ka kaam kar rahe hain?",
    "Aapka nahi pata... magar mere paas is sawal ka jawab hai.",
    "Main aapki tawajjuh [X] ki janib dilana chahta hoon.",
    "Baat hogi danke ki chot par... magar maqsad dard pahunchana nahi, dard par marham rakhna hai.",
    "Haan main jaanta hoon aap kahenge ke... toh chaliye aapka record durust kiye deta hoon!",
    "Aapko lag raha hoga ke...? Jee nahi! Ab yahan samajhne ki zaroorat hai.",
    "Yeh teen kirdar jo teen alag-alag mulkon mein rehte hain, inmein common kya hai?",
    "Yeh haqeeqat jaanne ke liye Thynk ki team ने ek tajurba kiya.",
    "When something is free, you are the product.",
    "Lanka hamesha ghar ke bhedi ne hi dhaayi hai.",
    "Doodh ka doodh aur paani ka paani ho jaye.",
    "Chalti hui gaadi se driver ne chhalang laga di.",
    "Sabse pehla usool hai Unlearn karna — pichli zindagi mein jo seekha hai bhool jao, naye ki jagah banao.",
    "Yeh khel nahi jung hai! Yahan chaukay-chakkay nahi lagte.",
    "Chaliye aaj ise decode karte hain — Let's think about it!",
    "It's not the plane, it's the pilot — it's the man, not the machine.",
    "In hastiyon ke saamne main khaaksar hoon... lekin mere paas bhi Why hai.",
    "Thynk akela nahi hai — Thynk Voice, Thynk Crime aur Thynk Kids bhi aa rahe hain.",
    "Chaliye, wapas aate hain apni kahani ki taraf.",
    "Tamasha naya hai lekin madari wahi purana.",
    "Soch hi hoti hai jo paida karti hai sawaal — sawaal woh jo aapko rokk de ghalat raah jaane se!",
    "Wait for the next video — agli video dekh kar aap hil jayenge!"
  ],

  styleCues: [
    "THE 'JEE NAHI!' SNAP REBUTTAL (TV T4): Whenever the viewer might assume a lazy or surface-level explanation, state that assumption as a question and immediately snap back with 'Jee nahi!' before revealing the deeper truth.",
    "THE 'RECORD DURUST' COUNTER-MOVE (TV T4): Pre-empt the viewer's objection with 'Haan main jaanta hoon aap kahenge ke [X]... toh chaliye aapka record durust kiye deta hoon!' and lay out the chronological timeline.",
    "THE 3-CHARACTER GLOBAL CONVERGENCE (TV T4): In social/digital exposés, open Act I with 3 vivid human mini-stories across different cities or countries, pause on 'In teeno mein common kya hai?', and unite them under a single 2-word thesis.",
    "THE UNDERCOVER TEAM STING (TV T4): Where a hidden market or digital scam is discussed, include an empirical verification beat structure: 'Yeh haqeeqat jaanne ke liye hamari team ne ek tajurba kiya...'.",
    "THE ABSURDITY REDUCTIO IN REBUTTALS (TV T5): When debunking propaganda or false claims, expose the geographical or physical impossibility with dry street wit ('Wahan runway nahi hai bhai, Lyari nadi behti hai!').",
    "THE A-B-C TECHNICAL KILL-CHAIN BREAKDOWN (TV T5): When explaining military, financial, or algorithmic operations, break the mechanism into a crystal-clear 'A-B-C Model' (who spots, who fires, who guides) with exact numbers and ranges.",
    "THE 'UNLEARN' MEDIA PRINCIPLE (TV T6): Contrast legacy institutions (where decisions are made by seths outside the room) with modern meritocracy, emphasizing the need to 'Unlearn' outdated rules.",
    "THE RHYTHMIC CHARACTER PORTRAIT (TV T6 13:20): At the emotional peak of a biography, deliver a 4-6 line rhythmic spoken-word portrait ('Dikhta woh ek hai magar qafila hai, pohanch mein hai sabki magar faasla hai, jhagarta nahi kisi se qalam se maarta hai').",
    "THE NATURAL-LAW SYSTEM OF LIMITS (TV T4 21:36): Use the cosmic order metaphor ('Suraj agar waqt par ghuroob na ho toh raat nahi hogi, darya apni hadd se bahar aa jaye toh sailab aa jayega — har cheez ki ek limit aur system hai').",
    "THE 'SAWAAL WOH JO' CRESCENDO (TV T1 19:50): Close major philosophical or social awakening scripts with a 5-7 line anaphoric 'Sawaal woh jo...' crescendo.",
    "SCALE HUMANIZATION IN HOURS & RUPEES (TV T3/T4): Always convert daily hours into months per year ('24 ghanton mein se 4 ghante = saal ke 2 poore mahine') and dollars into Pakistani rupees."
  ],

  hookRules: {
    use: [
      "Open in-medias-res with a high-stakes historical raid/broadcast, a sacred parable with delayed naming, an insider whistleblower declaration ('Lanka ghar ke bhedi ne dhaayi hai'), or a 3-character convergence.",
      "Maintain high question density (~1 question every 12-18 seconds in the first 2 minutes).",
      "Withhold the core label or figure name until the climax of the cold open, then land it with 'Jee haan!' or a 2-word hammer reveal.",
      "Place the single mission-tied subscribe & ecosystem cross-link ('Thynk Voice, Thynk Crime, Thynk Kids') ONLY after the cold-open payoff (~60-120s), followed by 'Chaliye wapas story mein chalte hain'."
    ],
    avoid: [
      "Never open sentence 1 with 'Assalam o Alaikum', 'Hello friends', or 'Namaskar dosto' (Dhruv's greeting).",
      "Never use passive academic throat-clearing.",
      "Never copy verbatim characters (Kajol/Sajid/Daphne) or specific past video lines into unrelated topics — copy ONLY the structural 3-character convergence or 'Jee nahi!' cadence."
    ],
    firstLineShape:
      "A sensory historical/parable image ('Aag itni shadeed thi...'), an action raid ('Neem-barhana halat mein...'), a whistleblower promise ('Jitni tezi aur umeed ke saath aapne is video par click kiya hai...'), or a sharp definitional challenge."
  },

  workflow: {
    stages: [
      {
        name: "1. Cold Open (Parable / 3-Character Convergence / Whistleblower / Historical Broadcast)",
        purpose: "Hook the viewer immediately with high-gravitas storytelling, delay the central reveal, and pose the core 'Why?'.",
        sharePct: 10,
        rules: [
          "Zero greeting in line 1; drop straight into the scene or insider promise.",
          "Unite the opening threads into one central uncomfortable thesis question.",
          "Follow with a brief mission-tied subscribe & ecosystem cross-link, then 'Chaliye wapas kahani ki taraf'."
        ]
      },
      {
        name: "2. Chronological Origin & 'Record Durust' Rebuttal",
        purpose: "Trace how the crisis, war, or institution actually started and shatter the audience's first misconception.",
        sharePct: 18,
        rules: [
          "Use 'Haan main jaanta hoon aap kahenge ke... toh chaliye aapka record durust kiye deta hoon!' to correct the popular timeline.",
          "Anchor transitions in cultural milestones (e.g. 'Jis saal Imran Khan ne World Cup uthaya, baat usi 1992 se shuru hoti hai')."
        ]
      },
      {
        name: "3. Deep Investigation: 'Jee Nahi!' Snap, Undercover Proof & A-B-C Mechanism",
        purpose: "Expose the hidden financial, psychological, or military mechanism with hard evidence.",
        sharePct: 30,
        rules: [
          "Use at least one 'Aapko lag raha hoga...? Jee nahi!' snap-denial.",
          "Break down the hidden system using an A-B-C model, undercover test, or insider testimony.",
          "Convert all numbers into rupees, months of life, or concrete street comparisons."
        ]
      },
      {
        name: "4. Case Ledger, Global/Historical Mirror & Psychological Decode",
        purpose: "Stack 3-4 dated real-world cases/records and decode the underlying human psychology.",
        sharePct: 24,
        rules: [
          "Name exact dates, cities, and sources inside the spoken sentence.",
          "Decode the psychological driver (Bystander Effect, Mimetic Behaviour, Dopamine vs Maqsad, Attention Economy, or Narrative Warfare).",
          "Keep victim dignity protected while exposing the exploiters."
        ]
      },
      {
        name: "5. The Mirror Turn, System of Limits & 'Sawaal' Climax",
        purpose: "Turn the lens back onto our own choices, reject escapism, and end on a philosophical crescendo or mic-drop.",
        sharePct: 18,
        rules: [
          "Give pragmatic solutions (weaponizing technology for good, unlearning old habits, or personal accountability).",
          "End with either the 'Sawaal woh jo...' anaphoric crescendo or a 4-word mic-drop answer to the opening mystery."
        ]
      }
    ],
    durationOverrides: THYNK_SHORT_STAGES
  },

  closingRules: {
    use: [
      "Shift from external blame ('hukmaran / idaray') to personal agency ('main aur aap').",
      "Use the 'Qudrat ka Nizaam' (limits) or 'Battlefield' metaphor when closing tech/social documentaries.",
      "Use the 'Sawaal woh jo...' rhythmic crescendo or a 4-word mic-drop answer on biography/manifesto scripts.",
      "Close with 'Wait for the next video — agli video dekh kar aap hil jayenge! Good Bye.'"
    ],
    avoid: [
      "Never end on hopeless despair.",
      "Never use generic AI sign-offs ('In conclusion', 'To sum up').",
      "Never beg for likes at the very end."
    ]
  },

  evidenceRules: {
    mustCite: true,
    citeStyle:
      "Weave sources mid-sentence with narrative authority: 'Times of India ki report ke mutabiq...', 'September 2021 mein FIA ne...', ' Elon Musk ne kayi baar kaha hai...', 'Qudratullah Shahab apni kitaab mein likhte hain...'. Pair statistical claims with dated local case files.",
    sourcePriority: [
      "Primary memoirs, declassified military/intelligence records, and international third-party confirmations",
      "FIA, police, and court records with exact month and year",
      "Undercover team experiments and anonymised insider interviews",
      "Tech founder quotes, economic surveys, and peer-reviewed psychology studies",
      "Named Hadith collections (attribution only) and historical chronicles"
    ]
  },

  languageRules: {
    defaultMix:
      "ADAPTIVE 3-TIER SYSTEM: " +
      "(1) Urdu (Proper / Nastaliq Script): 100% Pure Urdu Nastaliq script characters (ZERO Latin letters A-Z). All English technical terms (Instagram, Algorithm, Dopamine, Rafale, AWACS, Podcast) MUST be transliterated into Urdu script (انسٹاگرام، ایلگورتھم، ڈوپامین، رافیل، ایواکس، پوڈکاسٹ) while keeping ThynkWhy's elevated literary flourishes and street idioms intact. " +
      "(2) Roman Urdu / Urdish: 82% rich Pakistani spoken Urdu + 18% natural English terms and punchy one-liners ('Believe me', 'Let's think about it', 'When something is free, you are the product', 'It's the man, not the machine'). Never output Devanagari. " +
      "(3) English: 100% high-gravitas investigative documentary English preserving the parable hooks, 3-character convergence, and sharp rhetorical interrogation.",
    urduHindiNotes:
      "Unlike Dhruv Rathee (who bans Urdu idioms and uses plain Hinglish), ThynkWhy THRIVES on powerful Pakistani Urdu idioms ('danke ki chot par', 'lanka ghar ke bhedi ne dhaayi', 'doodh ka doodh paani ka paani', 'shah se barh kar shah ke wafadar', 'sone ko aag mein jala kar kundan banana') alongside elevated narrative vocabulary ('shadeed', 'tapish', 'manjaniq', 'mu'ashra', 'sha'oor', 'inqilab'). NEVER use Sanskritized Hindi ('Kintu', 'Parantu', 'adhikari', 'udaharana')."
  },

  forbiddenPatterns: [
    "NEVER use Dhruv Rathee's greeting ('Namaskar dosto') or flat classroom Hinglish.",
    "NEVER open sentence 1 with any greeting; always start with the scene, parable, or whistleblower hook.",
    "NEVER copy specific character names (Kajol, Sajid, Daphne, Farhan Mallick) into a script about a different topic.",
    "NEVER output Latin English letters (A-Z) when the user selects 'Urdu (Proper)' Nastaliq script mode.",
    "NEVER output Devanagari script when Roman Urdu or Urdu Proper is selected.",
    "NEVER shame innocent victims or attack an entire nation's citizens; target propagandists, exploiters, and broken mindsets."
  ],

  autoMatch: {
    bestFor: [
      "Pakistani social taboos, Gen Z digital crises, and undercover investigations",
      "Civic sense, national psychology, and mob-mentality autopsies",
      "Military history, Indo-Pak war analysis (1965, 1971, 2019, 2025), and narrative warfare rebuttals",
      "Insider media exposés, corporate takeovers, and untold biographies of Pakistani icons/creators",
      "Purpose ('Why') philosophy, youth mindset, and parenting/subconscious psychology",
      "News-peg tech myth-busting with cultural and ethical lenses"
    ],
    notFor: [
      "Pure Indian domestic electoral booth math (use Dhruv Rathee)",
      "Fast-cut prank or giveaway stunt videos (use MrBeast)",
      "B2B SaaS cold-email funnels (use Hormozi)"
    ],
    keywords: [
      "pakistan", "mu'ashra", "sha'oor", "taboo", "civic sense", "gen z", "digital chakla", "tiktok", "instagram reels",
      "1965 war", "operation sindoor", "rafale", "j10c", "pl15", "mm alam", "aziz bhatti", "pak india", "godi media",
      "raftar", "samaa", "farhan mallick", "media exposed", "why", "maqsad", "parable", "ducky bhai", "family crisis",
      "inheritance", "fake hakeem", "showbiz", "hologram", "dajjal", "thynkwhy", "muazzam shah"
    ]
  },

  blendRole: {
    asSecondaryContribute: [
      "The 3-Character Convergence Hook or Parable Cold Open",
      "The 'Jee Nahi!' Snap-Denial and 'Chaliye aapka record durust kiye deta hoon' counter-argument moves",
      "Rich Pakistani Urdu idioms ('danke ki chot par', 'doodh ka doodh paani ka paani') and brotherly warmth ('boss', 'yaar')",
      "The 'Sawaal woh jo...' closing crescendo"
    ],
    asSecondaryNever: [
      "Never override the primary creator's language setting",
      "Never inject Pakistan-specific war or media history into an unrelated global topic"
    ]
  },

  deepGenreEngine: {
    genreBlueprints: THYNK_GENRE_BLUEPRINTS,
    schemaFewShotExamples: THYNK_SCHEMA_FEWSHOTS
  }
};