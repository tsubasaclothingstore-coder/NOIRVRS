import { GoogleGenAI, Type, Schema } from "@google/genai";

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

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { nonce, user_name } = await req.json();
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Configuration Error" }), { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Generate a new NOIRVRS story.
      User Name: ${user_name || "The Detective"}
      Seed: ${nonce || Date.now()}
      
      Requirements:
      - Genre: Tech-Noir / Cyber-Noir
      - Tone: Melancholy, gritty, tense.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.8,
      },
    });

    const storyData = response.text ? JSON.parse(response.text) : null;

    if (!storyData) {
      throw new Error("Empty generation result");
    }

    // Return the structured story
    return new Response(JSON.stringify({
      case_id: `CASE_${Date.now()}`,
      ...storyData,
      credits_remaining: 3, // Mock value, would come from DB
      credits_reset_at: new Date(Date.now() + 86400000).toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("Ritual Generation Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Signal Lost" }), { status: 500 });
  }
}
