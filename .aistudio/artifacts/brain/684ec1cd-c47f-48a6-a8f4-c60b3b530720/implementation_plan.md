# Implementation Plan: Creator-First Studio, Research Style System (R1–R6) & Forensic Grounding Architecture

## 1. Confirmed Product & Architecture Decisions

Based on your selections and the complete forensic specifications, this plan covers:

1. **Unified Research Style Flow (Step 4):** Hide the legacy 4-mode research card in the classic step-by-step form (while preserving all underlying harvesting functions in code) so creators experience a single, unified Research Style flow in Step 4.
2. **Exact R1 & Phase B Schema Alignment:** Align all research styles, UI tabs, source priority toggles, and writing recipes to the exact schema fields:
   - Dynamic filter tabs (`{ id, label, types: FactType[] }[]`) and source priority toggles (`Less / Normal / More / Off` with multipliers `0.5x / 1.0x / 1.5x / 0x`).
   - All 7 creator writing recipes (`Dhruv Rathee`, `Raftar TV`, `Nitish Rajput`, `ThynkWhy`, `MrBeast`, `Alex Hormozi`, `Iman Gadzhi`) plus template slots for Creators 8–10, automatic structure weight validation (`sum === 1.0`), `ChannelStyleProfile` blending, and narration language resolution when blended creators use different languages.
3. **Full End-to-End Scope (Phase A, Phase B, R1–R6 & Forensic Research Upgrades):** Execute all remaining schema alignments, UI bindings, writer brief handoffs, and Raftar TV 5-genre & parallel research protections together while keeping `/creators/*.ts` and `/creator-intelligence/*.ts` completely untouched.

---

## 2. System Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   CREATOR-FIRST STUDIO BAR (5 STEPS)                        │
│  [1. Who to write like] -> [2. Topic] -> [3. Length] -> [4. Research]       │
│                                                        -> [5. Write Script] │
└───────────────────┬───────────────────────────────────────┬─────────────────┘
                    │                                       │
                    ▼                                       ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────────┐
│     PHASE B: WRITING RECIPES          │ │   R1: RESEARCH STYLE REGISTRY     │
│  • 7 Creators + Slots 8–10            │ │  • 7 Creators + Slots 8–10        │
│  • Hook / Body / Ending formulas      │ │  • Research Mode & Default Scope  │
│  • Structure weights (validated = 1)  │ │  • Question Set & Source Priority │
│  • Single / Blend (up to 3) / Auto    │ │  • Dynamic Tabs & Source Toggles  │
│  • Language conflict detection        │ │  • Fact Scoring & Claim Policy    │
└───────────────────┬───────────────────┘ └─────────────────┬─────────────────┘
                    │                                       │
                    │         ┌─────────────────────────────┘
                    │         ▼
                    │  ┌──────────────────────────────────────────────────────┐
                    │  │      R2–R4: RESEARCH STEP, MY SOURCES & ENGINE       │
                    │  │  • Pre-Research Plan Card (Questions, Toggles,       │
                    │  │    Ground/Abroad/Both, Depth, Words to Include/Avoid)│
                    │  │  • My Sources Panel (URL, Text, .txt/.md/.csv/.json, │
                    │  │    YouTube Transcripts, Pin to Must-Use, Library)    │
                    │  │  • 3-Round Parallel Research Engine (Landscape ->    │
                    │  │    Evidence by Priority -> Counter-Check + Scoring)  │
                    │  │  • Raftar TV 5-Genre Hierarchy & Forensic Dossier    │
                    │  └──────────────────────────┬───────────────────────────┘
                    │                             │
                    ▼                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│            R5–R6: DOSSIER REVIEW, WRITER BRIEF & AUDIT WORKSPACE            │
│  • Creator-specific Dossier Tabs (Numbers, Laws, Timeline, Cases, My Sources│
│    + custom tabs per creator style)                                         │
│  • Inline Fact Card actions: Keep, Star (Must-Use), Edit, Remove, Add Fact  │
│  • "Before we write" Summary Card + "Extra instructions from me" input      │
│  • Grounded Writer Brief (Starred facts first, grouped by section, strict   │
│    no-invented-numbers policy, claim qualifiers for single-source facts)    │
│  • Post-Generation "Research used" Audit (Verified vs. Unverified + Unused  │
│    Kept Facts list) & Shorts Clipper Studio (3–5 vertical 30–60s cuts)      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Implementation Phases

### Phase A: Top-Level Creator-First Studio Bar & State Persistence
- **5-Step Studio Bar Above the Fold:**
  - **Step 1 — Who to write like:** Mode tabs (`One creator`, `Blend up to 3`, `Auto-pick for my topic`), visual cards for all 7 creators with 1-line style descriptions, percentage sliders (`10%–80%`, auto-normalized to `100%`) in Blend mode, and a `"Which language should the final script be in?"` selector whenever blended creators have different default languages.
  - **Step 2 — Topic:** Single clean input with 1-click sample topic chips and automatic topic recommendation in Auto mode.
  - **Step 3 — Length & Format:** Quick pills (`Short 60s`, `8-10 min`, `15-20 min`, `25+ min deep dive`, `Custom`).
  - **Step 4 — Research:** Seamless toggle between the unified Research Step (Plan + My Sources) and the interactive Dossier Review once research completes.
  - **Step 5 — Write Script:** Opens the `"Before we write"` summary card showing the active writing style, research style, starred/kept fact counts, top 5 must-use facts, and an `"Extra instructions from me"` text box before triggering script generation.
- **Session Persistence:** All wizard selections, research plan overrides (`toggles`, `questions`, `includeWords`, `avoidWords`, `depth`), user sources, and dossier edits persist automatically in `localStorage`.

### Phase B: Structured Creator Writing Recipes (`creator-recipes/`)
- **Complete 7-Creator Recipe Registry + Slots 8–10:**
  - Provide complete, structured starter recipes for all 7 creators (`dhruv`, `raftar`, `nitish`, `thynkwhy`, `mrbeast`, `hormozi`, `iman`) plus template slots (`creator_8` to `creator_10`), keeping `/creators/*.ts` and `/creator-intelligence/*.ts` untouched.
  - Include `displayName`, `language`, `tone` (`summary` and `signaturePhrases`), `structure` (`hook`, `body`, `ending`, and `weights` validated on startup to sum to `1.0`), `sentenceRules`, `argumentRules`, `forbiddenPhrases`, and `exampleOpenings`.
  - Support `ChannelStyleProfile` conversion and `resolveRecipe` across `single`, `blend` (weighted interpolation of numeric rules, union of forbidden phrases, primary creator structure), and `auto` modes, setting `needsNarrationLanguage: true` when blended creators differ in narration language.

### Phase R1: Creator Research Style Registry (`creator-research/`)
- **Exact Schema & Startup Validation:**
  - Each creator's research style defines `displayName`, `tagline`, `researchMode`, `defaultScope` (`ground` | `abroad` | `both`), `questionSet`, `sourcePriority`, `queryTemplates`, `factScoring`, `claimPolicy`, `budget` (`quick` / `standard` / `deep`), `uiLabels` (`runHeader`, `tabs` with `FactType[]`, `sourceToggles` with `mapsTo: FactType`, `emptyState`, `startButton`), `writerNotes`, and `systemPromptBlock`.
  - Run `validateAllStyles()` at module load so any missing question, zero-sum source priority, or invalid budget is caught immediately.

### Phase R2: Pre-Research Plan Card & Legacy UI Cleanup
- **Unified Research Step UI:**
  - Bind the Research Step directly to the resolved `CreatorResearchStyle`:
    - Plain-English header (`"How [Creator] will research '[Topic]'"`) and dynamic start button (`style.uiLabels.startButton`).
    - Editable **Questions to answer** list seeded from `style.questionSet` with `{topic}` filled in, plus inline edit, delete, and `+ Add a question`.
    - **Source priority toggles** driven by `style.uiLabels.sourceToggles` with 4-state pills (`Less = 0.5x`, `Normal = 1.0x`, `More = 1.5x`, `Off = 0x`).
    - **Where to look** scope selector (`Ground` / `Abroad` / `Both`) defaulting to `style.defaultScope`.
    - **How deep** selector (`Quick` / `Standard` / `Deep`) displaying exact query and fact budgets from `style.budget`.
    - **Words to always include / Words to avoid** chip inputs.
- **Hide Legacy 4-Mode Research Card:**
  - Hide the legacy 4-mode research card in the classic form UI so there is only one unified research workflow, while keeping `harvestAgencyResearchDossier` and all existing functions intact in code.

### Phase R3: "My Sources" Panel & Library Reuse
- **4 Input Methods + Pinning:**
  - **Paste a link (URL)**, **Paste text or notes**, **Upload a file** (`.txt`, `.md`, `.csv`, `.json` up to 2MB), and **YouTube video link** (captions/metadata extraction with graceful fallback to paste transcript).
  - Every item supports **Pin as must-use** (`starred: true`, `userAdded: true`, `score: 1.0`), **Remove**, and **Save to My Library** for 1-click reuse across future scripts.

### Phase R4: Style-Driven 3-Round Research Engine & Forensic Upgrades
- **3-Round Parallel Execution with Live Progress:**
  - **Round 1 (Landscape):** Generates sub-questions from the user-edited question list and `style.queryTemplates.round1`.
  - **Round 2 (Evidence):** Allocates queries proportionally to `sourcePriority` multiplied by the user's `Less / Normal / More / Off` toggles and scope (`ground` / `abroad` / `both`), tagging every extracted `DossierFact` with its `FactType`, `year`, `numbers`, `namedEntities`, `region`, and `confidence`.
  - **Round 3 (Counter-Check & Gap Fill):** Runs counter-claim and secondary verification queries, marks facts confirmed by 2+ independent domains as `verified`, and applies `factScoring` weights to keep the top `budget.maxFacts` facts (always preserving `userAdded` and `starred` facts).
- **Raftar TV Forensic Protections:**
  - Preserve Raftar TV's full verbatim Karachi documentary transcript (`raftar.js`), 5-Genre Hierarchy (`Undercover Dark Web`, `Civic & Urban Decay`, `Geopolitical & Economic Autopsy`, `Historical True-Crime & Dynasty`, `Social Taboo & Mental Health`), and parallel `Promise.all` research execution.

### Phase R5: Dossier Review Screen & Grounded Writer Brief
- **Creator-Specific Dossier Tabs:**
  - Render filter tabs dynamically from `style.uiLabels.tabs` (`All`, `Numbers`, `Laws`, `Timeline`, `Cases`, `Quotes`, `My Sources`, plus creator-specific tabs) with live fact counts and search filtering.
  - Provide 1-click **Keep/Skip**, **Star (`★` Must-use)**, **Edit**, **Remove**, and **+ Add my own fact** actions on every fact card.
- **Strict Grounded Writer Brief:**
  - Format starred facts (`★ MUST USE IN SCRIPT`) first, followed by kept facts grouped by `FactType`, `style.writerNotes`, `style.claimPolicy`, and a strict grounding rule forbidding invented numbers or unnamed authorities.

### Phase R6: Post-Script Fact-Check Audit & Shorts Clipper Studio
- **Argument & Fact Checker:**
  - Automatically cross-checks every factual claim and number in the generated script against the approved `ResearchDossier`, highlighting `Verified from dossier` vs. `Unverified — not in your research` claims with 1-click ` soften claim ` or ` remove sentence ` actions, plus a **"Research used"** summary showing which kept facts were cited and which were left unused.
- **Shorts / Reels Clipper:**
  - Extracts 3–5 self-contained 30–60s vertical shorts (`Hook` in 0–3s, `Core` in 3–45s, `Loop/Payoff` in 45–60s, on-screen caption text, and suggested B-roll) with copy and `.txt` export.
