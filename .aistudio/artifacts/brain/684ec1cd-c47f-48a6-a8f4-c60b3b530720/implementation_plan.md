# System Architecture & Script Engine Overhaul Plan

## 1. Overview & Goals
This plan resolves all five root-cause defects identified in the forensic system audit so that the script engine researches any topic independently, selects the right creator strictly by topic domain without bias, and writes 100% original scripts in the chosen creator's voice using abstract cadence rules and connector phrase banks—never copying lines or analogies from past video transcripts.

---

## 2. Core Fixes by Subsystem

### Fix 1: API Key Persistence, Validation & Model Fallback Routing
- **Persistent API Key Storage (`App.tsx`, `services/apiKey.ts`, `components/SettingsModal.tsx`):**
  - Load and persist user-entered custom API keys in `localStorage` (`studio_custom_gemini_api_key`) so keys survive page reloads.
  - Sanitize and validate keys in `services/apiKey.ts` so placeholder strings (`"undefined"`, `"PLACEHOLDER_API_KEY"`, empty strings) are rejected instead of treated as valid keys.
  - Update `SettingsModal.tsx` to display accurate real-time status (`Custom Key Saved`, `System Environment Key Active`, or `No Valid API Key Detected`) and allow clearing a saved custom key.
- **Resilient Model Fallback (`config/models.ts`, `llm/errors.ts`, `llm/modelRouter.ts`):**
  - Ensure model fallback triggers immediately if a model returns a `400 Bad Request` / `404 Not Found` / `permission_denied` error on custom keys, falling back cleanly across `gemini-3.8-flash`, `gemini-flash-latest`, and `gemini-2.5-flash`.

### Fix 2: Equal-Weight Topic Matching & Strict Creator Isolation
- **Unbiased `AutoChooser` Engine (`creator-intelligence/AutoChooser.ts`):**
  - Neutralize `GENERALIST_PRIORS` so all creators start at `0.0` with equal weights (`dhruvrathee: 0`, `nitishrajput: 0`, `mohakmangal: 0`, `thynkwhy: 0`, `veritasium: 0`, `sharanhegde: 0`, `aevytv: 0`).
  - Remove generic documentary filler terms (`"explained"`, `"reality"`, `"history"`, `"india"`, `"country"`, `"public"`, `"system"`, `"report"`, `"data"`, `"truth"`) from Dhruv Rathee's lexicon so he only scores on his true core domains (civic explainers, public policy, climate/science-AI explainers, consumer awareness).
  - Update `reconcileModelSelection()` to respect the semantic topic match rather than overriding back to a biased default.
- **Per-Creator Language & Style Isolation (`services/languagePolicies.ts`, `services/preGenerationRules.ts`, `src/data/creatorTranscripts/index.ts`):**
  - Create distinct language policy profiles in `resolvePolicyProfileKey()` for `nitish_rajput`, `mohak_mangal`, `veritasium`, and `sharan_hegde` instead of aliasing them to `"dhruv_rathee"`.
  - Scope Dhruv Rathee's greeting (`"Namaskar dosto!"` / `"نمسکار دوستو!"`), word banks, and sub-genre rules strictly to `creator.id === 'dhruv'` so they never leak into ThynkWhy, Nitish Rajput, Mohak Mangal, Veritasium, Sharan Hegde, or Aevy TV.

### Fix 3: Pure Abstract Cadence Rules & Phrase Banks (Zero Verbatim Copy-Pasting)
- **Remove Verbatim Video Examples from System Prompts (`services/languagePolicies.ts`, `src/data/creatorTranscripts/index.ts`, `src/data/creatorTranscripts/dhruv_rathee.js`):**
  - Strip all hardcoded paragraphs from past videos (MIT Media Lab 54 participants, EEG brain scans, London Taxi Drivers GPS hippocampus, 10 years ago phone numbers, 20kg gym dumbbells, Hanuman Ji / Studio Ghibli examples) out of `DHRUV_HOOK_ARCHITECTURE_MATRIX` and `DHRUV_TRUE_URDISH_GOLDEN_SCENES`.
  - Replace them with **abstract structural formulas and rhetorical phrase banks** (e.g., `[Counter-Intuitive Premise] -> [Everyday Relatable Analogy Built Strictly From Current Topic] -> [Empirical Study/Data Point On Current Topic] -> [Direct Viewer Question]`).
  - Keep the full transcripts in `dhruv_rathee.js` as a reference archive while extracting only topic-agnostic transition markers, sentence-length rhythm, and vocabulary registers during prompt compilation.
  - Eliminate the duplicate prompt injection between `executePreGenerationRules()` and `constructAdvancedSystemPrompt()` in `services/scriptService.ts`, cutting prompt bloat by ~50%.

### Fix 4: Two-Stage Topic Planner + Creator Style Writer Pipeline
- **Stage 1 — Creator-Agnostic Topic & Fact Planner (`services/scriptService.ts`):**
  - Always run a fast, structured Topic & Fact Planning step for every script request (both with and without Google Search enabled).
  - Produce a structured JSON/Markdown Topic Blueprint containing:
    1. Core thesis and 5–7 topic-specific factual pillars, dates, statistics, and named entities.
    2. 3 original, topic-specific everyday analogies tailored strictly to the user's subject.
    3. Section-by-section narrative beats (Hook, Escalation, Deep Dive, Counter-Perspective, Conclusion).
- **Stage 2 — Creator Voice & Language Style Writer (`services/scriptService.ts`):**
  - Feed the Stage 1 Topic Blueprint + the selected Creator's Bio & Abstract Cadence Profile + Language Policy into Stage 2.
  - Enforce that Stage 2 translates the Stage 1 Topic Blueprint into the creator's signature pacing and transitions, and tags every factual statistic or historical event with `[CLAIM]` so interactive Claim Verification works reliably in Urdu, Hinglish, and English.

### Fix 5: End-to-End Verification & Audit Test Suite
- **Automated Verification Script & Report:**
  - Verify compilation (`compile_applet`) and run a multi-scenario verification suite testing:
    1. `AutoChooser` across 7 distinct topics (Finance, Business Case Study, Physics/Science, Civic Policy, Deep Geopolitics, Urban Society, Video Essay) to confirm unbiased creator selection.
    2. Prompt isolation check confirming zero Dhruv Rathee strings or past-video phrases appear in other creators' prompts or in Dhruv Rathee's abstract cadence prompt.
    3. Claim detection and script structure validation across Urdu, Hinglish, and English outputs.
