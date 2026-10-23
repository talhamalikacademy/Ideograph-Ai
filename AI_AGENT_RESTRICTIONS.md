# CREATOR PROFILE & CREATOR INTELLIGENCE ACCESS & PROTECTION POLICY

## 1. Full AI Read, Style-Training & Generation Usage (`READ = TRUE`)

Because **Ideograph** is a creator-style scriptwriting platform, all AI models and generation services in the application have **full, unrestricted permission** to:
- **Read Every Word**: Read the entirety of `/creators/*.ts` (including `/creators/dhruv.ts` and `/creators/nitish.ts`) and `/creator-intelligence/*.ts` (`CreatorDNA.ts`, `AutoChooser.ts`, `CreatorBlender.ts`, `CreatorStyleLint.ts`, `ThumbnailEngine.ts`, `CreatorIntegrityGuard.ts`).
- **Use to Generate Scripts & Assets**: Use the rules, algorithms, philosophy, voice, pacing, structure, research methodology, workflow stages, hook/closing rules, genre blueprints, and few-shot training examples from `/creators/*.ts` and `/creator-intelligence/*.ts` to generate scripts, viral Shorts, persona blends, titles, and hooks.
- **Copy & Use Creator Vocabulary in Generated Output**: Copy, reuse, and weave the creator's exact vocabulary words, reserved genre keywords, signature phrases, greetings, sign-offs, rhetorical questions, and structural patterns from `/creators/*.ts` directly into generated scripts.

## 2. Strict Backend-Level Write-Protection (`/creators/*` & `/creator-intelligence/*` Read-Only Lock — `EDIT = FALSE`)

While AI models can freely **read and use** `/creators/*.ts` and `/creator-intelligence/*.ts` to generate scripts, **neither `/creators/*.ts` (such as Dhruv Rathee or Nitish Rajput) nor `/creator-intelligence/*.ts` are editable at the backend or AI level**:
1. **Not a Single Word May Be Edited**: No AI model, backend route, or coding agent may edit, rewrite, summarize, format, or delete a single word inside `/creators/*.ts` or `/creator-intelligence/*.ts`.
2. **Runtime Memory Lock (`deepFreeze` & Checksum Verification)**: `CreatorIntegrityGuard` recursively freezes all creator profiles and bio objects in memory and verifies their FNV-1a checksums so that models can read and generate from them safely while any in-place mutation is blocked.
