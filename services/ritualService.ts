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

STORY STRUCTURE:
- Exactly 5 pages.
- Total word count between 700 and 800 (target 750).
- Vocabulary level 8/10. Clear, adult, readable, cinematic noir.
- Page flow: Setup -> Reveal -> Conflict -> Shift -> Ending.
- No moral lectures. No alternate endings.

VISUAL INSTRUCTIONS (PER PAGE):
- Include an 'image_prompt' for each page.
- Style: Hand-drawn comic panel, ink noir or cel fracture.
- NO cinematic/photorealistic terms.
- Focus on silhouettes, high contrast, hard shadows.

UNIQUENESS:
- Never repeat the same opening situation.
- Vary the setting and threat.
`;

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    story_year: { type: Type.STRING },
    location: { type: Type.STRING },
    archetype: { type: Type.STRING },
    divergence_mode: { type: Type.STRING },
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
          image_prompt: { type: Type.STRING, description: "Detailed visual description for a comic panel illustrator. No text." },
        },
        required: ["page_number", "scene_role", "text", "image_prompt"]
      }
    }
  },
  required: ["title", "pages"]
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

const generateImagesForStory = async (ai: GoogleGenAI, pages: any[]): Promise<string[]> => {
  const images: string[] = [];
  
  // Sequential generation to avoid rate limits and ensure order
  for (const page of pages) {
    try {
      const prompt = `Comic panel art. ${page.image_prompt}. Style: High contrast noir, ink lines, flat colors. No text in image.`;
      
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

      let foundImage = false;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
            foundImage = true;
            break;
          }
        }
      }
      
      if (!foundImage) {
        images.push(''); // Fallback handled by UI
      }
    } catch (e) {
      console.error("Image gen failed for page", page.page_number, e);
      images.push('');
    }
  }
  return images;
};

export const generateStorySession = async (requestId?: string): Promise<RitualResponse> => {
  const nonce = requestId || crypto.randomUUID();
  const now = Date.now();

  if (USE_MOCK_BACKEND) {
    return mockFlow(nonce, now);
  }

  try {
    diag("Initiating Neural Uplink...");
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API_KEY_MISSING");

    const ai = new GoogleGenAI({ apiKey });
    
    // 1. Generate Story Text
    const storyPrompt = `
      Generate a new NOIRVRS story.
      Seed: ${nonce}
      Genre: Tech-Noir / Cyber-Noir
      Tone: Melancholy, gritty, tense.
    `;

    const storyResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: storyPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.8,
      },
    });

    const storyJson = storyResponse.text ? JSON.parse(storyResponse.text) : null;
    if (!storyJson) throw new Error("VOID_RESPONSE");

    diag("Story Acquired. Visualizing...");

    // 2. Generate Images
    const images = await generateImagesForStory(ai, storyJson.pages);

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
      pages: pages,
      images: images,
      timestamp: now,
      status: 'COMPLETED',
      isComplete: true
    };

  } catch (err: any) {
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

    updateLocalProfile({
      threads_remaining: response.credits_remaining,
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
