import { CreatorProfile } from "../types";

export interface ThumbnailProfile {
    visualDNA: string;
    promptStructure: string;
    dominantColors: string;
    composition: string;
    elements: string[];
}

export const CREATOR_THUMBNAIL_STYLES: Record<string, ThumbnailProfile> = {
    "dhruvrathee": {
        visualDNA: "Rational, Documentary, Trustworthy",
        promptStructure: "high-contrast split-screen composition, 8k resolution, photorealistic lighting",
        dominantColors: "Electric Blue (#3b82f6) and Red (#ef4444)",
        composition: "Subject centered or slightly off-center, split screen with map or document",
        elements: ["circular magnifier lens highlighting a map or document", "serious subject pointing at data", "large sans-serif text in Yellow or White"]
    },
    "nitishrajput": {
        visualDNA: "Cinematic, Investigative, Noir",
        promptStructure: "Cinematic Noir aesthetic, deep blacks, gold accents, spotlight lighting",
        dominantColors: "Black, Gold, Deep Grey",
        composition: "Dramatic chiaroscuro lighting, subject in shadow or silhouette against a lit background",
        elements: ["gritty industrial scenes", "courtrooms", "newspaper montages", "serif font family (like Cinzel)"]
    },
    "mrbeast": {
        visualDNA: "Hyper-Viral, Spectacle, High Saturation",
        promptStructure: "Hyper-realistic, 8k, wide angle lens, explosive energy",
        dominantColors: "Cyan, Magenta, Bright Yellow",
        composition: "Extreme close-up of shocked face (Rule of Thirds), massive scale background object",
        elements: ["thick white outlines around subject", "money flying", "fire or explosions", "red arrows"]
    },
    "raftar": {
        visualDNA: "Aggressive, Breaking News, Roast",
        promptStructure: "Gritty news report style, high contrast, urgent atmosphere",
        dominantColors: "Blood Red, Black, White",
        composition: "Subject laughing or shouting, cutout style against chaotic background",
        elements: ["news ticker overlays", "exposed documents", "bold blocky impact font"]
    },
    "thynkwhy": {
        visualDNA: "Conceptual, Modern, Abstract",
        promptStructure: "Clean 3D render style, isometric or surreal composition, soft studio lighting",
        dominantColors: "Lime Green, Black, Matrix Code Green",
        composition: "Minimalist, floating elements, subject looking thoughtful",
        elements: ["3D icons", "floating question marks", "abstract geometric shapes", "glitch effects"]
    },
    "alexhormozi": {
        visualDNA: "Bold, Gym, Business",
        promptStructure: "High contrast gym-bro business aesthetic, gritty textures, bold typography",
        dominantColors: "High-Vis Orange, Black, White",
        composition: "Subject flexed or commanding, simple background, massive text",
        elements: ["bold sans-serif font (The Bold Font)", "flannel texture", "whiteboard sketches"]
    },
    "hormozi": {
        visualDNA: "Bold, Gym, Business",
        promptStructure: "High contrast gym-bro business aesthetic, gritty textures, bold typography",
        dominantColors: "High-Vis Orange, Black, White",
        composition: "Subject flexed or commanding, simple background, massive text",
        elements: ["bold sans-serif font (The Bold Font)", "flannel texture", "whiteboard sketches"]
    },
    "imangadzhi": {
        visualDNA: "Luxury, Monk Mode, Cinematic",
        promptStructure: "Old Money aesthetic, film grain, moody lighting, desaturated",
        dominantColors: "Silver, Charcoal, Deep Navy",
        composition: "Subject in suit or robe, looking out window or at camera, symmetric",
        elements: ["chess pieces", "luxury interiors", "vintage film effects"]
    },
    "navalravikant": {
        visualDNA: "Philosophical, Zen Minimalist, High-Signal Wisdom",
        promptStructure: "Minimalist editorial portrait with vast negative space, moody rim lighting, fine-art monochrome with subtle violet-gold glow",
        dominantColors: "Deep Obsidian (#090d16), Violet (#8b5cf6), Warm Gold (#f59e0b)",
        composition: "Contemplative subject in profile or calm eye contact on one third, clean dark negative space for crisp aphorism typography",
        elements: ["zen geometric line art or compounding curve", "minimalist serif/sans-serif aphorism text", "subtle cosmic or golden-ratio visual metaphor"]
    },
    "jordanpeterson": {
        visualDNA: "Mythological, Psychological, Classical Chiaroscuro",
        promptStructure: "Rembrandt chiaroscuro oil-painting meets razor-sharp studio portrait, dramatic warm amber light cutting through deep shadow",
        dominantColors: "Deep Slate (#0f172a), Crimson (#b91c1c), Classical Gold (#d97706), Sky Blue (#0284c7)",
        composition: "Intense furrowed-brow portrait juxtaposed with classical sculpture, mythological dragon/chaos motif, or symbolic scales of order",
        elements: ["classical marble statue or Jungian shadow silhouette", "authoritative serif typography (Trajan/Cinzel style)", "high-contrast split between Order (warm light) and Chaos (dark storm)"]
    },
    "veritasium": {
        visualDNA: "Scientific Paradox, Real-World Experiment, High-Curiosity",
        promptStructure: "Crisp outdoor/lab scientific photography, natural daylight, high-speed camera freeze-frame of a counter-intuitive physics phenomenon",
        dominantColors: "Teal (#14b8a6), Bright Yellow (#facc15), Crisp Sky Blue, Clean White",
        composition: "Curiosity-driven presenter holding or standing beside a baffling physical contraption or experiment in action, clear focal point",
        elements: ["counter-intuitive physics apparatus or force diagram arrow", "short 2-4 word paradox question in clean bold sans-serif", "real-world experimental setup"]
    },
    "sharanhegde": {
        visualDNA: "Edutainment Finance Skit, Relatable Money Hack, High-CTR",
        promptStructure: "Bright, crisp studio lighting, expressive dual-character comedy skit composition, vibrant financial visual props",
        dominantColors: "Emerald Money Green (#16a34a), Crisp White, Gold Coin Yellow, Deep Slate",
        composition: "Expressive presenter reacting with surprise or holding a giant tax/credit-card prop against a clean modern backdrop",
        elements: ["glowing green rupee/dollar savings callout badge", "credit card, tax file, or calculator prop", "punchy yellow-and-white headline text with green upward arrow"]
    },
    "default": {
        visualDNA: "High Quality YouTube Standard",
        promptStructure: "Professional 4k YouTube thumbnail, crisp lighting, high detail",
        dominantColors: "Vibrant contrasting colors",
        composition: "Clear subject in foreground, relevant background",
        elements: ["Expressive face", "Clear text overlay"]
    }
};

const CREATOR_ID_ALIASES: Record<string, string> = {
    "dhruv": "dhruvrathee",
    "dhruvrathee": "dhruvrathee",
    "nitish": "nitishrajput",
    "nitishrajput": "nitishrajput",
    "mrbeast": "mrbeast",
    "raftar": "raftar",
    "thynkwhy": "thynkwhy",
    "hormozi": "alexhormozi",
    "alexhormozi": "alexhormozi",
    "iman": "imangadzhi",
    "imangadzhi": "imangadzhi",
    "naval": "navalravikant",
    "navalravikant": "navalravikant",
    "peterson": "jordanpeterson",
    "jordanpeterson": "jordanpeterson",
    "veritasium": "veritasium",
    "sharan": "sharanhegde",
    "sharanhegde": "sharanhegde",
    "financewithsharan": "sharanhegde"
};

export class ThumbnailEngine {
    static getProfile(creatorId: string): ThumbnailProfile {
        const normalized = (creatorId || "").toLowerCase().replace(/\s+/g, "").replace("@", "");
        const aliasKey = CREATOR_ID_ALIASES[normalized];
        if (aliasKey && CREATOR_THUMBNAIL_STYLES[aliasKey]) {
            return CREATOR_THUMBNAIL_STYLES[aliasKey];
        }
        const matchedKey = Object.keys(CREATOR_THUMBNAIL_STYLES).find(
            k => k !== "default" && (normalized.includes(k) || k.includes(normalized))
        );
        return CREATOR_THUMBNAIL_STYLES[matchedKey || "default"];
    }

    static constructPrompt(
        creator: CreatorProfile, 
        topic: string, 
        textOverlay: string, 
        languageMode: string,
        aspectRatio: string = "16:9"
    ): string {
        const profile = this.getProfile(creator.id || creator.name);
        
        const subjectInjection = `Include imagery related to: "${topic}" (e.g., if economic, show graphs/currency; if tech/science, show physical mechanisms/devices).`;

        let fontInstruction = "";
        if (languageMode === 'Urdu/Hindi' || languageMode === 'Urdu') {
            fontInstruction = "Render the text overlay in a bold, calligraphic Nastaliq-style font or Devanagari script. Ensure cultural authenticity.";
        } else if (creator.id.includes('nitish') || creator.id.includes('peterson') || creator.id.includes('naval')) {
            fontInstruction = "Render text in a cinematic, authoritative Serif or clean editorial font (like Cinzel or Trajan).";
        } else {
            fontInstruction = "Render text in a bold, impactful Sans-Serif font (like Impact or Montserrat).";
        }

        const prompt = `
            Create a professional YouTube thumbnail.
            
            [STYLE DNA]
            Creator Style: ${creator.name} (${profile.visualDNA})
            Aesthetic: ${profile.promptStructure}
            Color Palette: ${profile.dominantColors}
            Composition: ${profile.composition}
            Mandatory Elements: ${profile.elements.join(", ")}.
            
            [SUBJECT MATTER]
            Core Topic: ${topic}
            ${subjectInjection}
            Integrate these visual metaphors into the creator's typical composition.
            
            [TEXT OVERLAY]
            Text: "${textOverlay}"
            Font Rule: ${fontInstruction}
            Text Visibility: Large, legible, high contrast against background.
            
            [TECHNICAL]
            Aspect Ratio: ${aspectRatio}
            Quality: 8k, sharp focus, studio grade lighting, no blur.
        `;

        return prompt.trim();
    }
}
