# IDEOGRAPH — Creator Style-Cloning, Shorts Clipper & Argument Checker Studio

## STRICT BACKEND RULE: READ-ONLY CREATOR PROFILES & CREATOR INTELLIGENCE (DO NOT EDIT A SINGLE WORD)

> **CRITICAL IMMUTABILITY & NON-EDITABLE BACKEND RULE:**
> Just as AI models and coding agents are strictly forbidden from modifying the Creator DNA files of **Dhruv Rathee (`/creators/dhruv.ts`)**, **Nitish Rajput (`/creators/nitish.ts`)**, or any other creator in `/creators/*.ts`, **all Creator Intelligence files inside `/creator-intelligence/*.ts` are ALSO strictly locked and NOT editable at the backend level.**
>
> - **READ & GENERATE ONLY (`READ = TRUE`, `EDIT = FALSE`)**: AI models and backend services may **ONLY read** `/creators/*.ts` and `/creator-intelligence/*.ts` and **use them to generate** scripts, Shorts, style blends, voice cards, and prompts.
> - **ZERO WORD MODIFICATION (`EDIT = FALSE`)**: **Not a single word, rule, keyword, weight, or line of code** inside `/creators/*.ts` or `/creator-intelligence/*.ts` may be edited, rewritten, deleted, formatted, or mutated by an AI model or backend process.

---

### 1. Protected Read-Only Directories & Files

#### A. Protected Creator DNA Files (`/creators/*.ts` — READ-ONLY)
- `/creators/dhruv.ts` (Dhruv Rathee — Locked & Read-Only)
- `/creators/nitish.ts` (Nitish Rajput — Locked & Read-Only)
- `/creators/thynkwhy.ts`
- `/creators/mrbeast.ts`
- `/creators/naval.ts`
- `/creators/raftar.ts`
- `/creators/hormozi.ts`
- `/creators/peterson.ts`
- `/creators/veritasium.ts`
- `/creators/iman.ts`
- `/creators/sharan.ts`

#### B. Protected Creator Intelligence Engine Files (`/creator-intelligence/*.ts` — READ-ONLY)
- `/creator-intelligence/CreatorDNA.ts` — Compiles Creator DNA into generation prompts (Read-Only)
- `/creator-intelligence/AutoChooser.ts` — Brief-aware creator selection and scoring engine (Read-Only)
- `/creator-intelligence/CreatorBlender.ts` — Multi-creator persona blending engine (Read-Only)
- `/creator-intelligence/CreatorStyleLint.ts` — Creator style verification and linting rules (Read-Only)
- `/creator-intelligence/ThumbnailEngine.ts` — Creator-aligned thumbnail & visual packaging rules (Read-Only)
- `/creator-intelligence/CreatorIntegrityGuard.ts` — Runtime FNV-1a checksum & `deepFreeze` immutability guard (Read-Only)

---

### 2. How Models Interact with Creator DNA & Creator Intelligence

1. **Unrestricted Read Access for Generation**:
   - Models read the creator bios (`/creators/*.ts`) and execute the intelligence engines (`/creator-intelligence/*.ts`) to generate authentic scripts, 60-second viral vertical Shorts, blended creator personas, and packaging assets.
2. **Backend-Level Immutability Enforcement (`CreatorIntegrityGuard.ts`)**:
   - At boot time, `lockCreatorProfiles()` computes a deterministic 32-bit FNV-1a hash of every creator profile (`dhruv.ts`, `nitish.ts`, etc.) and recursively applies `deepFreeze()` across all nested arrays and objects.
   - Before any prompt compilation (`verifyCreatorContextIntegrity()`), the guard verifies that the runtime hash matches the boot-time fingerprint. Any attempt to mutate even a single character in memory throws a `[CreatorIntegrityGuard] SECURITY VIOLATION` error.

---

### 3. Modular Application Architecture

- **Main Script Generator (`App.tsx` & `/services/scriptService.ts`)**:
  - Reads `/creators/*` and `/creator-intelligence/*` to generate long-form and short-form scripts with dual-language side-by-side translation, inline `[SFX]` / `[BGM]` audio cues, and Google Gemini TTS / Web Speech scratch voiceover preview.
- **Shorts Clipper Studio (`/components/ShortsClipperStudio.tsx` & `/shorts-clipper/`)**:
  - `/shorts-clipper/clipperRules.ts` & `/shorts-clipper/clipperLogic.ts`: Dedicated 4-stage vertical Shorts extraction rules, 60-second retention pacing structure (130–160 words), and 9:16 mobile safe-zone visual prompt pipeline connected to the Gemini API.
- **Argument & Fact Checker (`/components/DevilsAdvocateLab.tsx` & `/argument-checker/`)**:
  - `/argument-checker/argumentCheckerLogic.ts`: Dedicated model guidance, non-partisan behavioral rules, mode configurations (`Script Bias & Claim Checker` and `Topic Counter-Argument Generator`), and Google Search Grounding API pipeline.
