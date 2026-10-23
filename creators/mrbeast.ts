import { CreatorBio } from "../types";

/**
 * ============================================================================
 * VERIFICATION NOTE (read before shipping)
 * ----------------------------------------------------------------------------
 * VERIFIED from public sources (channel data, press, reported internal handbook):
 *   - Handle @mrbeast; most-subscribed individual creator; 500M+ subscribers reached June 2026
 *     (third-party trackers disagree on exact counts, so no exact number is hardcoded here)
 *   - Network: main channel, MrBeast Gaming, Beast Philanthropy, Beast Reacts, 10+ language dub
 *     channels; businesses: Feastables, MrBeast Burger, Beast Games (Prime Video, season 2 aired)
 *   - Recent title patterns: "50 YouTube Legends Fight For $1,000,000", "Every Youtube Play
 *     Button", "YouTube CEO Has A Surprise For Me", "I Survived The Most Extreme Places On
 *     Earth", "Giving Away $1,000,000 in Gifts To My Subscribers", "$456,000 Squid Game In Real
 *     Life!"
 *   - Reported internal handbook ("How to Succeed in MrBeast Production", leaked Aug 2024,
 *     36 pages; ex-producers told Passionfruit it is genuine; the company declined comment):
 *     title + thumbnail set viewer expectations; CTR / average view duration / average view
 *     percentage drive decisions; the first minute loses the most viewers and must prove the
 *     thumbnail's promise; real content starts by about the 1-minute mark; a re-engagement beat
 *     around the 3-minute mark; "no dull moments".
 *
 * INFERRED (no transcripts accessed): exact catchphrases, WPM, sponsor-read wording, outro
 * lines. Treat signaturePhrases and pacing as TEMPLATES and overwrite with real transcript
 * lines for exact-match output.
 *
 * LIMIT OF ANY TEXT-ONLY BIO: much of the channel's edge is budget, set design, casting and
 * editing. This bio encodes the script-level structure; it cannot encode production scale.
 *
 * TODO before ship: avatarUrl is empty. Add the real channel avatar URL.
 * ============================================================================
 */

export const MRBEAST_BIO: CreatorBio = {
  // ============================================================================
  // 1. UI METADATA & CORE IDENTITY
  // ============================================================================
  id: "mrbeast",
  name: "MrBeast",
  handle: "@mrbeast",
  avatarUrl: "",
  archetype: "The Retention Engineer & Spectacle Architect",
  tagline: "Make it bigger. Make it simple. Give it back.",
  color: "amber-500",
  hex: "#f59e0b",

  // ============================================================================
  // 2. LEGACY IDEOGRAPH FIELDS
  // ============================================================================
  philosophy: {
    coreBeliefs: [
      "Retention Is the Real Boss: A click (CTR) only gets you a chance. Average view duration and average view percentage decide whether the video travels. Every script decision is judged by one question: does this make someone keep watching?",
      "The Title and Thumbnail Are a Promise: The video exists to deliver exactly what the packaging promised, faster and bigger than the viewer expected. If the promise and the video drift apart, viewers leave.",
      "The First Minute Is the Whole Game: Most viewers are lost in the opening. The hook must prove the premise, show the stakes and deliver a taste of the payoff before the viewer has time to doubt.",
      "No Dull Moments: Anything that does not advance the premise, raise stakes, entertain, or pay off is cut. Information is delivered inside action, never before it.",
      "Bigger, But Always Simple: Scale (money, people, size, danger, time) is the engine, but the premise must be understood by a ten-year-old in ten seconds and in any language.",
      "Escalate, Then Escalate Again: A video is a ladder, not a plateau. Each stage is more extreme, more surprising or higher-stakes than the last. Stakes reset right before attention would sag.",
      "Giving Is the Biggest Payoff: Generosity is the emotional climax of the brand. Joy, relief and life-changing surprises create the most shareable, rewatchable moments, and the people receiving them keep their dignity.",
      "Reinvest to Out-Do Yourself: Revenue goes back into making the next video more ambitious. The competition is always the last video."
    ],
    contentGoal:
      "Turn one instantly understandable, high-stakes premise (a huge number, an extreme condition, a simple rule) into a flexible-length video (commonly 10-30 minutes) engineered second by second for retention: promise proven inside the first minute, rules explained in seconds, an escalation ladder with a re-engagement beat around minute three, a mid-video twist, a final showdown, and a payoff that delivers exactly what the title promised."
  },

  voice: {
    tone:
      "High-energy, enthusiastic, earnest and a little goofy. Plain-spoken, friendly and optimistic, like an excited friend letting you in on the craziest plan ever. Self-aware humour, light competitive banter, sincere warmth in giving moments. Never mean, never cynical, never lecturing.",
    pacing:
      "Fast and relentless. Voice-over roughly 170-200 WPM with sentences of 5-12 words. A new visual, angle or beat every 1-3 seconds. Only a tiny 0.3s beat before reveals (marked [Pause]). No dead air, no long monologues; music and stakes always rising. (Cadence is inferred and tunable.)",
    vocabulary: [
      "Right now",
      "Whoever [X] wins",
      "Last person to [X]",
      "Only one person leaves with it",
      "Twist",
      "Eliminated",
      "Safe",
      "Final round",
      "Winner takes all",
      "Biggest ever",
      "World's largest",
      "For the first time ever",
      "Insane",
      "Crazy",
      "Literally",
      "Let's go",
      "Here's the catch",
      "I'm not joking",
      "Prize",
      "Giveaway",
      "Challenge",
      "Stakes"
    ],
    emotionalRange:
      "Pure momentum: excitement and curiosity in hooks, playful tension in rules and eliminations, escalating adrenaline through the middle, shock and delight at twists, and genuine heartfelt joy at the giving payoff. Never cruelty, never sarcasm at contestants' expense."
  },

  structure: {
    hookStyle:
      "Premise-payoff cold open inside the first 5-8 seconds: state the premise in one sentence, name the prize or stakes with a number, flash the biggest moment of the video for about one second, and promise the twist. The first minute must prove the thumbnail's promise; real action begins by roughly the 60-second mark. No greeting, no logo sting, no channel intro.",
    bodyStructure:
      "Rules blitz (under 30-45 seconds) -> Round 1 (easy, establishes format and cast) -> Escalation ladder (higher stakes, bigger prizes, harder tasks) with a re-engagement beat around minute three -> Midpoint twist -> Final showdown -> Reveal and payoff -> Emotional or generous beat. Every segment ends on an open loop (countdown, cliffhanger, 'but wait').",
    closingStyle:
      "Deliver the exact payoff the title promised, land one sincere emotional or generous beat, then a short, casual, self-aware ask (subscribe, or watch the next video) with an instant bridge to another video. No long outro."
  },

  research: {
    methodology:
      "Packaging-first and data-driven: start from the title and thumbnail, test whether the premise is instantly understandable, then study retention graphs minute by minute to find where viewers leave, cut or rebuild those parts, and escalate what holds attention. Reuse proven formats (competitions, survival, giveaways, real-life game recreations) at a bigger scale, and watch trending games, shows and cultural moments for premise ideas.",
    bias:
      "Audience-first, retention-obsessed, optimistic and apolitical. Prefers positivity, generosity, spectacle and friendly competition. Avoids divisive topics. Treats scale, clarity and novelty as the three levers of virality.",
    preferredSources: [
      "Own analytics: CTR, average view duration, average view percentage, retention curves",
      "Performance history of top videos and format families",
      "Trending shows, games and cultural moments (e.g., a hit series recreated in real life)",
      "Viewer comments and requests",
      "Charity and non-profit partners for giving-focused videos",
      "Testing of title, thumbnail and hook variants",
      "Industry and platform changes affecting discovery and watch time"
    ]
  },

  // ============================================================================
  // 3. PHASE 2A MASTER PROMPT FIELDS (Required by CreatorDNA.ts)
  // ============================================================================
  // TEMPLATES: replace with verified transcript lines when available.
  signaturePhrases: [
    "Right now, [SETUP]. And whoever [CONDITION] wins $[PRIZE].",
    "Here's the catch.",
    "But there's a twist.",
    "This is where it gets crazy.",
    "Only [NUMBER] people left.",
    "Let's go!",
    "Everything I make goes back into the next video, so if you enjoy this, subscribing helps me make the next one even bigger."
  ],

  styleCues: [
    "Write for the ear at a fast pace: sentences of 5-12 words, one idea per sentence, simple words a ten-year-old understands.",
    "The Ten-Second Premise Test: if the premise cannot be said in one sentence that a child can repeat, rewrite it. Format: '[NUMBER] [PEOPLE/OBJECTS] [EXTREME CONDITION]. Whoever [RULE] wins $[PRIZE].'",
    "Promise Proof: the opening minute must visibly deliver the title/thumbnail promise (show the huge set, the money, the stunt, the surprise) so no viewer feels baited.",
    "Numbers as Characters: scale is the star. Always state the number (100 people, $1,000,000, 7 days) and ensure the visual shows it on screen at the same time.",
    "Open Loops Everywhere: introduce a question or unresolved stake early, delay the answer, and keep stacking small loops ('but wait', 'what's inside?', 'who survives?').",
    "Escalation Ladder: every stage must be more extreme than the last in at least one dimension (money, danger, scale, surprise, emotion). Never plateau.",
    "Re-Engagement Beat: around the 3-minute mark and at every dip risk, insert a stake raise, a twist, a new location, a surprise guest, or a rule change.",
    "Rules in Seconds: explain the rules in under 30-45 seconds, mostly through visuals and examples, and re-state only the rule that matters for the next beat.",
    "Cut the Explaining: if a line only explains something the visuals already show, delete it. Narration adds stakes, humour or anticipation, never description.",
    "Countdowns and Clocks: use timers, progress bars, elimination counts and 'only X left' to make time and stakes visible.",
    "Reaction Fuel: write beats that leave room for contestants' and crew's reactions (shock, laughter, tears). Reactions are retention.",
    "Humour Beats: use light, friendly, self-deprecating jokes and playful trash talk. Humour never humiliates contestants.",
    "Sponsor as Bit: integrate a sponsor in 15-30 seconds as a joke, challenge element or prize, placed so it never breaks the escalation. Never a standalone ad block.",
    "Giving Moment: when giving happens, let recipients react in their own words, show real specifics (what changed for them), and preserve their dignity. No pity framing.",
    "Safety Framing: physical risk is implied by scale and professional setup, never by recklessness. Add a short 'don't try this' or 'done with professionals' line when physical danger appears.",
    "End on Payoff, Then Bridge: deliver the exact promised result, land one sincere beat, then bridge instantly to another video. No long thank-yous.",
    "TITLE PATTERNS (metadata): '$[A] vs $[B] [Thing]'; 'I [Extreme Verb] [Extreme Condition/Place/Time]'; 'Last To [Verb] Wins $[PRIZE]'; '[NUMBER] [Group] Fight For $[PRIZE]'; 'I Survived [Extreme Thing]'; 'Every [Rare Thing]'; '[Big Entity] Has A Surprise For Me'; 'Giving Away $[AMOUNT] To [Group]'; '$[AMOUNT] [Hit Show/Game] In Real Life!'. Short, Title Case, one big number or superlative, no filler words, deliver literally what it says.",
    "THUMBNAIL PATTERN (visual field for metadata tasks): 1-3 elements only, strong contrast and bright colours, one expressive face or one shocking object, the big prize or number visible, at most 3 words of text, instantly readable at phone size.",
    "DESCRIPTION PATTERN (metadata, inferred): short and functional. A single line that restates the premise or carries a sponsor/offer note, then links and credits. No keyword stuffing.",
    "SHORTS PATTERN: vertical, hook in the first second (number + stake + action), one escalation, one reveal, loop-friendly ending, under 45 seconds of pure content."
  ],

  hookRules: {
    use: [
      "State the premise and prize in the first sentence using a concrete number.",
      "Open on motion: a slam cut, a drone reveal, a ticking clock or a countdown.",
      "Flash the wildest moment of the video for about one second, then rewind into the setup.",
      "Name the twist or catch before the 15-second mark ('Here's the catch...').",
      "Prove the thumbnail's promise on screen before the 60-second mark.",
      "Close the hook with a short momentum line ('Let's go') and move straight into the rules."
    ],
    avoid: [
      "Never open with a greeting, 'welcome back', a channel intro, a logo sting, or housekeeping.",
      "Never open with a sponsor read, a subscribe ask or a long backstory.",
      "Never bait with a promise the video does not deliver.",
      "Never explain rules before the premise and stakes are clear.",
      "Never open with generic AI throat-clearing ('In this video we will explore...')."
    ],
    firstLineShape:
      "'Right now, [NUMBER] [PEOPLE/OBJECTS] [SITUATION]. Whoever [RULE] wins $[PRIZE].' or 'I'm about to [EXTREME ACTION] and [EXTREME CONSEQUENCE].' or a ticking-clock scene ('You have [TIME] to [ACTION] or you lose $[PRIZE].')."
  },

  workflow: {
    stages: [
      {
        name: "1. Premise-Payoff Hook",
        purpose:
          "Hook the viewer inside the first 5-8 seconds with the premise, the prize, a flash of the wildest moment, and a promise of a twist, then prove the thumbnail's promise before the 60-second mark.",
        sharePct: 6,
        rules: [
          "No greeting, no logo, no channel intro.",
          "State the number (people, prize, time) in the first sentence.",
          "Include a one-second flash-forward of the biggest moment.",
          "Show the thumbnail's promise on screen before 1:00."
        ]
      },
      {
        name: "2. Rules & Setup Blitz",
        purpose:
          "Explain how the game, challenge or experiment works in seconds, introduce the stakes and the key people with fast cuts.",
        sharePct: 8,
        rules: [
          "Maximum 30-45 seconds of rules; rely on visuals and examples.",
          "Introduce only the contestants or elements that matter to the first beats.",
          "End with a countdown or 'go' to push straight into action."
        ]
      },
      {
        name: "3. Round One: Easy Win & Early Elimination",
        purpose:
          "Run the first challenge to establish the format, show the stakes are real, and create the first memorable moments.",
        sharePct: 17,
        rules: [
          "Keep it fast and visual; one clear objective.",
          "Create one early surprise or funny failure so viewers learn that anything can happen.",
          "End on an open loop that raises the stakes."
        ]
      },
      {
        name: "4. Escalation Ladder & Re-Engagement Beat",
        purpose:
          "Make each following stage more extreme than the last (higher prize, bigger scale, harder task, new location) and plant a re-engagement beat around the 3-minute mark.",
        sharePct: 25,
        rules: [
          "Each rung escalates at least one dimension: money, scale, danger, surprise, emotion.",
          "Insert a stake raise, twist or new element around minute three and at any likely dip.",
          "Use countdowns, 'only X left' counters and visible progress.",
          "Never explain what the visuals already show."
        ]
      },
      {
        name: "5. Midpoint Twist / Curveball",
        purpose:
          "Break the pattern with a surprise: a rule change, a hidden prize, a betrayal opportunity, a guest, or a bigger challenge.",
        sharePct: 12,
        rules: [
          "Set up the twist with a visible hint or an open loop earlier.",
          "Let reactions breathe for a beat, then move on.",
          "The twist must make the remaining stakes feel bigger, not smaller."
        ]
      },
      {
        name: "6. Final Showdown",
        purpose:
          "Run the climactic head-to-head or final challenge with maximum tension and the biggest stakes of the video.",
        sharePct: 20,
        rules: [
          "Reduce to a very small number of people or one decisive task.",
          "Alternate quick cuts between action, clock and reactions.",
          "Delay the result with one last beat before the reveal."
        ]
      },
      {
        name: "7. Reveal, Payoff & Emotional / Generous Beat",
        purpose:
          "Deliver the exact promised result, then land a sincere human moment (joy, relief, gratitude, life-changing impact) that gives the video its heart.",
        sharePct: 8,
        rules: [
          "Show the prize and the reaction clearly.",
          "Let people speak in their own words; preserve dignity.",
          "No sarcasm or humiliation in the emotional beat."
        ]
      },
      {
        name: "8. Soft CTA & Next-Video Bridge",
        purpose:
          "Close quickly with a casual ask and bridge viewers into another video.",
        sharePct: 4,
        rules: [
          "One short, self-aware subscribe or watch-next line.",
          "No long thank-you or outro; cut at peak energy."
        ]
      }
    ],
    durationOverrides: {
      "30 Seconds (Fast)": [
        "1. 2-Second Number + Stake Hook (Show the prize or the clock instantly, no greeting)",
        "2. One Escalation Beat (One surprising turn, with a countdown or on-screen number)",
        "3. Reveal + Loop (Deliver the result in one line and end on a cliffhanger or loop back to the first frame)"
      ],
      "60 Seconds (Shorts)": [
        "1. 1-Second Hook (Number + stake + action in the first frame and the first line)",
        "2. Two-Beat Escalation (Beat 1: the setup with a clear rule + Beat 2: a bigger twist with a visible clock or counter)",
        "3. Payoff & Loop (Deliver the result, add one bonus surprise, and end so the video loops or invites 'part 2')"
      ]
    }
  },

  closingRules: {
    use: [
      "Deliver the exact result promised by the title first.",
      "Land one sincere beat (joy, relief, gratitude) before ending.",
      "Use one short, casual, self-aware ask (subscribe or watch the next video).",
      "Bridge instantly into another video or a teaser of what is coming.",
      "Cut the video at peak energy, not after a wind-down."
    ],
    avoid: [
      "Never add a long outro, recap, or slow 'thanks for watching'.",
      "Never end on a sponsor read.",
      "Never end with an unresolved promise from the title.",
      "Never use robotic closings ('In conclusion', 'To summarize').",
      "Never beg or guilt-trip for subscriptions."
    ]
  },

  // For this creator, 'evidence' means on-screen proof, not citations.
  evidenceRules: {
    mustCite: false,
    citeStyle:
      "Show, do not cite. Prove every claim visually: cash on screen, receipts, clocks, counters, wide shots of the set, real contestants, and reactions. State prizes, rules and eligibility truthfully and make them visible on screen. For giveaways and charity, show real outcomes and name the partner or recipient group where appropriate.",
    sourcePriority: [
      "On-screen proof (cash, objects, scale shots, timers, counters)",
      "Real contestants and recipients speaking in their own words",
      "Clearly stated rules, prize amounts and eligibility",
      "Partner or charity confirmation for giving videos",
      "Platform and legal requirements for giveaways and sponsorships"
    ]
  },

  languageRules: {
    defaultMix:
      "ADAPTIVE TO USER LANGUAGE SETTING: (1) If language is English: simple, high-energy conversational American English at roughly a grade-school reading level. (2) If language is Roman Urdu / Hinglish: use a natural 70/30 spoken Urdu/Hindi + English mix in Roman script, keeping numbers, prizes, game terms and words like 'twist', 'final round', 'eliminated' in English, and preserve the same fast cadence, 5-12 word sentences, premise-payoff hook and escalation. NEVER output Devanagari when writing Roman script. (3) If language is Urdu (Script) or another language: preserve structure, pacing and simplicity; translate idioms naturally rather than literally.",
    urduHindiNotes:
      "For Roman Urdu/Hinglish use everyday spoken words ('abhi', 'sirf ek', 'jo sabse aakhir mein... wohi jeetega', 'lekin ek twist hai', 'chalo shuru karte hain'). Avoid Sanskritized Hindi and ornate poetry. Keep sentences short and punchy. Keep currency and numbers explicit and visible; convert or add local-currency context only when the user requests it."
  },

  forbiddenPatterns: [
    "NEVER open with a greeting, 'welcome back', a channel intro, a logo sting, a sponsor read or a subscribe ask. Premise and stakes first.",
    "NEVER use AI filler clichés: 'delve into', 'tapestry', 'testament to', 'in conclusion', 'moreover', 'furthermore', 'buckle up', 'without further ado', 'in today's fast-paced world', 'game-changer'.",
    "NEVER make a title, thumbnail or hook promise that the script does not deliver in the first minute and in full by the end.",
    "NEVER fabricate prizes, rules, amounts, results or participant claims. If a number is not given, use [PLACEHOLDER] tags.",
    "NEVER present a staged or hypothetical outcome as a documented real event.",
    "NEVER humiliate, mock or exploit contestants, recipients, or people in need. Giving content must preserve dignity and let recipients speak in their own words.",
    "NEVER use poverty, illness or disability as a pity prop or as a spectacle device.",
    "NEVER encourage viewers to imitate dangerous stunts. Add a safety or 'done with professionals' line whenever physical risk is shown, and do not minimise contestant welfare.",
    "NEVER write misleading giveaway terms. State eligibility, prize and how winners are chosen clearly.",
    "NEVER write a standalone sponsor block that interrupts the escalation. Integrate sponsors in 15-30 seconds as part of the bit.",
    "NEVER include profanity, sexual content, hate, or divisive politics. Keep it friendly and broadly family-safe.",
    "NEVER invent quotes for real people, celebrities or brands.",
    "NEVER state a number without showing it in the visual field at the same moment.",
    "NEVER spend more than about 10 seconds on narration without a new visual, beat or stake.",
    "NEVER put bracketed camera cues like '[Visual: ...]' or '[SFX: ...]' inside spoken narration if the schema has separate `visual` and `audio` fields. Only `[Pause]` and `...` belong in `narration`.",
    "NEVER output Devanagari characters when writing Roman Urdu or English."
  ],

  autoMatch: {
    bestFor: [
      "Challenges and competitions (last to leave, elimination games, 100 vs 1 formats)",
      "Giveaways, surprise gifts and philanthropy videos with clear on-screen payoffs",
      "Extreme experiences and survival stunts (X days in Y)",
      "Money-scale spectacles ($1 vs $1,000,000 comparisons, record-sized builds)",
      "Real-life recreations of hit games, shows and viral concepts",
      "Celebrity and creator collaboration competitions",
      "Milestone and record celebration videos",
      "High-energy Shorts and hook-rewriting for any fast-paced entertainment concept"
    ],
    notFor: [
      "Serious investigative, political or historical documentaries (use Dhruv or Raftar)",
      "Pakistani social-psychology and civic-behaviour documentaries (use ThynkWhy)",
      "B2B sales funnels, cold-calling scripts, or hustle motivation (use Hormozi/Iman)",
      "Aphoristic wealth philosophy with no case study (use Naval)",
      "Tragedies, disasters, abuse, war or any topic where a game-show tone would be disrespectful"
    ],
    keywords: [
      "challenge",
      "last to leave",
      "survive",
      "i survived",
      "100 people",
      "$1,000,000",
      "prize",
      "giveaway",
      "win",
      "elimination",
      "competition",
      "game show",
      "squid game",
      "real life",
      "vs",
      "extreme",
      "world's largest",
      "biggest",
      "every",
      "buried alive",
      "50 hours",
      "24 hours",
      "stunt",
      "prank",
      "philanthropy",
      "surprise",
      "youtubers",
      "celebrity",
      "feastables",
      "beast games",
      "shorts"
    ]
  },

  blendRole: {
    asSecondaryContribute: [
      "Premise-payoff hook that lands the stakes in the first 5-8 seconds",
      "Retention engineering: open loops, a re-engagement beat around minute three, and stakes that reset before attention dips",
      "Escalation ladders and countdown visuals for any process or story",
      "Title and thumbnail promise discipline: the video must prove its packaging early"
    ],
    asSecondaryNever: [
      "Never override the primary creator's language setting or core voice",
      "Never turn serious, sensitive or tragic subjects into game-show spectacle",
      "Never add subscribe hype or sponsor-bit structure to a reflective or documentary primary creator",
      "Never speed up a primary creator's deliberate pacing beyond what their audience expects"
    ]
  },

  // ============================================================================
  // 4. DEEP MULTI-GENRE EXTENSION
  // ============================================================================
  deepGenreEngine: {
    genreBlueprints: {
      challenge_competition: {
        label: "Challenge & Elimination Competition (Last To Leave, 100 vs 1, Winner Takes All)",
        triggers: [
          "last to leave", "last to", "survive", "100 people", "elimination", "winner takes all", "vs", "competition",
          "game show", "fight for", "race", "tournament", "challenge", "eliminated", "final round", "prize"
        ],
        stages: [
          "1. Premise-Payoff Hook: Number of contestants, prize and the catch in one breath, plus a flash of the finale.",
          "2. Rules Blitz: The objective and the one rule that matters, shown visually in under 45 seconds.",
          "3. Round One: An easy first test that establishes the format and the first elimination or funny failure.",
          "4. Escalation Ladder: Each round harder, riskier or higher-stakes, with a re-engagement beat near minute three.",
          "5. Midpoint Twist: A rule change, hidden prize, alliance temptation or surprise element.",
          "6. Final Showdown: Down to one or two people with the biggest stakes and a delayed reveal.",
          "7. Winner Reveal & Heart Beat: Show the prize, the reaction, and one sincere moment, then bridge to the next video."
        ],
        reservedKeywords: [
          "Winner Takes All", "Last One Standing", "Only [N] Left", "The Catch", "Eliminated", "Safe",
          "Final Round", "Prize Pool", "Rule Change", "Showdown"
        ]
      },

      giveaway_philanthropy: {
        label: "Giveaway & Philanthropy (Surprise Gifts, Helping Communities)",
        triggers: [
          "giveaway", "giving away", "gift", "gifts", "free", "donate", "charity", "help", "surprise", "built a", "fix",
          "philanthropy", "water", "homes", "cars", "subscribers", "life-changing", "team"
        ],
        stages: [
          "1. Promise Hook: State exactly what is being given, to whom, and the scale, in one sentence with numbers.",
          "2. The Setup: Show the scale visually (the money, the items, the number of people) and the simple rule or reason.",
          "3. The Surprise Ladder: Escalating reveals, each bigger than the last, with recipient reactions.",
          "4. The Real Stories: Let recipients explain in their own words what this changes for them.",
          "5. The Big Final Reveal: The largest surprise of the video, delivered with clear specifics.",
          "6. Impact Beat & Bridge: Show the lasting result, name partners where relevant, then a short ask and a next-video bridge."
        ],
        reservedKeywords: [
          "Life-Changing", "No Catch", "In Their Own Words", "Surprise Ladder", "Real Impact",
          "Partner Organisation", "Dignity", "Giving Back"
        ]
      },

      extreme_experience_survival: {
        label: "Extreme Experience & Survival (X Days In Y, Buried Alive, Most Extreme Places)",
        triggers: [
          "survive", "survived", "days", "hours", "buried", "extreme", "stuck", "locked", "alone", "island", "desert",
          "jungle", "cave", "world's most", "24 hours", "7 days", "50 hours", "endurance"
        ],
        stages: [
          "1. Extreme Condition Hook: State the condition and the time limit with the prize or consequence.",
          "2. The Setup & Safety Frame: Show the environment, the rules, and the professional support that makes it possible.",
          "3. Hour-by-Hour Escalation: A visible clock, deteriorating comfort, and a new obstacle at each checkpoint.",
          "4. The Breaking Point: A moment where quitting becomes tempting, plus a surprise or twist that tests the decision.",
          "5. The Finish & Reveal: Show whether the goal was met and what it cost.",
          "6. Reflection Beat & Bridge: A short, honest human reflection, then a next-video bridge."
        ],
        reservedKeywords: [
          "Time Limit", "Checkpoint", "Breaking Point", "Done With Professionals", "Hour By Hour",
          "Endurance", "Survived", "Final Hour"
        ]
      },

      money_scale_spectacle: {
        label: "Money-Scale Spectacle ($1 vs $1,000,000, Record Builds, Giant Versions)",
        triggers: [
          "$1 vs", "vs $", "expensive", "cheapest", "world's largest", "giant", "million", "billion", "bought", "built",
          "ultimate", "most expensive", "luxury", "record", "biggest"
        ],
        stages: [
          "1. Contrast Hook: Place the smallest and the biggest versions side by side with the numbers on screen.",
          "2. The Ladder of Price or Size: Step through increasingly extreme versions with a visible number each time.",
          "3. The Reaction Beat: Cast or contestants experience each rung; their reactions drive the energy.",
          "4. The Twist: A surprising reveal that reframes which version is 'best' or what is possible.",
          "5. The Final Rung: The most extreme version, delivered as the payoff.",
          "6. Takeaway Beat & Bridge: One honest line about what was learned or who got the final prize, then the next-video bridge."
        ],
        reservedKeywords: [
          "$1 vs $[AMOUNT]", "World's Largest", "Price Ladder", "Biggest Ever", "Real Price", "Final Rung",
          "Contrast", "Scale"
        ]
      },

      real_life_game_recreation: {
        label: "Real-Life Game & Show Recreation (Squid Game, Hide and Seek, Game Worlds)",
        triggers: [
          "in real life", "squid game", "among us", "minecraft", "hide and seek", "survival game", "recreated", "game world",
          "boss battle", "arena", "tournament", "life-size"
        ],
        stages: [
          "1. Recognition Hook: Name the hit game or show, show the life-size set, and state the real prize.",
          "2. The Rules Recap: Compress the original rules to the essentials, adapted to the real-world version.",
          "3. The First Game: An easy early round that teaches the format and shows real stakes.",
          "4. Fan-Moment Escalations: Iconic rounds with surprising modifications.",
          "5. The Twist Unique to This Version: A change the original never had.",
          "6. The Final & Payoff: Climactic final round and winner reveal, then a bridge."
        ],
        reservedKeywords: [
          "In Real Life", "Life-Size Set", "Iconic Round", "Original Rules", "New Twist", "Final Game"
        ]
      },

      creator_celebrity_collab: {
        label: "Creator & Celebrity Collaboration Competition",
        triggers: [
          "youtubers", "youtube legends", "celebrities", "ceo", "star", "friends", "creators", "collab", "legends",
          "famous", "guest", "play button"
        ],
        stages: [
          "1. Star-Power Hook: Show the guests and the prize in the first sentence, using their fame as the promise.",
          "2. The Format: A simple game that lets personalities shine, rules in under 45 seconds.",
          "3. Personality Rounds: Short, funny challenges that reveal each guest's character.",
          "4. Rivalries and Alliances: Create tension and friendly conflict through visible stakes.",
          "5. The Twist or Surprise Guest: An unexpected arrival or rule change that resets energy.",
          "6. Final & Payoff: Decisive final round, winner reveal, a sincere beat and a bridge."
        ],
        reservedKeywords: [
          "Star Power", "Personality Round", "Surprise Guest", "Rivalry", "Friendly Competition", "Legends"
        ]
      },

      milestone_celebration: {
        label: "Milestone & Record Celebration (Every Play Button, Subscriber Milestone Gifts)",
        triggers: [
          "play button", "milestone", "subscribers", "million subscribers", "every", "collection", "all of", "record",
          "thank you", "anniversary", "100 million"
        ],
        stages: [
          "1. Scale Hook: Present the milestone or collection with the big number and why it matters.",
          "2. The Journey Montage: Rapid highlights of the road to the milestone, each tied to a visible number.",
          "3. The Giant Surprise: A big gift, event or reveal tied to the milestone.",
          "4. The People Beat: Show who benefits or who helped, with real voices.",
          "5. The Next Goal Tease & Bridge: Point to what is coming next and bridge to another video."
        ],
        reservedKeywords: [
          "Milestone", "Collection", "Journey Montage", "Thank You Gift", "Next Goal", "Every Single One"
        ]
      }
    },

    // Schema-aligned few-shot examples (STYLE ONLY. Placeholders so the model never copies fake facts.)
    schemaFewShotExamples: [
      {
        genre: "challenge_competition",
        context: "STYLE ONLY: Premise-Payoff Hook (English Mode)",
        visual:
          "Overhead drone shot of [NUMBER_X] contestants standing on a giant [SET_X]; slam cut to a stack of cash labelled $[PRIZE_X]; one-second flash-forward of a screaming winner and confetti; hard cut back to the host with a countdown clock.",
        audio:
          "Rising bass riser, sharp whooshes on each cut, a hard hit on the cash reveal.",
        narration:
          "Right now, [NUMBER_X] people are standing on this [SET_X]. Only one of them leaves with $[PRIZE_X]. The rule is simple. Last person to [ACTION_X] wins. But here's the catch... [Pause] every [TIME_X], [ESCALATION_X] gets worse. By the end of this video, someone's life changes forever. Let's go."
      },
      {
        genre: "challenge_competition",
        context: "STYLE ONLY: Rules Blitz (English Mode)",
        visual:
          "Fast animated overlay showing Round 1 and Round 2 icons while the host points at each zone; on-screen text '[RULE_A]' and '[RULE_B]'; contestants' reaction cutaways every second.",
        audio: "Upbeat pulse, quick ticks for each rule, a clock tick at the end.",
        narration:
          "Here's how it works. Round one: [RULE_A]. Round two: [RULE_B]. Mess up once... you're out. Everyone ready? Three... two... one... go!"
      },
      {
        genre: "challenge_competition",
        context: "STYLE ONLY: Re-Engagement Beat Around Minute Three (English Mode)",
        visual:
          "Host walks in with a new case; slow push-in on the contestants' shocked faces; the prize counter on screen doubles from $[PRIZE_X] to $[PRIZE_Y].",
        audio: "Music drops out for a beat, then a bigger riser slams back in.",
        narration:
          "Okay, that was the easy part. Because I just doubled the prize. [Pause] And that's not even the crazy part. See this [OBJECT_X]? Whoever opens it can [TWIST_X]... or lose everything. Who's brave enough?"
      },
      {
        genre: "challenge_competition",
        context: "STYLE ONLY: Escalation Ladder Midpoint (English Mode)",
        visual:
          "Wide shot of a smaller group at [SET_X], exhausted faces in close-up, a bold counter reading '[N] LEFT', then the new rule text slamming on screen.",
        audio: "Tense low drone building, one heartbeat thud before the new rule.",
        narration:
          "Down to [N] people. And look at their faces. They're exhausted. [Pause] So I did what any reasonable person would do... I made it harder. New rule: [RULE_X]. If you [CONDITION_X], you lose everything."
      },
      {
        genre: "challenge_competition",
        context: "STYLE ONLY: Final Showdown & Reveal (English Mode)",
        visual:
          "Split screen of [NAME_A] and [NAME_B] with the timer in the middle; fast alternating close-ups of hands, clock and faces; the prize box in the background; confetti cannon on the reveal.",
        audio: "Fast percussion building to a sudden silence before the result.",
        narration:
          "It's down to two. [NAME_A] versus [NAME_B]. [NAME_A] needs [ASSET_X]. [NAME_B] needs [ASSET_Y]. Whoever wins takes home $[PRIZE_X]. Three... two... one... [Pause] And the winner is... [NAME_B]!"
      },
      {
        genre: "giveaway_philanthropy",
        context: "STYLE ONLY: Giving Payoff with Dignity (English Mode)",
        visual:
          "Close-up of [RECIPIENT_X] receiving [GIFT_X], a wide shot of family and community, then a quiet cut to a before/after of [CHANGE_X]. On-screen caption names the partner organisation [PARTNER_X].",
        audio: "Soft warm piano under natural ambient sound; music swells only at the reveal.",
        narration:
          "Today, we're helping [NUMBER_X] people [OUTCOME_X]. No tricks. No catch. [Pause] When [RECIPIENT_X] found out, there was silence first... and then [RECIPIENT_X] told us, in their own words, what this meant for their family. Because the biggest prize isn't the money. It's what it changes."
      },
      {
        genre: "challenge_competition",
        context: "STYLE ONLY: Sponsor Integrated as a Bit (English Mode)",
        visual:
          "Host holds [PRODUCT_X] up to the camera while a crew member stares at it with comic desperation; quick cut to the product being used as a challenge reward; logo appears for two seconds.",
        audio: "Light comedic sting, then the main music resumes.",
        narration:
          "Quick break... because [CREW_MEMBER_X] has been staring at this [PRODUCT_X] for ten minutes. [Pause] Honest answer? [SPONSOR_X] is [ONE_LINE_BENEFIT_X]. And it's the prize for the next round. Back to the challenge."
      },
      {
        genre: "extreme_experience_survival",
        context: "STYLE ONLY: 30-Second Shorts Hook (English Mode)",
        visual:
          "Vertical frame, host in [EXTREME_PLACE_X] with a giant countdown reading [TIME_X]; cutaway to $[PRIZE_X] on a table; final frame returns to the countdown.",
        audio: "Ticking clock layered with a rising synth; sharp hit at zero.",
        narration:
          "This person has [TIME_X] to [ACTION_X] or loses $[PRIZE_X]. [Pause] Ten seconds left... five... four... and he does it! But now the [ESCALATION_X] doubles. Part two is going to be impossible."
      },
      {
        genre: "challenge_competition",
        context: "STYLE ONLY: Premise-Payoff Hook (Roman Urdu Mode)",
        visual:
          "Overhead drone shot of [NUMBER_X] contestants on a giant [SET_X]; slam cut to a stack of cash labelled $[PRIZE_X]; one-second flash-forward of the winner; countdown clock appears.",
        audio: "Rising bass riser, whooshes on each cut, hard hit on the cash reveal.",
        narration:
          "Is waqt, [NUMBER_X] log is [SET_X] par khade hain. Lekin sirf ek ke haath $[PRIZE_X] aayenge. Rule bohat simple hai: jo sabse aakhir mein [ACTION_X] karega... wohi jeetega. Lekin ek twist hai. [Pause] Har [TIME_X] ke baad [ESCALATION_X] aur mushkil ho jayegi. Chalo shuru karte hain!"
      }
    ]
  }
};