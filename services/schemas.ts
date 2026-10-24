import { Type, Schema } from "@google/genai";

export const scriptPackageSchema: Schema = {
  type: Type.OBJECT,
  required: ["title", "segments"],
  properties: {
    title: { type: Type.STRING },
    detectedIntent: { type: Type.STRING },
    targetAudience: { type: Type.STRING },
    segments: {
      type: Type.ARRAY,
      description: "Must contain the full required number of scenes for the selected duration, with each scene's narration containing the full required paragraph depth (12-16 sentences / 170-200 spoken words per scene for 10-minute scripts).",
      items: {
        type: Type.OBJECT,
        required: ["visual", "audio"],
        properties: {
          visual: { type: Type.STRING },
          audio: {
            type: Type.STRING,
            description: "Spoken narration for this scene. Must contain the full required paragraph depth and sentences for the selected duration (12-16 sentences / 170-200 spoken words per scene for long-form scripts)."
          },
          isWeak: { type: Type.BOOLEAN },
          rewriteSuggestion: { type: Type.STRING }
        }
      }
    },
    ctas: { type: Type.ARRAY, items: { type: Type.STRING } },
    citations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['News', 'Research', 'Report', 'Public Data', 'Official'] },
          sourceName: { type: Type.STRING },
          context: { type: Type.STRING },
          reliabilityScore: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
          isVerified: { type: Type.BOOLEAN },
          url: { type: Type.STRING }
        }
      }
    },
    autoCreatorSelection: {
      type: Type.OBJECT,
      properties: {
        selectedId: { type: Type.STRING },
        reason: { type: Type.STRING },
        alternatives: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    blendMetadata: {
      type: Type.OBJECT,
      properties: {
        primaryCreator: { type: Type.STRING },
        secondaryCreators: { type: Type.ARRAY, items: { type: Type.STRING } },
        blendRatio: { type: Type.STRING }
      }
    },
    scientificGlossary: {
      type: Type.ARRAY,
      description: "High-density technical, scientific, economic, or legal terms injected into the script paired with simple layperson explanations.",
      items: {
        type: Type.OBJECT,
        required: ["term", "simpleDefinition", "usedInTimestamp"],
        properties: {
          term: { type: Type.STRING },
          simpleDefinition: { type: Type.STRING },
          usedInTimestamp: { type: Type.STRING }
        }
      }
    },
    claimsAndPapersRegistry: {
      type: Type.ARRAY,
      description: "Verifiable factual claims and peer-reviewed research papers referenced via inline [CLAIM-1] / [PAPER-1] tags in the script.",
      items: {
        type: Type.OBJECT,
        required: ["id", "type", "spokenSentenceInScript", "sourceTitle", "institutionOrJournal", "publicationYear", "deepVerificationDetails"],
        properties: {
          id: { type: Type.STRING, description: "Exact marker tag used in script, e.g., CLAIM-1 or PAPER-1" },
          type: { type: Type.STRING, description: "article_claim or research_paper" },
          spokenSentenceInScript: { type: Type.STRING },
          sourceTitle: { type: Type.STRING },
          institutionOrJournal: { type: Type.STRING },
          publicationYear: { type: Type.STRING },
          deepVerificationDetails: { type: Type.STRING },
          sourceUrl: { type: Type.STRING }
        }
      }
    },
    infographicsBlueprint: {
      type: Type.ARRAY,
      description: "Data visualization and infographic chart blueprints referenced via inline [INFOGRAPHIC-1] tags.",
      items: {
        type: Type.OBJECT,
        required: ["id", "timestamp", "chartType", "onScreenTitle", "dataPoints", "sourceCitationOnScreen", "editorAnimationNotes"],
        properties: {
          id: { type: Type.STRING, description: "Exact marker tag used in script, e.g., INFOGRAPHIC-1" },
          timestamp: { type: Type.STRING },
          chartType: { type: Type.STRING, description: "Line Graph | Bar Comparison | Biological Mechanism Diagram | Map | Flow Diagram" },
          onScreenTitle: { type: Type.STRING },
          dataPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          sourceCitationOnScreen: { type: Type.STRING },
          editorAnimationNotes: { type: Type.STRING }
        }
      }
    }
  }
};

export const partialScriptSchema: Schema = {
  type: Type.OBJECT,
  required: ["segments"],
  properties: {
    segments: {
      type: Type.ARRAY,
      description: "Must contain the full required number of scenes for the selected duration, with each scene's narration containing the full required paragraph depth (12-16 sentences / 170-200 spoken words per scene for 10-minute scripts).",
      items: {
        type: Type.OBJECT,
        required: ["visual", "audio"],
        properties: {
          visual: { type: Type.STRING },
          audio: {
            type: Type.STRING,
            description: "Spoken narration for this scene. Must contain the full required paragraph depth and sentences for the selected duration (12-16 sentences / 170-200 spoken words per scene for long-form scripts)."
          },
          isWeak: { type: Type.BOOLEAN },
          rewriteSuggestion: { type: Type.STRING }
        }
      }
    }
  }
};

export const topicSuggestionSchema: Schema = {
  type: Type.OBJECT,
  required: ["suggestions"],
  properties: {
    suggestions: {
      type: Type.ARRAY,
      description: "Exactly 5 distinct, compelling video angles tailored to the user's topic and focus region.",
      items: {
        type: Type.OBJECT,
        required: ["angleNumber", "angleCategory", "refinedTopic", "reason", "criteriaPoints", "type"],
        properties: {
          angleNumber: { type: Type.INTEGER, description: "Angle index from 1 to 5" },
          angleCategory: {
            type: Type.STRING,
            description: "The lens used for this angle, e.g., Who Profits | Effect on Ordinary People | Why the System Failed | Science & Evidence | History | Solutions | Future"
          },
          refinedTopic: { type: Type.STRING, description: "Sharp working title for this specific angle" },
          reason: { type: Type.STRING, description: "1-line promise explaining what the viewer will learn or experience" },
          criteriaPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Exactly 3 concrete key questions this angle will answer inside the video"
          },
          pakistaniOrGroundProofPreview: {
            type: Type.STRING,
            description: "Specific evidence types, reports, or examples to investigate for this angle"
          },
          type: { type: Type.STRING, enum: ['Angle', 'Clarity', 'Depth'] }
        }
      }
    }
  }
};

export const agencyResearchDossierSchema: Schema = {
  type: Type.OBJECT,
  required: [
    "topicSummary",
    "bookAndParableAnchor",
    "localInstitutionalData",
    "grassrootsAndRedditVoices",
    "globalScientificBenchmarks",
    "nonRepetitiveFactPlan"
  ],
  properties: {
    topicSummary: { type: Type.STRING },
    bookAndParableAnchor: {
      type: Type.ARRAY,
      description: "Layer 1: Published books, historical commissions, memoirs, or literary parables (e.g., 1984, Alif Laila, Clever Hans Commission, Shahabnama, Broken Pillars of Democracy) with author and year.",
      items: {
        type: Type.OBJECT,
        required: ["titleAndAuthor", "yearOrEra", "parableOrConceptSummary", "howToWeaveIntoScript"],
        properties: {
          titleAndAuthor: { type: Type.STRING },
          yearOrEra: { type: Type.STRING },
          parableOrConceptSummary: { type: Type.STRING },
          howToWeaveIntoScript: { type: Type.STRING }
        }
      }
    },
    localInstitutionalData: {
      type: Type.ARRAY,
      description: "Layer 2: Hard Pakistani / Regional Institutional Data (PIDE, PBS, State Bank, P@SHA, HRCP, NEPRA, PCRWR, KWSB, Dawn, Express Tribune) + exact rupee figures + street-level city/neighborhood names.",
      items: {
        type: Type.OBJECT,
        required: ["institutionOrReport", "keyStatisticOrPolicy", "rupeeOrEconomicBreakdown", "citiesAndNeighborhoods"],
        properties: {
          institutionOrReport: { type: Type.STRING },
          keyStatisticOrPolicy: { type: Type.STRING },
          rupeeOrEconomicBreakdown: { type: Type.STRING },
          citiesAndNeighborhoods: { type: Type.STRING }
        }
      }
    },
    grassrootsAndRedditVoices: {
      type: Type.ARRAY,
      description: "Layer 3: Grassroots social listening from r/pakistan, r/karachi, r/lahore, citizen-uploaded Reels/complaints, and street proverbs (e.g., 'Yahan paani nahi, taalluqat chalte hain').",
      items: {
        type: Type.OBJECT,
        required: ["sourceCommunityOrPlatform", "livedCitizenExperience", "streetProverbOrQuote"],
        properties: {
          sourceCommunityOrPlatform: { type: Type.STRING },
          livedCitizenExperience: { type: Type.STRING },
          streetProverbOrQuote: { type: Type.STRING }
        }
      }
    },
    globalScientificBenchmarks: {
      type: Type.ARRAY,
      description: "Layer 4: Peer-reviewed journals (Nature, The Lancet, MIT, Stanford, WHO) and international comparative benchmarks.",
      items: {
        type: Type.OBJECT,
        required: ["studyOrInstitution", "findingAndMechanism", "comparativeLesson"],
        properties: {
          studyOrInstitution: { type: Type.STRING },
          findingAndMechanism: { type: Type.STRING },
          comparativeLesson: { type: Type.STRING }
        }
      }
    },
    nonRepetitiveFactPlan: {
      type: Type.ARRAY,
      description: "Zero-Repetition Law: Ordered scene-by-scene progression of distinct facts so the script never repeats the same point twice.",
      items: { type: Type.STRING }
    }
  }
};

export const viralTitlesSchema: Schema = {
  type: Type.OBJECT,
  required: ["titles"],
  properties: {
    titles: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["text", "ctrScore", "pattern", "thumbnailText", "reasoning"],
        properties: {
          text: { type: Type.STRING },
          ctrScore: { type: Type.NUMBER },
          pattern: { type: Type.STRING, enum: ['Explanation', 'Investigation', 'Curiosity', 'Shock', 'List'] },
          thumbnailText: { type: Type.STRING },
          reasoning: { type: Type.STRING }
        }
      }
    }
  }
};

export const analysisSchema: Schema = {
  type: Type.OBJECT,
  required: ["hookScore", "viralityLabel", "retentionData", "suggestions"],
  properties: {
    hookScore: { type: Type.NUMBER },
    viralityLabel: { type: Type.STRING, enum: ['Low', 'Medium', 'Viral'] },
    retentionData: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { time: { type: Type.STRING }, retention: { type: Type.NUMBER } }
      }
    },
    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
    dropOffPrediction: { type: Type.STRING },
    truthScore: { type: Type.NUMBER },
    monetizationRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
    safetyFlags: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          severity: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
          reason: { type: Type.STRING }
        }
      }
    }
  }
};

export const hooksSchema: Schema = {
  type: Type.OBJECT,
  required: ["hooks"],
  properties: {
    hooks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["id", "type", "visual", "audio", "score", "reasoning"],
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['Mystery', 'Controversy', 'Relatable Story'] },
          visual: { type: Type.STRING },
          audio: { type: Type.STRING },
          score: { type: Type.NUMBER },
          reasoning: { type: Type.STRING }
        }
      }
    }
  }
};

export const simulationSchema: Schema = {
  type: Type.OBJECT,
  required: ["retentionHeatmap", "personas", "microFixes", "predictedRetention"],
  properties: {
    retentionHeatmap: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          second: { type: Type.NUMBER },
          score: { type: Type.NUMBER },
          comment: { type: Type.STRING }
        }
      }
    },
    personas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          demographic: { type: Type.STRING },
          reaction: { type: Type.STRING },
          dropPointTime: { type: Type.STRING },
          emotionalTrigger: { type: Type.STRING }
        }
      }
    },
    microFixes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          original: { type: Type.STRING },
          fix: { type: Type.STRING },
          impact: { type: Type.STRING }
        }
      }
    },
    predictedRetention: { type: Type.NUMBER }
  }
};

export const directorPlanSchema: Schema = {
  type: Type.OBJECT,
  required: ["scenes", "thumbnails", "editingNotes", "musicMood"],
  properties: {
    scenes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          timeStart: { type: Type.STRING },
          duration: { type: Type.STRING },
          cameraDirection: { type: Type.STRING },
          audioCue: { type: Type.STRING },
          visualPrompt: { type: Type.STRING },
          onScreenText: { type: Type.STRING }
        }
      }
    },
    thumbnails: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          textOverlay: { type: Type.STRING },
          score: { type: Type.NUMBER }
        }
      }
    },
    editingNotes: { type: Type.STRING },
    musicMood: { type: Type.STRING }
  }
};

export const citationsSchema: Schema = {
  type: Type.OBJECT,
  required: ["citations"],
  properties: {
    citations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING },
          sourceName: { type: Type.STRING },
          context: { type: Type.STRING },
          url: { type: Type.STRING },
          reliabilityScore: { type: Type.STRING },
          isVerified: { type: Type.BOOLEAN }
        }
      }
    }
  }
};

export const experimentVariantsSchema: Schema = {
  type: Type.OBJECT,
  required: ["variants"],
  properties: {
    variants: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING },
          predictedWinner: { type: Type.BOOLEAN },
          confidence: { type: Type.NUMBER },
          reason: { type: Type.STRING }
        }
      }
    }
  }
};

export const enhancementLogSchema: Schema = {
  type: Type.OBJECT,
  required: ["improvedFields", "summary", "enhancedSegments"],
  properties: {
    improvedFields: { type: Type.ARRAY, items: { type: Type.STRING } },
    summary: { type: Type.STRING },
    enhancedSegments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["visual", "audio"],
        properties: {
          visual: { type: Type.STRING },
          audio: { type: Type.STRING }
        }
      }
    }
  }
};

export const translatedScriptSchema: Schema = {
  type: Type.OBJECT,
  required: ["title", "segments"],
  properties: {
    title: { type: Type.STRING },
    segments: {
      type: Type.ARRAY,
      description: "Must contain the exact same number of scenes as the original script, with every scene's spoken audio translated and culturally adapted into the target language at full verbatim length.",
      items: {
        type: Type.OBJECT,
        required: ["visual", "audio"],
        properties: {
          visual: { type: Type.STRING },
          audio: {
            type: Type.STRING,
            description: "Full verbatim spoken narration for this scene in the target language, preserving all sentences, evidence, and Creator DNA cadence without summarizing."
          }
        }
      }
    },
    ctas: { type: Type.ARRAY, items: { type: Type.STRING } }
  }
};

export const shortsClipperSchema: Schema = {
  type: Type.OBJECT,
  required: ["sourceSummary", "shorts"],
  properties: {
    sourceSummary: { type: Type.STRING },
    shorts: {
      type: Type.ARRAY,
      description: "Must contain exactly 3 standalone 50-60 second viral vertical Shorts (strictly 130-150 spoken words each at 150 WPM / 2.5 words per second).",
      items: {
        type: Type.OBJECT,
        required: [
          "id",
          "title",
          "extractionRationale",
          "hook0to3s",
          "escalation3to15s",
          "climax15to50s",
          "infiniteLoop50to60s",
          "loopBridgePreview",
          "storyboardFrames"
        ],
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          extractionRationale: { type: Type.STRING },
          hook0to3s: {
            type: Type.STRING,
            description: "[00:00 - 00:03] HOOK (3 seconds): Strictly 7 to 9 punchy words. Must trigger an immediate curiosity gap. Write this FIRST and copy its exact opening words to verify the infinite loop ending."
          },
          escalation3to15s: {
            type: Type.STRING,
            description: "[00:03 - 00:15] RAPID ESCALATION (12 seconds): Strictly 28 to 32 words. Short, staccato sentences showing the contrast between normal reality and the hidden crisis. Include one [Pause]."
          },
          climax15to50s: {
            type: Type.STRING,
            description: "[00:15 - 00:48] CORE REVEAL / CLIMAX (33 seconds): Strictly 80 to 90 words. Step-by-step breakdown + 1 tangible everyday physical analogy + the exact numeric/scientific payoff written in clean digits with units."
          },
          infiniteLoop50to60s: {
            type: Type.STRING,
            description: "[00:48 - 00:55] INFINITE LOOP ENDING (7 seconds): Strictly 15 to 18 words. Must NOT end with a period if mid-sentence; the final words MUST grammatically flow directly into the first word of hook0to3s so reading [infiniteLoop50to60s] + [hook0to3s] out loud forms a single, 100% grammatically flawless sentence."
          },
          loopBridgePreview: {
            type: Type.STRING,
            description: "Scratchpad proof showing the exact combined sentence '[infiniteLoop50to60s] -> [hook0to3s]' read together as one unbroken grammatical sentence."
          },
          storyboardFrames: {
            type: Type.ARRAY,
            description: "5 to 6 vertical 9:16 storyboard visual prompts (one for every 8-10 seconds of the 55s script).",
            items: {
              type: Type.OBJECT,
              required: ["id", "timeRange", "visualPrompt", "captionOverlay"],
              properties: {
                id: { type: Type.STRING },
                timeRange: { type: Type.STRING },
                visualPrompt: { type: Type.STRING },
                captionOverlay: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  }
};

export const sfxMapperSchema: Schema = {
  type: Type.OBJECT,
  required: ["segments"],
  properties: {
    segments: {
      type: Type.ARRAY,
      description: "Exact same number of scenes as input, preserving 100% of spoken words while injecting inline [SFX: ...] and [BGM: ...] cues at key emotional and structural transitions.",
      items: {
        type: Type.OBJECT,
        required: ["audio"],
        properties: {
          audio: { type: Type.STRING }
        }
      }
    }
  }
};

export const devilsAdvocateSchema: Schema = {
  type: Type.OBJECT,
  required: [
    "inputSummary",
    "overallObjectivityScore",
    "vulnerabilities",
    "steelmanAndRebuttalMatrix",
    "bulletproofBridgeBlocks"
  ],
  properties: {
    inputSummary: { type: Type.STRING },
    overallObjectivityScore: { type: Type.NUMBER },
    vulnerabilities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: [
          "id",
          "sentenceOrClaim",
          "issueType",
          "explanation",
          "severity",
          "suggestedNeutralFix"
        ],
        properties: {
          id: { type: Type.STRING },
          sentenceOrClaim: { type: Type.STRING },
          issueType: {
            type: Type.STRING,
            enum: ["Unverified Claim", "Loaded Framing", "Selection Bias", "Logical Leap"]
          },
          explanation: { type: Type.STRING },
          severity: {
            type: Type.STRING,
            enum: [
              "Low Risk",
              "Medium Risk",
              "High Backlash Risk (Comment Section Magnet)"
            ]
          },
          suggestedNeutralFix: { type: Type.STRING }
        }
      }
    },
    steelmanAndRebuttalMatrix: {
      type: Type.ARRAY,
      description: "3 to 5 strongest Steelman Counter-Arguments paired with Fact-Backed Defenses / Rebuttals.",
      items: {
        type: Type.OBJECT,
        required: [
          "id",
          "opposingSchoolOfThought",
          "steelmanCounterArgument",
          "supportingEvidenceAndData",
          "creatorDefenseAndRebuttal",
          "defenseCounterStatistics"
        ],
        properties: {
          id: { type: Type.STRING },
          opposingSchoolOfThought: { type: Type.STRING },
          steelmanCounterArgument: { type: Type.STRING },
          supportingEvidenceAndData: { type: Type.STRING },
          counterSourceTitle: { type: Type.STRING },
          counterSourceUrl: { type: Type.STRING },
          creatorDefenseAndRebuttal: { type: Type.STRING },
          defenseCounterStatistics: { type: Type.STRING },
          defenseSourceTitle: { type: Type.STRING },
          defenseSourceUrl: { type: Type.STRING }
        }
      }
    },
    bulletproofBridgeBlocks: {
      type: Type.ARRAY,
      description: "2 to 3 neutral, high-credibility bridge paragraphs that preemptively disarm critics.",
      items: {
        type: Type.OBJECT,
        required: ["id", "label", "targetPlacement", "scriptParagraph", "disarmsCriticism"],
        properties: {
          id: { type: Type.STRING },
          label: { type: Type.STRING },
          targetPlacement: { type: Type.STRING },
          scriptParagraph: { type: Type.STRING },
          disarmsCriticism: { type: Type.STRING }
        }
      }
    }
  }
};


