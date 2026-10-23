/**
 * ============================================================================
 * CREATOR TRANSCRIPT CORPUS — ALL ADDITIONAL CREATORS
 * (`src/data/creatorTranscripts/other_creators.js`)
 * ----------------------------------------------------------------------------
 * Tri-Lingual Transcriptions (English, Urdu Nastaliq + Roman Urdu, Hindi) and
 * Sub-Genre Blueprints for all 9 additional creators:
 *   - Nitish Rajput (`nitishrajput`)
 *   - Raftar (`raftar`)
 *   - Veritasium (`veritasium`)
 *   - MrBeast (`mrbeast`)
 *   - Alex Hormozi (`alexhormozi`)
 *   - Naval Ravikant (`navalravikant`)
 *   - Jordan Peterson (`jordanpeterson`)
 *   - Iman Gadzhi (`imangadzhi`)
 *   - Sharan Hegde (`sharanhegde`)
 * ============================================================================
 */

const createCreatorPack = ({
  creatorId,
  creatorName,
  blueprintId,
  blueprintTitle,
  aggressionScore,
  aggressionAndTone,
  signatureWordingAndPacing,
  topicTriggers,
  videoTitle,
  topicDomain,
  englishTranscript,
  urduTranscript,
  romanUrduTranscript,
  hindiTranscript,
  realTimeTransitions,
  englishMixExamples
}) => ({
  creatorId,
  creatorName,
  subGenreBlueprints: [
    {
      id: blueprintId,
      cardNumber: 1,
      genreTag: blueprintTitle,
      title: blueprintTitle,
      aggressionScore,
      aggressionAndTone,
      signatureWordingAndPacing,
      topicTriggers
    }
  ],
  transcripts: [
    {
      id: `${creatorId}-signature-pack`,
      subGenreId: blueprintId,
      genreTag: blueprintTitle,
      videoTitle,
      topicDomain,
      aggressionScore,
      sourceScriptLanguage: "English / Urdu / Hinglish",
      trilingualTranscripts: {
        englishTranscript: englishTranscript.trim(),
        urduTranscript: urduTranscript.trim(),
        romanUrduTranscript: romanUrduTranscript.trim(),
        hindiTranscript: hindiTranscript.trim()
      },
      rawTranscriptExcerpt: englishTranscript.trim().slice(0, 220),
      openingMechanics: {
        visceralStatementFormula: signatureWordingAndPacing,
        inverseCorrelationFormula: "Contrast common assumptions against documented evidence.",
        uncomfortableTruthBridge: "Let the primary evidence and numbers speak directly.",
        expectationVsRealityParadox: "Surface belief vs. underlying mechanism.",
        nostalgiaMemorySelfTest: "Ground the concept in a concrete real-world scenario.",
        inconvenientQuestionPivot: "Step through the core mechanism scene by scene."
      },
      realTimeTransitions,
      englishMixExamples,
      closingMechanics: {
        antiBoycottNuance: "Synthesize all sides of the evidence clearly.",
        practicalProtocol: "Provide actionable, verifiable takeaways.",
        finalMetaphorAndQuestion: "Close with a sharp question tailored to the topic."
      }
    }
  ]
});

export const OTHER_CREATOR_TRANSCRIPT_PACKS = {
  nitishrajput: createCreatorPack({
    creatorId: "nitishrajput",
    creatorName: "Nitish Rajput",
    blueprintId: "nitish_case_file_investigation",
    blueprintTitle: "1. Structural Case-File & Policy Investigation",
    aggressionScore: "Prosecutorial Archival Timeline",
    aggressionAndTone:
      "Prosecutorial, archival, zero-fluff timeline & official document dissection",
    signatureWordingAndPacing:
      'Dated timeline anchors ("Kahani ki shuruat hoti hai saal..."), multi-stakeholder perspective ("Ek taraf government ka kehna hai... doosri taraf official audit report dikhati hai..."), crisp factual sentences.',
    topicTriggers: ["policy", "scam", "history", "politics", "court", "law", "economy", "war", "case", "farmer", "poverty"],
    videoTitle: "The Complete Timeline & Official Document Breakdown | Nitish Rajput Style",
    topicDomain: "Investigative Case Study, Public Policy & Institutional Audit",
    englishTranscript: `
[00:00 - CASE FILE HOOK] To understand this entire controversy, we cannot just look at today's headlines—we have to go back to the exact day the first official file was signed [CLAIM-1]. Let's decode every single document chapter by chapter.
[02:10 - TIMELINE & AUDIT] Look at this chronological chart [INFOGRAPHIC-1]. In Phase 1, the policy was introduced with a clear objective, but within 18 months, three structural loopholes changed the entire ground reality.
[06:30 - CLOSING] I have placed all the official reports, court filings, and data links in the description below so you can verify every fact yourself. After looking at all sides of the evidence, what is your conclusion?
    `,
    urduTranscript: `
[00:00 - CASE FILE HOOK] اس پورے معاملے کی تہہ تک پہنچنے کے لیے ہمیں صرف آج کی خبروں کو نہیں، بلکہ اس دن کے سرکاری ریکارڈ کو دیکھنا ہوگا جہاں سے اس کہانی کی شروعات ہوئی تھی [CLAIM-1]۔ آئیے اس پورے کیس کو ثبوتوں کے ساتھ شروعات سے سمجھتے ہیں۔
[02:10 - TIMELINE & AUDIT] اس ٹائم لائن کو دھیان سے دیکھیے [INFOGRAPHIC-1]۔ پہلے مرحلے میں جو قانون بنایا گیا، محض اٹھارہ مہینے کے اندر اس کی تین قانونی خامیوں نے زمینی حقیقت کو پوری طرح بدل کر رکھ دیا۔
[06:30 - CLOSING] میں نے اس ویڈیو میں استعمال کی گئی تمام سرکاری رپورٹس اور ڈیٹا کے لنکس نیچے ڈسکرپشن میں ڈال دیے ہیں تاکہ آپ خود بھی ہر فیکٹ کو ویریفائی کر سکیں۔ ان تمام ثبوتوں کو دیکھنے کے بعد آپ کی کیا رائے ہے؟
    `,
    romanUrduTranscript: `
[00:00 - CASE FILE HOOK] Is poore mamle ki teh tak pahunchne ke liye humein sirf aaj ki headlines ko nahi, balki us din ke official record ko dekhna hoga jahan se is kahani ki shuruat hui thi [CLAIM-1]. Aaiye is poore case ko sabooton ke sath shuruat se samajhte hain.
[02:10 - TIMELINE & AUDIT] Is timeline ko dhyan se dekhiye [INFOGRAPHIC-1]. Phase 1 mein jo policy banayi gayi, mehez 18 mahine ke andar uske teen legal loopholes ne ground reality ko poori tarah badal kar rakh diya.
[06:30 - CLOSING] Maine is video mein use ki gayi tamam official reports aur data ke links neeche description mein daal diye hain taake aap khud bhi har fact ko verify kar sakein. In tamam sabooton ko dekhne ke baad aapki kya raye hai?
    `,
    hindiTranscript: `
[00:00 - CASE FILE HOOK] इस पूरे मामले की तह तक पहुँचने के लिए हमें सिर्फ़ आज की सुर्ख़ियों को नहीं, बल्कि उस दिन के सरकारी रिकॉर्ड को देखना होगा जहाँ से इस कहानी की शुरुआत हुई थी [CLAIM-1]। आइए इस पूरे केस को सबूतों के साथ शुरुआत से समझते हैं।
[02:10 - TIMELINE & AUDIT] इस टाइमलाइन को ध्यान से देखिए [INFOGRAPHIC-1]। पहले चरण में जो नीति बनाई गई, महज़ 18 महीने के अंदर उसके तीन क़ानूनी loopholes ने ज़मीनी हक़ीक़त को पूरी तरह बदल कर रख दिया।
[06:30 - CLOSING] मैंने इस वीडियो में इस्तेमाल की गई तमाम सरकारी रिपोर्ट्स और डेटा के लिंक्स नीचे description में डाल दिए हैं ताकि आप खुद भी हर फ़ैक्ट को verify कर सकें।
    `,
    realTimeTransitions: [
      "Is kahani ki shuruat hoti hai saal [YEAR] mein [CLAIM-1]...",
      "Ab is coin ke doosre pehlu ko dekhte hain [INFOGRAPHIC-1]...",
      "Official audit report ke mutabiq..."
    ],
    englishMixExamples: [
      "official audit report ka data",
      "ground reality ko poori tarah badal kar rakh diya",
      "links neeche description mein daal diye hain"
    ]
  }),

  raftar: createCreatorPack({
    creatorId: "raftar",
    creatorName: "Raftar",
    blueprintId: "raftar_geopolitical_thriller",
    blueprintTitle: "1. High-Stakes Geopolitical & Investigative Thriller",
    aggressionScore: "Investigative Documentary Thriller",
    aggressionAndTone: "Dramatic, investigative documentary thriller pacing",
    signatureWordingAndPacing:
      "High-tension geopolitical framing, intelligence & power-corridor storytelling, vivid Urdu/Hindi narrative momentum.",
    topicTriggers: ["geopolitics", "war", "intelligence", "history", "empire", "economy", "power", "roast", "exposed"],
    videoTitle: "Inside the Secret Power Corridor | Raftar Documentary Style",
    topicDomain: "Geopolitics, Intelligence Operations & Investigative Callouts",
    englishTranscript: `
[00:00 - THRILLER HOOK] Behind closed doors in the capitals of global superpowers, a single decision was signed that rewrote the fate of an entire region [CLAIM-1].
[02:15 - THE POWER CHESSBOARD] Look closely at this geopolitical map [INFOGRAPHIC-1]. Whoever controls this choke point controls the entire strategic corridor.
[06:30 - CLOSING] On the chessboard of global power, there are no permanent friends or permanent enemies—only permanent interests. What happens next?
    `,
    urduTranscript: `
[00:00 - THRILLER HOOK] بند کمروں کے پیچھے، جہاں عالمی طاقتوں کے فیصلے لکھے جاتے ہیں، ایک ایسا دستخط ہوا جس نے پورے خطے کا مستقبل بدل کر رکھ دیا [CLAIM-1]۔
[02:15 - THE POWER CHESSBOARD] اس نقشے کو غور سے دیکھیے [INFOGRAPHIC-1]۔ طاقت کی اصل جنگ یہیں سے شروع ہوتی ہے۔
[06:30 - CLOSING] عالمی سیاست کی اس شطرنج پر نہ کوئی ہمیشہ کا دوست ہوتا ہے اور نہ ہمیشہ کا دشمن—یہاں صرف مفادات ہمیشہ زندہ رہتے ہیں۔
    `,
    romanUrduTranscript: `
[00:00 - THRILLER HOOK] Band kamron ke peeche, jahan global superpowers ke faisle likhe jate hain, ek aisa signature hua jisne poore region ka future badal kar rakh diya [CLAIM-1].
[02:15 - THE POWER CHESSBOARD] Is map ko ghaur se dekhiye [INFOGRAPHIC-1]. Power ki asli jung yahin se shuru hoti hai.
[06:30 - CLOSING] Global politics ki is shatranj par na koi hamesha ka dost hota hai aur na hamesha ka dushman—yahan sirf interests hamesha zinda rehte hain.
    `,
    hindiTranscript: `
[00:00 - THRILLER HOOK] बंद कमरों के पीछे, जहाँ वैश्विक महाशक्तियों के फ़ैसले लिखे जाते हैं, एक ऐसा हस्ताक्षर हुआ जिसने पूरे क्षेत्र का भविष्य बदल कर रख दिया [CLAIM-1]।
[02:15 - THE POWER CHESSBOARD] इस नक़्शे को ग़ौर से देखिए [INFOGRAPHIC-1]। ताक़त की असली जंग यहीं से शुरू होती है।
[06:30 - CLOSING] वैश्विक राजनीति की इस शतरंज पर न कोई हमेशा का दोस्त होता है और न हमेशा का दुश्मन—यहाँ सिर्फ़ हित हमेशा ज़िंदा रहते हैं।
    `,
    realTimeTransitions: [
      "Lekin asli kahani tab palat gayi jab [CLAIM-1]...",
      "Is map aur data ko ghaur se dekhiye [INFOGRAPHIC-1]..."
    ],
    englishMixExamples: ["global superpowers", "strategic corridor", "permanent interests"]
  }),

  veritasium: createCreatorPack({
    creatorId: "veritasium",
    creatorName: "Veritasium",
    blueprintId: "veritasium_counterintuitive_science",
    blueprintTitle: "1. Counter-Intuitive Physics, Math & Experimental Paradox",
    aggressionScore: "Experimental Scientific Wonder",
    aggressionAndTone: "Curious, experimental, paradox-driven scientific wonder",
    signatureWordingAndPacing:
      "Opens with a counter-intuitive physical riddle or common misconception, tests it via physical experiment, reveals the deeper mathematical/physical law.",
    topicTriggers: ["physics", "math", "science", "space", "quantum", "engineering", "paradox", "energy", "experiment"],
    videoTitle: "The Counter-Intuitive Scientific Paradox | Veritasium Style",
    topicDomain: "Physics, Mathematics, Neuroscience & Experimental Science",
    englishTranscript: `
[00:00 - PARADOX HOOK] Almost everyone gets this simple question wrong—including trained physicists and engineers. Common sense tells you one thing, yet in controlled laboratory tests, the exact opposite happens [CLAIM-1].
[02:10 - THE PHYSICAL MECHANISM] To see what is really going on, we have to zoom down to the microscopic mechanism [INFOGRAPHIC-1].
[06:30 - CLOSING] The universe doesn't care what feels intuitive to our brains—it obeys the underlying equations of physics.
    `,
    urduTranscript: `
[00:00 - PARADOX HOOK] اس بظاہر آسان سے سوال کا جواب تقریباً ہر انسان غلط دیتا ہے—یہاں تک کہ بڑے بڑے سائنٹسٹس اور انجینئرز بھی۔ لیبارٹری کے تجربات میں اس کا بالکل الٹا نتیجہ نکلتا ہے [CLAIM-1]۔
[02:10 - THE PHYSICAL MECHANISM] اس کے پیچھے کے اصل راز کو دیکھنے کے لیے ہمیں مائیکروسکوپک سطح پر جا کر اس کے مکینزم کو سمجھنا ہوگا [INFOGRAPHIC-1]۔
[06:30 - CLOSING] کائنات ہماری خواہشات یا اندازوں کے حساب سے نہیں چلتی—وہ فزکس اور ریاضی کے اٹل قوانین پر چلتی ہے۔
    `,
    romanUrduTranscript: `
[00:00 - PARADOX HOOK] Is bazahir aasan se sawal ka jawab kareeb har insaan galat deta hai—yahan tak ke bade-bade scientists aur engineers bhi [CLAIM-1].
[02:10 - THE PHYSICAL MECHANISM] Iske peeche ke asli mechanism ko dekhne ke liye humein microscopic level par jana hoga [INFOGRAPHIC-1].
[06:30 - CLOSING] Universe hamari intuition ke hisab se nahi chalti—woh physics aur mathematics ke fundamental laws par chalti hai.
    `,
    hindiTranscript: `
[00:00 - PARADOX HOOK] इस दिखने में आसान से सवाल का जवाब क़रीब हर इंसान ग़लत देता है—यहाँ तक कि बड़े-बड़े scientists और engineers भी [CLAIM-1]।
[02:10 - THE PHYSICAL MECHANISM] इसके पीछे के असली mechanism को देखने के लिए हमें microscopic level पर जाना होगा [INFOGRAPHIC-1]।
[06:30 - CLOSING] ब्रह्मांड हमारी intuition के हिसाब से नहीं चलता—वो physics और mathematics के fundamental laws पर चलता है।
    `,
    realTimeTransitions: [
      "To see why our intuition fails here, look at the experimental data [CLAIM-1]...",
      "At the microscopic level, a completely different mechanism takes over [INFOGRAPHIC-1]..."
    ],
    englishMixExamples: ["laboratory experiments", "microscopic level", "feedback loop", "fundamental laws"]
  }),

  mrbeast: createCreatorPack({
    creatorId: "mrbeast",
    creatorName: "MrBeast",
    blueprintId: "mrbeast_high_stakes_spectacle",
    blueprintTitle: "1. High-Stakes Spectacle & Escalating Challenge",
    aggressionScore: "Hyper-Retention Spectacle",
    aggressionAndTone: "Zero-wasted-second hook, immediate visual stakes, escalating rewards & cliffhangers",
    signatureWordingAndPacing:
      "First 5 seconds state the exact premise and massive stakes with zero throat-clearing; every 30 seconds escalates the obstacle or reward.",
    topicTriggers: ["challenge", "survive", "hours", "million", "dollar", "giveaway", "world record", "extreme", "stunt"],
    videoTitle: "High-Stakes Escalation & Retention Architecture | MrBeast Style",
    topicDomain: "High-Retention Challenge, Escalating Stakes & Spectacle",
    englishTranscript: `
[00:00 - INSTANT STAKES HOOK] Right behind me is a challenge that nobody has ever survived for a full 24 hours—and if they make it to the end, they walk away with the grand prize [CLAIM-1]!
[01:30 - ESCALATION PHASE 2] Just when they thought Stage 1 was over, we doubled the difficulty and brought out the next obstacle [INFOGRAPHIC-1].
[05:00 - CLIMAX CLOSING] Everything comes down to this final decision in the last 10 seconds!
    `,
    urduTranscript: `
[00:00 - INSTANT STAKES HOOK] میرے بالکل پیچھے ایک ایسا چیلنج موجود ہے جسے آج تک کوئی بھی چوبیس گھنٹے تک مکمل نہیں کر سکا—اور جو آخر تک ٹک گیا، وہ آج یہ بڑا انعام جیت کر جائے گا [CLAIM-1]!
[01:30 - ESCALATION PHASE 2] جب انہیں لگا کہ پہلا مرحلہ ختم ہو گیا ہے، تو ہم نے مشکل کو دگنا کر دیا [INFOGRAPHIC-1]۔
[05:00 - CLIMAX CLOSING] اب پورا فیصلہ آخری دس سیکنڈ کے اس ایک قدم پر ٹکا ہوا ہے!
    `,
    romanUrduTranscript: `
[00:00 - INSTANT STAKES HOOK] Mere bilkul peeche ek aisa challenge hai jisay aaj tak koi 24 ghante tak complete nahi kar saka—aur jo aakhir tak tik gaya, woh aaj yeh bada inaam jeet kar jayega [CLAIM-1]!
[01:30 - ESCALATION PHASE 2] Jab unhein laga ke Stage 1 khatam ho gaya hai, toh humne difficulty ko double kar diya [INFOGRAPHIC-1].
[05:00 - CLIMAX CLOSING] Ab poora faisla aakhri 10 seconds ke is ek move par tika hua hai!
    `,
    hindiTranscript: `
[00:00 - INSTANT STAKES HOOK] मेरे बिल्कुल पीछे एक ऐसा चैलेंज है जिसे आज तक कोई 24 घंटे तक पूरा नहीं कर सका—और जो आख़िर तक टिक गया, वो आज यह बड़ा इनाम जीत कर जाएगा [CLAIM-1]!
[01:30 - ESCALATION PHASE 2] जब उन्हें लगा कि पहला चरण ख़त्म हो गया है, तो हमने मुश्किल को दोगुना कर दिया [INFOGRAPHIC-1]।
[05:00 - CLIMAX CLOSING] अब पूरा फ़ैसला आख़िरी 10 सेकंड के इस एक क़दम पर टिका हुआ है!
    `,
    realTimeTransitions: [
      "But that was just Level 1—now look at what happens next...",
      "With only minutes left on the clock [INFOGRAPHIC-1]..."
    ],
    englishMixExamples: ["grand prize", "Stage 1", "final 10 seconds"]
  }),

  alexhormozi: createCreatorPack({
    creatorId: "alexhormozi",
    creatorName: "Alex Hormozi",
    blueprintId: "hormozi_value_equation_playbook",
    blueprintTitle: "1. Direct-Response Business Math & Value Equation Playbook",
    aggressionScore: "No-Fluff Operator Tactical Breakdown",
    aggressionAndTone: "Blunt, numerical, operator-tested business and execution frameworks",
    signatureWordingAndPacing:
      "Opens with a hard proof/numbers hook, breaks the problem into a 3-or-4 variable equation, gives exact tactical action steps.",
    topicTriggers: ["business", "sales", "offer", "leads", "revenue", "profit", "pricing", "marketing", "client", "b2b", "scale"],
    videoTitle: "The Tactical Value Equation & Unit Economics | Alex Hormozi Style",
    topicDomain: "Business Scaling, Sales Systems, Offers & Unit Economics",
    englishTranscript: `
[00:00 - PROOF & PROMISE HOOK] Most businesses don't have a traffic problem—they have an offer problem [CLAIM-1]. In the next few minutes, I'm going to show you the exact four-variable equation we used to fix unit economics without spending an extra dollar on ads.
[01:45 - THE EQUATION] Look at these four levers on screen [INFOGRAPHIC-1]: increase the dream outcome and perceived likelihood, while cutting time delay and effort to zero.
[05:30 - TACTICAL CLOSING] Stop trying to do more random things—do more of the one input that moves the constraint.
    `,
    urduTranscript: `
[00:00 - PROOF & PROMISE HOOK] زیادہ تر کاروباروں میں کسٹمرز کی کمی کا مسئلہ نہیں ہوتا—ان کے آفر ماڈل میں مسئلہ ہوتا ہے [CLAIM-1]۔ آج ہم ان چار بنیادی عوامل کو سمجھیں گے جو بغیر اشتہارات کا خرچہ بڑھائے منافع کو کئی گنا بڑھا دیتے ہیں۔
[01:45 - THE EQUATION] اسکرین پر موجود ان چار پوائنٹس کو دیکھیے [INFOGRAPHIC-1]: نتیجے کی قدر اور بھروسے کو بڑھائیں، جبکہ وقت اور کسٹمر کی محنت کو کم سے کم کر دیں۔
[05:30 - TACTICAL CLOSING] دس الگ الگ کام کرنے کے بجائے اس ایک رکاوٹ کو حل کریں جو آپ کی گروتھ کو روک رہی ہے۔
    `,
    romanUrduTranscript: `
[00:00 - PROOF & PROMISE HOOK] Zyadatar businesses mein traffic ka masla nahi hota—unke offer model mein masla hota hai [CLAIM-1]. Aaj hum un chaar levers ko samjhenge jo bina ad spend barhaye margins ko multiply kar dete hain.
[01:45 - THE EQUATION] Screen par maujood in chaar variables ko dekhiye [INFOGRAPHIC-1]: dream outcome aur trust ko barhayein, jabke time delay aur effort ko kam se kam kar dein.
[05:30 - TACTICAL CLOSING] Das alag cheezein try karne ke bajaye us ek bottleneck ko fix karein jo aapki growth ko rok raha hai.
    `,
    hindiTranscript: `
[00:00 - PROOF & PROMISE HOOK] ज़्यादातर बिज़नेस में ट्रैफ़िक की समस्या नहीं होती—उनके ऑफ़र मॉडल में समस्या होती है [CLAIM-1]। आज हम उन चार लीवर्स को समझेंगे जो बिना विज्ञापन ख़र्च बढ़ाए मुनाफ़े को कई गुना बढ़ा देते हैं।
[01:45 - THE EQUATION] स्क्रीन पर मौजूद इन चार पॉइंट्स को देखिए [INFOGRAPHIC-1]: परिणाम और भरोसे को बढ़ाएँ, जबकि समय और मेहनत को कम से कम कर दें।
[05:30 - TACTICAL CLOSING] दस अलग चीज़ें करने के बजाय उस एक रुकावट को ठीक करें जो आपकी ग्रोथ को रोक रही है।
    `,
    realTimeTransitions: [
      "Here is the exact math behind why that happens [CLAIM-1]...",
      "Break this down into four measurable variables [INFOGRAPHIC-1]..."
    ],
    englishMixExamples: ["unit economics", "value equation", "time delay", "bottleneck"]
  }),

  navalravikant: createCreatorPack({
    creatorId: "navalravikant",
    creatorName: "Naval Ravikant",
    blueprintId: "naval_first_principles_wealth_wisdom",
    blueprintTitle: "1. First-Principles Leverage, Wealth & Philosophy",
    aggressionScore: "Calm Aphoristic Clarity",
    aggressionAndTone: "Distilled, meditative, first-principles aphorisms on wealth, leverage, and peace of mind",
    signatureWordingAndPacing:
      "Short, timeless sentences; contrasts status games with wealth creation; defines specific knowledge, leverage, and internal peace.",
    topicTriggers: ["wealth", "leverage", "specific knowledge", "happiness", "peace", "philosophy", "freedom", "compounding", "startup"],
    videoTitle: "First Principles of Leverage & Inner Clarity | Naval Ravikant Style",
    topicDomain: "Wealth Creation, Leverage, Judgment & Philosophical Clarity",
    englishTranscript: `
[00:00 - APHORISTIC HOOK] Seek wealth, not money or status. Wealth is having assets that earn while you sleep [CLAIM-1].
[01:45 - LEVERAGE & JUDGMENT] In an age of infinite leverage through code and media [INFOGRAPHIC-1], clear judgment matters far more than raw hours worked.
[05:00 - MEDITATIVE CLOSING] A calm mind, a fit body, and a house full of love cannot be bought—they must be cultivated from within.
    `,
    urduTranscript: `
[00:00 - APHORISTIC HOOK] صرف پیسے یا دکھاوے کے پیچھے مت بھاگیں، بلکہ حقیقی ویلتھ بنائیں—یعنی ایسے اثاثے جو اس وقت بھی کام کریں جب آپ سو رہے ہوں [CLAIM-1]۔
[01:45 - LEVERAGE & JUDGMENT] کوڈ اور میڈیا کے اس دور میں [INFOGRAPHIC-1]، گھنٹوں کی مزدوری سے زیادہ آپ کے ایک درست فیصلے کی قیمت ہوتی ہے۔
[05:00 - MEDITATIVE CLOSING] پرسکون ذہن، صحت مند جسم اور محبت بھرا گھر بازار سے خریدے نہیں جا سکتے—انہیں انسان کو اپنے اندر سے تعمیر کرنا پڑتا ہے۔
    `,
    romanUrduTranscript: `
[00:00 - APHORISTIC HOOK] Sirf paise ya status games ke peeche mat bhagein, balki asli wealth banayein—yani aise assets jo tab bhi kaam karein jab aap so rahe hon [CLAIM-1].
[01:45 - LEVERAGE & JUDGMENT] Code aur media ke is infinite leverage wale dor mein [INFOGRAPHIC-1], ghanton ki mehnat se zyada aapki clear judgment ki value hoti hai.
[05:00 - MEDITATIVE CLOSING] Ek shant dimagh, fit body aur sukoon bhara ghar khareeda nahi ja sakta—isay andar se banana parta hai.
    `,
    hindiTranscript: `
[00:00 - APHORISTIC HOOK] सिर्फ़ पैसे या दिखावे के पीछे मत भागें, बल्कि असली वेल्थ बनाएँ—यानी ऐसे एसेट्स जो तब भी काम करें जब आप सो रहे हों [CLAIM-1]।
[01:45 - LEVERAGE & JUDGMENT] कोड और मीडिया के इस दौर में [INFOGRAPHIC-1], घंटों की मेहनत से ज़्यादा आपके एक सही फ़ैसले की क़ीमत होती है।
[05:00 - MEDITATIVE CLOSING] शांत मन, स्वस्थ शरीर और प्रेम से भरा घर बाज़ार से ख़रीदे नहीं जा सकते—उन्हें भीतर से बनाना पड़ता है।
    `,
    realTimeTransitions: [
      "Look at this from first principles [CLAIM-1]...",
      "All returns in life come from compound interest [INFOGRAPHIC-1]..."
    ],
    englishMixExamples: ["specific knowledge", "infinite leverage", "compound interest", "status games"]
  }),

  jordanpeterson: createCreatorPack({
    creatorId: "jordanpeterson",
    creatorName: "Jordan Peterson",
    blueprintId: "peterson_order_chaos_archetype",
    blueprintTitle: "1. Psychological Depth, Responsibility & Archetypal Meaning",
    aggressionScore: "Clinical & Existential Gravity",
    aggressionAndTone: "Intense clinical psychology, evolutionary biology, and mythological/existential responsibility",
    signatureWordingAndPacing:
      "Builds from a concrete behavioral observation up to the eternal tension between Order and Chaos, calling the listener to voluntary responsibility.",
    topicTriggers: ["meaning", "responsibility", "chaos", "order", "shadow", "archetype", "mythology", "discipline", "virtue", "suffering"],
    videoTitle: "Confronting Chaos Through Voluntary Responsibility | Jordan Peterson Style",
    topicDomain: "Clinical Psychology, Existential Meaning & Personal Responsibility",
    englishTranscript: `
[00:00 - EXISTENTIAL HOOK] When you avoid the dragon standing directly in front of you, it doesn't disappear—it grows larger in the dark while your own capacity to face it shrinks [CLAIM-1].
[02:00 - CLINICAL & BIOLOGICAL MECHANISM] Neurologically, voluntary confrontation activates approach circuitry rather than paralyzing threat responses [INFOGRAPHIC-1].
[06:00 - CLOSING] Pick up the heaviest burden you can bear, tell the truth, and put your own household in order first.
    `,
    urduTranscript: `
[00:00 - EXISTENTIAL HOOK] جب آپ اپنے سامنے کھڑے چیلنج سے آنکھیں چراتے ہیں تو وہ خطرہ کم نہیں ہوتا—بلکہ اندھیرے میں اور بڑا ہوتا جاتا ہے جبکہ آپ کا اپنا حوصلہ سکڑنے لگتا ہے [CLAIM-1]۔
[02:00 - CLINICAL & BIOLOGICAL MECHANISM] نفسیاتی اور نیورولوجیکل تحقیق بتاتی ہے کہ جب انسان خود آگے بڑھ کر مشکل کا سامنا کرتا ہے تو اس کا دماغ خوف کے بجائے ہمت کا راستہ چنتا ہے [INFOGRAPHIC-1]۔
[06:00 - CLOSING] زندگی کا اصل معنی آسان راستے میں نہیں، بلکہ اپنی ذمہ داری کا بوجھ خود اٹھانے میں چھپا ہے۔
    `,
    romanUrduTranscript: `
[00:00 - EXISTENTIAL HOOK] Jab aap apne samne khade challenge se aankhein churate hain toh woh khatra kam nahi hota—balki andhere mein aur bada hota jata hai jabke aapki apni himmat kamzor parne lagti hai [CLAIM-1].
[02:00 - CLINICAL & BIOLOGICAL MECHANISM] Clinical psychology aur neuroscience batati hai ke jab insaan khud aage barh kar mushkil ka samna karta hai toh uska brain fear ke bajaye growth mode mein aata hai [INFOGRAPHIC-1].
[06:00 - CLOSING] Zindagi ka asli maqsad aasan raste mein nahi, balki apni zimmedari ka bojh khud uthane mein hai.
    `,
    hindiTranscript: `
[00:00 - EXISTENTIAL HOOK] जब आप अपने सामने खड़ी चुनौती से आँखें चुराते हैं तो वह ख़तरा कम नहीं होता—बल्कि अंधेरे में और बड़ा होता जाता है जबकि आपकी अपनी हिम्मत कमज़ोर पड़ने लगती है [CLAIM-1]।
[02:00 - CLINICAL & BIOLOGICAL MECHANISM] मनोविज्ञान और न्यूरोसाइंस बताती है कि जब इंसान खुद आगे बढ़ कर मुश्किल का सामना करता है तो उसका दिमाग़ डर के बजाय साहस का रास्ता चुनता है [INFOGRAPHIC-1]।
[06:00 - CLOSING] जीवन का असली अर्थ आसान रास्ते में नहीं, बल्कि अपनी ज़िम्मेदारी का बोझ खुद उठाने में है।
    `,
    realTimeTransitions: [
      "And that is no trivial matter psychologically [CLAIM-1]...",
      "Look at what happens at the neurobiological level [INFOGRAPHIC-1]..."
    ],
    englishMixExamples: ["voluntary responsibility", "order and chaos", "clinical psychology"]
  }),

  imangadzhi: createCreatorPack({
    creatorId: "imangadzhi",
    creatorName: "Iman Gadzhi",
    blueprintId: "iman_monk_mode_digital_operator",
    blueprintTitle: "1. Digital Operator Protocols, Monk Mode & High-Income Skills",
    aggressionScore: "Cinematic Entrepreneurial Polish",
    aggressionAndTone: "Sleek, contrarian, protocol-driven focus on digital leverage and disciplined routines",
    signatureWordingAndPacing:
      "Contrasts outdated industrial habits against modern high-income digital execution and non-negotiable Monk Mode protocols.",
    topicTriggers: ["monk mode", "smma", "agency", "high income", "digital nomad", "dropshipping", "protocol", "routine", "online business"],
    videoTitle: "The Monk Mode Protocol & High-Income Focus | Iman Gadzhi Style",
    topicDomain: "Digital Entrepreneurship, High-Income Skills & Focus Protocols",
    englishTranscript: `
[00:00 - CONTRARIAN HOOK] Most people spend an entire year wondering why their life hasn't changed, yet they cannot protect even ninety minutes of uninterrupted deep work a day [CLAIM-1].
[02:00 - THE PROTOCOL] Look at the difference between reactive distraction and a structured three-pillar Monk Mode protocol [INFOGRAPHIC-1].
[05:30 - CLOSING] Audit your environment, lock in your protocol for the next thirty days, and let the execution speak for itself.
    `,
    urduTranscript: `
[00:00 - CONTRARIAN HOOK] زیادہ تر لوگ پورا سال یہ سوچتے رہتے ہیں کہ ان کی زندگی کیوں نہیں بدل رہی، لیکن وہ دن میں نوے منٹ بھی مکمل فوکس کے ساتھ کام نہیں کر پاتے [CLAIM-1]۔
[02:00 - THE PROTOCOL] اس چارٹ میں دیکھیے کہ بغیر سسٹم کے محنت کرنے اور ایک منظم پروٹوکول کے ساتھ کام کرنے میں کتنا بڑا فرق ہے [INFOGRAPHIC-1]۔
[05:30 - CLOSING] اپنے ماحول کو بدلیں، اگلے تیس دنوں کے لیے اپنا فوکس لاک کریں اور نتائج کو خود بولنے دیں۔
    `,
    romanUrduTranscript: `
[00:00 - CONTRARIAN HOOK] Zyadatar log poora saal yeh sochte rehte hain ke unki life kyun nahi badal rahi, lekin woh din mein 90 minutes bhi uninterrupted deep work nahi kar paate [CLAIM-1].
[02:00 - THE PROTOCOL] Is chart mein dekhiye ke random hustle aur ek structured Monk Mode protocol mein kitna bada farq hai [INFOGRAPHIC-1].
[05:30 - CLOSING] Apne environment ko audit karein, agle 30 din ke liye apna protocol lock karein aur execution ko khud bolne dein.
    `,
    hindiTranscript: `
[00:00 - CONTRARIAN HOOK] ज़्यादातर लोग पूरा साल यह सोचते रहते हैं कि उनकी ज़िंदगी क्यों नहीं बदल रही, लेकिन वे दिन में 90 मिनट भी पूरे फ़ोकस के साथ काम नहीं कर पाते [CLAIM-1]।
[02:00 - THE PROTOCOL] इस चार्ट में देखिए कि बिना सिस्टम की मेहनत और एक व्यवस्थित प्रोटोकॉल में कितना बड़ा फ़र्क़ है [INFOGRAPHIC-1]।
[05:30 - CLOSING] अपने माहौल को बदलें, अगले 30 दिनों के लिए अपना प्रोटोकॉल लॉक करें और परिणामों को खुद बोलने दें।
    `,
    realTimeTransitions: [
      "Here is the exact protocol that separates operators from spectators [CLAIM-1]...",
      "Compare these two daily trajectories side by side [INFOGRAPHIC-1]..."
    ],
    englishMixExamples: ["Monk Mode protocol", "deep work", "high-income skill"]
  }),

  sharanhegde: createCreatorPack({
    creatorId: "sharanhegde",
    creatorName: "Sharan Hegde",
    blueprintId: "sharan_personal_finance_money_hacks",
    blueprintTitle: "1. Personal Finance Math, Tax Loopholes & Wealth Hacks",
    aggressionScore: "Relatable Skits & Sharp Financial Math",
    aggressionAndTone: "Witty, numbers-first consumer finance, tax optimization, and middle-class money traps",
    signatureWordingAndPacing:
      "Opens with a relatable salary/EMI/tax mistake, runs the exact compounding or tax-bracket numbers on screen, and gives a clear step-by-step money rule.",
    topicTriggers: ["credit card", "mutual fund", "sip", "emi", "tax", "loophole", "money hack", "insurance", "loan", "finance", "salary", "rent", "investing"],
    videoTitle: "The Hidden Math Behind Everyday Money Decisions | Sharan Hegde Style",
    topicDomain: "Personal Finance, Tax Planning, Investing & Consumer Math",
    englishTranscript: `
[00:00 - RELATABLE MONEY HOOK] You think that "zero-cost" offer or default tax bracket is saving you money—until you actually run the hidden spreadsheet math [CLAIM-1]!
[01:50 - THE SPREADSHEET BREAKDOWN] Look at this side-by-side calculation over ten years [INFOGRAPHIC-1]: a tiny two-percent fee difference quietly eats lakhs of rupees from your compounding corpus.
[05:30 - CLOSING] Before you sign your next financial form, check these three numbers first—and follow for more practical money math!
    `,
    urduTranscript: `
[00:00 - RELATABLE MONEY HOOK] آپ کو لگتا ہے کہ یہ آفر آپ کے پیسے بچا رہی ہے—لیکن جیسے ہی آپ اس کے پیچھے کا اصل حساب لگاتے ہیں، پوری کہانی بدل جاتی ہے [CLAIM-1]!
[01:50 - THE SPREADSHEET BREAKDOWN] اس دس سال کے کیلکولیشن چارٹ کو دیکھیے [INFOGRAPHIC-1]: صرف دو فیصد کی چھپی ہوئی فیس آپ کی کمپاؤنڈنگ سے لاکھوں روپے خاموشی سے نکال لیتی ہے۔
[05:30 - CLOSING] اگلا مالیاتی فیصلہ لینے سے پہلے ان تین نمبروں کو ضرور چیک کریں!
    `,
    romanUrduTranscript: `
[00:00 - RELATABLE MONEY HOOK] Aapko lagta hai ke yeh zero-cost offer aapke paise bacha rahi hai—lekin jaise hi aap iske peeche ka asli spreadsheet math lagate hain, poori kahani palat jati hai [CLAIM-1]!
[01:50 - THE SPREADSHEET BREAKDOWN] Is 10-year calculation chart ko dekhiye [INFOGRAPHIC-1]: sirf 2 percent ka hidden charge aapke compounding corpus se lakhon rupaye chupke se nikaal leta hai.
[05:30 - CLOSING] Apna agla financial decision lene se pehle in teen numbers ko zaroor check karein!
    `,
    hindiTranscript: `
[00:00 - RELATABLE MONEY HOOK] आपको लगता है कि यह ऑफ़र आपके पैसे बचा रहा है—लेकिन जैसे ही आप इसके पीछे का असली गणित लगाते हैं, पूरी कहानी पलट जाती है [CLAIM-1]!
[01:50 - THE SPREADSHEET BREAKDOWN] इस 10 साल के कैलकुलेशन चार्ट को देखिए [INFOGRAPHIC-1]: सिर्फ़ 2 प्रतिशत की छुपी हुई फ़ीस आपके कंपाउंडिंग कॉर्पस से लाखों रुपये चुपके से निकाल लेती है।
[05:30 - CLOSING] अपना अगला वित्तीय फ़ैसला लेने से पहले इन तीन नंबरों को ज़रूर चेक करें!
    `,
    realTimeTransitions: [
      "Let's run the actual numbers on the spreadsheet [CLAIM-1]...",
      "Look at how this compounds over ten years [INFOGRAPHIC-1]..."
    ],
    englishMixExamples: ["spreadsheet math", "compounding corpus", "hidden charges"]
  })
};

export default OTHER_CREATOR_TRANSCRIPT_PACKS;
