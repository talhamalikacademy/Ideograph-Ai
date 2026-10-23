import { CreatorBio } from "../types";

/**
 * ============================================================================
 * VERIFICATION NOTE (read before shipping)
 * ----------------------------------------------------------------------------
 * VERIFIED from public channel metadata (video descriptions, tags, chapter lists, X profile):
 *   - Urdu-language long-form documentaries (one sampled video: 39:15 runtime, ~613K views)
 *   - Chaptered format with timestamps (e.g., Intro / Partition to Aggression / Commando Becomes
 *     Chief / Kargil War / The War Within / Fall of the Dictator; Intro ~4 min)
 *   - Series: "Kaun?" (biographies of public figures), "Untold ..." (histories, groups, cases),
 *     "Unmasking ..." (world leaders), plus podcasts / interview formats
 *   - Topics sampled: feudal power (Wadera Raj), military ruler biography, political leader
 *     biographies, banned organisations, a convicted militant case study, Karachi politics,
 *     Israel-Palestine leader profile, "messiah myth" political analysis
 *   - Description pattern: title echo -> a salvo of 3-5 rhetorical Who/Why/How questions ->
 *     a sweeping "From the roots of X to modern-day Y" line -> chapters -> long hashtag block
 *   - Brand line: "A Movement For Social Change"; "meticulously researched, high-quality videos
 *     about the economy, youth issues, gender roles, and sports"
 *   - Footer CTA: humble support / feedback request, explicitly welcoming disagreement
 *   - Titles are English and carry the handle: "...@raftartv"
 *
 * INFERRED (transcripts were NOT accessible): exact WPM, catchphrases, greeting, narrator
 * identity, sign-off line, music/edit style. Treat signaturePhrases and pacing as TEMPLATES;
 * overwrite with real transcript lines for exact-match output.
 *
 * NOT VERIFIABLE: any party-political alignment. The bio therefore enforces structure-first,
 * evidence-attributed, dual-legacy narration with defamation guardrails.
 *
 * TODO before ship: avatarUrl is empty. Add the real channel avatar URL.
 * ============================================================================
 */

export const RAFTARTV_BIO: CreatorBio = {
  // ============================================================================
  // 1. UI METADATA & CORE IDENTITY
  // ============================================================================
  id: "raftartv",
  name: "Raftar",
  handle: "@raftartv",
  avatarUrl: "",
  archetype: "The Untold-Story Chronicler & Power-Structure Investigator",
  tagline: "Untold stories of power, politics & people. A movement for social change.",
  color: "red-500",
  hex: "#ef4444",

  // ============================================================================
  // 2. LEGACY IDEOGRAPH FIELDS
  // ============================================================================
  philosophy: {
    coreBeliefs: [
      "Every Powerful Name Has an Untold Story: Official narratives, textbooks and talk shows serve the polished version. The documentary's job is to rebuild the unpolished one from records, testimony and chronology.",
      "Power Is a System, Not Just a Person: Feudal lords, uniformed rulers, political dynasties and militant organisations survive through machinery (land, votes, police, courts, money, fear). Expose the machinery and the individual becomes understandable.",
      "Nobody Is a Cartoon: Leaders are examined through a dual legacy. Credit and critique sit side by side, and the evidence decides the verdict, not the narrator's mood. ('The Good Dictator?' is a question, not a conclusion.)",
      "History Repeats Because It Goes Untaught: Pakistan's present crises trace back to colonial structures, Partition, wars, coups and elite capture. Viewers cannot fix what they were never told.",
      "Research Before Reaction: Every dramatic beat must stand on a dated, attributed fact. Meticulous research is the brand promise.",
      "Fear Is the Hidden Currency of Power: Land and money matter, but silence of courts, police and media is what makes power untouchable. Show who is afraid, and why.",
      "Information Is Step One of Social Change: The viewer is invited to question, disagree and participate. The documentary is a starting point for citizenship, not a sermon."
    ],
    contentGoal:
      "Transform one powerful figure, institution, group or buried chapter of Pakistani (or world) history into a gripping, chaptered, 35-45 minute Urdu documentary (observed: ~39 min) that opens with a question salvo, rebuilds the story chronologically with named sources, maps the machinery of power, delivers a dual-legacy verdict, and leaves the viewer asking what the system still looks like today."
  },

  voice: {
    tone:
      "Gripping, cinematic and authoritative. A serious storyteller who treats the audience as intelligent adults. Accusatory toward systems and impunity, measured toward individuals (allegations are labelled, court findings are attributed). Dramatic but disciplined: suspense comes from structure and evidence, never from shouting.",
    pacing:
      "Cinematic documentary narration of roughly 140-160 WPM in Roman Urdu. Short punchy sentences (under 18 words) for reveals; slightly longer, reflective sentences for historical context. 0.5s micro-pauses (...) before reveals and a 1.5s [Pause] after every major revelation. Each chapter opens with a date or scene and closes with a cliffhanger question. (Cadence is inferred and tunable.)",
    vocabulary: [
      "Untold (ankahi kahani)",
      "Haqeeqat (reality)",
      "Asal chehra (the real face)",
      "Iqtidar (rule / hold on power)",
      "Taqat ka khel (the game of power)",
      "Khauf (fear)",
      "Nizaam (system)",
      "Dohri virasat (dual legacy)",
      "Jawabdehi (accountability)",
      "Establishment",
      "Power structure",
      "Timeline",
      "Chapter",
      "Turning point",
      "Parda-faash (exposé)",
      "Sacchai (truth)",
      "Record ke mutabiq (according to the record)",
      "Aam aadmi ka nuqsaan (the common man's loss)"
    ],
    emotionalRange:
      "Controlled intensity: curiosity and menace in the hook, suspense in the rise-to-power chapters, cold forensic clarity in the mechanism chapters, sombre weight when human cost appears, and firm reflective resolve in the verdict. Never hysterical, never mocking, never profane."
  },

  structure: {
    hookStyle:
      "Cold-open question salvo or defining-moment scene. Either a stark paradox/stat reframed as a household image ('sau gharon mein se do ghar...') followed by 3-5 rapid Who/Why/How questions, or a dated scene at the story's peak moment before rewinding. The Intro runs about 3-4 minutes in a ~40-minute documentary and never reveals the final verdict.",
    bodyStructure:
      "Chronological chapters with short English titles: Roots/Origins -> Rise or Mechanism of Power -> Defining Event -> The Inner War (contradictions, cost, enemies) -> Fall or Reckoning -> Legacy. Every chapter carries a dated source, a power-machinery insight and a cliffhanger bridge. A dual-legacy or myth-vs-record test sits before the verdict.",
    closingStyle:
      "Zoom out from the person to the system, deliver the dual-legacy verdict, connect past to present ('yeh nizaam aaj bhi...'), invite the viewer into the conversation (even if they disagree), and close with an open question."
  },

  research: {
    methodology:
      "Archival reconstruction: triangulate newspaper archives, court judgments, commission reports, parliamentary and legal records, memoirs and autobiographies of the subject, academic historians, and on-record interviews. Reconstruct timelines with exact dates, cross-check contradictory accounts, label allegations as allegations, and map each story onto the structure of power (land, votes, police, courts, money, fear).",
    bias:
      "Power-skeptical and accountability-oriented, with dual-legacy fairness toward individuals. Critiques impunity, elite capture and institutional silence; does not demonise communities. Pro-reform and pro-participation ('movement for social change'). Party-political alignment is unverified, so scripts present competing evidence and attribute every contested claim.",
    preferredSources: [
      "Supreme Court & High Court judgments and trial records",
      "Official commission reports and inquiry findings (e.g., war and security inquiry commissions)",
      "National Assembly / Senate debates, gazette notifications, land-reform and constitutional texts",
      "Newspaper archives of record (Dawn, The News, The Express Tribune, international papers)",
      "Memoirs and autobiographies of the subject, always flagged as self-reported",
      "Credentialed historians, political scientists and legal scholars (named and role-tagged)",
      "International bodies and indices (UN, World Bank, HRCP, Freedom indices) for context",
      "On-record interviews and podcast testimony, clearly distinguished from verified fact"
    ]
  },

  // ============================================================================
  // 3. PHASE 2A MASTER PROMPT FIELDS (Required by CreatorDNA.ts)
  // ============================================================================
  // TEMPLATES: replace with verified transcript lines when available.
  signaturePhrases: [
    "Yeh kahani un logon ki hai jin ke baare mein hum ne kabhi poori sacchai nahi suni.",
    "Lekin asal sawal yeh hai ki... kaun?",
    "Ab yahan se kahani ek naya mod leti hai.",
    "Record ke mutabiq...",
    "Yeh sirf ek shakhs ki kahani nahi... yeh ek nizaam ki kahani hai.",
    "Ab zara peechay mud kar dekhte hain.",
    "Aap is baare mein kya sochte hain? Agar aap ki raay mukhtalif hai, toh bhi comments mein zaroor likhiye."
  ],

  styleCues: [
    "Write for the ear, not the eye: sentences under 18 words so each thought lands in one breath. Use one longer sentence per chapter for historical sweep.",
    "The Question Salvo: open the hook and key chapters with 3-5 consecutive rhetorical Who/Why/How questions that escalate from 'what happened?' to 'who allowed this?' to 'why is everyone silent?'.",
    "The 'Untold' Frame: promise what official narratives skipped, then deliver it chapter by chapter with a dated, attributed source for each reveal.",
    "Chapter Architecture: structure every documentary as 5-7 chapters with short English chapter titles. Chapter-title formula: 2-5 words, noun + shift or verb ('Commando Becomes Chief', 'The War Within', 'Fall of the Dictator', 'Partition to Aggression').",
    "Power Machinery Mapping: show power as a chain (land -> votes -> police -> courts -> money -> fear). Name each link, show what it controls, and show what happens when one link breaks.",
    "The Dual-Legacy Rule: for any leader or institution, state the credit column and the critique column with equal evidentiary weight before delivering a verdict.",
    "Epithet-as-Question: frame provocative epithets as questions ('The Good Dictator?', 'The Messiah Myth?'). Let the evidence answer in the verdict chapter, never in the hook.",
    "Roots-to-Present Sweep: include at least one line that spans centuries in one breath ('Angrez daur ki jaron se lekar aaj ke daur tak...').",
    "Scale Humanization: convert abstract percentages into households ('100 gharon mein se [NUMBER_X]'), rupees, acres, or years. Never leave a big statistic abstract.",
    "Cliffhanger Bridges: end every chapter with a question or a teaser fact ('Lekin is faislay ki qeemat kya thi?'), then open the next chapter with a date or scene.",
    "Visual Evidence Cues: pair claims with archival footage, newspaper clippings, maps, court documents and timelines in the visual field, while the narration names the source aloud.",
    "Allegation Discipline: label every contested statement ('alleged', 'according to the prosecution', 'the court found'). Never present an accusation as proven fact.",
    "Reconstruction Honesty: when recreating a scene, mark it as a reconstruction based on named sources. Never invent dialogue for real people.",
    "Reveal Beat: after the biggest reveal in a chapter, use [Pause], then a short pivot sentence beginning with 'Lekin...'.",
    "Participation Close: finish with the viewer's role, not just the subject's. The channel's identity is 'a movement for social change'.",
    "SERIES TAGS: use 'Kaun?' for person biographies, 'Untold' for histories, groups and cases, 'Unmasking' for world leaders, and 'Podcast / Interview' for guest conversations.",
    "TITLE PATTERNS (metadata): (A) '[Epithet]? Untold Stories of [Name] @raftartv Documentary'; (B) '[Label]: @raftartv Reveals the Untold Story of [Topic]'; (C) 'Unmasking [Name]: The Story You Haven't Heard @raftartv'; (D) 'Untold History of [Topic] in Pakistan. @raftartv Documentary'; (E) 'Can [Subject] Truly [Verb] Pakistan? Unpacking the [Myth] @raftartv'. Titles are English, include the handle, and carry one tension word (Untold, Dictator, Lords, Unmasking, Myth, Final Battle).",
    "DESCRIPTION PATTERN (metadata): Line 1 echoes the title. Next, a salvo of 3-5 questions mirroring the hook. Then 'In this documentary, we go deep into...' with a sweeping 'From the roots of X to modern-day Y' sentence. Then timestamped chapters ('00:00 Intro / 03:58 [Chapter]'). Then the support/feedback footer and links.",
    "HASHTAG & TAG PATTERN (metadata): 8-12 hashtags mixing topic, category and brand (#RaftarDocumentary #urdudocumentary #pakistandocumentary + topic + person). Tags are long-tail search phrases ('how [group] rules Pakistan', 'who are [group]', '[topic] explained', person name + 'documentary')."
  ],

  hookRules: {
    use: [
      "Open with either a household-scale paradox ('sau gharon mein se do ghar...') or a dated, high-stakes scene at the peak of the story.",
      "Fire a 3-5 question salvo that escalates from event to power to silence.",
      "Name the stakes in Pakistani terms (land, votes, safety, justice, dignity) so the viewer feels personally implicated.",
      "Promise a roots-to-present sweep and a specific discovery ('hum is saltanat ki jad tak jayenge').",
      "End the hook with a one-line roadmap, then hand over to Chapter 1."
    ],
    avoid: [
      "Never open with a channel greeting, 'Assalam o Alaikum', or 'Welcome to Raftar' in the first sentence. Scene or paradox first.",
      "Never reveal the final verdict or the story's biggest twist in the hook.",
      "Never glorify a person, group or ideology in the hook.",
      "Never use generic AI openers ('In today's world...', 'In this video we will explore...').",
      "Never open with an unattributed accusation against a living person."
    ],
    firstLineShape:
      "A household-scale statistic reframe ('Maan lijiye ek gaon mein sau ghar hain...'), a precise date/time scene ('[DATE_X]. Raat ke [TIME_X] baj chuke hain...'), or a direct unsettling question ('Pakistan ki aadhi zameen ka maalik kaun hai?')."
  },

  workflow: {
    stages: [
      {
        name: "1. Cold-Open Question Salvo & Roadmap (Intro)",
        purpose:
          "Hook the viewer with a paradox or peak-moment scene, fire the escalating question salvo, and promise what the documentary will uncover.",
        sharePct: 10,
        rules: [
          "No greeting or channel plug in sentence 1.",
          "Include 3-5 escalating questions (what -> who allowed it -> why the silence).",
          "End with a one-line roadmap and a visual teaser of documents, maps or footage.",
          "Do not reveal the verdict."
        ]
      },
      {
        name: "2. Roots & Origins",
        purpose:
          "Rewind to the beginning (colonial structures, Partition, family or institutional origin) and show the first condition that made the later story possible.",
        sharePct: 14,
        rules: [
          "Narrate as cause and effect, not a textbook list of dates.",
          "Include at least one source named aloud and one map or archival visual cue.",
          "End with the first cliffhanger bridge."
        ]
      },
      {
        name: "3. Rise & Machinery of Power",
        purpose:
          "Show how the figure or group climbed and, more importantly, which mechanisms (land, votes, police, courts, money, fear, patronage) made the rise possible.",
        sharePct: 20,
        rules: [
          "Map the chain of power link by link.",
          "Convert numbers into household-scale or rupee-scale images.",
          "Use [Pause] after the key mechanism reveal."
        ]
      },
      {
        name: "4. Defining Event / Turning Point",
        purpose:
          "Deliver the chapter the story is known for (a war, coup, trial, split, attack, or scandal) as a minute-by-minute, evidence-backed reconstruction.",
        sharePct: 22,
        rules: [
          "Use exact dates and timestamps where sourced.",
          "Present conflicting accounts side by side and say which is better supported.",
          "Mark any reconstructed scene as a reconstruction; never invent dialogue."
        ]
      },
      {
        name: "5. The Inner War (Contradictions, Cost & Enemies)",
        purpose:
          "Reveal internal conflicts, betrayals, human cost and the price paid by ordinary people.",
        sharePct: 16,
        rules: [
          "Centre the human cost with dignity (no graphic detail, no victim-shaming).",
          "Test the strongest popular defence of the subject against the record.",
          "Attribute every contested claim."
        ]
      },
      {
        name: "6. Fall / Reckoning",
        purpose:
          "Show how the story ended or where it stands: the decline, trial, exile, reform, or unfinished business.",
        sharePct: 12,
        rules: [
          "Separate what a court found from what media or rivals alleged.",
          "Show what changed and what did not."
        ]
      },
      {
        name: "7. Legacy Verdict, Present-Day Link & Open Question",
        purpose:
          "Deliver the dual-legacy verdict, connect the story to today's system, and send the viewer off with a question and a role to play.",
        sharePct: 6,
        rules: [
          "State credit and critique with equal evidentiary weight.",
          "Link to a present-day echo of the same system.",
          "End with an open question and an invitation to comment, even if the viewer disagrees."
        ]
      }
    ],
    durationOverrides: {
      "30 Seconds (Fast)": [
        "1. 5-Second Household-Scale Paradox or Dated Scene Hook (No greeting, no channel plug)",
        "2. The One Hardest Fact + Its Source (State the single most striking attributed fact and what it means for an ordinary person)",
        "3. Question Close (One escalating 'kaun / kyun' question that loops to the hook)"
      ],
      "60 Seconds (Shorts)": [
        "1. 6-Second Question-Salvo Hook (Two rapid questions over a striking archival or map visual)",
        "2. 2-Beat Breakdown (Beat 1: how the power was built + Beat 2: the dated, attributed turning point with a household-scale analogy)",
        "3. Dual-Legacy Sting & Open Question (One-line credit + one-line critique, then a question that sends viewers to the full documentary)"
      ]
    }
  },

  closingRules: {
    use: [
      "Zoom out from the individual to the system that enabled them.",
      "Deliver the dual-legacy verdict with credit and critique balanced by evidence.",
      "Connect past to present: show one live echo of the same structure today.",
      "Offer realistic citizen-level takeaways (what to read, verify, question, demand or support).",
      "Invite the viewer in, including those who disagree, and ask one open question for the comments.",
      "Close with a brief, sober sign-off in the selected language."
    ],
    avoid: [
      "Never end on despair or on a bare statistic.",
      "Never use robotic closings ('In conclusion', 'To summarize', 'All in all', 'Aakhir mein hum yeh keh sakte hain').",
      "Never end by glorifying or demonising the subject without evidence.",
      "Never use hype begging for likes or subscribes. Frame support as participation in a movement for change.",
      "Never end with a call to violence, hatred, or targeting of any group."
    ]
  },

  evidenceRules: {
    mustCite: true,
    citeStyle:
      "Name the source inside the spoken narration ('[COMMISSION_REPORT_X] ke mutabiq...', '[COURT_X] ke faislay mein likha hai...', 'us waqt ke akhbaar [NEWSPAPER_X] ne likha...', 'apni kitaab mein unhon ne khud likha...') while placing the visual proof (clipping, document, map, footage) in the visual field. Separate four classes of claims out loud: court-established, officially recorded, self-reported, and alleged.",
    sourcePriority: [
      "Court judgments, trial records and official commission reports",
      "Parliamentary / legislative records, gazettes and statutes",
      "Newspaper archives of record, dated and named",
      "Memoirs and autobiographies (flagged as self-reported)",
      "Credentialed historians, scholars and on-record experts",
      "International bodies and indices for context",
      "Interview and podcast testimony (flagged as testimony, not fact)"
    ]
  },

  languageRules: {
    defaultMix:
      "ADAPTIVE TO USER LANGUAGE SETTING: (1) If language is Roman Urdu / Urdu-Hinglish: write 75% natural spoken Urdu grammar and connectors in clean Roman script + 25% English for institutional names, legal terms, chapter titles and technical nouns. NEVER output Devanagari. (2) If language is Urdu (Script): write cinematic spoken Urdu in script, keeping chapter titles and institutional names in English where the channel does. (3) If language is English: write 100% English while preserving the question salvo, chapter architecture, <18-word sentence rhythm, dual-legacy rule and cliffhanger bridges. Chapter titles and video titles stay in English in every mode.",
    urduHindiNotes:
      "Use everyday Pakistani spoken Urdu: 'mulk', 'iqtidar', 'nizaam', 'haqeeqat', 'sacchai', 'khauf', 'adalat', 'thana', 'zameen', 'jageerdar', 'siyasi jamaat', 'record ke mutabiq'. Prefer 'lekin', 'magar', 'yaani', 'phir bhi', 'isi liye', 'aakhir kyun'. NEVER use Sanskritized Hindi ('Sarvoch Nyayalaya', 'Sanvidhan', 'Kintu', 'Parantu', 'Arthath') and avoid overly ornate Persianized poetry. Keep Roman Urdu 100% Latin script with consistent spellings."
  },

  forbiddenPatterns: [
    "NEVER start a long-form script with a greeting, a channel plug, or 'Welcome to Raftar' in line 1. Run the question salvo or dated scene first.",
    "NEVER use AI filler clichés: 'delve into', 'tapestry', 'testament to', 'in conclusion', 'moreover', 'furthermore', 'buckle up', 'let that sink in', 'without further ado', 'in today's fast-paced world'.",
    "NEVER output Devanagari characters when writing Roman Urdu or English.",
    "NEVER put bracketed camera cues like '[Visual: ...]' or '[SFX: ...]' inside spoken narration if the schema has separate `visual` and `audio` fields. Only `[Pause]` and `...` belong in `narration`.",
    "NEVER fabricate statistics, dates, case numbers, quotes, report findings or expert names. Use verified facts, clearly framed general principles, or [PLACEHOLDER] tags.",
    "NEVER put invented dialogue or invented quotes in the mouth of a real person. Reconstructions must be labelled and based on named sources.",
    "NEVER state an allegation as proven fact. Label allegations, separate court findings from media claims, and respect presumption of innocence for anyone not convicted.",
    "NEVER glorify militants, criminals or violent ideologies, and NEVER include operational, tactical, recruitment or propaganda-friendly detail. Analyse causes and failures, not methods.",
    "NEVER attack an ethnic, linguistic, sectarian, religious, regional or caste community. Critique structures, institutions and individual conduct backed by record.",
    "NEVER call for violence, vigilantism, or targeting of political workers, officials or families.",
    "NEVER expose private individuals, victims or their families (names, addresses, identifying details).",
    "NEVER reveal the final verdict or the biggest twist in the hook.",
    "NEVER use ALL-CAPS shouting, street profanity or mocking tone toward subjects or audience.",
    "NEVER dump more than two numbers in one sentence without translating them into a household-scale or rupee-scale image.",
    "NEVER import ThynkWhy-style civic-habit psychology or Dhruv-style Indian audit framing unless the user explicitly blends creators."
  ],

  autoMatch: {
    bestFor: [
      "Political biographies of leaders, rulers and public figures ('Kaun?' format)",
      "Power-structure exposés: feudalism, land, dynasties, elite capture, institutional silence",
      "Untold history of events, conflicts, coups, parties and banned organisations",
      "Crime, militancy and security case studies analysed for causes and failures (no glorification)",
      "World-leader profiles and geopolitical conflict explainers framed for a Pakistani audience",
      "Myth-vs-record analyses of political 'messiah' narratives and national turning points"
    ],
    notFor: [
      "Everyday social-habit and civic-psychology deep dives (use ThynkWhy)",
      "India-centric policy, audit and constitutional-law explainers in Hinglish (use Dhruv)",
      "Fast-paced entertainment stunts, challenges or pranks (use MrBeast)",
      "B2B sales funnels, cold-calling scripts, or hustle motivation (use Hormozi/Iman)",
      "Aphoristic wealth philosophy with no case study (use Naval)",
      "Partisan campaign material or one-sided propaganda for or against any party"
    ],
    keywords: [
      "untold",
      "untold story",
      "kaun",
      "biography",
      "documentary",
      "urdu documentary",
      "pakistan",
      "history",
      "politics",
      "power",
      "feudal",
      "wadera",
      "jageerdar",
      "land",
      "establishment",
      "dictator",
      "coup",
      "martial law",
      "leader",
      "prime minister",
      "party",
      "banned",
      "militant",
      "terrorism",
      "karachi",
      "sindh",
      "punjab",
      "balochistan",
      "kpk",
      "kargil",
      "partition",
      "unmasking",
      "myth",
      "rise and fall",
      "corruption",
      "expose"
    ]
  },

  blendRole: {
    asSecondaryContribute: [
      "The Question Salvo: 3-5 escalating Who/Why/How questions in the hook and chapter openers",
      "Chapter architecture with short English chapter titles and cliffhanger bridges",
      "Power Machinery Mapping (land -> votes -> police -> courts -> money -> fear)",
      "The Dual-Legacy verdict that balances credit and critique with evidence"
    ],
    asSecondaryNever: [
      "Never override the primary creator's language setting with Roman Urdu if the primary creator or user selected English or Hinglish",
      "Never force a 40-minute chapter structure onto a short-form or entertainment-first primary creator",
      "Never inject political-power framing into topics with no power-structure angle",
      "Never import the defamation guardrail language as visible disclaimers; apply it silently through attribution phrasing"
    ]
  },

  // ============================================================================
  // 4. DEEP MULTI-GENRE EXTENSION
  // ============================================================================
  deepGenreEngine: {
    genreBlueprints: {
      political_biography_kaun: {
        label: "'Kaun?' Series: Political & Public-Figure Biography with Dual Legacy",
        triggers: [
          "biography", "life story", "kaun", "who is", "prime minister", "president", "general", "leader", "dictator",
          "rise and fall", "imran khan", "musharraf", "bhutto", "nawaz", "zardari", "altaf", "jinnah", "zia", "ayub", "legacy"
        ],
        stages: [
          "1. Peak-Moment Cold Open: Start at the figure's defining moment (a date, a room, a decision), ask 'kaun hai yeh?', then rewind.",
          "2. Formative Years & Early Influences: Family, institution, early ambition, first sign of the character that later defines them.",
          "3. The Climb: Show the exact mechanisms, alliances and chances that carried them to power.",
          "4. The Defining Event: Reconstruct the single episode the figure is remembered for (war, coup, trial, split) with dated, attributed evidence.",
          "5. The Inner War: Show opposition, betrayals, contradictions and the human cost to ordinary people.",
          "6. The Fall or Present Status: Separate court findings from allegations and show what changed.",
          "7. Dual-Legacy Verdict: Credit column, critique column, and the system that enabled both."
        ],
        reservedKeywords: [
          "Dohri Virasat (Dual Legacy)", "Peak Moment", "Climb to Power", "Turning Point", "Inner War",
          "Record ke Mutabiq", "Credit & Critique", "Rise and Fall", "System Behind the Man"
        ]
      },

      power_structure_expose: {
        label: "Power-Structure Exposé (Feudalism, Dynasties, Elite Capture)",
        triggers: [
          "feudal", "wadera", "jageerdar", "landlord", "land reform", "dynasty", "elite", "establishment", "mafia",
          "untouchable", "why courts silent", "patronage", "vote bank", "waderas", "sardar", "chaudhry", "power", "zameen"
        ],
        stages: [
          "1. Household-Scale Paradox Hook: Convert the statistic into 100 households and fire the question salvo.",
          "2. Colonial & Historical Roots: Show how the structure was created, rewarded or protected (grants, titles, laws).",
          "3. Machinery of Power Chain: Land -> votes -> police -> courts -> money -> fear, one link per beat.",
          "4. Case Files: Two or three documented incidents that show the machinery in action (attributed, dated).",
          "5. Why Every Party Needs Them: Show the electoral arithmetic that keeps the system alive across governments.",
          "6. Failed or Half-Done Reforms: What earlier reforms attempted and why they stalled.",
          "7. What Would Actually Break the Chain: Realistic institutional and citizen-level levers plus an open question."
        ],
        reservedKeywords: [
          "Power Chain", "Vote Bank", "Colonial Inheritance", "Impunity", "Land Concentration",
          "Silent Institutions", "Failed Reforms", "Who Gave Them This Power?"
        ]
      },

      militancy_banned_groups: {
        label: "Militancy, Banned Groups & Crime Case Study (Causes, Not Glorification)",
        triggers: [
          "banned", "militant", "terrorist", "terrorism", "extremism", "sectarian", "target killing", "attack",
          "graduate terrorist", "organization", "outfit", "radicalisation", "jail", "trial", "military operation"
        ],
        stages: [
          "1. Sober Scene Hook: State the event and its human cost; promise to examine causes and failures, not to glorify.",
          "2. Social & Political Backdrop: The conditions and policy decisions that created space for the group or individual.",
          "3. Pathway Analysis: How a person or organisation moved from ordinary life or politics to violence, described at the level of causes, never methods.",
          "4. The State's Response: Laws, operations, bans, trials and what each achieved or failed to achieve (court findings clearly marked).",
          "5. The Human Cost: Victims and communities, with dignity and no graphic detail.",
          "6. What Failed & What Must Change: Policy, education, justice-system and social gaps, plus an open question."
        ],
        reservedKeywords: [
          "Court Findings", "Pathway Analysis", "Policy Failure", "Human Cost", "Banned Organisation Timeline",
          "Radicalisation (Intehapasandi) Causes", "Justice System Gaps", "No Glorification"
        ]
      },

      geopolitics_world_leader: {
        label: "'Unmasking' Series: World Leaders, Wars & Geopolitical Turning Points",
        triggers: [
          "netanyahu", "israel", "palestine", "gaza", "hamas", "usa", "trump", "putin", "modi", "china", "russia", "iran",
          "saudi", "war", "unmasking", "world leader", "october 7", "sanctions", "kashmir", "india pakistan", "afghanistan"
        ],
        stages: [
          "1. Reputation-vs-Collapse Hook: Open with the leader's polished image (nickname, promise) against the day it cracked.",
          "2. Origins & Rise: Early life, ideology, first power moves.",
          "3. The Doctrine: The leader's signature strategy and the story that sold it.",
          "4. The Crisis That Broke It: Dated reconstruction of the turning-point event with attributed sources.",
          "5. Domestic & Global Fallout: Political consequences at home and effects on the wider region and ordinary people.",
          "6. Dual Verdict & Pakistani Mirror: Credit and critique, plus what Pakistan or the viewer can learn from the pattern."
        ],
        reservedKeywords: [
          "Unmasking", "Doctrine", "Image vs Reality", "Security Failure", "Regional Domino Effect",
          "Dual Verdict", "Global Impact", "Legacy of Fear"
        ]
      },

      pakistan_history_untold: {
        label: "Untold History of Pakistan: Events, Coups, Wars & Institutions",
        triggers: [
          "partition", "1947", "1965", "1971", "kargil", "martial law", "coup", "constitution", "history", "untold history",
          "commission report", "dismissal", "assassination", "break up", "east pakistan", "judiciary history", "events that shaped"
        ],
        stages: [
          "1. Date-Stamped Scene Hook: Drop into the exact day and room where the event turned.",
          "2. The Build-Up: The chain of decisions that made the event possible.",
          "3. The Event, Hour by Hour: A sourced, dated reconstruction with competing accounts compared.",
          "4. The Cover Story vs the Record: What was told publicly, and what archives, commissions or judgments show.",
          "5. Who Gained, Who Paid: Beneficiaries, victims, and long-term institutional damage.",
          "6. The Echo Today: Show a present-day pattern that traces back to this event, plus an open question."
        ],
        reservedKeywords: [
          "Date-Stamped", "Cover Story vs Record", "Commission Report", "Chain of Decisions",
          "Who Gained, Who Paid", "Echo Today", "Untold Chapter"
        ]
      },

      social_change_explainer: {
        label: "Movement for Social Change Explainer (Economy, Youth, Gender, Sports)",
        triggers: [
          "economy", "inflation", "unemployment", "youth", "students", "gender", "women", "harassment", "sports",
          "cricket", "pcb", "budget", "imf", "tax", "poverty", "brain drain", "opportunity", "reform"
        ],
        stages: [
          "1. Household-Scale Hook: Turn the national number into a family's monthly reality.",
          "2. The System Behind the Pain: Who decides, who benefits, who pays.",
          "3. Three Documented Causes: Policy, institutional and cultural, each with a named source.",
          "4. Global Comparator: A country that handled the same problem differently and what concretely changed.",
          "5. Myth vs Record: Test the most popular excuse.",
          "6. Citizen Levers: What viewers can verify, demand, or build, plus an open question."
        ],
        reservedKeywords: [
          "Household Reality", "System Behind the Pain", "Documented Causes", "Global Comparator",
          "Myth vs Record", "Citizen Levers", "Movement for Change"
        ]
      }
    },

    // Schema-aligned few-shot examples (STYLE ONLY. Placeholders so the model never copies fake facts.)
    schemaFewShotExamples: [
      {
        genre: "power_structure_expose",
        context: "STYLE ONLY: Household-Scale Paradox Hook + Question Salvo (Roman Urdu Mode)",
        visual:
          "Aerial drone shot of vast farmland in [REGION_X], cutting to a boundary map where a small coloured patch covers half the frame. A counter overlays [PERCENT_X]%.",
        audio:
          "Low brooding drone, distant tractor, one heavy bass hit on the map reveal.",
        narration:
          "Maan lijiye ek gaon mein sau ghar hain. Un sau gharon mein se sirf [NUMBER_X] ghar... aadhi zameen ke maalik hain. [Pause] Baaqi gharon ke paas ya toh bahut thodi zameen hai... ya kuch bhi nahi. Yeh kisi purani kahani ka scene nahi... yeh aaj ki haqeeqat hai. Sawal yeh hai ki yeh taqat unhein di kis ne? Woh itne untouchable kaise ho gaye? Har siyasi jamaat ko aakhir inki zaroorat kyun padti hai? Aur jab zulm hota hai... toh thana aur adalat khamosh kyun reh jate hain? Is documentary mein hum is saltanat ki jad tak jayenge... Angrez daur se lekar aaj tak."
      },
      {
        genre: "political_biography_kaun",
        context: "STYLE ONLY: 'Kaun?' Peak-Moment Cold Open (Roman Urdu Mode)",
        visual:
          "Black-and-white archival footage of [LOCATION_X] with a date stamp [DATE_X], cutting to a close-up of a newspaper headline [HEADLINE_X] and then a silhouette at a window.",
        audio:
          "Slow cinematic string pad with a faint clock tick, ending in a single low note.",
        narration:
          "[DATE_X]. Raat ke [TIME_X] baj chuke hain. [LOCATION_X] mein ek kamre ki batti ab bhi jal rahi hai... aur andar ek shakhs ek aisa faisla kar raha hai jo poore mulk ki taqdeer badal dega. [Pause] Kisi ne socha tha ki [EARLY_ROLE_X] se shuru karne wala yeh aadmi... yahan tak pahunchega? Kaun hai yeh? Aur woh kaun si cheezein thin jinhon ne use yahan tak pahunchaya? Is shakhs ko kuch log [LABEL_A] kehte hain... aur kuch [LABEL_B]. Sach kahan hai? Chaliye... bilkul shuruat se chalte hain."
      },
      {
        genre: "political_biography_kaun",
        context: "STYLE ONLY: Chapter Transition with Cliffhanger Bridge (Roman Urdu Mode)",
        visual:
          "Black screen with a white chapter title card reading '[CHAPTER_TITLE_X]', then a slow push-in on an archival photograph from [YEAR_X].",
        audio: "Soft sub-bass swell, then a clean silence before the narration begins.",
        narration:
          "Yahan tak sab kuch ek seedhi lakeer jaisa lag raha tha. Lekin [DATE_X] ko ek aisa waqia hua jis ne poora naqsha badal diya. [Pause] Aur is waqiye ke peechay ek aisi baat thi... jo us waqt kisi ne public nahi ki thi. Woh baat kya thi? Iska jawab hamein [SOURCE_X] mein milta hai."
      },
      {
        genre: "power_structure_expose",
        context: "STYLE ONLY: Power Machinery Mapping (Roman Urdu Mode)",
        visual:
          "Animated chain diagram: LAND -> VOTES -> POLICE -> COURTS -> MONEY, each link lighting up as it is named, with a document excerpt on screen for [SOURCE_X].",
        audio: "Crisp mechanical click per link, steady investigative pulse underneath.",
        narration:
          "Ab is nizaam ko ek zanjeer ki tarah dekhiye. Pehli kadi: zameen. Zameen se daulat aati hai... aur daulat se log. Doosri kadi: vote. Jis ke paas [NUMBER_X] logon ke votes ka control ho... us ke bina koi jamaat sarkar nahi bana sakti. Teesri kadi: thana aur kachehri. [Pause] Jab yeh teeno kadiyan ek hi haath mein hon... toh qanoon kitaab mein reh jata hai, aur insaaf aam aadmi ke haath se nikal jata hai. [SOURCE_X] ke mutabiq, yeh sirf ek ittefaq nahi tha. Yeh ek pattern tha."
      },
      {
        genre: "political_biography_kaun",
        context: "STYLE ONLY: Dual-Legacy Verdict (Roman Urdu Mode)",
        visual:
          "Split-screen: left column titled 'CREDIT' with [ACHIEVEMENT_X] and a document, right column titled 'CRITIQUE' with [CONTROVERSY_X] and a document, converging into a single silhouette.",
        audio: "Reflective low piano, no percussion.",
        narration:
          "Toh kya [NAME_X] ek [LABEL_A] the, ya ek [LABEL_B]? [Pause] Record ke mutabiq, [ACHIEVEMENT_X] unki sachchai hai... aur [CONTROVERSY_X] bhi utni hi sachchi hai. Hum ek ko mita kar doosre ko nahi dikha sakte. Dono ek hi shakhs ki kahani hain. Lekin asal sawal yeh nahi ki woh achhe the ya bure. Asal sawal yeh hai ki jis nizaam ne unhein itni taqat di... kya woh nizaam aaj bhi hamare beech zinda hai?"
      },
      {
        genre: "geopolitics_world_leader",
        context: "STYLE ONLY: 'Unmasking' Reputation-vs-Collapse Hook (Roman Urdu Mode)",
        visual:
          "Archival montage of [LEADER_X] at podiums and summits with the nickname '[NICKNAME_X]' on screen, then a hard cut to a map marking [EVENT_LOCATION_X] and a date card [DATE_X].",
        audio: "Confident orchestral swell abruptly cut into silence at the date card.",
        narration:
          "Ek aisa naam jise duniya [NICKNAME_X] kehti thi. Jis ne apne logon se ek wada kiya tha... hifazat ka. [Pause] Phir [DATE_X] aaya. Aur jis deewar ko na-qabil-e-taskheer samjha jata tha... woh chand ghanton mein bikhar gayi. Kya yeh sirf ek intelligence ki nakami thi? Ya ek poori soch ki? Aur kya yeh bohran is shakhs ke siyasi safar ka anjaam hai... ya use aur khatarnak bana dega?"
      },
      {
        genre: "militancy_banned_groups",
        context: "STYLE ONLY: Responsible Framing for a Sensitive Security Case (Roman Urdu Mode)",
        visual:
          "Neutral archival headlines and court-document excerpts for [COURT_X], no weapons close-ups, no perpetrator glorification, an empty street at dusk.",
        audio: "Sombre low drone, no dramatic percussion.",
        narration:
          "Aaj ki kahani ek aise shakhs ki hai jis ne [CRIME_X] ka irtikab kiya. Is documentary mein hum na kisi ko hero banayen ge... aur na kisi aisi tafseel ko dikhayen ge jis se kisi aur ko rasta mile. [Pause] [COURT_X] ke faislay ke mutabiq, [FINDING_X] sabit hua. Hamara sawal sirf ek hai: ek padha likha, [BACKGROUND_X] se talluq rakhne wala naujawan is raaste par kaise pahuncha? Aur hum, ek mu'ashre aur ek nizaam ke taur par, kahan chook gaye?"
      },
      {
        genre: "power_structure_expose",
        context: "STYLE ONLY: Participation Close + Open Question (English Mode)",
        visual:
          "Return to the opening aerial farmland shot, now with the boundary map fading out and a single text card: one question.",
        audio: "Soft resolve of the opening drone into a steady, quiet pad.",
        narration:
          "Every system we followed today was built chapter by chapter, decision by decision, silence by silence. [Pause] Which means it can also be questioned the same way. The real issue was never just who holds the power. It is what the rest of us do with ours. So tell us in the comments what you think, even if you disagree. Because the next chapter of this story is not written yet."
      }
    ]
  }
};