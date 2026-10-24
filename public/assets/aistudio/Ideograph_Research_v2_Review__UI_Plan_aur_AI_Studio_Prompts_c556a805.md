# Ideograph Research v2: Review, UI Plan aur AI Studio Prompts

Talha ke liye | 24 Oct 2026 | Pasted upgrade prompt ka review + naya research system

## 1. Verdict

Tumhara andaza sahi hai. Pasted prompt jaisa hai waisa use mat karo: lagbhag **35% rakhne layak, 65% dobara banana chahiye**.

**Rakhne layak:**

- Step 1 me chhota topic bar + alag 'video me kya hona chahiye' box (confusion sach me wahi hai)
- Angle Finder (topic dalo, 5 angles milen)
- Script se pehle research dikhana
- Repetition ka rule

**Dobara banana hai:**

- Research ab bhi ek hi prompt hai, isliye 2-3 items aate hain
- Modes aur toggles ek hi kaam do jagah karte hain
- Creator names (Raftar, Dhruv, Nitish) research UI me kisi kaam ke nahi
- Topic aur country hard-coded hain (water, Pakistan, mafia)
- Duration ka research se koi taalluq nahi
- User apni books, links, files nahi de sakta
- Research edit nahi ho sakti, aur koi verification nahi

**Zaroori warning:** pasted file ke 'live research' claims (Raftar video ke timestamps, Aryan ke quotes, 9 Oct ka experiment, NCCIA arrest) kisi aur AI ne likhe hain. Maine unhe verify nahi kiya. Raftar team ko DM karne se pehle video khud dekho aur har timestamp aur quote khud check karo. Ek galat quote poora pitch kharab kar deta hai. Aur yahi masla tumhari app ko bhi hoga agar verification na ho.

## 2. Prompt asal me kya banata hai

| Screen par jo likha hai | Prompt me asal kaam | Masla |
| --- | --- | --- |
| Raftar TV / Dhruv Rathee / Nitish Rajput / ThynkWhy Production Standard | Sirf heading | Research par koi asar nahi. Creator ka naam writing style ka masla hai, research ka nahi. Simple user ko meaning nahi pata |
| 4-Layer Agency Research Engine & Source Harvester | Sirf heading | Bhaari alfaaz (agency, harvester, engine), user ko kuch samajh nahi aata |
| Aryan's Zero-Repetition Law Active | Writer ko ek instruction | Insider naam UI me. Koi check nahi hota ke repetition hui ya nahi |
| Select Specialized Research Engine Mode (4 Modes) | 4 radio buttons | Mode 4 = sab toggles ON, Mode 1/2/3 = ek ek toggle. Wahi kaam do jagah |
| Layer 1 to 4 toggles | 4 true/false values | Har layer ka minimum output define nahi. True/false se model ko nahi pata kitna dhoondna hai |
| Pre-Script 5-Part Agency Research Dossier | Preview button | Naam me 5 parts, prompt me sirf 4 (Book, Local, Citizen, Global). 5th (scene plan) kahin define nahi |
| Generate & Review Research Dossier | Ek button | Review likha hai par edit nahi: book badalna, link dalna, fact hatana, kuch nahi |
| Short topic + criteria + angles | Step 1 redesign | Yeh hissa acha hai. Bas angles topic ke hisaab se adapt hon, har topic par mafia lens na lage |

## 3. Research 2-3 cheezein kyun deta hai

1. **Ek call, ek jawab.** Ek grounded call me model 2-4 search karke jaldi likh deta hai. 5 minute ki documentary ko 15-20 facts chahiye.
2. **Chhota schema.** Output format me 1 book, 1 stat, 2 voices jitni jagah ho, to output utna hi aata hai.
3. **Target nahi.** App ko pata hi nahi ke 5 minute ko kitne facts chahiye, isliye model jaldi ruk jata hai.
4. **Pages padhe nahi jaate.** Sirf search snippets milte hain, asal article ka text nahi.
5. **Verification nahi.** Book, number ya link galat ho to app pakad nahi sakti.
6. **Kuch wade possible nahi.** Search se Reddit comments poore nahi milte aur Instagram/TikTok Reels model dekh nahi sakta. Is layer ko Public discussion kaho, result ko unverified label do, aur user ko apna text paste karne do.
7. **Topic aur country hard-coded.** Water, Pakistan, mafia wala lens har topic par chipka hai. 'History of tea' ya 'AI jobs in UAE' par ulta chalega.

## 4. Fuzool alfaaz: kya hatao, kya likho

User ko sirf 3 cheezein samajhni chahiye: kya dhoondna hai, kitna gehra, kahan se.

| Abhi | Naya (simple) |
| --- | --- |
| Production Standard (4 creator names) | Hata do. Creator sirf Writing Style dropdown me rahe |
| 4-Layer Agency Research Engine & Source Harvester | Research |
| Aryan's Zero-Repetition Law Active | No-repeat check: ON |
| Select Specialized Research Engine Mode | Research depth: Quick / Standard / Deep |
| Mode 1, 2, 3, 4 | Hata do (toggles kaafi hain) |
| Layer 1: Books, Historical Parables & Archival Records | Books & history |
| Layer 2: Pakistani Data, Reports (PIDE/PBS/Dawn) & Rupee Economics | Official data & reports (region ke hisaab se) |
| Layer 3: Reddit Threads & Citizen Ground-Reality Voices | Public discussion (forums, social) |
| Layer 4: Global Scientific Studies & Counter-Arguments | Global studies & the other side |
| Pre-Script 5-Part Agency Research Dossier | Review research before writing |
| Generate & Review Research Dossier | Start research |
| Lambi grey lines (PIDE, PBS, HRCP...) | Ek chhoti line + (i) icon, examples uske andar |

Rule: **research = kaunse facts, style = kaise bolna hai.** Creator ka naam sirf style me aaye.

## 5. Naya flow (screens)

**Step 1: Idea**

- Topic: ek line (max 160 chars)
- Button 'Find angles': 5 angle cards (multi-select). Har card: title, 1 line promise, 3 sawal. AI in lenses me se topic ke hisaab se chunta hai: kaun kamata hai, aam log par asar, system kyun fail hua, science/evidence, history, solutions, future
- Box 'Video me kya hona chahiye': angle click par auto-append, user edit kar sakta hai
- Optional: apne notes paste karo

**Step 2: Format**

- Duration chips: 1, 2, 3, 5, 8, 10, 15 min + custom. **Required.** Isi se Step 3 unlock hota hai
- Narration language: Roman Urdu / Urdu / English / Hinglish
- Focus region: dropdown (Pakistan default, other countries, Global)
- Writing style: creator dropdown (yahin, sirf yahin)
- Live hint: 'Is video ko lagbhag 15 verified facts chahiye (about 700 words)'

**Step 3: Research** (duration select hone ke baad hi dikhe)

- Depth: Quick (\~1 min) / Standard (\~2 min) / Deep (\~3 min). Default Standard
- Sources toggles (sab ON): Books & history | Official data & reports | News & investigations | Public discussion | Global studies & the other side
- **My Sources** panel (section 8): files, links, paste, book search
- Button 'Start research' + progress (stage name, sources read, facts found per type)

**Step 4: Review research** (sab kuch editable)

- Tabs: Facts | Books & quotes | Public voices | My sources | Gaps
- Har card par Approve / Reject / Pin / Edit / Find more like this
- Coverage meter: '13 of 15 facts', plus type-wise bars
- Footer: 'Research more', 'Add my own fact', 'Lock & write script'

**Step 5: Script**

- Beat plan dikhao (hook, context, cause, evidence, human story, other side, consequence, way forward, close), user order badal sake
- Generate. Baad me 'Check report': repetition score, facts used, uncited numbers, auto-fix

## 6. Buttons aur unka kaam

| Button | Kahan | Kya karta hai | Output |
| --- | --- | --- | --- |
| Find angles | Step 1 | Topic + region par 5 angles | 5 cards |
| Continue | Step 2 | Duration set na ho to disabled | Step 3 unlock |
| Start research | Step 3 | Pipeline (section 7) chalata hai | Dossier, target x 1.3 cards |
| Cancel | Progress | Rokta hai, ab tak ka result rakhta hai | Partial dossier |
| Upload files | My Sources | File padh kar insight card banata hai | Summary, facts, quotes |
| Add links | My Sources | Har link padhta hai | Insight card per link |
| Search books | My Sources | Google Books / Open Library me dhoondta hai | Results list |
| Add book | Result row | Reference me daalta hai | Book card |
| Approve / Reject / Pin | Card | Status badalta hai. Pin = script me zaroor aaye | Status badge |
| Edit | Card | Claim ya number khud sahi karo | Card 'edited by you' |
| Find more like this | Card | Isi point par 3-5 naye cards | New cards |
| Research more: \[gap\] | Gaps tab | Sirf us type ka ek aur round | New cards |
| Add my own fact | Facts tab | Source ke saath manual card | User card |
| Lock & write script | Footer | Approved + pinned cards writer ko bhejta hai | Step 5 |
| Check report | After script | Repetition aur citation check | Report + auto-fix |

## 7. Research logic (backend me kya chalna chahiye)

Model **train karne ki zaroorat nahi**. Strong Gemini model + Google Search aur URL reading tools + strict schema + verification kaafi hai. Do models: **FAST** (query plan, chhote kaam) aur **STRONG** (fact extraction, verification, script). Dono ek hi API key se. Model names ek hi jagah constants me rakho.

**Duration se target (rule: facts = minutes x 3, harvest = facts x 1.3)**

| Video | Narration words (\~140/min) | Facts chahiye | Harvest karo | Search queries |
| --- | --- | --- | --- | --- |
| 2 min | 280 | 6 | 8 | \~8 |
| 3 min | 420 | 9 | 12 | \~10 |
| 5 min | 700 | 15 | 20 | \~16 |
| 8 min | 1120 | 24 | 32 | \~22 |
| 10 min | 1400 | 30 | 39 | \~26 |
| 15 min | 2100 | 45 | 59 | \~32 |

Coverage minimum har 5 minute par: official data 3, news 3, books/history 1, public voices 2 (unverified label), global comparison 2, other side 1. Quick depth me targets x 0.6, Deep me x 1.5.

**Pipeline**

1. **Brief:** topic, criteria, angles, duration, language, region, toggles, user sources. Targets calculate hote hain (AI nahi)
2. **Query planner (FAST, search nahi):** queries ki list, har ek par type aur beat ka tag. Region ke hisaab se local language me bhi queries. Region ke trusted domains ek chhote config me
3. **Harvest (Google Search grounding):** queries parallel, ek waqt me 4. Har jawab ke saath grounding sources (title + url) save karo
4. **Deep read:** top 6-12 unique pages (aur user ke sab links) URL tool se padho. Uploaded files File API se
5. **Fact extraction (STRONG, JSON):** sirf padhe hue text se cards. Har card par source url + chhota verbatim snippet (max 25 words). Snippet ya url na ho to card automatically reject
6. **Verify & dedupe:** duplicates merge. Number me farq ho to 'conflict' badge dono values ke saath. Do sources = high, ek source = medium. Books Google Books / Open Library se check (exist, author, year). Na mile to unverified, default me hidden
7. **Gap check:** quotas se compare. Kam type par naye queries ke saath ek aur round (max 2)
8. **Dossier save** aur Step 4 par bhejo

Time: Standard me \~1-2 min. Progress UI zaroor, cancel zaroor, queries ka cache, 429/503 par retry with backoff. Agar tumhare model me JSON mode aur search tool saath nahi chalte to do call karo: pehle search wali call (text), phir bina tool ke doosri call jo usay JSON bana de.

URL ka rule: **model ke likhe URL par bharosa nahi.** Sirf grounding metadata ya user ki file/link ka source valid hai.

**FactCard:** id, type, claim (1 sentence), figure (value, unit, year), snippet, source (title, publisher, url, fileId, page), confidence, conflict, status (suggested/approved/rejected/pinned), editedByUser, beat.

## 8. My Sources: apni books, links, files

**Upload:** PDF, DOCX, TXT, MD (max 5 files, har ek \~20 MB tak). Har file par analysis:

- 5 line summary
- 10 sabse mazboot facts (page ke saath agar nazar aaye)
- Max 8 quotes, har ek 25 words se kam, page/chapter ke saath
- Key arguments, naam, tareekhein
- 'Kahan fit hoga': kaunsa beat/angle

**Links:** ek saath kai links paste karo. Har link padha jaye. Paywall ya block ho to 'padh nahi saka, text paste karo' dikhao.

**Paste text:** article ya chapter ka text seedha.

**Book search:** title/author likho, Google Books (fallback Open Library) se results: cover, author, saal, description, 'Add as reference'. **Zaroori rule:** jis book ka sirf naam/description mila, uska quote AI ko likhne mat do. Us book card par 'summary-level only. Quotes ke liye PDF upload karo ya chapter paste karo' likha aaye. Warna AI jhooti quotes banayega.

**Quotes Library:** sab sources ke quotes ek jagah, filter, pin, 'Insert in beat'. Script me quotes chhote rahen aur baqi paraphrase. User sirf wohi files upload kare jin ka usay haq ho.

## 9. Script likhne ke rules (writer ko dene wale)

Writer ko sirf yeh milta hai: brief, beat plan, approved + pinned cards (ID ke saath), writing style guide.

1. **Hook (pehle 15 sec):** sabse hairaan karne wala approved fact + ek sawal
2. **Har beat ka ek kaam** hota hai (setup, cause, evidence, human story, other side, consequence, way forward, close)
3. **Har 40-50 words me kuch naya:** naya fact ID, scene ya cause-effect. Warna paragraph hatao
4. **Number sirf dossier se.** Dossier me nahi to likho \[NEEDS DATA: kya chahiye\] aur invent mat karo
5. **Repetition band:** ek idea ko 4-5 alag jumlon me mat phailao. Jaan-boojh kar callback ho to usay mark karo
6. **Books/parables:** max 1-2, argument se relevant, quote 25 words se kam aur sirf dossier se
7. **Public voices** ko 'online discussions me log kehte hain' ki tarah likho, verified fact ki tarah nahi
8. **Other side:** agar topic contested hai to kam az kam ek munsif jawabi point
9. **Filler openers mana:** 'Aaj hum baat karenge', 'Zindagi ek safar hai' jaisi baatein bina fact ke nahi
10. **Closing:** nateeja + ek concrete agla qadam. Philosophical dhuaan nahi

**QA pass (code me, prompt me nahi):** repetition detector (sentence n-gram + ek chhota model check), har digit sequence ka dossier se match, fact density (\~45 words par ek fact), flagged paragraphs ka auto-rewrite (max 2 rounds), aur Check report.

## 10. AI Studio ko dene wale prompts

Ek saath nahi, **3 phases me** do. Har phase ke baad test karo (section 11), phir agla. Har phase ke shuru me yeh header paste karo:

```
CONTEXT
Ideograph is a React + TypeScript AI scripting app built on the Gemini API. I am upgrading its research flow. Do NOT modify /creators/*.ts or /creator-intelligence/*.ts (protected). Keep existing features and exported function names working. Keep the current design language (ShortsClipperStudio.tsx is the visual reference), mobile-first, clean bold fonts, plain UI text with no jargon and no creator names outside the Writing Style dropdown. Return full updated files, not snippets. Use the models already configured in geminiService.ts; define FAST_MODEL and STRONG_MODEL constants in one place and never hardcode model names elsewhere. Follow the current @google/genai SDK docs for Google Search grounding, URL context and file upload.
```

### Phase 1: Flow, labels, types

````
PHASE 1: RESTRUCTURE THE CREATION FLOW

Rebuild CreationForm.tsx into 5 steps: 1 Idea, 2 Format, 3 Research, 4 Review research, 5 Script. Keep the main generation logic working.

STEP 1 IDEA: single-line Topic input (max 160 chars). Button 'Find angles' calls analyzeTopicWithGemini(topic, region) and returns 5 angles chosen from these lenses to fit the topic (never force the same lens on every topic): who profits, effect on ordinary people, why the system failed, science and evidence, history, solutions, future. Each angle card has: title, one-line promise, 3 key questions. Cards are multi-select; selecting appends them to a textarea labelled 'What should be inside this video' (user can edit). Optional notes paste box.

STEP 2 FORMAT: duration chips 1, 2, 3, 5, 8, 10, 15 min plus custom (REQUIRED, Continue stays disabled without it), narration language (Roman Urdu, Urdu, English, Hinglish), focus region dropdown (default Pakistan, other countries, Global), Writing Style dropdown (the only place creator names appear). Show a live hint: 'About {minutes*3} verified facts needed (about {minutes*140} words)'.

STEP 3 RESEARCH: appears only after duration is set. Depth selector Quick / Standard / Deep (default Standard, with estimated time). Five source toggles, all ON by default: Books & history, Official data & reports, News & investigations, Public discussion, Global studies & the other side. Each has a one-line description and an (i) icon with examples. A 'My Sources' section (built in Phase 3, render a placeholder now). Button 'Start research' (wired in Phase 2).

REMOVE the old research modes, the layer toggles, any text mentioning Raftar, Dhruv, Nitish, ThynkWhy or Aryan outside the Writing Style dropdown, and any water/Pakistan-specific hard-coded examples from prompts and UI (placeholders may use examples).

In types.ts add:

```ts
type FactType = 'books_history' | 'official_data' | 'news' | 'public_voices' | 'global_counter' | 'user_source';
type CardStatus = 'suggested' | 'approved' | 'rejected' | 'pinned';
interface SourceRef { title: string; publisher?: string; url?: string; fileId?: string; page?: string }
interface FactCard { id: string; type: FactType; claim: string; figure?: { value: string; unit?: string; year?: string }; snippet?: string; source: SourceRef; confidence: 'high' | 'medium' | 'low'; conflict?: string; status: CardStatus; editedByUser?: boolean; beat?: string }
interface QuoteCard { id: string; text: string; speaker?: string; source: SourceRef; note?: string; status: CardStatus }
interface BookRef { id: string; title: string; author: string; year?: string; why: string; verified: boolean; depth: 'metadata_only' | 'user_text'; quotes: QuoteCard[] }
interface ResearchConfig { depth: 'quick' | 'standard' | 'deep'; durationMin: number; region: string; language: string; sources: { booksHistory: boolean; officialData: boolean; news: boolean; publicDiscussion: boolean; globalAndCounter: boolean } }
interface Dossier { facts: FactCard[]; books: BookRef[]; quotes: QuoteCard[]; gaps: { type: FactType; have: number; need: number }[]; targets: { facts: number; harvest: number } }
```

Add a pure function computeTargets(durationMin, depth) in a new file services/researchTargets.ts: facts = minutes*3, harvest = ceil(facts*1.3), Quick multiplies by 0.6, Deep by 1.5. Add per-type minimums per 5 minutes: official 3, news 3, books_history 1, public_voices 2, global_counter 3 (2 global + 1 other side).
````

### Phase 2: Research engine + review screen

```
PHASE 2: RESEARCH ENGINE AND EDITABLE REVIEW

Create services/researchService.ts exporting runResearch(brief, config, onProgress, signal): Promise<Dossier>. Pipeline:

1. Targets from computeTargets.
2. Query planner (FAST_MODEL, no tools): returns JSON array of {type, beat, query, language}. Count about 8 + 2*minutes queries. Include local-language queries for the chosen region and region-trusted domains from a small config map (region -> domains), plus site:reddit.com style queries only for public_voices.
3. Harvest (STRONG_MODEL or FAST_MODEL with Google Search grounding): run queries in parallel, max 4 at once, retry 3 times with exponential backoff on 429/503. Keep each answer text AND groundingMetadata sources (title + url). If this model cannot combine JSON output with the search tool, do two calls: grounded text call, then a no-tool call that converts it to JSON.
4. Deep read: take the top 6-12 unique source URLs plus every user link and read them with the URL context tool; read uploaded files via File API.
5. Fact extraction (STRONG_MODEL, JSON schema = FactCard[]): use ONLY the retrieved text. Each card needs source.url from grounding or user input (never a URL the model typed) and a verbatim snippet of at most 25 words. Drop any card without both.
6. Verify and dedupe: merge duplicates; if the same figure differs across sources set conflict to a short note with both values; two independent sources = high, one = medium. For books, check Google Books API (volumes?q=intitle:X+inauthor:Y); if not found set verified=false (hidden by default behind an 'Unverified' toggle).
7. Gap check: compare per-type counts to the minimums; for short types run one more targeted round (max 2 rounds total).
8. onProgress({stage, done, total, sourcesRead, factsByType}) at every step. Support AbortSignal; on cancel return what exists.
9. Cache by hash of (query, region, language) in memory for the session.

Build components/research/ResearchStep.tsx (Step 3 UI, Start research button, progress stepper with live counters, Cancel) and components/research/DossierReview.tsx (Step 4): tabs Facts | Books & quotes | Public voices | My sources | Gaps. Every card shows claim, figure, source link (opens new tab), confidence and conflict badges, and buttons Approve, Reject, Pin, Edit (inline), Find more like this (runs 1 targeted query and adds 3-5 cards). Public voices cards carry a visible 'Unverified' label. A CoverageMeter at top shows 'approved+pinned / needed' overall and per type. Footer buttons: Research more (per gap), Add my own fact (manual card with source field), Lock & write script. Default all suggested cards to approved except low-confidence, conflict and unverified ones. State lives in one dossier object passed to the writer.
```

### Phase 3: My Sources + writer + QA

```
PHASE 3: MY SOURCES, SCRIPT RULES, QA

Create services/sourceService.ts and components/research/MySourcesPanel.tsx (used in Step 3 and the 'My sources' tab in Step 4).

UPLOAD: PDF, DOCX, TXT, MD, max 5 files. Upload with the Gemini File API (convert DOCX to text with mammoth if needed). analyzeSource() returns JSON: summary (5 lines), up to 10 FactCards (type user_source, with page if visible), up to 8 QuoteCards (each under 25 words, with page or chapter), key arguments, names and dates, and fitSuggestions (which beat or angle each item helps). Show status per file: uploading, reading, done, failed.
LINKS: multi-line paste box; read each with URL context; if unreadable show 'Could not read this link, paste the text instead'.
PASTE TEXT: textarea, analyzed like a file.
BOOK SEARCH: input -> Google Books API (fallback Open Library) -> result rows with cover, author, year, description and an 'Add as reference' button. A book added this way is BookRef.depth = 'metadata_only': the AI may summarize what the description and search results say but MUST NOT generate quotes for it; show 'Summary-level only. Upload the PDF or paste a chapter for quotes'. If the user later uploads or pastes its text, upgrade to depth 'user_text' and extract quotes from that text only.
QUOTES LIBRARY: list all QuoteCards across sources with filter, Pin, and 'Insert in beat'.

WRITER (scriptService.ts): after Lock & write script, (a) generate a beat plan sized to the duration (hook, context, cause, evidence, human story, other side, consequence, way forward, close), each beat assigned approved/pinned card IDs, editable by the user; (b) the writer prompt receives ONLY the brief, beat plan, approved+pinned cards with IDs and the selected writing style. Rules in the prompt: hook in first 15 seconds using the most surprising approved fact plus a question; one job per beat; a new fact, scene or cause-effect at least every 40-50 words; numbers only from the dossier, otherwise write [NEEDS DATA: what is missing]; never stretch one idea across several rephrased sentences; max 1-2 books or parables, quotes under 25 words and only from the dossier; public voices phrased as 'people online say', never as verified fact; at least one fair other-side point when the topic is contested; no filler openers; closing = conclusion plus one concrete next step.

QA (code): detect repetition (sentence n-gram similarity plus a short model check), find every number in the script and confirm it matches an approved FactCard figure, check fact density, auto-rewrite flagged paragraphs (max 2 rounds), then show a 'Check report' (repetition score, facts used vs approved, uncited numbers, NEEDS DATA gaps) and a Sources list built from the cards used.
```

## 11. Test checklist (har phase ke baad)

1. 5 min ka topic: kam az kam 20 cards, har ek ka source link kaam kare
2. Duration 5 se 10 karo: cards lagbhag double
3. Jhooti book ka naam likho: verified=false, default me hidden
4. PDF upload: quotes page ke saath, har ek 25 words se kam
5. Fact reject karo: script me na aaye. Pin karo: zaroor aaye
6. Script me koi number nahi jo dossier me na ho
7. Non-Pakistan topic (jaise history of tea, region Global): mafia ya Pakistan lens zabardasti na aaye
8. 375px mobile par har step istemal ke qabil ho
9. Cancel dabao: ab tak ka partial dossier mile
10. Link block ho to saaf message, crash nahi

## 12. Shuru kahan se karo

Pehle Phase 1 (sirf UI aur labels, 1 ghanta). Phir Phase 2 (asli research, sabse zyada asar yahin se aayega). Phase 3 sab se aakhir me, kyunki My Sources aur QA research ke upar chalte hain. Agar AI Studio kisi phase me adhoora code de, to usay sirf us file ka naam bata kar 'return the complete file' kaho.
