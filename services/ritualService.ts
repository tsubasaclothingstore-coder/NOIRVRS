
import { RitualPage } from '../types';
import { getMockSession, getLocalProfile, updateLocalProfile } from './mockBackend';

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
    console.log(`%c[NOIRVRS_MOCK] ${msg}`, 'color: #76F3FF; font-weight: bold', data || '');
  }
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

export const generateStorySession = async (requestId?: string): Promise<RitualResponse> => {
  const nonce = requestId || crypto.randomUUID();
  const now = Date.now();

  try {
    diag("Initiating Mock Uplink...");
    
    // 1. Call Mock Backend
    const response = await getMockSession(nonce);

    // 2. Map Response
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

    const result: RitualResponse = {
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

    return result;

  } catch (err: any) {
    console.error("Mock Generation Failed", err);
    throw new Error("SIMULATION_ERROR");
  }
};

export const getStoryById = async (id: string): Promise<RitualResponse | null> => {
  return null;
};
