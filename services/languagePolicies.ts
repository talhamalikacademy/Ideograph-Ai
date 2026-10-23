import { CreatorProfile, GeneratorConfig, ScriptData } from "../types";
import { DHRUV_DEEP_DNA, detectDhruvGenre } from "../creators/dhruv";
import {
  DHRUV_SUB_GENRE_BLUEPRINTS,
  DHRUV_RATHEE_TRANSCRIPTS,
  THYNKWHY_SUB_GENRE_BLUEPRINTS,
  THYNKWHY_TRANSCRIPTS,
  OTHER_CREATOR_TRANSCRIPT_PACKS,
  getSubGenreBlueprintsForCreator,
  matchCreatorSubGenreAndTranscript,
  compileCreatorTranscriptAndSubGenreBlock,
  buildAntiPlagiarismDirective
} from "../src/data/creatorTranscripts";

export {
  DHRUV_SUB_GENRE_BLUEPRINTS,
  DHRUV_RATHEE_TRANSCRIPTS,
  THYNKWHY_SUB_GENRE_BLUEPRINTS,
  THYNKWHY_TRANSCRIPTS,
  OTHER_CREATOR_TRANSCRIPT_PACKS,
  getSubGenreBlueprintsForCreator,
  matchCreatorSubGenreAndTranscript,
  compileCreatorTranscriptAndSubGenreBlock,
  buildAntiPlagiarismDirective
};

/**
 * ============================================================================
 * 4-STAGE SEQUENTIAL SCRIPT EXECUTION PIPELINE & LAYER-2 POLICY ENGINE
 * (`services/languagePolicies.ts`)
 * ----------------------------------------------------------------------------
 * Enforces the Sequential Execution Pipeline on every script generation:
 *   STAGE 1A: Read Creator Bio File (Read-Only from `/creators/*` & `/creator-intelligence/*`)
 *   STAGE 1B: Read Creator Transcript File (`src/data/creatorTranscripts/dhruv_rathee.js`, `thynkwhy.js`, etc.)
 *             & Route Topic -> 5 Sub-Genre Blueprints + Abstracted DNA (Zero Plagiarism)
 *   STAGE 2:  Apply Layer-2 Language Policy (`getLanguagePolicyMatrix`)
 *   STAGE 3:  Enforce Pacing, Speed & Sentence-Length Math (`buildStage3PacingAndSpeedEngine`)
 *   STAGE 4:  Lock Hook-to-Body Curiosity, Topic-First Declarative Contrast Hook & Narrative Thread (`DHRUV_HOOK_ARCHITECTURE_MATRIX`)
 *   + POST-GENERATION: `sanitizeCreatorVocabulary(scriptText, creatorId, targetLanguage, userTopic, isFirstScene)` safety net.
 * ============================================================================
 */

export type PolicyProfileKey = "dhruv_rathee" | "thynkwhy" | "default";

export interface LexicalReplacementRule {
  /** Banned formal/literary Urdu or low-energy desi morning-show phrase (Nastaliq) */
  bannedPhrase: string;
  /** Optional Roman Urdu / Hinglish equivalent to ban */
  bannedRoman?: string;
  /** Why it fails for this creator */
  reason: string;
  /** True Creator Style replacement (100% Pure Urdu Script in Nastaliq — zero Latin characters) */
  replacement: string;
  /** Roman Urdu replacement when generating in Roman Urdu / Hinglish */
  replacementRoman?: string;
}

export interface CreatorLanguagePolicyProfile {
  policyKey: PolicyProfileKey;
  displayName: string;
  idiomPolicy: "STRICTLY_FORBIDDEN" | "ALLOWED_DRAMATIC" | "MODERATE_SPOKEN";
  registerSummary: string;
  idiomDirective: string;
  codeSwitchingDirective: string;
  hookEndingRule: string;
  sentenceRhythmPatterns: string[];
  sentenceRhythmPatternsRoman?: string[];
  visualPromptDirective: string;
  bannedLexiconTable: LexicalReplacementRule[];
  goldenCalibrationPassages?: string[];
  hookCalibrationBlock?: string;
}

/**
 * Complete Forensic Audit Table & Lexical Replacement Dictionary for `dhruv_rathee`
 * Every Nastaliq `replacement` uses 100% Pure Urdu Script characters (zero Latin letters)
 * so Unicode BiDi rendering never breaks in `Urdu (Proper)` mode.
 */
export const DHRUV_RATHEE_LEXICAL_REPLACEMENTS: LexicalReplacementRule[] = [
  // --- Forensic Audit: Ban Weak Morning-Show Openings & Domestic Laziness Complaints ---
  {
    bannedPhrase: "ہمارا دماغ کتنی جلدی تھکنے لگا ہے",
    bannedRoman: "hamara dimagh kitni jaldi thakne laga hai",
    reason: "Soft domestic complaint ('thakne laga hai'). Dhruv uses sharp cognitive framing.",
    replacement: "ہمارے سوچنے اور سمجھنے کی انٹیلیجنس کمزور پڑ رہی ہے",
    replacementRoman: "hamare sochne aur samajhne ki intelligence weak ho rahi hai"
  },
  {
    bannedPhrase: "دماغ کتنی جلدی تھکنے لگا ہے",
    bannedRoman: "dimagh kitni jaldi thakne laga hai",
    reason: "Soft domestic complaint about tiredness instead of cognitive impact.",
    replacement: "دماغ کی تھنکنگ پاور کمزور ہو رہی ہے",
    replacementRoman: "dimagh ki thinking power weak ho rahi hai"
  },
  {
    bannedPhrase: "یہ کوئی عام سستی نہیں ہے",
    bannedRoman: "yeh koi aam susti nahi hai",
    reason: "Morning-show host domestic phrasing ('aam susti').",
    replacement: "یہ صرف نارمل لیزینس نہیں ہے، بلکہ ہمارے برین کنکشنز کا کمزور پڑنا ہے",
    replacementRoman: "yeh sirf normal laziness nahi hai, balki hamare brain connections ka weak hona hai"
  },
  {
    bannedPhrase: "دوستو، ذرا سچ بتائیے",
    bannedRoman: "dosto, zara sach batayein",
    reason: "Chatty morning-show banter. Dhruv uses direct analytical challenges ('Zara socho, dosto').",
    replacement: "ذرا سوچو، دوستو",
    replacementRoman: "Zara socho, dosto"
  },
  {
    bannedPhrase: "ذرا سچ بتائیے",
    bannedRoman: "zara sach batayein",
    reason: "Morning-show host filler.",
    replacement: "ذرا سوچو",
    replacementRoman: "zara socho"
  },
  {
    bannedPhrase: "ذرا سچ بتائیں",
    bannedRoman: "zara sach bataiye",
    reason: "Morning-show host filler.",
    replacement: "ذرا سوچو",
    replacementRoman: "zara socho"
  },

  // --- Multi-Word Idioms, Formal Phrases & Leaked Body Phrases (Longest match first for sanitizer) ---
  {
    bannedPhrase: "جادو سر چڑھ کر بول رہا تھا",
    bannedRoman: "jadu sar charh kar bol raha tha",
    reason: "Poetic idiom (محاورہ). Dhruv uses modern internet terms.",
    replacement: "پوری دنیا میں کریز اور ہائپ اپنے پیک پر تھی",
    replacementRoman: "poori duniya mein craze aur hype apne peak par thi"
  },
  {
    bannedPhrase: "سر چڑھ کر بول رہا تھا",
    bannedRoman: "sar charh kar bol raha tha",
    reason: "Dramatic Urdu idiom forbidden in Dhruv Rathee's conversational style.",
    replacement: "پوری دنیا میں کریز اور ہائپ اپنے پیک پر تھی",
    replacementRoman: "poori duniya mein craze aur hype apne peak par thi"
  },
  {
    bannedPhrase: "بڑی وباؤں جتنا ہی سنگین",
    bannedRoman: "bari wabaon jitna hi sangeen",
    reason: "Formal literary Urdu words (وباؤں, سنگین) leaked in body.",
    replacement: "خطرناک پینڈیمکس جتنا ہی سیریس",
    replacementRoman: "khatarnaak pandemics jitna hi serious"
  },
  {
    bannedPhrase: "بڑی وباؤں جتنا سنگین",
    bannedRoman: "bari wabaon jitna sangeen",
    reason: "Formal literary Urdu words (وباؤں, سنگین) leaked in body.",
    replacement: "خطرناک پینڈیمکس جتنا سیریس",
    replacementRoman: "khatarnaak pandemics jitna serious"
  },
  {
    bannedPhrase: "اس کی تخلیق کیا رہے گی",
    bannedRoman: "uski takhleeq kya rahegi",
    reason: "Nobody says 'اس کی تخلیق کیا رہے گی' in spoken Urdu.",
    replacement: "اس کی کریٹیویٹی اور پہچان کیا بچے گی",
    replacementRoman: "uski creativity aur pehchan kya bachegi"
  },
  {
    bannedPhrase: "خبردار کر رہے ہیں",
    bannedRoman: "khabardar kar rahe hain",
    reason: "Formal news-anchor verb; Dhruv says 'وارننگ دے رہے ہیں'.",
    replacement: "وارننگ دے رہے ہیں",
    replacementRoman: "warning de rahe hain"
  },
  {
    bannedPhrase: "مستقل طور پر سست",
    bannedRoman: "mustaqil taur par sust",
    reason: "Formal textbook Urdu phrase.",
    replacement: "ہمیشہ کے لیے سلو اور ڈل",
    replacementRoman: "permanently slow aur dull"
  },
  {
    bannedPhrase: "مستقل طور پر",
    bannedRoman: "mustaqil taur par",
    reason: "Formal textbook phrase—Dhruv says 'ہمیشہ کے لیے' or 'پرمننٹلی'.",
    replacement: "ہمیشہ کے لیے",
    replacementRoman: "permanently"
  },
  {
    bannedPhrase: "آئیے اسے سمجھتے ہیں۔",
    bannedRoman: "aaiye isay samajhte hain.",
    reason: "Flat hook ending without evidence medium or scientific curiosity gap.",
    replacement: "آئیے اس کے پیچھے کی سائنس کو اسٹیپ بائی اسٹیپ سمجھتے ہیں۔",
    replacementRoman: "aaiye iske peeche ki science ko step-by-step samajhte hain."
  },
  {
    bannedPhrase: "آئیے اس کو سمجھتے ہیں۔",
    bannedRoman: "aaiye isko samajhte hain.",
    reason: "Flat hook ending without evidence medium.",
    replacement: "آئیے اس کے پیچھے کی سائنس کو اسٹیپ بائی اسٹیپ سمجھتے ہیں۔",
    replacementRoman: "aaiye iske peeche ki science ko step-by-step samajhte hain."
  },
  {
    bannedPhrase: "عہدے سے استعفیٰ دے دیتا ہے",
    bannedRoman: "ohday se istefa de deta hai",
    reason: "Formal news-anchor Urdu (عہدہ, استعفیٰ).",
    replacement: "اپنی پوزیشن سے ریزائن کر دیتے ہیں",
    replacementRoman: "apni position se resign kar dete hain"
  },
  {
    bannedPhrase: "عہدے سے استعفیٰ دے دیتے ہیں",
    bannedRoman: "ohday se istefa de dete hain",
    reason: "Formal news-anchor Urdu (عہدہ, استعفیٰ).",
    replacement: "اپنی پوزیشن سے ریزائن کر دیتے ہیں",
    replacementRoman: "apni position se resign kar dete hain"
  },
  {
    bannedPhrase: "عہدے سے استعفیٰ",
    bannedRoman: "ohday se istefa",
    reason: "Formal news-anchor Urdu (عہدہ, استعفیٰ).",
    replacement: "پوزیشن سے ریزائن",
    replacementRoman: "position se resign"
  },
  {
    bannedPhrase: "ٹورنگ ایوارڈ یافتہ",
    bannedRoman: "turing award yafta",
    reason: "Persian suffix (یافتہ) sounds like a textbook.",
    replacement: "'ٹورنگ ایوارڈ' جیتنے والے",
    replacementRoman: "Turing Award jeetne wale"
  },
  {
    bannedPhrase: "ایوارڈ یافتہ",
    bannedRoman: "award yafta",
    reason: "Persian textbook suffix (یافتہ).",
    replacement: "ایوارڈ جیتنے والے",
    replacementRoman: "award jeetne wale"
  },
  {
    bannedPhrase: "رات دن ایک کر کے",
    bannedRoman: "raat din aik kar ke",
    reason: "Melodramatic literary idiom.",
    replacement: "سالوں کی محنت اور ریسرچ کے بعد",
    replacementRoman: "saalon ki mehnat aur research ke baad"
  },
  {
    bannedPhrase: "زمین آسمان کا فرق",
    bannedRoman: "zameen aasman ka farq",
    reason: "Dramatic Urdu idiom.",
    replacement: "بہت بڑا فرق",
    replacementRoman: "bohat bara farq"
  },
  {
    bannedPhrase: "جڑ سے اکھاڑ پھینکنا",
    bannedRoman: "jar se ukhaar phenkna",
    reason: "Dramatic literary idiom.",
    replacement: "پوری طرح ختم کر دینا",
    replacementRoman: "poori tarah khatam kar dena"
  },
  {
    bannedPhrase: "خود مختار جان لیوا ہتھیاروں",
    bannedRoman: "khud mukhtar jaan lewa hathyaron",
    reason: "Sounds like an official military translation.",
    replacement: "آٹونومس لیتھل ویپنز، یعنی ایسے ہتھیار جو خود فیصلہ لیتے ہیں",
    replacementRoman: "Autonomous lethal weapons, yani aise hathyar jo khud decision lete hain"
  },
  {
    bannedPhrase: "خود مختار ہتھیاروں",
    bannedRoman: "khud mukhtar hathyaron",
    reason: "Official military translation register.",
    replacement: "آٹونومس ویپنز، یعنی ایسے ہتھیار جو خود فیصلے لیتے ہیں",
    replacementRoman: "Autonomous Weapons, yani aise hathyar jo khud decisions lete hain"
  },
  {
    bannedPhrase: "یہ صرف ایک تمثیل ہے",
    bannedRoman: "yeh sirf aik tamseel hai",
    reason: "تمثیل (Tamseel) is a 10th-grade Urdu literature word.",
    replacement: "یہ تو بس ایک ایگزامپل ہے",
    replacementRoman: "yeh toh bas ek example hai"
  },
  {
    bannedPhrase: "موازنہ اینیمیشن",
    bannedRoman: "muwazna animation",
    reason: "Literary Urdu inside visual prompts.",
    replacement: "کمپیریزن اینیمیشن",
    replacementRoman: "comparison animation"
  },
  {
    bannedPhrase: "سادہ لوح شہریوں",
    bannedRoman: "saada loh shehriyon",
    reason: "Archaic literary Urdu (سادہ لوح).",
    replacement: "معصوم لوگوں",
    replacementRoman: "innocent logon"
  },
  {
    bannedPhrase: "شائع ہونے والی",
    bannedRoman: "shaya hone wali",
    reason: "Heavy literary newspaper word (شائع).",
    replacement: "پبلش ہونے والی",
    replacementRoman: "publish hone wali"
  },
  {
    bannedPhrase: "شائع ہوئی",
    bannedRoman: "shaya hui",
    reason: "Heavy literary newspaper word (شائع).",
    replacement: "پبلش ہوئی",
    replacementRoman: "publish hui"
  },

  // --- Single / Core Lexical Replacements (100% Pure Nastaliq Urdu in `replacement`) ---
  {
    bannedPhrase: "سستی",
    bannedRoman: "susti",
    reason: "Soft domestic word; Dhruv uses 'مینٹل لیزینس'.",
    replacement: "مینٹل لیزینس",
    replacementRoman: "mental laziness"
  },
  {
    bannedPhrase: "کاہل",
    bannedRoman: "kaahil",
    reason: "Archaic/domestic scolding word; Dhruv uses 'مینٹلی لیزی'.",
    replacement: "مینٹلی لیزی",
    replacementRoman: "mentally lazy"
  },
  {
    bannedPhrase: "وباؤں",
    bannedRoman: "wabaon",
    reason: "Literary Urdu plural; Dhruv uses 'خطرناک پینڈیمکس'.",
    replacement: "خطرناک پینڈیمکس",
    replacementRoman: "khatarnaak pandemics"
  },
  {
    bannedPhrase: "سنگین",
    bannedRoman: "sangeen",
    reason: "Formal news-anchor Urdu; Dhruv uses 'سیریس'.",
    replacement: "سیریس",
    replacementRoman: "serious"
  },
  {
    bannedPhrase: "تخلیق",
    bannedRoman: "takhleeq",
    reason: "Literary Urdu noun; Dhruv uses 'کریٹیویٹی'.",
    replacement: "کریٹیویٹی",
    replacementRoman: "creativity"
  },
  {
    bannedPhrase: "خبردار",
    bannedRoman: "khabardar",
    reason: "Formal news-anchor Urdu; Dhruv uses 'وارننگ'.",
    replacement: "وارننگ",
    replacementRoman: "warning"
  },
  {
    bannedPhrase: "بغاوت",
    bannedRoman: "baghawat",
    reason: "Dramatic historical Urdu when used for AI/machines.",
    replacement: "کنٹرول سے باہر ہونا",
    replacementRoman: "out of control hona"
  },
  {
    bannedPhrase: "استعفیٰ",
    bannedRoman: "istefa",
    reason: "Formal news-anchor Urdu.",
    replacement: "ریزائن",
    replacementRoman: "resign"
  },
  {
    bannedPhrase: "ریاضی دانوں",
    bannedRoman: "riyazi daanon",
    reason: "Nobody says Riyazi-daan in conversational YouTube videos.",
    replacement: "میتھمیٹیشنز",
    replacementRoman: "Mathematicians"
  },
  {
    bannedPhrase: "ریاضی دان",
    bannedRoman: "riyazi daan",
    reason: "Academic Urdu noun.",
    replacement: "میتھمیٹیشنز",
    replacementRoman: "Mathematicians"
  },
  {
    bannedPhrase: "صنعتی انقلاب",
    bannedRoman: "sanati inqilab",
    reason: "Textbook history translation.",
    replacement: "انڈسٹریل ریوولوشن",
    replacementRoman: "Industrial Revolution"
  },
  {
    bannedPhrase: "غیر متوقع",
    bannedRoman: "ghair mutawaqqa",
    reason: "Heavy literary Urdu.",
    replacement: "ان پریڈکٹیبل",
    replacementRoman: "unpredictable"
  },
  {
    bannedPhrase: "شائع",
    bannedRoman: "shaya",
    reason: "Formal literary/print-news word.",
    replacement: "پبلش",
    replacementRoman: "publish"
  },
  {
    bannedPhrase: "سادہ لوح",
    bannedRoman: "saada loh",
    reason: "Archaic literary Urdu.",
    replacement: "معصوم",
    replacementRoman: "innocent"
  },
  {
    bannedPhrase: "ہوبہو",
    bannedRoman: "hu-ba-hu",
    reason: "Formal literary word.",
    replacement: "بالکل سیم ٹو سیم",
    replacementRoman: "bilkul exact"
  },
  {
    bannedPhrase: "تمثیل",
    bannedRoman: "tamseel",
    reason: "10th-grade Urdu literature word.",
    replacement: "ایگزامپل",
    replacementRoman: "example"
  },
  {
    bannedPhrase: "موازنہ",
    bannedRoman: "muwazna",
    reason: "Formal academic Urdu.",
    replacement: "کمپیریزن",
    replacementRoman: "comparison"
  },
  {
    bannedPhrase: "خود مختار",
    bannedRoman: "khud mukhtar",
    reason: "Formal political/military Urdu translation.",
    replacement: "آٹونومس",
    replacementRoman: "autonomous"
  },
  {
    bannedPhrase: "قابل اعتراض",
    bannedRoman: "qabil-e-aitraaz",
    reason: "Formal news-anchor phrasing.",
    replacement: "متنازعہ",
    replacementRoman: "fake ya controversial"
  },
  {
    bannedPhrase: "مسحور کن",
    bannedRoman: "mashoor kun",
    reason: "Poetic/literary Urdu adjective.",
    replacement: "سنیماٹک اور ریئلسٹک",
    replacementRoman: "Cinematic aur Realistic"
  },
  {
    bannedPhrase: "اشتعال انگیزی",
    bannedRoman: "ishtiaal angezi",
    reason: "Formal news-anchor Urdu.",
    replacement: "لوگوں کو بھڑکانا",
    replacementRoman: "logon ko provoke karna"
  },
  {
    bannedPhrase: "انکشاف",
    bannedRoman: "inkishaf",
    reason: "Sensational TV news-anchor word.",
    replacement: "سچائی سامنے آنا",
    replacementRoman: "sachai samne aana"
  },
  {
    bannedPhrase: "شواہد",
    bannedRoman: "shawahid",
    reason: "Courtroom/literary Urdu.",
    replacement: "ثبوت",
    replacementRoman: "saboot"
  },
  {
    bannedPhrase: "آغاز",
    bannedRoman: "aaghaz",
    reason: "Formal literary Urdu.",
    replacement: "شروع",
    replacementRoman: "shuru"
  },
  {
    bannedPhrase: "مفروضہ",
    bannedRoman: "mafrooza",
    reason: "Textbook Urdu word.",
    replacement: "اندازہ",
    replacementRoman: "assumption"
  },
  {
    bannedPhrase: "محرکات",
    bannedRoman: "muharrikaat",
    reason: "Heavy academic Urdu.",
    replacement: "وجوہات",
    replacementRoman: "reasons"
  },
  {
    bannedPhrase: "اختتام",
    bannedRoman: "ikhtitaam",
    reason: "Formal literary Urdu.",
    replacement: "ختم",
    replacementRoman: "khtam"
  },
  {
    bannedPhrase: "حتمی",
    bannedRoman: "hatmi",
    reason: "Formal news-anchor Urdu.",
    replacement: "فائنل",
    replacementRoman: "final"
  }
];

/**
 * STAGE 3 OF THE 4-STAGE PIPELINE:
 * Pacing, Speed, Sentence-Length Cap & Causal Mechanism Analogy Engine
 */
export const buildStage3PacingAndSpeedEngine = (
  durationLabel: string = "5 Minutes (Standard)"
): string => `
================================================================================
[STAGE 3: PACING, SPEED, SENTENCE-LENGTH CAP & MECHANISM ANALOGY ENGINE]
Target Duration: ${durationLabel}
================================================================================
1. SENTENCE LENGTH CAP (STRICT 12–18 WORD CEILING):
   - Maximum **14 to 18 words per sentence** (average 12 to 16 words).
   - NEVER write 30–35 word run-on sentences that exhaust the speaker or viewer.
2. STACCATO INFOTAINMENT RHYTHM & INVERSE CONTRAST FRAMING:
   - Alternate between a medium explanatory sentence (14–16 words) and a short, high-impact punchy sentence (6–9 words).
   - Use **Inverse-Proportional Contrast Framing** ("Jitna zyada [X]... utni hi kam [Y]" / "جتنا زیادہ [X]... اتنی ہی کم [Y]") tailored 100% to the user's specific topic.
3. STRATEGIC PAUSE MARKER PLACEMENT:
   - Place the literal marker "[Pause]" strictly right after a visceral high-stakes statement/question OR right before a physical mechanism analogy so the viewer's brain absorbs the impact.
4. ANTI-CLICHÉ MECHANISM ANALOGY RULE:
   - **BAN 1-Line Cliché Similes:** Never use generic 1-line clichés like *"جیسے ایک تیز رفتار گاڑی جس کے بریک فیل ہو جائیں"* (which only says something is dangerous without explaining *how* the mechanism works).
   - **MANDATORY CAUSE-AND-EFFECT MECHANOGY:** Every analogy MUST explain the physical/biological/economic *cause-and-effect mechanism* in 2 crisp sentences, followed immediately by the scientific term.
   - When writing in Urdu Script (Urdu Proper), write all terms in 100% pure Urdu script characters (zero Latin letters).
================================================================================
`.trim();

/**
 * STAGE 4 OF THE 4-STAGE PIPELINE:
 * Topic-First Hook Architecture, Zero Transcript Plagiarism, Contrast Framing,
 * 100% Pure Urdu Script (Zero Latin Leak), & Hook-to-Body Narrative Thread Lock (`activeThesis`).
 */
export const DHRUV_HOOK_ARCHITECTURE_MATRIX = [
  "================================================================================",
  "[STAGE 4: TOPIC-FIRST DHRUV HOOK ARCHITECTURE, ZERO PLAGIARISM & NARRATIVE THREAD LOCK]",
  "================================================================================",
  "### A. CRITICAL LAW — ZERO TRANSCRIPT HOOK PLAGIARISM & TOPIC-FIRST ANCHORING AT [00:00]:",
  "- NEVER copy, paraphrase, or recycle opening sentences or case studies from reference transcripts.",
  "- Sentence #1 and Sentence #2 at [00:00] MUST be 100% original and lock directly onto the user's exact topic, subject, and timeframe.",
  "- Never write soft domestic complaints about everyday tiredness.",
  "",
  "### B. THE 4-BEAT ABSTRACT DHRUV HOOK FORMULA (TAILORED 100% TO USER TOPIC):",
  "1. Beat 1 (0–5s) — Topic-Locked Visceral Statement + Inverse Contrast Frame:",
  "   - Open with a bold, high-stakes statement of fact anchored 100% on the user's exact topic, immediately followed by inverse contrast framing ('Jitna zyada [Topic Factor A]... utna hi [Topic Consequence B]').",
  "2. Beat 2 (5–10s) — Immediate Proof Pivot ('Yeh baat main apni taraf se nahi keh raha'):",
  "   - Pivot immediately to a verified report, empirical study, or primary historical record on the user's topic with an inline [CLAIM-1] marker.",
  "3. Beat 3 (10–15s) — Everyday Micro-Escalation + High-Stakes Reframe (activeThesis):",
  "   - Connect the topic to concrete real-world stakes and pose the central investigative question (activeThesis).",
  "4. Beat 4 (15–18s) — Signature Greeting & Evidence-Medium Roadmap:",
  "   - Include 'Namaskar dosto!' / 'نمسکار دوستو!' and invite the viewer to decode the evidence step-by-step ('Aaiye aaj ki is video mein poori research ke saath iske peeche ke sach ko step-by-step samajhte hain.').",
  "",
  "### C. THE 'SINGLE THREAD LAW' & MANDATORY INLINE [CLAIM-X] MARKERS:",
  "- Lock the core claim from the Hook as your activeThesis.",
  "- Every body scene that mentions a factual statistic, institutional report, historical event, or scientific study MUST include an inline clickable verification marker ([CLAIM-1], [CLAIM-2], [PAPER-1], etc.) inside the 'audio' narration and a matching entry in 'claimsAndPapersRegistry' and 'citations'.",
  "",
  "### D. MANDATORY CAUSAL BRIDGE RULE BETWEEN PARAGRAPHS:",
  "- Every body paragraph MUST open with a Causal Connector ('اس سوال کا جواب ڈھونڈنے کے لیے...', 'اور بات صرف یہیں ختم نہیں ہوتی، اسی دوران...', 'اب ذرا سوچو، دوستو!') that glues it seamlessly to the previous paragraph.",
  "================================================================================"
].join("\n");

/**
 * De-lexicalized structural calibration skeletons in BOTH Roman Urdu (Hinglish/Urdish Spine) AND Nastaliq Urdu.
 * Contains ZERO topic-specific nouns from past videos so the LLM never copy-pastes unrelated topics.
 */
export const DHRUV_TRUE_URDISH_GOLDEN_SCENES: string[] = [
  [
    "[DE-LEXICALIZED ROMAN URDU / HINGLISH CADENCE SKELETON — TOPIC-FIRST ANCHORING & INLINE [CLAIM-X] TAGS]:",
    "Scene 1 Skeleton (Hook): \"[BOLD_DECLARATIVE_FACT_ON_USER_TOPIC]. Jitna tezi se [TOPIC_FACTOR_A] barh raha hai... utna hi [TOPIC_CONSEQUENCE_B] samne aa raha hai. [Pause] Aur dosto, yeh baat main apni taraf se hawa mein nahi keh raha. Haal hi mein [PRIMARY_INSTITUTION_OR_REPORT] ki latest study mein yeh shocking data saamne aaya hai [CLAIM-1]. Namaskar dosto! Aaiye aaj ki is video mein poori research ke saath iske peeche ke sach ko step-by-step samajhte hain.\"",
    "Scene 2 Skeleton (Causal Bridge + Mechanism + Claim Tag): \"Is sawal ka jawab dhoondne ke liye humein sabse pehle [CORE_TOPIC_MECHANISM] ko samajhna hoga [CLAIM-2]. [Pause] Isay aasan zaban mein ek aise example se samjho: [2_SENTENCE_CAUSE_AND_EFFECT_ANALOGY_STRICTLY_FOR_USER_TOPIC] [INFOGRAPHIC-1].\""
  ].join("\n"),

  [
    "[DE-LEXICALIZED NASTALIQ URDU CADENCE SKELETON — ZERO LATIN LEAK & MANDATORY INLINE [CLAIM-X] TAGS]:",
    "Scene 1 Skeleton (Hook): \"[USER_TOPIC_BOLD_FACT]۔ جتنی تیزی سے [TOPIC_FACTOR_A] آگے بڑھ رہا ہے... اتنا ہی [TOPIC_CONSEQUENCE_B] سامنے آ رہا ہے۔ [Pause] اور دوستو، یہ بات میں اپنی طرف سے ہوا میں نہیں کہہ رہا۔ حال ہی میں [PRIMARY_REPORT_OR_INSTITUTION] کی لیٹسٹ رپورٹ میں یہ شاکنگ ڈیٹا سامنے آیا ہے [CLAIM-1]۔ نمسکار دوستو! آئیے آج کی اس ویڈیو میں پوری ریسرچ کے ساتھ اس کے پیچھے کے سچ کو اسٹیپ بائی اسٹیپ سمجھتے ہیں۔\"",
    "Scene 2 Skeleton (Causal Bridge + Mechanism + Claim Tag): \"اس سوال کا جواب ڈھونڈنے کے لیے ہمیں سب سے پہلے اس کے پیچھے کے اصل سسٹم کو سمجھنا ہوگا [CLAIM-2]۔ [Pause] اسے آسان زبان میں ایسے سمجھیں: [2_SENTENCE_TOPIC_SPECIFIC_ANALOGY] [INFOGRAPHIC-1]۔\""
  ].join("\n")
];

/**
 * Dedicated Layer-2 Linguistic Policy Profiles per Creator
 */
export const LANGUAGE_POLICY_PROFILES: Record<PolicyProfileKey, CreatorLanguagePolicyProfile> = {
  dhruv_rathee: {
    policyKey: "dhruv_rathee",
    displayName: "Dhruv Rathee (Conversational Urdish / Hindustani-English Spine)",
    idiomPolicy: "STRICTLY_FORBIDDEN",
    registerSummary:
      "High-energy modern Hindustani/Urdu spine fused with sharp conversational English technical/cognitive concepts (written in 100% pure Urdu Nastaliq script characters when Urdu Proper is selected). Zero poetic idioms (محاورات), zero archaic/literary Urdu nouns, and zero transcript hook plagiarism.",
    idiomDirective:
      'IDIOM, MORNING-SHOW FILLER & HOOK PLAGIARISM BAN: Never use dramatic poetic Urdu idioms ("جادو سر چڑھ کر بول رہا تھا", "رات دن ایک کر کے", "زمین آسمان کا فرق"), never use low-energy domestic complaints ("ہمارا دماغ کتنی جلدی تھکنے لگا ہے", "ذرا سچ بتائیں", "یہ کوئی عام سستی نہیں ہے"), and NEVER copy opening hooks from reference transcripts. Open with a 100% original visceral statement anchored on the user\'s exact topic and timeframe.',
    codeSwitchingDirective:
      'MANDATORY CONVERSATIONAL CODE-SWITCHING & SCRIPT PURITY: Keep the sentence grammar in clean, fast-paced Hindustani/Urdu, and use conversational English terms for technical, cognitive, and action concepts. CRITICAL: When output language is Urdu (Proper), write ALL English words in 100% Pure Urdu Script characters with ZERO Latin letters (A-Z) so Unicode BiDi word order never breaks.',
    hookEndingRule:
      'HOOK OPENING & ENDING RULE (CRITICAL): Open at [00:00] with a 100% original visceral declarative fact + contrast framing ("Jitna zyada... utna hi...") anchored directly on the user\'s exact topic. Always end the hook with the specific research medium ("Aaiye aaj ki is video mein poori research ke saath iske peeche ke sach ko step-by-step samajhte hain.").',
    sentenceRhythmPatterns: [
      "[Pause] اور دوستو، یہ بات میں اپنی طرف سے ہوا میں نہیں کہہ رہا۔ حال ہی میں لیٹسٹ ریسرچ رپورٹ میں یہ شاکنگ سچ سامنے آیا ہے [CLAIM-1]۔",
      "اس سوال کا جواب ڈھونڈنے کے لیے سب سے پہلے اس کے پیچھے کے ڈیٹا کو دیکھیے [CLAIM-2]...",
      "اور بات صرف یہیں ختم نہیں ہوتی۔ اسی دوران ایک نئی رپورٹ نے آفیشل وارننگ جاری کی [INFOGRAPHIC-1]...",
      "اسے آسان زبان میں ایک سادہ سے ایگزامپل سے سمجھیں...",
      "اب ذرا سوچو، دوستو! اصل مسئلہ یہ نہیں ہے کہ... اصل سوال یہ ہے کہ...",
      "آپ کو کیا لگتا ہے دوستو—نیچے کمنٹس میں ضرور بتائیے گا!"
    ],
    sentenceRhythmPatternsRoman: [
      "[Pause] Aur dosto, yeh baat main apni taraf se hawa mein nahi keh raha. Haal hi mein latest research report mein yeh shocking sach saamne aaya hai [CLAIM-1].",
      "Is sawal ka jawab dhoondne ke liye sabse pehle iske peeche ke data ko dekhiye [CLAIM-2]...",
      "Aur baat sirf yahin khatam nahi hoti. Isi dauran ek nayi report ne official warning jaari ki [INFOGRAPHIC-1]...",
      "Isay aasan zaban mein ek saada se example se samjho...",
      "Ab zara socho, dosto! Asal masla yeh nahi hai ke... Asal sawal yeh hai ke...",
      "Aapko kya lagta hai dosto—neeche comments mein zaroor bataiyega!"
    ],
    visualPromptDirective:
      'VISUAL PROMPT REGISTER: Never use literary Urdu words like "موازنہ اینیمیشن" or "مسحور کن" inside visual directions. Use modern production terms like "Comparison animation", "Split-screen contrast", and "Data growth chart".',
    bannedLexiconTable: DHRUV_RATHEE_LEXICAL_REPLACEMENTS,
    goldenCalibrationPassages: DHRUV_TRUE_URDISH_GOLDEN_SCENES,
    hookCalibrationBlock: DHRUV_HOOK_ARCHITECTURE_MATRIX
  },

  thynkwhy: {
    policyKey: "thynkwhy",
    displayName: "ThynkWhy — Muazzam Shah (Rhythmic Parallel Clauses, Parables & Philosophical 'Why' Documentary)",
    idiomPolicy: "ALLOWED_DRAMATIC",
    registerSummary:
      "High-gravitas (9/10) ideological and philosophical documentary storytelling that eschews dry clinical science words in favor of rhythmic, rhyming, and parallel Urdu/Urdish clauses (ہم قافیہ و متوازی جملے), poetic historical parables (تمثیلی آغاز), and a warm brotherly-yet-literary cadence ('ڈنکے کی چوٹ پر', 'درد پر مرہم رکھنا', 'کیوں کی کھوج / Unraveling the Why').",
    idiomDirective:
      'RHYTHMIC WORD-BLENDING & IDIOM PERMISSION (ہم قافیہ جملے اور محاورات ALLOWED FOR THYNKWHY ONLY): Unlike clinical science explainers, ThynkWhy thrives on rhythmic, matching parallel clauses ("کہانیاں سنا کر زمانہ بدلنے آیا ہے، معاشرے کی منفی سوچ کو مثبت سوچ سے بدلنے آیا ہے", "مگر آج یہ مقصد کہیں کھو گیا ہے، زندگی کا مقصد سو گیا ہے") and powerful Urdu expressions ("بات ہوگی ڈنکے کی چوٹ پر", "درد پر مرہم رکھنا اور معاشرہ سنوارنا", "سینہ بہ سینہ", "عقل پر پڑے تالوں کو کھولنا"). Never copy past transcript lines verbatim; create 100% original rhythmic parallel sentences for the user\'s topic.',
    codeSwitchingDirective:
      'THYNKWHY BLENDED REGISTER: In Urdu (Proper), use 100% pure Urdu Nastaliq script with zero Latin characters, weaving literary philosophical depth with grounded human warmth ("آپ کا بڑا بھائی", "شام کی چائے", "خود احتسابی"). In Roman Urdu / Hinglish, blend natural spoken anchors ("oh bhai", "yaar", "boss", "danke ki chot par", "Why") with rhythmic parallel clauses.',
    hookEndingRule:
      'THYNKWHY PARABLE & WHY HOOK RULE: Open at [00:00] with a vivid historical/moral parable (like the little sparrow carrying a drop of water over Nimrod\'s fire) or an unsettling societal mirror scene anchored on the user\'s topic, and close the hook with a piercing question of personal responsibility ("کیا آج ہم اپنے حصے کا کام کر رہے ہیں؟" / "Kya aaj hum apne hissay ka kaam kar rahe hain?").',
    sentenceRhythmPatterns: [
      "کیا آج ہم اپنے حصے کا کام کر رہے ہیں؟ آپ کا نہیں معلوم، مگر میرے پاس اس سوال کا جواب ہے۔",
      "بولنا تو بعد کا مرحلہ ہے، اس سے پہلے سوچنا ضروری ہے کہ بولنا کیا ہے!",
      "بات ہوگی ڈنکے کی چوٹ پر، اور چوٹ لگنے پر تھوڑا درد تو ہوگا، مگر یقین مانیے مقصد درد پہنچانا نہیں بلکہ درد پر مرہم رکھنا اور معاشرہ سنوارنا ہے۔",
      "مگر آج یہ مقصد کہیں کھو گیا ہے، زندگی کا مقصد سو گیا ہے۔",
      "یہی وہ 'کیوں' ہے جو انسان کی عقل پر پڑے تالوں کو کھولتا ہے [CLAIM-1]۔",
      "ضروری ہے کہ آپ کے اندر ایک سچی سوچ پیدا ہو، کیونکہ سوچ ہی سوال کو جنم دیتی ہے—وہ سوال جو آپ کی فکر بدل دے اور نیا راستہ دکھائے!"
    ],
    sentenceRhythmPatternsRoman: [
      "Kya aaj hum apne hissay ka kaam kar rahe hain? Aapka nahi pata, magar mere paas is sawal ka jawab hai.",
      "Oh bhai, bolna agla step hai! Us se pehle soch lo ke bolna kya hai!",
      "Baat hogi danke ki chot par, aur chot lagne par thoda dard toh hoga yaar, magar yaqeen karein maqsad dard pohanchana nahi, dard par marham rakhna hai, muashra sanwarna hai.",
      "Magar aaj yeh Why kahin kho gaya hai, zindagi ka maqsad so gaya hai.",
      "Yehi Why aapke zehen ki girhein kholega [CLAIM-1]!",
      "Zaroori hai ke aapke andar aik soch paida ho, kyunke soch hi sawal ko janam deti hai—sawal woh jo aapko ghalat raah par jaane se rokk de; sawal woh jo sach ki raah dikhaye!"
    ],
    visualPromptDirective:
      "VISUAL PROMPT REGISTER: Cinematic, high-contrast documentary visuals with symbolic metaphors (e.g., a solitary sparrow over a roaring furnace, archival historical portraits, teleprompter studio shadows, warm evening tea reflections).",
    bannedLexiconTable: []
  },

  default: {
    policyKey: "default",
    displayName: "Universal Conversational South Asian Infotainment Policy",
    idiomPolicy: "MODERATE_SPOKEN",
    registerSummary:
      "Everyday spoken Urdu/Hindi mixed naturally with common technical, scientific, and modern terms—never news-anchor or textbook dictionary Urdu.",
    idiomDirective:
      "Avoid archaic textbook Urdu idioms and low-energy morning-show filler; prefer clear, direct, high-retention spoken storytelling.",
    codeSwitchingDirective:
      'Keep technical, scientific, and modern nouns/verbs in conversational form (transliterated into pure Urdu script when Urdu Proper is selected) while keeping sentence structure in simple everyday spoken Hindustani/Urdu.',
    hookEndingRule:
      'HOOK ENDING RULE: Never end a hook with a flat "آئیے اسے سمجھتے ہیں". Always tease the evidence, research, or mechanism to be uncovered.',
    sentenceRhythmPatterns: [
      "اسے آسان زبان میں ایسے سمجھیں کہ...",
      "ذرا سوچو دوستو...",
      "آئیے اس کے پیچھے کی سائنس کو اسٹیپ بائی اسٹیپ سمجھتے ہیں۔"
    ],
    visualPromptDirective:
      "Keep visual directions crisp, modern, and production-ready.",
    bannedLexiconTable: DHRUV_RATHEE_LEXICAL_REPLACEMENTS.slice(0, 38)
  }
};

/**
 * Resolves any creator ID or name (`"dhruvrathee"`, `"dhruv_rathee"`, `"dhruv"`, `"thynkwhy"`, etc.)
 * to its canonical Layer-2 PolicyProfileKey.
 */
export const resolvePolicyProfileKey = (
  creatorOrId?: CreatorProfile | string | null
): PolicyProfileKey => {
  const raw =
    typeof creatorOrId === "string"
      ? creatorOrId
      : creatorOrId?.id || creatorOrId?.bio?.id || creatorOrId?.name || "";
  const clean = raw.toLowerCase().replace(/[\s_-]+/g, "");

  if (clean.includes("dhruv") || clean.includes("analyticalexplainer")) {
    return "dhruv_rathee";
  }

  if (clean.includes("thynkwhy") || clean.includes("thinkwhy")) {
    return "thynkwhy";
  }

  return "default";
};

/**
 * Connects `/creators/dhruv.ts` (`DHRUV_DEEP_DNA.hookEngine`) with Stage 3 (Pacing & Speed)
 * and Stage 4 (Topic-First Hook Formula & Hook-to-Body Narrative Thread Lock).
 */
export const getHookCalibrationDirective = (
  creatorOrId?: CreatorProfile | string | null,
  durationLabel: string = "5 Minutes (Standard)",
  targetLanguage: string = "English",
  topic: string = ""
): string => {
  const profileKey = resolvePolicyProfileKey(creatorOrId);
  const policy = LANGUAGE_POLICY_PROFILES[profileKey];
  const isShortForm = /30\s*sec|60\s*sec|short|1\s*min/i.test(durationLabel || "");

  if (profileKey === "dhruv_rathee") {
    const detectedGenre = detectDhruvGenre(topic);
    const genreSpec = DHRUV_DEEP_DNA.hookEngine.genres[detectedGenre];

    return [
      buildAntiPlagiarismDirective(topic),
      buildStage3PacingAndSpeedEngine(durationLabel),
      DHRUV_HOOK_ARCHITECTURE_MATRIX,
      `[ACTIVE DHRUV HOOK & THREAD LOCK MODE]: ${
        isShortForm
          ? "FAST-PACED SHORT / REEL (12–16 word sentences, 4-Beat Topic-Locked Hook -> Immediate Institutional Research Proof [CLAIM-1] -> Everyday Scenario -> 'Aaiye iske peeche ki science ko step-by-step samajhte hain.' -> Causal Bridge into [CLAIM-2] & [INFOGRAPHIC-1] + 2-Sentence Mechanism Analogy -> Thread-Locked Ending)"
          : "5–20 MINUTE YOUTUBE DOCUMENTARY (100% Original Topic-Locked Visceral Declarative Statement + Inverse Contrast Frame -> Immediate Institutional Research Proof [CLAIM-1] -> Everyday Escalation + High-Stakes Reframe Question -> Evidence-Medium Roadmap -> Causal Bridges across every chapter with inline [CLAIM-X] and [INFOGRAPHIC-X] markers)"
      }`,
      `[CONNECTED DHRUV BIO GENRE HOOK SHAPE (${genreSpec.label})]: ${genreSpec.openingShape}`,
      `[CONNECTED DHRUV BIO GENRE DEVICES]: ${genreSpec.devices.join(" | ")}`
    ].join("\n\n");
  }

  return [
    buildAntiPlagiarismDirective(topic),
    buildStage3PacingAndSpeedEngine(durationLabel),
    `### STAGE 4: HOOK & NARRATIVE THREAD LOCK (${policy.displayName}):\n- ${policy.hookEndingRule}\n- Lock the central claim/question of Scene 1 as activeThesis and ensure every subsequent scene, [CLAIM-X], [INFOGRAPHIC-X], and analogy directly answers activeThesis using smooth causal bridges.`
  ].join("\n\n");
};

/**
 * STAGE 2 + STAGE 3 + STAGE 4 POLICY MATRIX BUILDER:
 * `getLanguagePolicyMatrix(creatorId, targetLanguage, durationLabel, topic)`
 */
export const getLanguagePolicyMatrix = (
  creatorId?: CreatorProfile | string | null,
  targetLanguage: string = "English",
  durationLabel: string = "5 Minutes (Standard)",
  topic: string = ""
): string => {
  const profileKey = resolvePolicyProfileKey(creatorId);
  const policy = LANGUAGE_POLICY_PROFILES[profileKey];
  const isUrduOrHindi = /urdu|hinglish|hindi/i.test(targetLanguage || "");
  const isRomanScript = /roman|hinglish/i.test(targetLanguage || "");

  const lexicalOverrideLines =
    policy.bannedLexiconTable.length > 0
      ? [
          `### MANDATORY LEXICAL SUBSTITUTION MATRIX (${policy.displayName.toUpperCase()}):`,
          ...policy.bannedLexiconTable.map(
            rule =>
              `- NEVER use "${rule.bannedPhrase}"${
                rule.bannedRoman ? ` / "${rule.bannedRoman}"` : ""
              } -> INSTEAD USE "${
                isRomanScript && rule.replacementRoman ? rule.replacementRoman : rule.replacement
              }" [Reason: ${rule.reason}]`
          )
        ].join("\n")
      : `### LEXICAL REGISTER DIRECTIVE (${policy.displayName.toUpperCase()}):\n- ${policy.registerSummary}`;

  const activeRhythmPatterns =
    isRomanScript && policy.sentenceRhythmPatternsRoman && policy.sentenceRhythmPatternsRoman.length > 0
      ? policy.sentenceRhythmPatternsRoman
      : policy.sentenceRhythmPatterns;

  const stage3And4Block = getHookCalibrationDirective(
    creatorId,
    durationLabel,
    targetLanguage,
    topic
  );

  const goldenCalibrationBlock =
    isUrduOrHindi &&
    policy.goldenCalibrationPassages &&
    policy.goldenCalibrationPassages.length > 0
      ? `\n### GOLDEN 10/10 CALIBRATION PASSAGES — TRUE ${policy.displayName.toUpperCase()} CADENCE & THREAD LOCK:\n${policy.goldenCalibrationPassages.join(
          "\n\n"
        )}`
      : "";

  return `
================================================================================
[STAGE 2: LAYER-2 LINGUISTIC ENCRYPTION & VOCABULARY POLICY ENGINE]
Policy Profile: ${policy.displayName} (\`${policy.policyKey}\`)
Target Output Language: ${targetLanguage}
Idiom Policy: ${policy.idiomPolicy}
================================================================================
1. CORE LINGUISTIC DNA OVERRIDE:
   - ${policy.registerSummary}
2. IDIOM, MORNING-SHOW FILLER & HOOK PLAGIARISM POLICY:
   - ${policy.idiomDirective}
3. CODE-SWITCHING & SCRIPT PURITY SPINE:
   - ${policy.codeSwitchingDirective}
4. HOOK OPENING, CONTRAST FRAMING & EVIDENCE-MEDIUM RULE:
   - ${policy.hookEndingRule}
5. AUTHENTIC SENTENCE RHYTHM & CAUSAL BRIDGES (${isRomanScript ? "ROMAN URDU / HINGLISH" : "URDU / HINGLISH"}):
${activeRhythmPatterns.map(p => `   * "${p}"`).join("\n")}
6. VISUAL PROMPT LINGUISTIC FILTER:
   - ${policy.visualPromptDirective}

${lexicalOverrideLines}

${stage3And4Block}
${goldenCalibrationBlock}
================================================================================
`.trim();
};

/**
 * 4-STAGE SEQUENTIAL EXECUTION PIPELINE BUILDER (`assembleFourStageCreatorPipeline` / `assembleTwoLayerCreatorPrompt`)
 */
export const assembleFourStageCreatorPipeline = (options: {
  stage1CreatorBioPrompt: string;
  creator?: CreatorProfile | string | null;
  config?: Partial<GeneratorConfig>;
  targetLanguage?: string;
  additionalDirectives?: string[];
}): string => {
  const effectiveLanguage =
    options.targetLanguage || options.config?.language || "English";
  const effectiveDuration = options.config?.duration || "5 Minutes (Standard)";
  const effectiveTopic = options.config?.topicOrScript || "";
  const effectiveSubGenreId = options.config?.subGenreId || "auto";

  const effectiveSecondaryLanguage =
    options.config?.enableDualScript && options.config?.secondaryLanguage
      ? options.config.secondaryLanguage
      : "";

  const stage1BTranscriptBlock = compileCreatorTranscriptAndSubGenreBlock({
    creator: options.creator,
    topic: effectiveTopic,
    targetLanguage: effectiveLanguage,
    secondaryLanguage: effectiveSecondaryLanguage,
    subGenreId: effectiveSubGenreId
  });

  const stages2To4Matrix = getLanguagePolicyMatrix(
    options.creator,
    effectiveLanguage,
    effectiveDuration,
    effectiveTopic
  );

  const extraBlocks = (options.additionalDirectives || [])
    .filter(Boolean)
    .join("\n\n");

  return [
    `/* === STAGE 1A: CREATOR BIO INGESTION (READ-ONLY BIO FILE) === */`,
    options.stage1CreatorBioPrompt,
    `/* === STAGE 1B: CREATOR TRANSCRIPT CORPUS & 5 SUB-GENRE ROUTING (READ-ONLY TRANSCRIPT FILE) === */`,
    stage1BTranscriptBlock,
    `/* === STAGES 2, 3 & 4: LAYER-2 LANGUAGE POLICY, PACING ENGINE & NARRATIVE THREAD LOCK === */`,
    stages2To4Matrix,
    extraBlocks
  ]
    .filter(Boolean)
    .join("\n\n");
};

export const assembleTwoLayerCreatorPrompt = (options: {
  creatorBioPrompt: string;
  creator?: CreatorProfile | string | null;
  config?: Partial<GeneratorConfig>;
  targetLanguage?: string;
  additionalDirectives?: string[];
}): string =>
  assembleFourStageCreatorPipeline({
    stage1CreatorBioPrompt: options.creatorBioPrompt,
    creator: options.creator,
    config: options.config,
    targetLanguage: options.targetLanguage,
    additionalDirectives: options.additionalDirectives
  });

/**
 * Helper to escape special regex characters for safe case-insensitive replacement.
 */
const escapeRegExp = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Comprehensive English-to-Urdu-Script Transliteration Dictionary for `Urdu (Proper)`
 * Ensures 100% Pure Urdu Script rendering with ZERO Latin letters (`A-Z`) so Unicode BiDi never breaks.
 */
const LATIN_TO_PURE_URDU_SCRIPT_MAP: Array<[string, string]> = [
  ["Namaskar dosto", "نمسکار دوستو"],
  ["namaskar dosto", "نمسکار دوستو"],
  ["Namaskar", "نمسکار"],
  ["namaskar", "نمسکار"],
  ["Dosto", "دوستو"],
  ["dosto", "دوستو"],
  ["Autonomous lethal weapons", "آٹونومس لیتھل ویپنز"],
  ["Autonomous Weapons", "آٹونومس ویپنز"],
  ["autonomous weapons", "آٹونومس ویپنز"],
  ["Autonomous", "آٹونومس"],
  ["autonomous", "آٹونومس"],
  ["Drone Swarms", "ڈرون سوارمز"],
  ["drone swarms", "ڈرون سوارمز"],
  ["Cyber Warfare", "سائبر وار فیئر"],
  ["cyber warfare", "سائبر وار فیئر"],
  ["Power Grid", "پاور گرڈ"],
  ["power grid", "پاور گرڈ"],
  ["Carnegie Mellon University", "کارنیگی میلن یونیورسٹی"],
  ["Carnegie Mellon", "کارنیگی میلن"],
  ["MIT Media Lab", "ایم آئی ٹی میڈیا لیب"],
  ["Cognitive Offloading", "کوگنیٹو آف لوڈنگ"],
  ["cognitive offloading", "کوگنیٹو آف لوڈنگ"],
  ["Critical Thinking", "کریٹیکل تھنکنگ"],
  ["critical thinking", "کریٹیکل تھنکنگ"],
  ["Industrial Revolution", "انڈسٹریل ریوولوشن"],
  ["Artificial Intelligence", "آرٹیفیشل انٹیلیجنس"],
  ["General AI", "جنرل اے آئی"],
  ["neural connections", "نیورل کنکشنز"],
  ["brain connections", "برین کنکشنز"],
  ["brain activity", "برین ایکٹیویٹی"],
  ["memory loss", "میموری لاس"],
  ["mental laziness", "مینٹل لیزینس"],
  ["mentally lazy", "مینٹلی لیزی"],
  ["mentally dumb", "مینٹلی ڈمب"],
  ["out of control", "آؤٹ آف کنٹرول"],
  ["step-by-step", "اسٹیپ بائی اسٹیپ"],
  ["step by step", "اسٹیپ بائی اسٹیپ"],
  ["EEG scan", "ای ای جی اسکین"],
  ["EEG", "ای ای جی"],
  ["ChatGPT", "چیٹ جی پی ٹی"],
  ["OpenAI", "اوپن اے آئی"],
  ["Microsoft", "مائیکروسافٹ"],
  ["Google Search", "گوگل سرچ"],
  ["Google", "گوگل"],
  ["YouTube", "یوٹیوب"],
  ["MIT", "ایم آئی ٹی"],
  ["AGI", "اے جی آئی"],
  ["UN", "اقوامِ متحدہ"],
  ["AI", "اے آئی"],
  ["intelligence", "انٹیلیجنس"],
  ["predictions", "پریڈکشنز"],
  ["prediction", "پریڈکشن"],
  ["permanently", "پرمننٹلی"],
  ["calculation", "کیلکولیشن"],
  ["calculations", "کیلکولیشنز"],
  ["scientific", "سائنٹفک"],
  ["experiment", "ایکسپیریمنٹ"],
  ["participants", "پارٹیسپینٹس"],
  ["outsource", "آؤٹ سورس"],
  ["creativity", "کریٹیویٹی"],
  ["productive", "پروڈکٹیو"],
  ["algorithm", "الگورتھم"],
  ["algorithms", "الگورتھمز"],
  ["shocking", "شاکنگ"],
  ["thinking", "تھنکنگ"],
  ["research", "ریسرچ"],
  ["studies", "اسٹڈیز"],
  ["study", "اسٹڈی"],
  ["warning", "وارننگ"],
  ["serious", "سیریس"],
  ["depend", "ڈیپینڈ"],
  ["latest", "لیٹسٹ"],
  ["muscles", "مسلز"],
  ["muscle", "مسل"],
  ["normal", "نارمل"],
  ["laziness", "لیزینس"],
  ["resign", "ریزائن"],
  ["publish", "پبلش"],
  ["example", "ایگزامپل"],
  ["comparison", "کمپیریزن"],
  ["controversial", "متنازعہ"],
  ["unpredictable", "ان پریڈکٹیبل"],
  ["pandemics", "پینڈیمکس"],
  ["pandemic", "پینڈیمک"],
  ["divide", "ڈیوائیڈ"],
  ["activity", "ایکٹیویٹی"],
  ["weak", "کمزور"],
  ["dull", "ڈل"],
  ["slow", "سلو"],
  ["smart", "اسمارٹ"],
  ["dumb", "ڈمب"],
  ["craze", "کریز"],
  ["hype", "ہائپ"],
  ["peak", "پیک"],
  ["final", "فائنل"],
  ["exact", "ایگزیکٹ"]
];

/**
 * Phonetic fallback transliterator for any remaining stray Latin word in `Urdu (Proper)` mode
 * so zero `A-Z` characters leak into Nastaliq Urdu narration.
 */
const transliterateRemainingLatinWordToUrdu = (word: string): string => {
  if (!word || !/[A-Za-z]/.test(word)) return word;
  let w = word.toLowerCase();
  const digraphs: Array<[RegExp, string]> = [
    [/tion/g, "شن"],
    [/sion/g, "ژن"],
    [/sh/g, "ش"],
    [/ch/g, "چ"],
    [/kh/g, "خ"],
    [/gh/g, "غ"],
    [/ph/g, "ف"],
    [/th/g, "تھ"],
    [/ee/g, "ی"],
    [/oo/g, "و"],
    [/ai/g, "ے"],
    [/ay/g, "ے"],
    [/ck/g, "ک"],
    [/qu/g, "کو"]
  ];
  for (const [rgx, rep] of digraphs) {
    w = w.replace(rgx, rep);
  }
  const charMap: Record<string, string> = {
    a: "ا",
    b: "ب",
    c: "ک",
    d: "ڈ",
    e: "ے",
    f: "ف",
    g: "گ",
    h: "ہ",
    i: "ی",
    j: "ج",
    k: "ک",
    l: "ل",
    m: "م",
    n: "ن",
    o: "و",
    p: "پ",
    q: "ق",
    r: "ر",
    s: "س",
    t: "ٹ",
    u: "و",
    v: "و",
    w: "و",
    x: "یکس",
    y: "ی",
    z: "ز"
  };
  let out = "";
  for (const ch of w) {
    out += charMap[ch] !== undefined ? charMap[ch] : ch;
  }
  return out;
};

/**
 * Enforces Pure Urdu Script (`Urdu (Proper)`) using the verified dictionary map (`LATIN_TO_PURE_URDU_SCRIPT_MAP`),
 * while preserving inline production & verification markers (`[Pause]`, `[CLAIM-1]`, `[PAPER-1]`, `[INFOGRAPHIC-1]`).
 * Does NOT mangle unknown English words letter-by-letter.
 */
export const enforcePureUrduScriptNoLatinLeak = (text: string): string => {
  if (!text) return "";

  // 1. Temporarily protect allowed bracket markers ([Pause], [Beat], [Cut], [SFX], [B-Roll], [Music], [CLAIM-X], [PAPER-X], [INFOGRAPHIC-X])
  const savedMarkers: string[] = [];
  let working = text.replace(
    /\[\s*(?:Pause|Beat|Cut|SFX|B-Roll|Music|(?:CLAIM|PAPER|INFOGRAPHIC)\s*-\s*\d+)\s*\]/gi,
    match => {
      const idx = savedMarkers.length;
      savedMarkers.push(match);
      return `⟪__MARKER_${idx}__⟫`;
    }
  );

  // 2. Strip redundant parenthetical English glosses right after Urdu words, e.g. "مسلز (muscles)" -> "مسلز"
  working = working.replace(/\s*\(\s*[A-Za-z][A-Za-z0-9\s-]*\s*\)/g, "");

  // 3. Replace known English phrases/terms with their exact spoken Urdu Script equivalents (longest first)
  const sortedMap = [...LATIN_TO_PURE_URDU_SCRIPT_MAP].sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const [latinTerm, urduScript] of sortedMap) {
    const escaped = escapeRegExp(latinTerm);
    const rgx = new RegExp(`\\b${escaped}\\b`, "gi");
    working = working.replace(rgx, urduScript);
  }

  // 4. Restore protected bracket markers
  working = working.replace(/⟪__MARKER_(\d+)__⟫/g, (_, idxStr) => {
    const idx = parseInt(idxStr, 10);
    return savedMarkers[idx] || "";
  });

  return working.replace(/\s{2,}/g, " ").trim();
};

/**
 * Post-generation anti-plagiarism guard: strips any accidentally leaked hook lines
 * from past reference videos ("The DARK Side of ChatGPT" or "November 2022 OpenAI 5-day 10 lakh Netflix/Facebook record")
 * when those past-video facts were not requested in the user's topic.
 */
export const sanitizePlagiarizedHookSentences = (
  text: string,
  userTopic: string = "",
  _isPureUrdu: boolean = false
): string => {
  if (!text) return "";
  const lowerTopic = (userTopic || "").toLowerCase();

  let cleaned = text;

  if (!lowerTopic.includes("dark side of chatgpt") && !lowerTopic.includes("khokhla")) {
    const nastaliqHookRegex =
      /(?:اے آئی|AI)\s*آپ کے دماغ کو دھیرے دھیرے کھوکھلا کیے جا رہا ہے[^۔.؟!]*[۔.؟!]?\s*(?:جتنا زیادہ آپ\s*(?:چیٹ جی پی ٹی|ChatGPT)\s*کا استعمال کر رہے ہو[^۔.؟!]*[۔.؟!]?)?/gi;
    cleaned = cleaned.replace(nastaliqHookRegex, "").trim();

    const romanHookRegex =
      /AI aapke dimagh ko dheere-dheere khokhla kiye ja raha hai[^.?!]*[.?!]?\s*(?:Jitna zyada aap ChatGPT ka istemal kar rahe ho[^.?!]*[.?!]?)?/gi;
    cleaned = cleaned.replace(romanHookRegex, "").trim();
  }

  // Strip leaked Video #2 ("30 نومبر 2022 کو جب اوپن اے آئی... صرف پانچ دنوں کے اندر اس سسٹم سے 10 لاکھ... نیٹ فلکس اور فیس بک...") hook sentences if user topic didn't ask for 2022 or Netflix
  if (!lowerTopic.includes("2022") && !lowerTopic.includes("netflix")) {
    const nov2022UrduRegex =
      /(?:30\s*)?نومبر\s*2022\s*کو\s*جب\s*اوپن\s*اے\s*آئی[^۔.؟!]*[۔.؟!]?\s*(?:صرف\s*پانچ\s*دنوں\s*کے\s*اندر[^۔.؟!]*نیٹ\s*فلکس[^۔.؟!]*[۔.؟!]?)?/gi;
    cleaned = cleaned.replace(nov2022UrduRegex, "").trim();

    const fiveDaysRecordUrduRegex =
      /صرف\s*پانچ\s*دنوں\s*کے\s*اندر\s*(?:اس\s*سسٹم|چیٹ\s*جی\s*پی\s*ٹی)[^۔.؟!]*نیٹ\s*فلکس[^۔.؟!]*[۔.؟!]?/gi;
    cleaned = cleaned.replace(fiveDaysRecordUrduRegex, "").trim();
  }

  return cleaned || text;
};

/**
 * POST-GENERATION LEXICAL SANITIZER & PURE-URDU SCRIPT SAFETY NET:
 * `sanitizeCreatorVocabulary(scriptText, creatorId, targetLanguage, userTopic, isFirstScene)`
 */
export const sanitizeCreatorVocabulary = (
  scriptText: string,
  creatorId?: CreatorProfile | string | null,
  targetLanguage?: string,
  userTopic?: string,
  isFirstScene: boolean = false
): string => {
  if (!scriptText) return "";

  const profileKey = resolvePolicyProfileKey(creatorId);
  const policy = LANGUAGE_POLICY_PROFILES[profileKey];
  const isPureUrdu =
    targetLanguage === "Urdu (Proper)" ||
    (Boolean(targetLanguage) &&
      /urdu/i.test(targetLanguage || "") &&
      !/roman/i.test(targetLanguage || ""));

  let sanitized = scriptText;

  // Fix common LLM Urdu tokenization typo where 'نمسکار' (Namaskar) loses 'س' and becomes 'نمکار'
  sanitized = sanitized
    .replace(/نمکار\s+دوستو/g, "نمسکار دوستو")
    .replace(/نمکار(?=\s|[!،۔؟?]|$)/g, "نمسکار")
    .replace(/نمکار/g, "نمسکار")
    .replace(/نامسکار/g, "نمسکار")
    .replace(/نمس\s+کار/g, "نمسکار");

  // Clean up any accidental Bengali/Assamese script token leak (e.g., অভিশাপ -> تباہی)
  sanitized = sanitized.replace(/অভিশাপ\s*\(تباہی\)/g, "تباہی");
  sanitized = sanitized.replace(/অভিশাপ/g, "تباہی");

  // Strip plagiarized opening hook sentences if leaked in Scene 1
  if (
    isFirstScene ||
    sanitized.includes("کھوکھلا کیے جا رہا ہے") ||
    /khokhla kiye ja raha hai/i.test(sanitized) ||
    (sanitized.includes("نومبر 2022") && sanitized.includes("نیٹ فلکس"))
  ) {
    sanitized = sanitizePlagiarizedHookSentences(sanitized, userTopic, isPureUrdu);
  }

  if (policy.idiomPolicy !== "ALLOWED_DRAMATIC" && policy.bannedLexiconTable.length > 0) {
    // 1. Nastaliq Urdu replacements (longest-first so multi-word phrases replace before single words)
    const sortedNastaliqRules = [...policy.bannedLexiconTable].sort(
      (a, b) => b.bannedPhrase.length - a.bannedPhrase.length
    );

    for (const rule of sortedNastaliqRules) {
      if (rule.bannedPhrase && sanitized.includes(rule.bannedPhrase)) {
        sanitized = sanitized.split(rule.bannedPhrase).join(rule.replacement);
      }
    }

    // 2. Roman Urdu / Hinglish replacements (only when not in pure Nastaliq Urdu mode)
    if (!isPureUrdu) {
      const sortedRomanRules = [...policy.bannedLexiconTable]
        .filter(r => Boolean(r.bannedRoman && r.replacementRoman))
        .sort((a, b) => (b.bannedRoman?.length || 0) - (a.bannedRoman?.length || 0));

      for (const rule of sortedRomanRules) {
        if (!rule.bannedRoman || !rule.replacementRoman) continue;
        const escaped = escapeRegExp(rule.bannedRoman.trim());
        const startsWithWord = /^[A-Za-z0-9]/.test(rule.bannedRoman.trim());
        const endsWithWord = /[A-Za-z0-9]$/.test(rule.bannedRoman.trim());
        const pattern = `${startsWithWord ? "\\b" : ""}${escaped}${endsWithWord ? "\\b" : ""}`;
        const regex = new RegExp(pattern, "gi");
        if (regex.test(sanitized)) {
          sanitized = sanitized.replace(regex, rule.replacementRoman);
        }
      }
    }
  }

  // 3. Enforce 100% Pure Urdu Script (zero Latin characters) when `Urdu (Proper)` is active
  if (isPureUrdu) {
    sanitized = enforcePureUrduScriptNoLatinLeak(sanitized);
  }

  return sanitized;
};

/**
 * Applies `sanitizeCreatorVocabulary` across an entire array of script segments
 * (both `audio` narration and `visual` cues).
 */
export const sanitizeScriptSegmentsVocabulary = <
  T extends { visual?: string; audio?: string }
>(
  segments: T[],
  creatorId?: CreatorProfile | string | null,
  targetLanguage?: string,
  userTopic?: string
): T[] => {
  if (!Array.isArray(segments)) return [];
  return segments.map((seg, idx) => ({
    ...seg,
    visual: seg.visual ? sanitizeCreatorVocabulary(seg.visual, creatorId) : seg.visual,
    audio: seg.audio
      ? sanitizeCreatorVocabulary(seg.audio, creatorId, targetLanguage, userTopic, idx === 0)
      : seg.audio
  }));
};

/**
 * Applies `sanitizeCreatorVocabulary` to a full `ScriptData` package before UI rendering.
 */
export const sanitizeScriptDataPackage = (
  script: ScriptData,
  creatorId?: CreatorProfile | null | string
): ScriptData => {
  const effectiveCreator = creatorId || script.creatorId || script.creatorName;
  return {
    ...script,
    title: sanitizeCreatorVocabulary(script.title, effectiveCreator),
    segments: sanitizeScriptSegmentsVocabulary(
      script.segments || [],
      effectiveCreator,
      script.language,
      script.topic
    ),
    ctas: (script.ctas || []).map(cta =>
      sanitizeCreatorVocabulary(cta, effectiveCreator, script.language, script.topic, false)
    )
  };
};

