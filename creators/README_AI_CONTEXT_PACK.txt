================================================================================
EVIDENCE-LED ANALYTICAL EXPLAINER — AI CONTEXT PACK INTEGRATION README
================================================================================

1. OVERVIEW OF FILES IN THIS CONTEXT PACK
--------------------------------------------------------------------------------
This AI Context Pack provides an evidence-led documentary explainer Creator DNA
profile, transcript craft analysis, and prompt-builder extensions:

  A. /creators/dhruv.ts
     - Exports `ANALYTICAL_EXPLAINER_BIO` (CreatorBio)
     - Exports `ANALYTICAL_EXPLAINER_DNA` (Extended Creator-DNA configuration:
       `profilePolicy`, `transcriptAnalysis`, `hookEngine`,
       `sourcePlacementProtocol`, `languageEngine`, `promotionEngine`,
       and `outputContract`).
     - Status: STRICTLY READ-ONLY (`READ = TRUE`, `EDIT = FALSE`). Locked at
       boot time via `CreatorIntegrityGuard` (`lockCreatorProfiles` + FNV-1a
       checksum + recursive `deepFreeze`).

  B. /creators/analytical_explainer_analysis.md
     - Full Markdown reference analysis of the 4 supplied transcripts
       (`paranormal_mystery`, `investigative_accountability`,
       `ai_culture_creativity`, `science_space`), genre hook decision matrix,
       source placement protocol, language engine rules, and promotion guardrails.

  C. /creators/README_AI_CONTEXT_PACK.txt
     - This integration guide describing how the context pack connects to the
       existing Ideograph application without mutating any protected creator or
       creator-intelligence files.

2. HOW THE CONTEXT PACK CONNECTS TO THE EXISTING SYSTEM (ZERO MUTATION)
--------------------------------------------------------------------------------
  1. Constants & Integrity Lock (`/constants.ts`):
     - Imports `ANALYTICAL_EXPLAINER_BIO` and `ANALYTICAL_EXPLAINER_DNA` from
       `./creators/dhruv`.
     - Exports `DHRUV_BIO = ANALYTICAL_EXPLAINER_BIO` and re-exports
       `ANALYTICAL_EXPLAINER_BIO` and `ANALYTICAL_EXPLAINER_DNA`.
     - Registers the profile in `CREATORS[0]` with `id: "dhruvrathee"` and
       `bio: ANALYTICAL_EXPLAINER_BIO` (unmodified reference) so `AutoChooser`,
       `ThumbnailEngine`, `TEMPLATES`, and `CreatorIntegrityGuard` work with
       zero changes to `/creators/*` or `/creator-intelligence/*`.

  2. Main Script Prompt Builder (`/services/scriptService.ts`):
     - `compileAnalyticalExplainerDnaExtension()` merges `ANALYTICAL_EXPLAINER_DNA`
       (`profilePolicy`, `hookEngine`, `sourcePlacementProtocol`,
       `languageEngine`, `transcriptAnalysis`, `promotionEngine`, and
       `outputContract`) into `constructAdvancedSystemPrompt()` as well as
       Auto and Blend modes whenever the Analytical Explainer / Dhruv Rathee
       profile is active.
     - Enforces the prompt contract:
       "Follow the genre methods and output contract. Use original wording.
        Verify claims. Include a promotion only if promotion.enabled is
        exactly true. Never invent missing offer details."

  3. Unified Creator Registry (`/services/creatorRegistry.ts`):
     - Registers aliases `["dhruv", "dhruvrathee", "@dhruvrathee",
       "analytical-explainer", "@analytical-explainer",
       "evidence-leddocumentaryexplainer"]` so both Long-Form Script Generation
       and `ShortsClipperStudio` resolve the complete style schema seamlessly.
================================================================================
