# Ideograph: Phase A and Phase B (corrected) for AI Studio

For Talha | 24 Oct 2026 | Run these BEFORE R0 to R6 from the Research Styles pack.

## How to use

1. Paste the HEADER first, then Phase A. Test. Then paste the HEADER first, then Phase B. Test.
2. Do not paste two phases together.
3. **If you already ran the old Phase A or B**, do not run these. Run R0 from the Research Styles pack and send me the report. I will write a small patch instead.
4. After Phase B, the next prompt is **R0**, then R1, R2, and so on.

## What changed from the old Phase A and B

| Old | Now | Why |
|---|---|---|
| Voice cards: Pick / Blend / Auto-pick | **Manual / Auto / Blend** (use the labels already in the app) | Your app already has these names |
| Recipe had `research` and `verification` | **Removed.** Recipe keeps only length, hook, structure, formats | ResearchStyle (R1) owns research and proof rules. One owner, no conflict |
| Starter values only for Dhruv and Raftar | **Starter values for all 7 creators** | You now have 7 creators |
| Step 4 showed describeRecipe | Step 4 is left as a clear empty slot for R2 | R2 builds the new research screens |
| resolveRecipe merged research and verification | **Only hook, structure, language and tone** | Research merging moves to resolveResearchStyle in R1 |
| Wizard state had no research fields | **Adds optional `researchScope`, `researchStyleIds`, `researchPlanOverrides`** | R2 and R3 plug into them |

---

## HEADER (paste before each phase)

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

## PHASE A (corrected): App shell and wizard UI

````text
[PASTE HEADER FIRST]

PHASE A: APP SHELL AND WIZARD UI. No change to AI logic in this phase.

1) HOME with cards: Write a Script, Projects, Tools (link the existing Argument & Fact Checker and Shorts Clipper Studio so they stay reachable), Library (My Sources, Quotes, My Channel Style: empty placeholders), Settings (narration language, default region).

2) WRITE A SCRIPT wizard with a stepper: Voice, Topic, Format, Research, Script. A toggle at the top switches between:
   - Quick lane: Topic + Duration + Auto voice + one "Create" button. Everything else uses defaults.
   - Studio lane: all steps.

3) STEP 1, VOICE. Three large cards. Use the mode names ALREADY in the app (Manual, Auto, Blend). If the app uses other words, keep those. Short plain subtitles: Manual = "Pick one creator", Blend = "Mix 2 or 3 creators", Auto = "We pick for your topic". Auto is the default and the last choice is remembered.
   - Manual: a searchable creator grid read from the EXISTING creators registry (read-only): name, language, niche chips. Clicking a creator opens a side drawer "How this voice works" with 4 lines (placeholder text until Phase B). The drawer also shows: "Style inspired by public work. Not affiliated."
   - Blend: choose 2 or 3 creators, then three dropdowns: "Hook from", "Body structure from", "Language and tone from". Below, a "Blend preview" card with 5 plain lines (placeholder until Phase B). Show a warning if the chosen creators use different languages.
   - Auto: show "We will pick the best voice after you enter your topic."

4) STEP 2, TOPIC.
   - Niche chips: Politics and governance, Economy and business, Society and crime, History, Science and health, Tech and AI, Education and careers, Environment and resources, Culture and entertainment, Other. In Manual or Blend, show only that creator's niches (placeholder: show all until Phase B). In Auto, show all.
   - A single-line Topic input.
   - A "Find angles" button. Reuse analyzeTopicWithGemini (or stub it). It returns 5 angle cards, multi-select. Selected angles are added to a textarea "What should be inside this video". Angles must come from the topic. Do not force one fixed theme on every topic.
   - In Auto mode, after the topic is entered, show a "Best voice for this topic" card (placeholder until Phase B) with an override button. The override switches the mode to Manual or Blend.

5) STEP 3, FORMAT.
   - Format chips: Documentary / Explainer / Short.
   - Duration chips (Documentary: 10, 15, 20, 25, 30 plus a custom box). Duration is REQUIRED: Continue stays disabled without it.
   - Narration language, focus region, output (Voiceover / Voiceover + Production script), research depth (defaults: Documentary = Deep, Explainer = Standard, Short = Quick).
   - Create services/budget.ts with a pure function computeBudget(minutes, wpm = 140) that returns:
       voiceoverWords = minutes * wpm
       chapters = [floor(minutes/5)+1, floor(minutes/5)+2]
       wordsPerChapter = round(voiceoverWords / average of the two chapter numbers)
       claims = minutes * 3
       productionWords = round(voiceoverWords * 2.3)
   - Show a live line, for example: "25 min: about 3500 words, 6 to 7 chapters, about 75 claims to check".

6) STEPS 4 AND 5: keep the app working end to end.
   - Step 4 renders a component called <ResearchStep />. For now it must show the EXISTING research UI exactly as it works today, including the existing Ground-level and Abroad buttons. Do not build new research screens in this phase. Phase R2 will replace the inside of this component.
   - Step 5 calls the existing script generation and then opens the Workspace.

7) WORKSPACE SHELL (shown after a script exists):
   - Left: chapter list with words, claims and evidence indicators (empty for now).
   - Center: editable script.
   - Right: tabs Sources | Claims | Add evidence | Hook Lab | Style check (empty states for now).
   - Top bar: Versions and Export. Export options: Copy, .txt, .md, .docx (all made in the browser). Choices: Voiceover only, Production script, Fact-check log, Sources appendix.
   - Save projects with versions in browser storage (IndexedDB if easy, otherwise localStorage). Show a note: "Projects are saved in this browser only."

8) ONE WIZARD STATE object in a context or hook. It holds: voiceMode, creatorIds, blendRoles {hook, structure, tone}, niche, topic, angles, brief, format, minutes, narrationLanguage, region, output, depth, plus these NEW OPTIONAL fields: researchScope ('ground' | 'abroad' | 'both'), researchStyleIds (string[]), researchPlanOverrides (object, empty for now). Extend the existing GeneratorConfig with the same optional fields. Do not remove any existing field. Validate each step before Continue. Mobile first.

DONE WHEN: the app runs end to end with the old generation; Quick lane works; Continue is disabled without a duration; computeBudget(25) gives about 3500 words, chapters 6 to 7 and 75 claims; Tools opens both old tools; 375px looks right; Manual / Auto / Blend names match what was already in the app.
````

**Phase A test:**
1. Quick lane: topic + duration + Auto makes a script without opening other steps.
2. Duration empty means Continue is disabled.
3. 375px: no cut-off buttons, the stepper does not overflow.
4. Step 4 still shows the old Ground / Abroad buttons and still runs research.
5. Both old tools open from Tools.

---

## PHASE B (corrected): Creator recipes, Blend resolver, Auto matcher

Recipes are only about length, hook and structure. All research and proof rules live in ResearchStyle (R1).

````text
[PASTE HEADER FIRST]

PHASE B: CREATOR RECIPES, BLEND RESOLVER, AUTO MATCHER. NEW FILES ONLY in the folder creator-recipes/. Do not edit /creators/*.ts.

IMPORTANT: a CreatorRecipe must NOT contain research weights, source types, or verification settings. Those belong to a different system (ResearchStyle, built later in creator-research/). Do not create them here.

FILES
creator-recipes/types.ts
creator-recipes/index.ts            (registry, one recipe per creator in the existing registry)
creator-recipes/resolve.ts
creator-recipes/<creatorId>.ts      (one file per existing creator)

TYPES (types.ts)
```ts
export interface CreatorRecipe {
  creatorId: string;
  displayName: string;
  source: 'starter' | 'creator-file' | 'default' | 'user';   // 'creator-file' only if the value was read from /creators/<id>.ts
  niches: string[];
  regions: string[];
  languages: string[];
  formats: { id: 'documentary' | 'explainer' | 'short'; minLen: number; maxLen: number; wpm: number }[];  // lengths in minutes
  hook: { secondsMin: number; secondsMax: number; types: string[]; rules: string[] };
  structure: { id: string; purpose: string; weight: number }[];   // chapter blueprint, weights sum to 1
  tone: { summary: string; signaturePhrases: string[] };
}
```

GENERATING THE RECIPES
For each creator in the existing registry, READ their profile in /creators/<id>.ts (read-only). Fill what the profile has (language, niches, signature phrases, hook rules, structure) and set source 'creator-file' for those fields. Where the profile has no data, use the starter values below, or sensible defaults if the creator is not listed, and set source 'starter' or 'default'. Add a comment in each file: "Starter values. Tune after watching 3 to 5 real videos. Style-inspired, not written or approved by the creator."

Default formats if nothing else is known: documentary 10 to 30 min at 140 wpm, explainer 5 to 15 min at 140 wpm, short 0.25 to 1 min at 150 wpm.

STARTER VALUES (all are my guesses, mark them as starter)
- dhruv: hook 30 to 60 s, types [strong claim or question + what is at stake]. Structure: claim 0.10, context 0.20, evidence one by one 0.40, the other side 0.15, conclusion 0.15.
- raftar: hook 45 to 90 s, types [scene or incident cold open, then why it matters]. Structure: incident 0.10, background 0.15, who gains and who loses 0.20, voices from the ground 0.20, where the system failed 0.20, way forward 0.15.
- nitish: hook 45 to 90 s, types [a surprising document or record, then the question it raises]. Structure: the document 0.15, background 0.15, timeline 0.25, who gained and who lost 0.20, what does not add up 0.15, questions left 0.10.
- thynkwhy: hook 45 to 75 s, types [a person's story or a sharp question about behaviour]. Structure: the person or story 0.20, background 0.15, what experts say 0.25, what data shows 0.15, real examples 0.15, reflection 0.10.
- mrbeast: hook about 60 s, types [the promise and the stakes in the first sentences]. Structure: promise 0.10, stakes ladder 0.25, rising rounds 0.30, a re-engagement beat near minute 3 (a twist or new stake) 0.10, payoff 0.25.
- hormozi: hook 20 to 45 s, types [chosen by viewer awareness: unaware = curiosity, problem-aware = pain, solution-aware = promise, product-aware = proof]. Structure: hook 0.10, the problem 0.15, the framework 0.30, a solved numeric example 0.20, objections 0.15, one action step 0.10.
- iman: hook 20 to 45 s, types [a real result from the user's own journey, or a clear problem]. Structure: hook 0.10, the journey 0.20, the steps 0.35, tools and costs 0.15, common mistakes 0.10, next step 0.10.
For any other creator: hook 30 to 60 s, structure intro 0.10, context 0.20, evidence 0.40, other side 0.15, conclusion 0.15.
No recipe may promise or imply guaranteed income or results.

FUNCTIONS (resolve.ts)
1) resolveRecipe(selection, minutes): returns ONE effective recipe.
   - Manual: that creator's recipe.
   - Blend (max 3 creators, each role owned by exactly one creator): hook = the Hook creator's hook; structure = the Body structure creator's structure; languages and tone = the Language and tone creator's. If the languages of the chosen creators differ, return needsNarrationLanguage: true so the UI asks the user to choose one. formats = the Body structure creator's formats; minLen and maxLen from the intersection if it is not empty, otherwise from the Body structure creator.
   - Do NOT merge research or verification here. That is done later by resolveResearchStyle.
2) matchCreators(niche, topic, region, language, format, minutes): scores EVERY recipe IN CODE (niche match, region match, language match, duration-range fit). Return the top 3 with score and reasons (array of short strings). The FAST model only writes a one-line "why" for each, using ONLY that metadata. If the top two scores differ by less than 10 points, set suggestBlendTopTwo: true.
3) describeRecipe(recipe): returns exactly 5 plain lines: Hook (type and length) / Structure (chapter names in order) / Language / Tone / Length range.

WIRE INTO THE UI
   - Step 1 Manual drawer "How this voice works": use describeRecipe (4 lines).
   - Step 1 Blend preview: 5 lines: Hook from X / Structure from Y / Language and tone from Z / Length range / "Research: set in Step 4". Keep the language-mismatch question.
   - Step 2: in Manual and Blend, show only the chosen creators' niches. In Auto, after the topic, show the "Best voice for this topic" card from matchCreators (top 3, reason, "Blend top 2" button when suggested). Overriding switches the mode to Manual or Blend.
   - Step 4: change nothing. It stays the empty <ResearchStep /> slot for Phase R2.

MY CHANNEL STYLE (Library screen)
   - The user uploads 3 to 5 past scripts (PDF, TXT, DOCX or paste).
   - Build an editable profile: tone summary, average sentence length, signature phrases, typical hook pattern. Export a type ChannelStyleProfile from creator-recipes/types.ts.
   - Register the profile as a selectable creator (id "my-channel-style") with a CreatorRecipe (source 'user'). It must appear in Manual and Blend like any creator.
   - Never claim the profile is another creator's style.

DONE WHEN: every existing creator has a recipe file; weights sum to 1 for every structure (check in code, warn if not); Manual drawer shows 4 real lines; Blend preview shows who owns hook, structure and tone and asks for a narration language when the languages differ; Auto shows the top 3 with reasons; nothing in /creators or /creator-intelligence changed (show git diff --stat); no research weights exist in creator-recipes/.
````

**Phase B test:**
1. Pick Dhruv, then Raftar. The drawer shows a different hook length and different chapter names.
2. Blend 3 creators: the preview says who owns hook, structure and tone. If languages differ, you get a language question.
3. Auto with a topic: top 3 with reasons. The override works and the mode changes.
4. `git diff` shows nothing changed in `/creators` and `/creator-intelligence`.
5. Search `creator-recipes/` for "weights" or "verification". Expected: nothing.

---

## After Phase B

Go to **R0** (repo scan) in the Research Styles pack, then R1 to R6.
