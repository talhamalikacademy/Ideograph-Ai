# Ideograph: Research Style System (AI Studio Prompt Pack R0 to R6)

For Talha | 24 Oct 2026 | Goes with: Blueprint (Phase A to E) and the Part 2 research-style notes.
This pack replaces: Phase C, "Research v2 Phase 2" (research engine and review screen), and the old "4 research modes" screen. It adds to Phase B, D and E.

---

## 0. Read this first (2 minutes)

### What this pack builds, in plain words

1. **Every creator gets their own Research Style file.** It says what to ask first, where to look, what counts as a fact, and what to refuse. It is plugged into the same API key. Only the instruction (systemInstruction) and the research plan change. No new server, no new key.
2. **Step 4 looks different for each creator.**
   - Documentary-type creators (Dhruv, Nitish, Raftar, ThynkWhy): full research, with your Ground / Abroad / Both buttons.
   - MrBeast: a short 1-minute "Concept check" and a clear "Skip research" link.
   - Hormozi and Iman: "Frameworks and proof", where YOUR stories and numbers come first.
3. **Research becomes a real pipeline, not 2 or 3 results.** Plan, search, read pages, extract fact cards, score, fill gaps, review, approve. Every fact has a link. No link means the fact cannot be used in the script.
4. **You can bring your own material**: books, PDFs, articles, links, pasted text, and words to look for. The app reads them and suggests quotes. Every quote is checked against the real text in code.
5. **Plain labels.** No "Agency", "Harvester", "Production Standard", "Layer 1 to 4".

### Do you need to train a model?

No. Do not build a "basic model in the backend". It would be weaker at research and it needs a server, which you said not to touch. Research quality comes from three things:
- a good plan (the Research Style),
- the right tools (Google Search grounding and URL reading in Gemini),
- a strict output format (fact cards with links and scores).

Use STRONG_MODEL for planning and FAST_MODEL for extraction, both with your existing API key.

### Three conflicts I found in the blueprint, and how this pack fixes them

| Problem | Fix in this pack |
|---|---|
| Phase B puts source weights inside CreatorRecipe (`research`, `verification`). Part 2 puts different weights for the same creator inside ResearchStyle. Two numbers for one thing will fight each other. | **ResearchStyle is the only owner of research and verification.** CreatorRecipe keeps only length, hook, structure, formats. |
| Part 1 says Pick / Auto-pick / Blend. Part 2 says your app already has Manual / Auto / Blend. | **Keep your existing names: Manual, Auto, Blend.** |
| `FactType` is used everywhere but never defined. | **Defined once in R1** (12 types). Reuse the repo's version if it exists and extend it. |

### What happens to your old research screen

- The old "4 modes" and "4 layers" screen and the "Raftar TV / Dhruv Rathee / Nitish Rajput / ThynkWhy Production Standard" label are **hidden from the UI**. The old functions are **not deleted**.
- Old Layer 1 to 4 become **source toggles** with plain names.
- The hard-coded Pakistan source list (PIDE, PBS, HRCP, NEPRA, KWSB, State Bank, Dawn) moves into a **Region Pack** file. It is a hint list, not a fixed rule. Topics from other countries get their own institutions.
- Your Ground-level / Abroad buttons **stay**. They now save to `researchScope` = ground | abroad | both.
- The "Zero-Repetition Law" stays as a **rule inside the writer prompt**, not as a banner on screen.

### Run order

| If you have... | Run |
|---|---|
| Not run any phase yet | A, then B (with the change below), then R0, R1, R2, R3, R4, R5, then D, E, then R6 |
| Already run some phases | Start with **R0**. Paste its report to me and I will adjust the next steps |

**Change to Phase B before you run it:** in `creator-recipes/types.ts`, **remove** the fields `research` and `verification` from CreatorRecipe. Research and verification come from ResearchStyle only.
**Phase C is replaced** by R3. **Phase E** claim check must read `claimPolicy` from ResearchStyle (R5 wires this).

Rules for every phase:
- Paste the HEADER below at the top of every phase.
- Paste only one phase at a time.
- After each phase, run its test (end of each phase). Then go to the next.
- If AI Studio gives half code, reply with the file name and say: "return the complete file".

---

## HEADER (paste at the start of EVERY phase)

````text
CONTEXT
Ideograph is a React + TypeScript app that calls the Gemini API from client-side service files using the existing API key. FRONTEND ONLY: do not touch any server, API route or database. Do not add a new API key or a new backend.

PROTECTED: /creators/*.ts and /creator-intelligence/*.ts. Import them read-only. Never edit them.

NEVER rename or remove anything that already exists: Manual / Auto / Blend modes, Ground / Abroad buttons, analyzeTopicWithGemini, runGroundedJson, runResearch, scriptService.ts, CreationForm.tsx, GeneratorConfig, Argument & Fact Checker, Shorts Clipper Studio. Add new functions and add NEW OPTIONAL fields to existing types.

Before writing new code, search the repo for code that already does the job and reuse it. Tell me what you reused.

Keep the visual language of ShortsClipperStudio.tsx. Mobile first: 375px must work. Return complete files, not snippets. If you cannot finish a file, tell me its name and stop.

Define FAST_MODEL and STRONG_MODEL in one place, using models already configured. Follow the current @google/genai docs for Google Search grounding, URL context and file upload.

UI TEXT RULES
- Plain words a 15-year-old understands. Buttons: 4 words or fewer. Descriptions: one short sentence.
- NEVER use these words in any UI text: Agency, Harvester, Zero-Repetition Law, Production Standard, Layer 1/2/3/4, Steelman, Dossier, Engine, Recommended Mode.
- Use "research notes" or "fact base" instead of dossier.
- Creator names appear ONLY where the user picks or sees the voice. Never inside generic buttons, tab names or descriptions.

HONESTY RULES
- Never invent a source, URL, quote, number or book.
- A fact needs a real URL (from grounding metadata) or a user upload. Otherwise mark it "unsourced" and do not let the writer use it.
- If something is missing, say so on screen. Do not fill it with guesses.
````

---

## PHASE R0: Repo scan (NO code changes)

Why: I cannot see your repo, so this prevents AI Studio from building things that already exist.

````text
[PASTE HEADER FIRST]

PHASE R0: READ-ONLY REPO SCAN. Do not create or edit any file in this phase.

Search the repo and report each item below with: file path, exported names, what it does, and a verdict (REUSE / EXTEND / MISSING).

1. The Ground-level and Abroad research buttons: where they live, what state or field they set, what they change in the research call.
2. Manual / Auto / Blend creator modes: where they live, how the selection is stored.
3. The 4 old research modes and 4 layers (Books and Parables, Pakistani/Regional data, Reddit and citizen voices, Global studies): where they live, which functions they call.
4. runGroundedJson, runResearch (services/researchService.ts if present), analyzeTopicWithGemini, scriptService.ts: signatures and what they return.
5. FactType: is it already defined? Where? List its current values.
6. CreationForm.tsx and GeneratorConfig: list all current fields.
7. Any existing book search, file upload, link reader, quotes or "My Sources" code.
8. How model calls are made today: is there retry, backoff, caching, concurrency limit, a quota or 429 handler?
9. Claim or fact checking code inside the Argument & Fact Checker that I could reuse for claim checks.
10. In /creators/*.ts: for each creator, does the profile already contain research instructions, source lists, signature phrases or hook rules I should READ (not edit) when building the new Research Style files? List the field names.
11. Where the Aryan Zero-Repetition rule is implemented.

Then output:
A) A table: item | file | verdict | risk of breaking.
B) A proposed list of NEW files and EXTENDED files for the Research Style system (folder creator-research/, services/researchEngine.ts, services/sourceService.ts, UI components).
C) Anything in the repo that conflicts with these ideas (for example, two FactType definitions).
Then STOP and wait for my approval.
````

**Test:** AI Studio changed zero files. Save its report and paste it to me if anything looks odd.

---

## PHASE R1: Research Style files (data + resolver + prompt builder)

````text
[PASTE HEADER FIRST]

PHASE R1: RESEARCH STYLE FILES. Create the folder creator-research/ with NEW FILES ONLY. No UI in this phase.

FILES
creator-research/types.ts
creator-research/index.ts            (registry, validation, resolveResearchStyle, describeResearchStyle)
creator-research/prompt.ts           (buildResearchSystemPrompt)
creator-research/regions.ts          (Region Packs: hints, not rules)
creator-research/dhruv.research.ts
creator-research/nitish.research.ts
creator-research/raftar.research.ts
creator-research/thynkwhy.research.ts
creator-research/mrbeast.research.ts
creator-research/hormozi.research.ts
creator-research/iman.research.ts
creator-research/_template.research.ts   (empty slot for creators 8 to 10 and for My Channel Style)

If the repo already defines FactType, reuse it and ADD any missing values. Do not rename existing values. Otherwise define it here.

TYPES (types.ts)
```ts
export type FactType =
  | 'official_data' | 'official_documents' | 'news' | 'books_history'
  | 'global_studies' | 'expert_views' | 'public_voices'
  | 'user_material' | 'benchmarks' | 'format_reference'
  | 'feasibility_safety' | 'audience_interest';

export type ResearchScope = 'ground' | 'abroad' | 'both';
export type ResearchMode = 'full_dossier' | 'playbook' | 'concept_lab' | 'hybrid';
export type Depth = 'quick' | 'standard' | 'deep';

export interface ResearchStyle {
  creatorId: string;
  displayName: string;
  source: 'starter' | 'creator-file' | 'user';   // 'creator-file' only when the value was read from /creators/*.ts
  intent: string;
  audience: string;
  researchMode: ResearchMode;
  defaultScope: ResearchScope;
  questionSet: string[];                          // what the researcher asks first
  sourcePriority: { type: FactType; weight: number; examples: string[] }[];   // weights sum to 1
  evidenceRules: string[];
  avoid: string[];
  queryTemplates: { type: FactType; templates: string[] }[];   // placeholders: {topic} {region} {year} {entity} {countries}
  factScoring: { credibility: number; novelty: number; storyValue: number; relevance: number };  // sums to 1
  claimPolicy: { strictness: 'light' | 'standard' | 'strict'; namedEntityRule: boolean; resultsClaimCheck: boolean; sensitiveTopicFlag: boolean };
  budget: { queries: Record<Depth, number>; estimatedMinutes: Record<Depth, [number, number]> };
  uiLabels: {
    title: string; startButton: string;
    tabs: { id: string; label: string; types: FactType[] }[];   // empty types = show all
    sourceToggles: { id: string; label: string; mapsTo: FactType }[];
    showScope: boolean; canSkip: boolean;
  };
  writerNotes: string[];                          // short rules the chapter writer must follow
  systemPromptBlock: string;                      // text given to the API as systemInstruction
}
```
Note: uiLabels.tabs is an array of objects (not string[]) so each tab can filter fact cards.

VALIDATION (index.ts)
On load, check for every style: sourcePriority weights sum to 1 (+/- 0.01) and factScoring sums to 1 (+/- 0.01). If not, console.warn with the creator id and normalize. Export validateAllStyles() that returns a report. Also compute, if not set: minFactsPer5Min[type] = round(14 x weight), at least 1 for any weight of 0.05 or more.

BUDGET DEFAULTS (use unless a style says otherwise)
full_dossier: queries quick 10, standard 24, deep 40; minutes quick [0.5,1], standard [1,3], deep [2,5]
playbook:     queries quick 8,  standard 16, deep 24; minutes quick [0.5,1], standard [1,2], deep [1.5,3]
concept_lab:  queries quick 6,  standard 10, deep 14; minutes quick [0.5,1], standard [0.5,1], deep [1,2]

REGION PACKS (regions.ts)
Export packs for Pakistan, India and Global with: local languages, and example institutions per FactType.
- Pakistan examples: official_data = Pakistan Bureau of Statistics, State Bank of Pakistan, PIDE, provincial departments, regulators (NEPRA, OGRA), utilities (for example KWSB); official_documents = Auditor General reports, National Assembly and Senate records, court judgments, commission reports; news = Dawn, The News, Express Tribune, Business Recorder and local-language outlets; public_voices = local forums and social posts (always labelled "unverified").
- India examples: RBI, MoSPI/NSO, CAG audit reports, PRS Legislative Research, Parliament Q&A, RTI replies, Supreme Court and High Court judgments, major newspapers.
- Global: World Bank, IMF, OECD, WHO, UN agencies, peer-reviewed journals, national statistics offices of comparison countries.
Mark every pack "hints only, user can edit". For a topic about another country, the planner must find that country's own statistics office, central bank, audit body and legislature instead of forcing Pakistan or India sources.

LENS RULE (important, put it in prompt.ts)
Never assume a theme (for example scarcity, mafia, corruption, elite capture). The planner proposes 3 to 5 candidate lenses FROM THE TOPIC and writes one question that would test each lens. Evidence decides which lens survives.

FUNCTIONS
1) resolveResearchStyle(selection, scope, minutes): ResearchStyle
   - Manual: that creator's style.
   - Auto: use matchCreators() from Phase B (code scoring). Use the top 1 and let the user override.
   - Blend (2 or 3 creators, each role owned by one creator):
     * primary = the "Body structure" creator. researchMode = primary's mode. If the creators mix full_dossier with playbook or concept_lab, researchMode = 'hybrid'.
     * source weights: 0.6 / 0.4 for 2 creators, 0.5 / 0.3 / 0.2 for 3. Order: primary, then Hook creator, then Language and tone creator. If one creator holds two roles, count that creator once with the combined share. For each FactType: merged weight = sum(creator share x that creator's weight for the type). Normalize to 1.
     * claimPolicy = strictest of all (strictness, and OR for each boolean).
     * evidenceRules and avoid = union, duplicates removed.
     * questionSet = primary's questions first, then up to 3 extra from the others.
     * defaultScope: if creators differ, use 'both'.
     * uiLabels: title from primary; tabs and sourceToggles = union by id.
     * systemPromptBlock = primary's block first, then each other block under the heading "Use only for tone and angle, not for source rules:".
2) describeResearchStyle(style): returns exactly 5 plain lines: Goal / Looks first at (top 3 source types in plain words) / Region (ground, abroad or both) / Proof level (light, standard, strict in plain words) / What you get (full research notes, playbook, or concept sheet).
3) buildResearchSystemPrompt(style, brief, scope, stage) where stage is 'plan' | 'extract' | 'verify'. It must contain: the style's systemPromptBlock, intent, question set, source priorities in plain sentences, evidenceRules, avoid, claimPolicy in plain sentences, the lens rule, the region pack hints (only for the topic's region), and the rule "use ONLY retrieved text; if you cannot find it, say so".

SPEC FOR EACH STYLE (starter values written by me; if /creators/<id>.ts has real data for a field, READ it and use it, and set source: 'creator-file' for that style. Otherwise source: 'starter'. These are style-inspired, never claim the creator wrote or approved them. Add a one-line note in each file: "Style-inspired starter values. Tune after watching 3 to 5 real videos.")

------ 1. dhruv.research.ts ------
displayName: Dhruv-style explainer
intent: Explain a topic so the viewer understands it and trusts the facts enough to share.
audience: General viewers who want clear explanations backed by data.
mode: full_dossier | defaultScope: both
questionSet:
 - What exactly is being claimed, and by whom?
 - What do official numbers say, and how did they change over time?
 - What do studies and experts outside the country say?
 - How do 3 to 5 comparable countries or cases handle the same issue?
 - What is the strongest argument from the other side?
 - What do we still not know?
sourcePriority: official_data 0.30 (national statistics office, ministry reports, central bank, parliament records) | global_studies 0.30 (peer-reviewed papers, World Bank, IMF, WHO, OECD) | news 0.25 (major newspapers, wire services) | books_history 0.10 | public_voices 0.05
evidenceRules: Keep fact and opinion apart and label opinions. | Every key number needs source name, year and link. | Key numbers need a second independent source when one exists. | Prefer the original data over an article about the data. | If numbers disagree, show both and say why.
avoid: opinions without a source | single-source headline numbers | data with no date | social media as proof
queryTemplates: official_data: "{topic} official statistics {region} latest year", "{topic} government report data table" | global_studies: "{topic} peer reviewed study", "{topic} cross-country comparison {countries}" | news: "{topic} investigation {year}", "{topic} fact check"
factScoring: credibility 0.40, novelty 0.15, storyValue 0.15, relevance 0.30
claimPolicy: strict, namedEntityRule true, resultsClaimCheck false, sensitiveTopicFlag false
uiLabels: title "Research and fact base" | startButton "Start research" | showScope true | canSkip false
 tabs: Key facts (all) | Official numbers (official_data) | Studies and comparisons (global_studies) | News (news) | Background and voices (books_history, public_voices)
 sourceToggles: Official data, Global studies, News, Books and history, Public voices
writerNotes: Show the source name on screen with every key number. | Put the other side before the conclusion. | Say what is not known.
systemPromptBlock: You are the research lead for an explainer-style video. The goal is that the viewer understands the topic and can trust every number. First find what exactly is claimed. Then collect official numbers over time, then outside studies and country comparisons, then the best argument from the other side. Keep fact and opinion apart. Never rely on one source for a key number if a second exists.

------ 2. nitish.research.ts ------
displayName: Nitish-style document analysis
intent: Go deep through documents and records so the viewer can think and question for themselves.
audience: Viewers who like detailed, document-backed analysis of politics, governance, history and social issues.
mode: full_dossier | defaultScope: both
questionSet:
 - Which documents exist on this (reports, orders, RTI replies, audit reports, committee papers, court records)?
 - What does each document literally say, who issued it, when, and on which page?
 - What is the timeline, in order?
 - Who gained and who lost, according to the documents?
 - What do historians and books say about the background?
 - What is missing, or contradicted by another document?
sourcePriority: official_documents 0.40 (RTI replies, government and audit reports, commission reports, parliament and court records) | news 0.20 | books_history 0.20 | global_studies 0.15 | public_voices 0.05
evidenceRules: Every claim needs a document trail: name, issuer, date, page or section. | A summary of a document is not evidence; find the document or label it "secondary". | An accusation against a named person or organization needs a document or at least 2 independent sources, otherwise soften the wording. | Keep dates in correct order.
avoid: rumours and unsourced chat-app claims | timelines without dates | "experts say" without names
queryTemplates: official_documents: "{topic} report pdf government {year}", "{topic} RTI reply OR audit report OR commission report", "{topic} committee report parliament" | news: "{topic} documents reveal investigation" | books_history: "{topic} history book author", "{topic} background timeline"
factScoring: credibility 0.45, novelty 0.20, storyValue 0.10, relevance 0.25
claimPolicy: strict, namedEntityRule true, resultsClaimCheck false, sensitiveTopicFlag false
uiLabels: title "Document research" | startButton "Find documents" | showScope true | canSkip false
 tabs: All facts (all) | Documents (official_documents) | News (news) | Background (books_history) | Comparisons (global_studies) | Voices (public_voices)
 sourceToggles: Official documents, News, Books and history, Global comparison, Public voices
writerNotes: Name the document (issuer and date) when you use its facts. | Mark secondary summaries as secondary. | Soften wording on named accusations unless the trail is complete.
systemPromptBlock: You are the research lead for a document-first analysis video. Find the primary documents first and record issuer, date and page for each fact. Build the timeline from documents, then add news and books for background. A summary of a document is not proof. Never state an accusation against a named person or organization unless a document or two independent sources support it.

------ 3. raftar.research.ts ------
displayName: Raftar-style ground documentary
intent: Show the ground reality of a local issue so viewers understand how the system works and where it fails.
audience: Urdu-speaking viewers in Pakistan.
mode: full_dossier | defaultScope: ground
questionSet:
 - What happened, where and when (a specific incident, city or neighbourhood)?
 - What do official local numbers say, in rupees, with the year?
 - Who gains and who loses?
 - What do people on the ground say (labelled unverified)?
 - What is the history behind it?
 - Where did the system fail, and what would a fix look like (with examples from elsewhere)?
sourcePriority: official_data 0.25 (statistics bureau, central bank, provincial departments, regulators, utilities) | news 0.25 | public_voices 0.20 | books_history 0.20 | global_studies 0.10
evidenceRules: Money in PKR with the year. | Name the city and neighbourhood. | Public voices are labelled "unverified" and written as "people say". | An accusation needs a document or 2 sources. | Mark security, political and court topics for editor review.
avoid: global theory with no local link | "sources say" with no name | copying a social post as proof
queryTemplates: official_data: "{topic} {region} official figures PKR {year}", "{topic} {region} report data" | news: "{topic} {region} investigation", "{topic} {region} ground report" | public_voices: "{topic} {region} residents complain", "{topic} {region} forum discussion" | books_history: "{topic} {region} history"
LANGUAGE RULE: when narration language is Urdu or Roman Urdu and scope includes ground, write about 30% of queries in Urdu script and the rest in English.
factScoring: credibility 0.30, novelty 0.20, storyValue 0.25, relevance 0.25
claimPolicy: strict, namedEntityRule true, resultsClaimCheck false, sensitiveTopicFlag true
uiLabels: title "Ground research" | startButton "Start ground research" | showScope true | canSkip false
 tabs: All facts (all) | Local data (official_data) | News (news) | Voices (public_voices) | History (books_history) | Abroad (global_studies)
 sourceToggles: Local official data, News reports, Public voices, History, Global comparison
writerNotes: Use PKR and local place names. | Write public voices as "people say". | Flag sensitive paragraphs for editor review.
systemPromptBlock: You are the research lead for a ground-reality documentary about a local issue. Start from a specific place or incident. Collect official local numbers in rupees with the year, then news investigations, then what residents say (always labelled unverified), then the history. Show who gains and who loses. Never present a social media post as proof. Mark security and political topics for editor review.

------ 4. thynkwhy.research.ts ------
displayName: ThynkWhy-style society and story documentary
intent: Explain a social issue or a person's story through psychology, real stories and expert views.
audience: Viewers who like storytelling documentaries about society and people.
mode: full_dossier | defaultScope: ground (if the topic is about foreign countries or geopolitics, suggest 'both')
questionSet:
 - Who are the real people in this story and what happened to them?
 - What do named experts (with credentials) say about why people behave this way?
 - What does data say about how common this is?
 - What is the cultural or historical background?
 - Which real-life examples show it clearly?
 - What question or lesson is left at the end?
sourcePriority: expert_views 0.25 (psychologists, sociologists, researchers, university studies) | official_data 0.20 | news 0.20 | public_voices 0.20 (real stories, interviews, labelled) | books_history 0.15
evidenceRules: An expert needs name, credential and where they said it. | A real-life story needs its source. | Biographical facts about a person need 2 sources. | Never diagnose a real living person.
avoid: gossip | amateur psychology about named living people | "untold facts" with no source
queryTemplates: expert_views: "{topic} psychologist OR sociologist explains", "{topic} university study behaviour" | public_voices: "{topic} real story interview", "{topic} personal account" | official_data: "{topic} {region} statistics"
factScoring: credibility 0.25, novelty 0.20, storyValue 0.35, relevance 0.20
claimPolicy: strict, namedEntityRule true, resultsClaimCheck false, sensitiveTopicFlag false
uiLabels: title "Story and society research" | startButton "Start research" | showScope true | canSkip false
 tabs: All facts (all) | Experts (expert_views) | Real stories (public_voices) | Data (official_data) | News (news) | Background (books_history)
 sourceToggles: Expert views, Official data, News, Real stories, Books and history
writerNotes: Introduce each expert with name and credential. | Say where each real story comes from. | Keep stories human; do not turn people into case numbers.
systemPromptBlock: You are the research lead for a society and storytelling documentary. Find the real people and stories first, then named experts with credentials, then data that shows how common the issue is, then cultural and historical background. Every expert needs a name and credential. Every story needs a source. Never diagnose or judge a real living person.

------ 5. mrbeast.research.ts ------
displayName: MrBeast-style concept video
intent: Make an idea people click and watch to the end; verify only what must be true in the real world.
audience: Broad audience with short attention.
mode: concept_lab | defaultScope: both (hidden)
questionSet:
 - Have similar videos been made, and what made the best ones work?
 - What is the stakes ladder (what rises at each step)?
 - What are the real costs, prizes, rules, permits and safety needs?
 - Is it possible within the time and budget?
 - What would keep a viewer watching past minute 3?
 - What could go wrong legally or for safety?
sourcePriority: format_reference 0.35 | feasibility_safety 0.30 | audience_interest 0.20 | user_material 0.15
evidenceRules: Verify only real-world facts: cost, prize, time, rules, safety, legal. | Creative choices are "ideas", never "facts". | The user's own budget and plan outrank web results.
avoid: long factual research | history essays | anything that slows the first minute
queryTemplates: format_reference: "{topic} similar video concept", "{topic} challenge format that worked" | feasibility_safety: "{topic} rules permit safety requirements", "{topic} cost estimate"
factScoring: credibility 0.15, novelty 0.30, storyValue 0.30, relevance 0.25
claimPolicy: light (check numbers, safety and legal claims only), namedEntityRule false, resultsClaimCheck false, sensitiveTopicFlag false
uiLabels: title "Concept check" | startButton "Run concept check" | showScope false | canSkip true
 tabs: Concept sheet (all) | Similar formats (format_reference) | Rules and safety (feasibility_safety) | Audience (audience_interest) | Your plan (user_material)
 sourceToggles: Similar formats, Cost, rules and safety, Audience interest, Your plan
writerNotes: Label creative choices as ideas, not facts. | Put real costs and rules on screen as numbers. | The writer must follow the hook length and structure from the recipe.
systemPromptBlock: You are helping design a high-retention video concept, not writing an essay. Keep research short: find similar formats and what worked, build a stakes ladder, check real cost, rules and safety, and plan what keeps viewers past the 3-minute mark. Verify only real-world numbers and safety or legal facts. Everything creative is an "idea", not a "fact".

------ 6. hormozi.research.ts ------
displayName: Hormozi-style playbook
intent: Give the viewer a framework they can act on today, backed by real numbers and proof.
audience: Business and self-improvement viewers.
mode: playbook | defaultScope: both
questionSet:
 - Who is the viewer, and how aware are they of the problem (unaware, problem-aware, solution-aware, product-aware)?
 - What is the one framework or rule, in plain steps?
 - Which numbers or solved example show it working (the user's own first)?
 - What do studies or books say for or against it?
 - What objections will viewers raise, and what is the honest answer?
 - What are the realistic results and limits?
sourcePriority: user_material 0.30 | global_studies 0.35 (studies and books) | benchmarks 0.20 | public_voices 0.10 (objections) | news 0.05
evidenceRules: The user's own numbers and stories come first. | Every framework gets one solved numeric example. | No made-up case studies: use [NEEDS YOUR DATA]. | Results claims only from the user's verified numbers, with a "results vary" note.
avoid: news-cycle topics | abstract theory with no example | hype words (guaranteed, easy money)
queryTemplates: global_studies: "{topic} research study evidence", "{topic} book framework" | benchmarks: "{topic} industry benchmark {year}" | public_voices: "{topic} common objections"
factScoring: credibility 0.25, novelty 0.15, storyValue 0.25, relevance 0.35
claimPolicy: standard, namedEntityRule false, resultsClaimCheck true, sensitiveTopicFlag false
uiLabels: title "Frameworks and proof" | startButton "Build the playbook" | showScope true | canSkip false
 tabs: Playbook (all) | Your numbers (user_material) | Studies and books (global_studies) | Benchmarks (benchmarks) | Objections (public_voices) | News (news)
 sourceToggles: Your stories and numbers, Studies and books, Benchmarks, Objections, News
writerNotes: Pick the hook by viewer awareness: unaware = curiosity, problem-aware = pain, solution-aware = promise, product-aware = proof. | Show one solved numeric example per framework. | Add a "results vary" line wherever results are mentioned.
systemPromptBlock: You are the research lead for an action-first playbook video. Start with the user's own stories and numbers. Then find studies and books that support or challenge the framework, industry benchmarks, and the objections viewers will raise. Every framework needs one solved numeric example. If real numbers are missing, write [NEEDS YOUR DATA]. Never invent a case study or promise results.

------ 7. iman.research.ts ------
displayName: Iman-style business playbook (assumed Iman Gadzhi; confirm with me)
intent: Teach a step-by-step business or personal-brand method and connect with the viewer through a real journey.
audience: Viewers who want to learn a business skill and follow a journey.
mode: playbook | defaultScope: both
questionSet:
 - What is the exact outcome, and what are the steps to get there?
 - What did the user personally do and earn (real numbers, real timeline)?
 - Which tools are needed, and what do they cost?
 - What do trends and platform data say about this right now?
 - What are common mistakes and honest limits?
 - What will viewers ask or doubt?
sourcePriority: user_material 0.30 | news 0.20 (trends) | global_studies 0.20 | benchmarks 0.15 (platform benchmarks) | public_voices 0.15 (audience questions)
evidenceRules: Income and result claims only from the user's own verified numbers. | Always add "results vary". | Flag words like guaranteed, passive, easy, quit your job. | Every step must be something the viewer can really do. | Name each tool and say if it is paid.
avoid: guaranteed income | "no experience needed" promises | invented screenshots or proof
queryTemplates: news: "{topic} trend {year}", "{topic} platform change" | benchmarks: "{topic} platform benchmark data" | public_voices: "{topic} beginner questions"
factScoring: credibility 0.30, novelty 0.15, storyValue 0.25, relevance 0.30
claimPolicy: strict, namedEntityRule false, resultsClaimCheck true, sensitiveTopicFlag false
uiLabels: title "Playbook research" | startButton "Build the playbook" | showScope true | canSkip false
 tabs: Playbook (all) | Your story (user_material) | Trends (news) | Studies (global_studies) | Benchmarks (benchmarks) | Audience questions (public_voices)
 sourceToggles: Your stories and numbers, Trends, Studies, Platform benchmarks, Audience questions
writerNotes: Tell the journey with the user's own real details. | Number the steps. | Never promise income.
systemPromptBlock: You are the research lead for a step-by-step business or personal-brand video. Start with the user's own journey and numbers. Then find current trends, platform benchmarks, and studies. List the tools and their costs. Flag any income promise. If numbers are missing, write [NEEDS YOUR DATA]. Never imply guaranteed results.

------ _template.research.ts ------
Export createResearchStyleFromProfile(profile): ResearchStyle. It builds a style from a My Channel Style profile with source: 'user', researchMode 'full_dossier', balanced weights, strictness 'standard', and a systemPromptBlock that says to follow the user's own house voice. Also export an EMPTY_STYLE_SLOT so I can add creators 8 to 10 later by copying the file.

DO NOT claim in any UI text that a creator wrote, approved or uses these styles. In the voice drawer show: "Style inspired by public work. Not affiliated."

DONE WHEN: validateAllStyles() reports no problems, nothing in /creators or /creator-intelligence changed (show git diff stat), and there is no UI change yet.
````

**R1 test:**
1. Open the console and run `validateAllStyles()`. Expected: no warnings.
2. Count the files in `creator-research/`. Expected: 7 style files, `_template`, `types`, `index`, `prompt`, `regions`.
3. `git diff` shows nothing changed in `/creators` and `/creator-intelligence`.
4. Call `resolveResearchStyle` with a Blend of Dhruv and Raftar. Check the merged weights sum to 1 and the claim policy is the strictest.

---

## PHASE R2: Step 4 screens (Research Plan + Review), UI only

Build both screens with fake data first. The AI logic comes in R3. This keeps phases small.

````text
[PASTE HEADER FIRST]

PHASE R2: STEP 4 UI. Build the screens with a dev-only fixture (FactCard[] in a fixture file). No AI calls in this phase.

0) LABEL AUDIT. Scan the whole UI for the banned words in the HEADER and for the old labels below. Replace as shown. Keep the old functions alive; only the UI text and visibility change.
   - "Select Specialized Research Engine Mode (4 Modes)" -> remove
   - "Mode 1/2/3/4 ..." cards -> remove from the new flow (keep code, hidden)
   - "Layer 1 / 2 / 3 / 4 ..." toggles -> the style's sourceToggles
   - "Raftar TV / Dhruv Rathee / Nitish Rajput / ThynkWhy Production Standard" -> the creator's uiLabels.title
   - "Aryan's Zero-Repetition Law Active" -> remove the banner (the rule stays inside the writer prompt)
   - "Pre-Script 5-Part Agency Research Dossier (Optional Live Preview)" -> "Review before writing"
   - "Generate and Review Research Dossier" -> uiLabels.startButton
   Output a before/after table of every label you changed.

1) RESEARCH PLAN screen (Step 4, first state). It appears only after format and duration are chosen. Sections, top to bottom:
   a) Title = uiLabels.title. Under it, the 5 lines from describeResearchStyle(). A small "Style inspired by public work. Not affiliated." note.
   b) SCOPE: reuse the EXISTING Ground-level / Abroad buttons and add a third "Both". Default = style.defaultScope. Save to researchScope. Hide it when uiLabels.showScope is false. The user can always change it.
   c) SOURCES: one row per sourceToggles item with a 3-step control: Less / Normal / More (multipliers 0.5 / 1 / 1.5) and an Off switch. No decimals shown. Show a plain hint under each (for example "Official data: government tables, reports").
   d) QUESTIONS: the style's questionSet, rewritten for this topic (FAST model, placeholder text until R3). Editable list: edit, add, delete, reorder. Label: "What we will try to answer".
   e) YOUR MATERIAL: button "Add books, files, links". It opens the My Sources panel (built in R4; show an empty state now). Show count chips: books, files, links.
   f) WORDS: two tag inputs, "Words and names to look for" and "Words to avoid".
   g) DEPTH: Quick / Standard / Deep chips. Default from format (Documentary = Deep, Explainer = Standard, Short = Quick). Show a live line from style.budget, for example: "Deep: about 40 searches, 2 to 5 minutes."
   h) Primary button = uiLabels.startButton. If uiLabels.canSkip, also show a text link "Skip research". Skipping goes to Step 5 with an empty fact base and a yellow banner: "The script will use [NEEDS DATA] markers where facts are missing."

2) MODE-SPECIFIC LAYOUT
   - full_dossier: as above.
   - playbook: the first section is a big box "Your stories and numbers" ("Paste real results, numbers and client stories. We use these first."). If empty, show a warning: "Without your own numbers the script will leave blanks marked [NEEDS YOUR DATA]."
   - concept_lab: replace sections c to g with 3 simple inputs: "Your idea in one line", "Budget or limits (optional)", "Prize or stakes (optional)". These become user_material facts. Button = "Run concept check". Show "Skip research" link.
   - hybrid (Blend): show the union of toggles and tabs, and under the title a line "Blended research: <primary> leads."

3) REVIEW screen (Step 4, second state, shown after research):
   a) Quality meter in words: "58 facts, 34 sources, 19 websites, 5 of 6 questions answered", plus one small bar per source type: found vs target.
   b) Tabs from uiLabels.tabs (each tab filters by its types). A "Sort by date" switch on every tab.
   c) FACT CARD: statement, figure chip (value, unit, year), source (site name, title, date, link), type chip, strength badge Strong / OK / Weak, label chips (Unverified voice, Opinion, Idea), buttons: Use / Remove, Edit text, "Find a second source". Edited facts show "Edited by you".
   d) Sections under the tabs: "Books and quotes" (filled in R4), "The other side" (stance = counter), "Still missing" (gaps list with a "Search for this" button each).
   e) "Add a fact by hand": text + URL + type.
   f) Footer: "Use these facts and continue". If approved facts are fewer than the target for the chosen duration, show a warning with 3 buttons: Search more / Add my material / Continue anyway.
   g) Mobile: tabs scroll sideways; cards full width.

4) Store everything in the wizard state: researchScope, researchStyleIds (extend GeneratorConfig with NEW OPTIONAL fields: researchScope, researchStyleIds, researchPlanOverrides {toggles, questions, includeWords, avoidWords, depth}).

DONE WHEN: switching creator in Step 1 changes the Step 4 title, button text, toggles and tabs; MrBeast shows the concept check with a skip link; Hormozi and Iman show the "Your stories and numbers" box first; the old Ground / Abroad buttons still work; no banned word appears anywhere in the UI.
````

**R2 test:**
1. Same topic, pick Dhruv, then Raftar, then MrBeast, then Hormozi. Step 4 must look different each time (title, button, toggles, tabs).
2. 375px: nothing is cut off and the tabs scroll.
3. Search the code for the banned words. Expected: none inside UI strings.
4. Old Ground / Abroad buttons still change `researchScope`.

---

## PHASE R3: The research pipeline (real research, 2 to 5 minutes)

````text
[PASTE HEADER FIRST]

PHASE R3: RESEARCH PIPELINE. Create services/researchEngine.ts (new). Do NOT delete runResearch or runGroundedJson. Add an adapter toLegacyDossier(result) so the existing writer still works until Phase D.

TYPES
```ts
interface ResearchInput {
  topic: string; brief: string; angles: string[]; minutes: number; format: string;
  depth: 'quick'|'standard'|'deep'; scope: 'ground'|'abroad'|'both';
  style: ResearchStyle;                       // from resolveResearchStyle
  questions: string[]; includeWords: string[]; avoidWords: string[];
  togglesLevel: Record<string, 0|0.5|1|1.5>;  // sourceToggles id -> multiplier (0 = off)
  userSources: UserSource[]; narrationLanguage: string; region: string;
}
interface PlannedQuery { id: string; type: FactType; text: string; language: string; scope: 'ground'|'abroad'; questionIdx: number; priority: 1|2|3; }
interface FactCard {
  id: string; type: FactType; statement: string;
  figure?: { value: string|number; unit?: string; year?: number };
  date?: string; place?: string; entities: string[];
  sourceTitle: string; sourceUrl: string; sourceDomain: string;
  sourceKind: 'web'|'user_file'|'user_link'|'user_paste'|'book_text';
  evidenceText?: string;                      // short supporting text from the source
  quote?: { text: string; page?: string; verified: boolean };   // verified = checked in code against uploaded text
  sub: { credibility: number; novelty: number; storyValue: number; relevance: number };  // 0 to 1, from the model
  score: number;                              // computed in CODE from style.factScoring
  strength: 'strong'|'ok'|'weak';             // score >= 0.7 strong, 0.5 to 0.7 ok, else weak
  stance: 'supports'|'counter'|'context';
  label?: 'unverified_voice'|'opinion'|'idea';
  secondSourceUrl?: string;
  questionIdx: number[];
  status: 'pending'|'approved'|'removed'|'edited';
}
interface ResearchResult { facts: FactCard[]; coverage: Coverage; gaps: string[]; stats: {...}; plan: PlannedQuery[]; playbook?: Playbook; concept?: ConceptSheet; }
```

STAGES (run by mode)

STAGE 0, INGEST user material: read userSources (R4 provides them). For playbook styles, user_material comes first; if there is none, continue but add a gap "Your own numbers are missing".

STAGE 1, PLAN. One STRONG_MODEL call with systemInstruction = buildResearchSystemPrompt(style, brief, scope, 'plan'). It returns: 3 to 5 candidate lenses taken from the topic (never a fixed theme), and queries filled from the style's queryTemplates plus topic-specific variants. CODE then decides the numbers, not the model:
   - Total queries Q = style.budget.queries[depth]. For durations over 15 minutes cap the first pass at 40.
   - Per type: n_type = round(Q x effectiveWeight x toggleMultiplier), at least 2 for any type with weight >= 0.10 that is not switched off. Re-normalize so the total is Q.
   - Scope: ground = local region pack, local-language queries (see style rule); abroad = comparison countries and global sources (the model proposes 3 to 5 comparison countries and shows them for the user to edit); both = official_data, official_documents and public_voices mostly ground; global_studies and benchmarks mostly abroad; everything else split evenly.
   - Drop near-duplicate queries (word overlap above 0.8). Include includeWords in at least 30% of queries. Never use avoidWords.
   - Every query is tied to one question in the question list.

STAGE 2, HARVEST. For each query run a grounded Google Search call. Concurrency 4. Retry with exponential backoff (1s, 2s, 4s, 8s with jitter, max 4 tries). On a quota error (429) show "Waiting for quota, retrying in N seconds" with a countdown and do not fail. Cache every result in IndexedDB keyed by hash(model + query + date) so a retry never repeats a finished query. Take URLs and titles from the grounding metadata only. If the URL is a redirect link keep it and show the site name.

STAGE 3, READ. For the best sources per type (quick 6, standard 15, deep 30 total) read the page with URL context. If the page cannot be read, keep the grounded snippet and mark readDepth 'snippet'.

STAGE 4, EXTRACT. FAST_MODEL, in batches of 3 to 4 sources, systemInstruction = buildResearchSystemPrompt(..., 'extract'). Rules: use ONLY the retrieved text; one fact per card; include a short evidenceText from the source; give the 4 sub-scores from 0 to 1; mark public voices label 'unverified_voice'; mark opinions label 'opinion'; if no URL, do not output the fact. For web pages the app cannot check a quote word for word, so a web quote is shown as "check at source" (verified false). Only uploaded text can be verified in code (R4).

STAGE 5, SCORE AND CLEAN (in CODE, no model): score = credibility x w1 + novelty x w2 + storyValue x w3 + relevance x w4 using style.factScoring. Set strength. Merge duplicates (same figure + same entity, or statement similarity above 0.85), keeping the stronger source and adding the other as secondSourceUrl. Sort by score.

STAGE 6, VERIFY (only for strict styles; budget about 15% of Q for strict, 5% for standard, 0 for light): for the top facts that contain a number, run one targeted search for a second independent website. If found, set secondSourceUrl. If the numbers disagree, add a new fact with stance 'counter' and show both numbers.

STAGE 7, COVERAGE AND GAP-FILL. For each FactType compute target = minFactsPer5Min x (minutes / 5). If found < target, make up to 16 extra queries in total for the biggest shortfalls (run them through stages 2 to 5). After Step 5 creates the outline (Phase D), run the per-chapter gap-fill from the old Phase C: for every chapter with fewer approved facts than needed, run targeted queries only for that chapter (max 4 per chapter).

STAGE 8, OUTPUT. ResearchResult with facts, coverage, gaps (which questions have no good answer), stats.
   - If after gap-fill the number of facts with strength ok or strong is below 70% of the target, show "Evidence is thin for this topic" and offer: Widen the search, Add my material, Continue with [NEEDS DATA]. NEVER pad the result with weak or invented facts.

MODES
   - full_dossier: stages 0 to 8.
   - playbook: stage 0 first; extract Framework objects { name, steps[], solvedExample (from the user's numbers, else the string "[NEEDS YOUR DATA]"), proof[], objections[], limits[] }; then run the reduced search.
   - concept_lab: at most style.budget.queries[depth] searches (about 1 minute). Produce a ConceptSheet { similarFormats[], stakesLadder[], costRulesSafety[] (verified facts only), retentionBeats[] (ideas), openQuestions[] }. Creative items are labelled 'idea'.
   - hybrid: run both parts; merge the tabs.

PROGRESS UI (wire to the Review screen from R2)
   - Live stages with counts: "Searching 18/40, reading pages 7/15, facts found 43".
   - Estimated time from style.budget (shown before start) and the real time left while running.
   - A Cancel button and a "Use what we found so far" button. Save partial results in IndexedDB so a refresh does not lose them.
   - If a deep run goes past 8 minutes, offer "Stop and use what we found".

CALLS WRAPPER: build one callModel() helper with queue, concurrency limit, backoff and caching. Reuse an existing one if R0 found it.

DONE WHEN: a 25-minute test runs 2 to 5 minutes; every fact has a URL; the Review screen shows real data; the old writer still works through toLegacyDossier.
````

**R3 test:**
1. 25-minute documentary on any topic with Dhruv: at most 40 first-pass searches, the Review screen shows real facts, about 60 or more facts with strength ok or strong, 15 or more different websites. If less, "Evidence is thin" must appear. It must not pretend.
2. **Same topic: Dhruv, then Raftar.** The top source type, the queries and the default scope are clearly different. Less than half of the queries should be the same.
3. Switch the scope to Abroad: the queries now name comparison countries.
4. MrBeast concept check finishes in about 1 minute and does not produce a long fact list.
5. Click an old fact: it opens a real link. Open 5 random links. They should show the claimed thing.
6. Turn off Wi-Fi mid-run: the screen should say it is waiting or has partial results, not crash.

---

## PHASE R4: My Sources (your own books, files, links and words)

If you already ran "Research v2 Phase 3 (My Sources)", tell AI Studio in the first line: "My Sources already exists in <path>. Extend it, do not rebuild."

````text
[PASTE HEADER FIRST]

PHASE R4: MY SOURCES AND BOOK TOOLS. Create services/sourceService.ts (new) and the My Sources panel. It is opened from the Research Plan screen ("Add books, files, links"), from Library, and from the Workspace "Add evidence" tab (same panel).

ADD SOURCES
   - Upload files: PDF, TXT, MD, DOCX (EPUB only if easy). Extract text in the browser. Keep the page number with every chunk. For big files use the Gemini file upload as in the current docs. Store the text in IndexedDB.
   - Links: article or page URLs (read with URL context).
   - Paste text: a box with a name field.
   - Book search: the user types a title or author. Search with grounded search (use a books API only if the repo already uses one or I approve). Result cards show title, author, year and the label "Text not available". Two buttons: "Use as reference (no quotes)" and "I have this book, upload it".
   - Each source has a switch "Use in this script" and a remove button. Show status: reading, ready, failed (with the reason).

ANALYZE: analyzeSource(source, topic, style) returns SourceInsights:
   - summary (120 words or fewer)
   - keyIdeas[]
   - quotes[] { text, page, suggestedUse: 'hook'|'evidence'|'counter'|'closing', why }
   - numbers[] (figure, unit, year, where)
   - storiesAndParables[] (short story, why it fits)
   - termsAndNames[] (words from the source worth using)
   - fillsQuestions[] (which of the research questions this source answers)
   QUOTE RULES (enforced in CODE, not by the model): every quote must be under 25 words. After the model answers, search the saved source text for the quote (ignore case, extra spaces and curly vs straight quote marks). If it is not found, drop it. Tell the user "Dropped 3 quotes we could not find in your file". Quotes are only allowed when the app has the real text. A book found by search with no uploaded text gets ZERO quotes.

SUGGESTIONS PANEL "Quote ideas": cards with the quote, source, page, "Use as: Hook / Evidence / Counter / Closing" and a button "Add to research notes". Adding creates a FactCard (sourceKind 'book_text' or 'user_file', type user_material or books_history, quote.verified = true).

SEARCH INSIDE MY SOURCES: a box "Find words in my sources". It lists matches with a short surrounding sentence and page number. The user can send any match to the research notes.

WEIGHT: user_material counts as its own source type. For playbook styles it is shown first. For full_dossier styles it appears as "From your material" and is not outranked by web facts of equal strength.

COPYRIGHT NOTE (shown once in the panel): "Upload only material you have the right to use. Quotes are limited to under 25 words."

DONE WHEN: a 100-page PDF becomes at least 10 quote cards, every quote is found word for word in the file, a metadata-only book shows no quotes, and "Find words in my sources" works.
````

**R4 test:**
1. Upload a PDF. Check 5 quote cards: search the PDF for each quote. All 5 must match.
2. Add a book by title only (no file): the app says "Text not available" and offers no quotes.
3. Accept a quote: it appears in the Review screen under "Books and quotes" with a Strong badge.
4. Search for a word you know is in the file: the page number is right.

---

## PHASE R5: "What to follow" brief and the research-to-writer link

This phase connects research to the writer (Phase D) and to claim check (Phase E). It does not rebuild them.

````text
[PASTE HEADER FIRST]

PHASE R5: WRITING BRIEF AND RESEARCH-TO-WRITER CONTRACT. Create services/writerBrief.ts and a "Before we write" card at the top of Step 5. Do NOT rewrite longFormService.ts; extend it with the inputs below. If Phase D is not built yet, build only the brief and the contract types.

1) buildWriterBrief(style, recipe, approvedFacts, budget, scope) returns:
   - userChecklist: 8 plain lines the user can read and edit:
     Voice | Hook (type and length) | Structure (chapter list) | Research rules (from evidenceRules) | Proof rules (from claimPolicy in plain words) | Length (words, chapters) | Facts available (counts by type) | What is still missing
   - modelInstruction: the text for the writer system prompt.

2) "Before we write" card: shows userChecklist, each line with a pencil to edit, plus a box "Extra instructions from me" saved per project. Button "Looks good, write it".

3) RESEARCH-TO-WRITER CONTRACT (hard rules in modelInstruction):
   - Use facts ONLY from approved FactCards. Tag each sentence that uses a fact with its id, like [F12].
   - If a number or fact is missing, write [NEEDS DATA: what is missing]. For playbook styles write [NEEDS YOUR DATA: ...].
   - Public voices: write "people say" or "people online say". Never as a verified fact.
   - Follow style.evidenceRules and style.avoid as hard rules, and style.writerNotes as writing rules.
   - claimPolicy: strict means every number gets its source tag. namedEntityRule means soften any accusation against a named person or organization unless 2 sources are tagged. resultsClaimCheck means add a "results vary" line wherever results are mentioned. sensitiveTopicFlag means mark that paragraph "Editor review".
   - Quotes: under 25 words, only from FactCards where quote.verified is true or the source link is shown as "check at source".
   - Keep the existing no-repeat rule: do not repeat facts, examples or phrases already used in earlier chapters.
   - Do not assume a theme. The lens is the one the research supported (pass the lens that won in R3).

4) After writing, show "Research used": how many approved facts were used vs unused, with the unused list so the user can ask for them.

5) Phase E link: claim check must read claimPolicy from the effective ResearchStyle and use fact ids ([F12]) to match claims to FactCards first. Do not break the existing claim code.

DONE WHEN: the checklist matches the chosen voice; a claim in the script carries a fact tag; a missing number becomes [NEEDS DATA]; editing a checklist line changes the next write.
````

**R5 test:**
1. Same topic: Dhruv vs Raftar. The checklist lines (hook, structure, proof rules) differ.
2. Remove all facts of one type in the Review screen. The script uses [NEEDS DATA] for them. It does not invent numbers.
3. A script paragraph about a named person with one source is softened or marked "Editor review".

---

## PHASE R6: Final audit

````text
[PASTE HEADER FIRST]

PHASE R6: FINAL AUDIT. Fix problems only. Do not add features.

1) Run validateAllStyles(). Report any weight that does not sum to 1.
2) Search all UI strings for the banned words in the HEADER. List and fix.
3) Show git diff --stat. Nothing may change inside /creators or /creator-intelligence.
4) Confirm the old things still work: Manual / Auto / Blend, Ground / Abroad buttons, Argument & Fact Checker, Shorts Clipper Studio, analyzeTopicWithGemini, runGroundedJson, runResearch.
5) Check that no code path lets a fact with no URL reach the writer.
6) Check the quota state: simulate a 429 and confirm the screen says "Waiting for quota".
7) Check 375px on Steps 1 to 5 and the Review screen.
8) Report anything that is a stub, a placeholder, or hard-coded to Pakistan.
````

---

## Final test checklist (after all phases)

| # | Test | Pass if |
|---|---|---|
| 1 | Same topic, Dhruv vs Raftar vs Nitish | Different source mix, different queries, different default scope, different tabs |
| 2 | MrBeast | 1-minute concept check, "Skip research" works, creative items marked as ideas |
| 3 | Hormozi / Iman without your numbers | Big "Your stories and numbers" box, script has [NEEDS YOUR DATA], no invented case study |
| 4 | Blend Dhruv + Raftar | Merged weights, strictest claim policy, preview shows who leads |
| 5 | Ground / Abroad / Both | The query list changes (local language and region vs comparison countries) |
| 6 | 25-minute run | 2 to 5 minutes, about 60 or more usable facts, 15 or more websites, or an honest "Evidence is thin" |
| 7 | Upload a book PDF | 10 or more quote cards, every quote found in the file, under 25 words |
| 8 | Book by title only | No quotes offered |
| 9 | Random 5 facts | Each link opens and supports the fact |
| 10 | Banned words search | Zero hits in UI text |
| 11 | git diff | Zero changes in /creators and /creator-intelligence |

---

## Things to know

- **API key:** inside AI Studio, a key in browser code is fine for you alone. If you ever share the app publicly, the key can be copied by users. Fixing that needs a small server, which is outside this pack.
- **Web quotes:** the app cannot check a quote from a web page word for word, only text from files you upload. So web quotes show "check at source". This is on purpose.
- **Quota:** a 25-minute documentary uses many calls (research 40 to 70, chapters 8, claims 60 or more). Test with 10 to 15 minutes first. The free tier can hit limits fast.
- **Starter values:** every weight, score and question here is my starting guess. Watch 3 to 5 real videos per creator and tune the files in `creator-research/`.
- **Safety wording:** Raftar and Nitish styles flag named accusations and sensitive topics for "Editor review". This is a workflow flag, not legal advice.

## Open items for you

1. **Slots 8 to 10:** you said 10 creators but named 7 (ThynkWhy, Nitish, Raftar, Dhruv, MrBeast, Hormozi, Iman). Send the 3 names and I will write their style specs in the same format.
2. **"Iman":** I kept Iman Gadzhi, as your earlier file assumed. Tell me if you meant someone else.
3. **Research v2 doc:** it was not in the upload, so I could not check it. If you already ran its phases, run R0 first.
