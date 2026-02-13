import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RitualPage } from '../types';
import { getMockSession, getLocalProfile, updateLocalProfile } from './mockBackend';
import { USE_MOCK_BACKEND } from '../constants';

export { getLocalProfile, updateLocalProfile };

export type RitualStatus = 'IDLE' | 'STORY_GEN' | 'IMAGE_GEN' | 'FINALIZING' | 'COMPLETED' | 'ERROR' | 'COOLDOWN';

export interface RitualResponse {
  id: string;
  title: string;
  pages: RitualPage[];
  images: string[];
  archetype: string;
  divergence_mode: string;
  character_description?: string;
  isComplete?: boolean;
  timestamp: number;
  status: RitualStatus;
  error?: string;
}

const diag = (msg: string, data?: any) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`%c[NOIRVRS_SYSTEM] ${msg}`, 'color: #76F3FF; font-weight: bold', data || '');
  }
};

const SYSTEM_INSTRUCTION = `
You are the NOIRVRS Narrative Engine.
You generate a complete 5-page comic story as a JSON package.

OUTPUT:
- Output ONLY valid JSON.
- No markdown formatting.

STORY STRUCTURE (STRICT FLOW):
- Exactly 5 pages.
- TOTAL WORD COUNT: 750-850 words. (approx 150-170 words per page).
- Page 1: INTRODUCTION. Establish the heavy, vintage-futuristic atmosphere and the Protagonist's immediate situation.
- Page 2: THE CASE. Reveal the specific mystery, tech-crime, or assignment details.
- Page 3: PRE-CLIMAX. Rising Action. The investigation hits a critical, dangerous turning point.
- Page 4: CLIMAX. The peak conflict. High-stakes confrontation, hacking duel, or shootout.
- Page 5: AFTERMATH. Conclusion. The immediate fallout of the case. A moment of reflection.

GENRE & TONE:
- Genre: Tech-Noir / Retro-Futurism.
- Tone: "Vintage Cool meets High Tech". Atmospheric, gritty, and human.
- Aesthetic: Analog-Digital Mix. Trench coats, revolvers, CRT monitors, flying cars, neon rain, bulky technology.
- Language: Raymond Chandler meets Blade Runner. Short, punchy sentences. Accessible vocabulary.
- RULE: Avoid complex technobabble. Use simple, grounded words to describe futuristic concepts (e.g., "the drive" instead of "quantum-encrypted data storage unit", "the synthetic" instead of "biomechanical humanoid construct"). Focus on mood, action, and emotion over science.

CASTING RULES (STRICT):
1. MAX 3 MAIN CHARACTERS total (including Protagonist).
2. DEFINE VISUALS: You must generate a 'character_roster' defining HIGHLY SPECIFIC, IMMUTABLE looks for these 3.
   - PROTAGONIST VISUALS: Must include distinct hair, specific clothing (e.g., "battered tan trenchcoat", "mirrored visor"), and a physical trait. This description must be distinctive to ensure they look the same in every panel.
3. EXTRAS ARE SHADOWS: Any other characters (thugs, police, crowds) MUST be described as "faceless shadows", "masked troopers", "silhouettes", or "identical androids". Do NOT give extras specific faces.
4. NAMING PROTOCOL: 
   - Protagonist MUST have a unique First Name and Surname. 
   - DO NOT use generic noir names like "Jack", "John", "Vance", "Nick", "Shadow", "Raven".
   - Use diverse, culturally distinct names suitable for a global mega-city.
5. ROSTER CONSISTENCY: The names used in 'active_characters' for each page MUST match the names in 'character_roster'.

VISUAL INSTRUCTIONS:
- For each page, provide an 'image_prompt' describing the scene action.
- List 'active_characters' for that page so the illustrator knows who to draw.
- CRITICAL: Images must be WORDLESS. Do not describe signs, letters, or spoken words in the image prompt.

UNIQUENESS PROTOCOL:
- Never repeat the same opening scene.
- Vary the threat: Rogue AI, Genetic Corruption, Chrono-Thieves, Corporate Espionage, Orbital Heists.
- Vary the setting: Docks, High-rises, Subways, Abandoned Labs, Mansions, Markets, Server Farms.
`;

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    story_year: { type: Type.STRING },
    location: { type: Type.STRING },
    archetype: { type: Type.STRING },
    divergence_mode: { type: Type.STRING },
    character_roster: {
      type: Type.ARRAY,
      description: "List of MAIN characters (Max 3). Index 0 is Protagonist.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          visual_details: { type: Type.STRING, description: "Detailed, specific, and unique visual traits (e.g. 'Messy bun, cybernetic left arm, red leather jacket') that MUST be used in every panel." }
        },
        required: ["name", "visual_details"]
      }
    },
    pages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          page_number: { type: Type.INTEGER },
          scene_role: { type: Type.STRING },
          scene_summary: { type: Type.STRING },
          text: { type: Type.STRING },
          word_count_page: { type: Type.INTEGER },
          active_characters: {
            type: Type.ARRAY,
            description: "Names of main characters present in this specific panel.",
            items: { type: Type.STRING }
          },
          image_prompt: { type: Type.STRING, description: "Detailed visual description for a comic panel illustrator. NO TEXT DESCRIPTIONS." },
        },
        required: ["page_number", "scene_role", "text", "image_prompt", "active_characters"]
      }
    }
  },
  required: ["title", "pages", "character_roster"]
};

// List of atmospheres to enforce variety
const ATMOSPHERES = [
  "Electromagnetic Storm (Static, Ozone)",
  "Neon Haze & Acid Rain (Green/Yellow tint)",
  "Server Farm Heat (Dry, Humid, Electric buzz)",
  "Stifling Heatwave (Sweat, Haze)",
  "Freezing Fog (Mist, Breath visible)",
  "Dry & Dusty Wind (Gritty, Parched)",
  "Oppressive Humidity (Damp, Sticky, No Rain)",
  "Clear Cold Starlight (Sharp, crisp shadows)",
  "Industrial Smog (Thick, Oily)",
  "Underground / Subway (Claustrophobic, Artificial Light)",
  "High Rise Penthouse (Sterile, Cold, Windy)",
  "Chemical Ash Fall (Grey, Flaking)"
];

// List of opening scenarios to prevent "Rooftop" cliché
const OPENING_SCENARIOS = [
  "IN_MEDIA_RES_ACTION: Mid-chase or mid-fight in a tight space.",
  "FORENSIC_INVESTIGATION: Kneeling next to evidence at ground level.",
  "TRANSIT: Riding a crowded subway or futuristic maglev train.",
  "SOCIAL_INFILTRATION: Sitting at a bar or club counter, blending in.",
  "VEHICULAR: Inside a vehicle driving fast, interior shot.",
  "INTERROGATION: Sitting across a table from a suspect in a small room.",
  "BREAK_IN: Hacking a terminal or lockpicking a door.",
  "WAKING_UP: Disoriented in a safehouse or apartment."
];

// Items of interest to ensure variety beyond just "Cassette Tapes"
const MACGUFFINS = [
  "a cracked holographic data-shard",
  "a reeling magnetic audio tape",
  "a biological sample in a cryo-tube",
  "a blood-stained paper dossier",
  "a severed android memory-core",
  "an ancient, heavy iron key",
  "a stolen corporate encrypted tablet",
  "a pulsating strange artifact",
  "a sub-dermal chip extracted from a body",
  "a vintage floppy disk with a red label",
  "a gold-plated pistol with one bullet",
  "a locket containing a holographic map"
];

// Diversity Generators
const GENDERS = ['Male', 'Female'];
const BODY_TYPES = [
  "Lean & Wiry (Runner's build)",
  "Imposing & Muscular (Brawler's build)",
  "Scarred & Athletic (Veteran's build)",
  "Gaunt & Sharp (Intellectual/Hacker build)",
  "Heavy-set & Strong (Powerlifter build)",
  "Cybernetically Enhanced / Asymmetrical",
  "Tall & Lanky"
];

export const normalizeImageSrc = (input: unknown): string | null => {
  if (!input) return null;
  let str = '';
  if (typeof input === 'string') {
    str = input.trim();
  }
  if (!str) return null;
  if (str.startsWith('data:image/') || str.startsWith('http')) {
    return str;
  }
  return `data:image/png;base64,${str}`;
};

export const abortRitual = () => {
  diag("ABORTING ACTIVE SIGNAL PROCESS");
};

// Visual Synthesis Engine Rules
// Updated to reflect "Vintage yet Futuristic" (Cassette Futurism/Syd Mead)
// Added "anatomically correct hands" to Style Tokens
const STYLE_TOKENS = "Retro-futuristic noir comic style, Retro-Tech Noir, Syd Mead aesthetic, heavy black ink, high contrast, stark white, spot color glowing cyan #76F3FF, tech-noir atmosphere, intricate machinery, wires and CRT screens, masterpiece, detailed line art, hard shadows, consistent character design, anatomically correct hands, perfect anatomy";

// Enhanced negative prompt to strictly ban bad anatomy, text, AND EXTRA LIMBS
const NEGATIVE_PROMPT = "disfigured, bad anatomy, dislocated limbs, extra limbs, missing limbs, floating limbs, mutated hands, extra fingers, missing fingers, fused fingers, malformed body, anatomical nonsense, bad proportions, uncoordinated body, amputation, head out of frame, cut off, split screen, text, words, speech bubble, thinking bubble, caption, label, sign, typography, letter, alphabet, watermark, logo, border, white frame, picture frame, margin, gutter, split panel, multiple panels, color gradient, soft lighting, orange, red, yellow, green, purple, sepia, greyscale, blurry, photograph, photorealistic, 3d render, distorted anatomy, elderly, wrinkles, old age, morphing clothes, three hands, three arms, more than two arms, extra legs, mutant, double body, clone, fused bodies";

/**
 * Helper to match active characters to roster even if names are slightly different
 */
const findCharacterInRoster = (name: string, roster: { name: string, visual_details: string }[]) => {
  const normalizedInput = name.toLowerCase().trim();
  
  // 1. Exact match
  let found = roster.find(r => r.name.toLowerCase().trim() === normalizedInput);
  if (found) return found;

  // 2. Partial match (e.g. "Vance" matching "Detective Vance")
  found = roster.find(r => {
    const rName = r.name.toLowerCase().trim();
    return rName.includes(normalizedInput) || normalizedInput.includes(rName);
  });
  
  return found;
};

/**
 * Generates a single image for a specific page.
 */
const generatePageImage = async (
  ai: GoogleGenAI, 
  page: any, 
  roster: { name: string, visual_details: string }[]
): Promise<string> => {
  try {
    // Build a specific visual context for ONLY the characters in this scene
    let characterContext = "";
    if (page.active_characters && page.active_characters.length > 0) {
      characterContext = "CAST IN THIS PANEL (MUST MATCH DESCRIPTIONS EXACTLY):\n";
      page.active_characters.forEach((charName: string) => {
        const charData = findCharacterInRoster(charName, roster);
        const charDetails = charData ? charData.visual_details : "A shadowy figure";
        const finalName = charData ? charData.name.toUpperCase() : charName.toUpperCase();
        characterContext += `- ${finalName}: ${charDetails} (Single individual)\n`;
      });
    }

    const prompt = `
      full bleed comic panel illustration, no border.
      
      ${characterContext}
      
      ACTION: ${page.image_prompt}
      
      STYLE RULES:
      1. ART STYLE: ${STYLE_TOKENS}
      2. COLOR PALETTE: Strictly Black, White, and Photon Cyan (#76F3FF). NO other colors.
      3. LIGHTING: Chiaroscuro, hard shadows, rim lighting.
      4. COMPOSITION: Cinematic framing, comic book dynamic.
      5. SCALE & ANATOMY: Masterpiece, anatomically correct, perfect anatomy, accurate body proportions. Objects and characters must obey real-world physics and scale. No distorted heads or limbs.
      6. CHARACTER CONSISTENCY: If a character from the CAST list is in the ACTION, they MUST match their visual description exactly.
      7. HANDS & LIMBS: Ensure all characters have exactly two arms and two hands. Hands must have 5 fingers. No extra limbs or hallucinations.
      
      CRITICAL: DO NOT INCLUDE ANY TEXT, SPEECH BUBBLES, OR CAPTIONS.
      
      Exclude: ${NEGATIVE_PROMPT}
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return '';
  } catch (e) {
    console.error("Image gen failed for page", page.page_number, e);
    return '';
  }
};

export const generateStorySession = async (
  requestId?: string, 
  onStatus?: (status: string) => void,
  signal?: AbortSignal,
  onImageResolved?: (index: number, image: string) => void
): Promise<RitualResponse> => {
  const nonce = requestId || crypto.randomUUID();
  const now = Date.now();

  if (USE_MOCK_BACKEND) {
    return mockFlow(nonce, now);
  }

  try {
    if (signal?.aborted) throw new Error("ABORTED");

    if (onStatus) onStatus("ESTABLISHING NEURAL UPLINK");
    diag("Initiating Neural Uplink...");
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API_KEY_MISSING");

    const ai = new GoogleGenAI({ apiKey });
    
    // 1. Generate Story Text + Character Sheet
    if (onStatus) onStatus("DECODING NARRATIVE STREAM");
    
    if (signal?.aborted) throw new Error("ABORTED");

    // Select random atmosphere and opening scenario
    const atmosphere = ATMOSPHERES[Math.floor(Math.random() * ATMOSPHERES.length)];
    const openingScenario = OPENING_SCENARIOS[Math.floor(Math.random() * OPENING_SCENARIOS.length)];

    // Select random MacGuffin to avoid "Cassette Tape" repetition
    const macguffin = MACGUFFINS[Math.floor(Math.random() * MACGUFFINS.length)];

    // Randomize Protagonist Attributes to ensure diversity
    const pGender = GENDERS[Math.floor(Math.random() * GENDERS.length)];
    const pAge = Math.floor(Math.random() * (45 - 20 + 1)) + 20; // 20 to 45
    const pBodyType = BODY_TYPES[Math.floor(Math.random() * BODY_TYPES.length)];

    const storyPrompt = `
      Generate a new NOIRVRS story.
      Seed: ${nonce}
      Genre: Tech-Noir / Retro-Futurism / Sci-Fi Mystery
      
      MANDATORY SETTING CONSTRAINTS:
      1. ATMOSPHERE: ${atmosphere}.
      2. TIME: NIGHT (Always).
      3. OPENING SCENE TYPE: ${openingScenario}.
      4. KEY ITEM: The mystery involves ${macguffin}.
      
      MANDATORY PROTAGONIST SPECS (DO NOT DEVIATE):
      - GENDER: ${pGender}
      - AGE: ${pAge}
      - BODY TYPE: ${pBodyType}
      - NAME: MUST be a unique First & Last Name. Do not use generic names like "Jack", "Vance", "John".
      
      CRITICAL INSTRUCTIONS:
      - The first scene MUST MATCH the OPENING SCENE TYPE.
      - DO NOT start the story with a character standing on a rooftop or balcony unless the opening type explicitly demands it (unlikely).
      - AVOID "Rain" unless the atmosphere is "Oppressive Humidity" or "Stifling Heatwave" (ironic) or explicitly demands it.
      - LANGUAGE: Simple, punchy, hard-boiled. No complex science talk or technobabble. Focus on the mood, the action, and the mystery. Make it readable for anyone.
      
      Constraint: GENERATE A NEW, UNIQUE PROTAGONIST based on the specs above.
    `;

    const storyResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: storyPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 1.0, 
      },
    });

    const storyJson = storyResponse.text ? JSON.parse(storyResponse.text) : null;
    if (!storyJson) throw new Error("VOID_RESPONSE");

    // Extract Protagonist description for backward compatibility/metadata
    const characterDesc = storyJson.character_roster?.[0]?.visual_details || "A silhouette of a detective";
    const roster = storyJson.character_roster || [{ name: "Protagonist", visual_details: characterDesc }];
    
    diag("Story Acquired. Roster size: " + roster.length);

    // CRITICAL: Update Profile Threads early since we have the story
    const profile = getLocalProfile();
    updateLocalProfile({
      threads_remaining: Math.max(0, (profile.threads_remaining || 0) - 1),
      activeCaseId: `CASE_${now}`,
      last_generation_at: now
    });

    // Prepare partial response structure
    const pages: RitualPage[] = storyJson.pages.map((p: any) => ({
      page_number: p.page_number,
      text: p.text,
      image_prompt: p.image_prompt
    }));

    const partialResponse: RitualResponse = {
      id: `CASE_${now}`,
      title: storyJson.title,
      archetype: storyJson.archetype,
      divergence_mode: storyJson.divergence_mode,
      character_description: characterDesc,
      pages: pages,
      images: new Array(5).fill(''), // Placeholders
      timestamp: now,
      status: 'IMAGE_GEN',
      isComplete: true
    };

    // 2. Start Images Generation in Background
    if (onStatus) onStatus("RENDERING VISUALS...");
    
    // Create an array of promises but don't await all of them at once
    const imageGenPromises = storyJson.pages.map(async (page: any, index: number) => {
       if (signal?.aborted) return;
       const img = await generatePageImage(ai, page, roster);
       // Notify via callback for streaming effect
       if (onImageResolved) {
         onImageResolved(index, img);
       }
       // Update local object reference (though caller likely uses callback)
       partialResponse.images[index] = img;
       return img;
    });

    // 3. WAIT STRATEGY: Wait only for the FIRST image to ensure the landing is not a black screen.
    // This dramatically reduces wait time (waiting for 1 image vs 5).
    await imageGenPromises[0];
    partialResponse.status = 'COMPLETED';

    if (onStatus) onStatus("FINALIZING CASE FILE");

    return partialResponse;

  } catch (err: any) {
    if (err.message === 'ABORTED' || (signal?.aborted)) {
      diag("Process aborted by user.");
      throw new Error("ABORTED");
    }
    console.error("Ritual Failed", err);
    throw new Error(err.message || "SIGNAL_LOST");
  }
};

const mockFlow = async (nonce: string, now: number): Promise<RitualResponse> => {
    diag("Initiating Mock Uplink...");
    const response = await getMockSession(nonce);
    
    const pages: RitualPage[] = response.story_pages.map((text: string, index: number) => ({
      page_number: index + 1,
      text: text
    }));

    const profile = getLocalProfile();
    // Consistent decrement logic for mock mode
    updateLocalProfile({
      threads_remaining: Math.max(0, (profile.threads_remaining || 0) - 1),
      cycle_end: new Date(response.credits_reset_at).getTime(),
      activeCaseId: response.case_id,
      last_generation_at: now
    });

    const normalizedImages = response.images.map((img: string) => normalizeImageSrc(img) || '');

    return {
      id: response.case_id,
      title: "CASE " + response.case_id.slice(-6), 
      archetype: "Neon Noir", 
      divergence_mode: "Simulation",
      character_description: "Mock Detective",
      pages: pages,
      images: normalizedImages,
      timestamp: now,
      status: 'COMPLETED', 
      isComplete: true
    };
};

export const getStoryById = async (id: string): Promise<RitualResponse | null> => {
  return null;
};