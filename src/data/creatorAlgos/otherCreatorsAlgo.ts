/**
 * ============================================================================
 * OTHER STUDIO CREATORS — DEDICATED PER-CREATOR ALGORITHMS
 * (`src/data/creatorAlgos/otherCreatorsAlgo.ts`)
 * ----------------------------------------------------------------------------
 * Dedicated execution algorithms for Nitish Rajput, Raftar, Veritasium,
 * MrBeast, Alex Hormozi, Naval Ravikant, Jordan Peterson, Iman Gadzhi,
 * and Sharan Hegde.
 * ============================================================================
 */

export const OTHER_CREATOR_ALGO_MAP: Record<
  string,
  {
    creatorName: string;
    hookAlgo: string;
    bodyAndTargetingAlgo: string;
    closingAlgo: string;
  }
> = {
  nitishrajput: {
    creatorName: "Nitish Rajput",
    hookAlgo:
      "Open on a dated, documented event or statutory clash without taking a side in the first 30 seconds; frame the central conflict ('Ek taraf kaha ja raha hai... doosri taraf aarop hai...') and promise a document-backed chronological breakdown.",
    bodyAndTargetingAlgo:
      "Build a strict chronological chain of custody cross-verifying published books (e.g. 'The Broken Pillars of Democracy'), official commission reports, FIRs, CAG audits, court orders, and parliamentary records ([CLAIM-1], [CLAIM-2]). Present Stakeholder A's argument, then Stakeholder B's counter-argument, and test both against official records with zero repetition.",
    closingAlgo:
      "Deliver the structural institutional diagnosis (why the system failed regardless of which party is in power) and ask the viewer to judge based on the facts."
  },
  raftar: {
    creatorName: "Raftar",
    hookAlgo:
      "Open in medias res inside a dated historical, street-level, or geopolitical flashpoint with high-stakes documentary gravitas, or weave a literary/historical parable (like Alif Laila's Genie 'Kya hukum hai mere aaka', the 1900s German 'Clever Hans' Commission, or George Orwell's '1984'), then pull back to ask how the crisis began.",
    bodyAndTargetingAlgo:
      "Execute Raftar TV's 5-Layer Documentary Research Stack & Aryan's Zero-Repetition Standard: (1) Literary & Historical Parables, (2) The Pakistani Pivot ('Yeh saari pesh-raft toh taraqqi-yafta duniya mein ho rahi hai, lekin Pakistan mein kya ho raha hai?') backed by hard Pakistani institutional data (PIDE, PBS, P@SHA, HRCP, State Bank, NEPRA, KWSB, NCCIA) and exact Rupee figures, (3) Street-Level Geography naming exact neighborhoods (Orangi Town, Baldia Town, Korangi, Surjani, Gulistan-e-Johar, Lyari, Clifton/DHA) and tracing the rupee flow from the citizen's pocket to the mafia/middleman, (4) Grassroots citizen voices & street proverbs ('Yahan paani nahi, taalluqat chalte hain'), and (5) STRICT ZERO-REPETITION LAW: never repeat the same point in 4-5 sentences or pad with generic philosophical fluff.",
    closingAlgo:
      "Synthesize the structural & geopolitical lesson for Pakistan/South Asia and end with a lingering, urgent accountability question."
  },
  veritasium: {
    creatorName: "Veritasium",
    hookAlgo:
      "Open with a counter-intuitive physical paradox or street-interview misconception where most people guess the wrong answer.",
    bodyAndTargetingAlgo:
      "Test the naive hypothesis, reveal why it fails, trace the historical discovery of the real scientific law, and demonstrate the exact mathematical/physical mechanism.",
    closingAlgo:
      "Zoom out to a profound universal implication about how nature, information, or human perception works."
  },
  mrbeast: {
    creatorName: "MrBeast",
    hookAlgo:
      "Deliver the exact visual and financial spectacle in the very first sentence (0–5 seconds) with zero throat-clearing and immediate visual proof.",
    bodyAndTargetingAlgo:
      "Escalate stakes every 45–60 seconds with clear rules, mid-video twist obstacles, countdown timers, and human emotional reactions.",
    closingAlgo:
      "Instant climax payoff in the final seconds with zero lingering outro."
  },
  alexhormozi: {
    creatorName: "Alex Hormozi",
    hookAlgo:
      "Open with a blunt, proof-backed financial or operational truth that destroys a common business excuse in under 8 seconds.",
    bodyAndTargetingAlgo:
      "Break the solution into a numbered 3-step equation (Value Equation / unit economics), contrast what amateurs do vs. what operators do, and use zero fluff.",
    closingAlgo:
      "End with an immediate, zero-excuse execution command."
  },
  navalravikant: {
    creatorName: "Naval Ravikant",
    hookAlgo:
      "Open with a razor-sharp philosophical aphorism that reframes wealth, leverage, happiness, or human desire in one sentence.",
    bodyAndTargetingAlgo:
      "Deconstruct the concept from First Principles using calm, timeless contrasts (status games vs. wealth games, code/media leverage vs. rented time).",
    closingAlgo:
      "Close on a quiet, meditative truth that rewards re-listening."
  },
  jordanpeterson: {
    creatorName: "Jordan Peterson",
    hookAlgo:
      "Frame an everyday behavioral struggle as a deep psychological and archetypal crisis of order versus chaos.",
    bodyAndTargetingAlgo:
      "Layer clinical psychology, evolutionary biology, and mythological/literary archetypes to show the catastrophic cost of avoidance versus voluntary responsibility.",
    closingAlgo:
      "Call the individual to bear the heaviest load they can contend with and orient toward truth."
  },
  imangadzhi: {
    creatorName: "Iman Gadzhi",
    hookAlgo:
      "Challenge the viewer's conventional life script (school/9-to-5 trap) with a contrarian modern wealth shift in the first 10 seconds.",
    bodyAndTargetingAlgo:
      "Diagnose why the old system is broken, then map out a 3-pillar digital leverage and monk-mode execution protocol.",
    closingAlgo:
      "Challenge the viewer to take ownership before the window closes."
  },
  sharanhegde: {
    creatorName: "Sharan Hegde",
    hookAlgo:
      "Open with a relatable middle-class money mistake or roleplay hook paired with a shocking rupee calculation in the first 5 seconds.",
    bodyAndTargetingAlgo:
      "Expose the hidden tax/inflation/banking loophole using simple lakh/crore math, side-by-side comparisons, and actionable rules.",
    closingAlgo:
      "Give a 3-point financial checklist the viewer can apply today."
  }
};

export const buildOtherCreatorDedicatedAlgoBlock = (
  creatorKey: string,
  userTopic: string = "",
  targetLanguage: string = "English"
): string => {
  const spec = OTHER_CREATOR_ALGO_MAP[creatorKey];
  if (!spec) return "";
  const cleanTopic = (userTopic || "the user's topic").trim();

  return `
================================================================================
[${spec.creatorName.toUpperCase()} DEDICATED CREATOR ALGORITHM (\`src/data/creatorAlgos/otherCreatorsAlgo.ts\`)]
Active Topic: "${cleanTopic}" | Active Language: ${targetLanguage}
================================================================================
1. HOOK ALGORITHM: ${spec.hookAlgo}
2. BODY & TARGETING ALGORITHM: ${spec.bodyAndTargetingAlgo}
3. CLOSING ALGORITHM: ${spec.closingAlgo}
================================================================================
`.trim();
};
