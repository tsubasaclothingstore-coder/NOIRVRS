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

STORY STRUCTURE:
- Exactly 5 pages.
- TOTAL WORD COUNT: 750-850 words. (approx 150-170 words per page).
- This is a reading ritual. Do not be brief. be descriptive and atmospheric.
- Page flow: Setup -> Reveal -> Conflict -> Shift -> Ending.

GENRE & TONE:
- Genre: Neo-Noir / Urban Fantasy / Vigilante Thriller.
- Protagonists: Vigilantes (often with subtle supernatural powers like shadow-walking, enhanced senses, kinetic blasts) OR Grit-toothed Detectives.
- AGE: Characters must be in their PRIME (20s-40s). Do not default to "old", "retired", or "weary elder".
- Tone: Serious, violent, dramatic, moody.
- Language: Accessible crime-drama prose. Punchy and hard-hitting.

VISUAL INSTRUCTIONS:
- Define 'character_description': A specific visual description of the protagonist. MUST BE UNIQUE every time.
- For each page, provide an 'image_prompt' describing the scene action.
- CRITICAL: Images must be WORDLESS. Do not describe signs, letters, or spoken words in the image prompt.

UNIQUENESS PROTOCOL:
- Never repeat the same opening scene.
- Vary the threat: Corruption, Super-powered thugs, Cults, Heists.
`;

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    story_year: { type: Type.STRING },
    location: { type: Type.STRING },
    archetype: { type: Type.STRING },
    divergence_mode: { type: Type.STRING },
    character_description: { type: Type.STRING, description: "A detailed visual description of the main character (Age 25-45)." },
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
          image_prompt: { type: Type.STRING, description: "Detailed visual description for a comic panel illustrator. NO TEXT DESCRIPTIONS." },
        },
        required: ["page_number", "scene_role", "text", "image_prompt"]
      }
    }
  },
  required: ["title", "pages", "character_description"]
};

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
const STYLE_TOKENS = "Sin City graphic novel style, Frank Miller aesthetic, extreme high contrast, heavy black ink, stark white, spot color glowing cyan #76F3FF, noir atmosphere, masterpiece, detailed line art, hard shadows";
// Enhanced negative prompt to strictly ban bad anatomy and text
const NEGATIVE_PROMPT = "disfigured, bad anatomy, dislocated limbs, extra limbs, missing limbs, floating limbs, mutated hands, extra fingers, missing fingers, fused fingers, malformed body, anatomical nonsense, bad proportions, uncoordinated body, amputation, head out of frame, cut off, split screen, text, words, speech bubble, thinking bubble, caption, label, sign, typography, letter, alphabet, watermark, logo, border, white frame, picture frame, margin, gutter, split panel, multiple panels, color gradient, soft lighting, orange, red, yellow, green, purple, sepia, greyscale, blurry, photograph, photorealistic, 3d render, distorted anatomy, elderly, wrinkles, old age";

const generateImagesForStory = async (
  ai: GoogleGenAI, 
  pages: any[], 
  characterDesc: string, 
  onStatus?: (status: string) => void
): Promise<string[]> => {
  
  if (onStatus) onStatus("RENDERING VISUALS (0/5)");

  const generatePageImage = async (page: any, index: number): Promise<string> => {
    try {
      const prompt = `
        full bleed comic panel illustration, no border.
        
        CHARACTER: ${characterDesc}
        ACTION: ${page.image_prompt}
        
        STYLE RULES:
        1. ART STYLE: ${STYLE_TOKENS}
        2. COLOR PALETTE: Strictly Black, White, and Photon Cyan (#76F3FF). NO other colors.
        3. LIGHTING: Chiaroscuro, hard shadows, rim lighting.
        4. COMPOSITION: Cinematic framing, comic book dynamic.
        5. SCALE & ANATOMY: Masterpiece, anatomically correct, perfect anatomy, accurate body proportions. Objects and characters must obey real-world physics and scale. No distorted heads or limbs.
        
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

      if (onStatus) onStatus(`RENDERING VISUALS (${index + 1}/5)`);

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

  // Parallel execution for speed
  const imagePromises = pages.map((page, index) => generatePageImage(page, index));
  const images = await Promise.all(imagePromises);
  
  return images;
};

export const generateStorySession = async (
  requestId?: string, 
  onStatus?: (status: string) => void,
  signal?: AbortSignal
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

    const storyPrompt = `
      Generate a new NOIRVRS story.
      Seed: ${nonce}
      Genre: Vigilante Thriller / Neo-Noir
      Tone: Melancholy, gritty, tense, dramatic.
      
      Constraint: GENERATE A NEW, UNIQUE PROTAGONIST (Age 20s-40s).
      Constraint: GENERATE A UNIQUE OPENING SCENE.
    `;

    const storyResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: storyPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.9, 
      },
    });

    const storyJson = storyResponse.text ? JSON.parse(storyResponse.text) : null;
    if (!storyJson) throw new Error("VOID_RESPONSE");

    const characterDesc = storyJson.character_description || "A silhouette of a detective";
    
    diag("Story Acquired. Character: " + characterDesc);

    // Check signal before image gen
    if (signal?.aborted) throw new Error("ABORTED");

    // 2. Generate Images (Parallel) with Character Consistency
    const images = await generateImagesForStory(ai, storyJson.pages, characterDesc, onStatus);

    if (onStatus) onStatus("FINALIZING CASE FILE");

    // CRITICAL: Check signal right before deducting threads
    if (signal?.aborted) throw new Error("ABORTED");

    // 3. Update Profile & Return
    const profile = getLocalProfile();
    updateLocalProfile({
      threads_remaining: Math.max(0, (profile.threads_remaining || 0) - 1),
      activeCaseId: `CASE_${now}`,
      last_generation_at: now
    });

    const pages: RitualPage[] = storyJson.pages.map((p: any) => ({
      page_number: p.page_number,
      text: p.text,
      image_prompt: p.image_prompt
    }));

    return {
      id: `CASE_${now}`,
      title: storyJson.title,
      archetype: storyJson.archetype,
      divergence_mode: storyJson.divergence_mode,
      character_description: characterDesc,
      pages: pages,
      images: images,
      timestamp: now,
      status: 'COMPLETED',
      isComplete: true
    };

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