
export interface GenerateCaseRequest {
  nonce: string;
}

export interface GenerateCaseResponse {
  case_id: string;
  seed: string;
  story_pages: string[];      // length 5
  images: string[];           // length 5; base64 data URLs
  credits_remaining: number;
  credits_reset_at: string;   // ISO string
}

export const validateGenerateCaseResponse = (resp: any): GenerateCaseResponse => {
  if (!resp || typeof resp !== 'object') {
    throw new Error("MALFORMED_RESPONSE: Root must be an object.");
  }

  if (typeof resp.case_id !== 'string' || !resp.case_id) {
    throw new Error("MALFORMED_RESPONSE: Missing case_id.");
  }

  if (!Array.isArray(resp.story_pages) || resp.story_pages.length !== 5) {
    throw new Error("MALFORMED_RESPONSE: story_pages must be array of length 5.");
  }
  
  if (!resp.story_pages.every((p: any) => typeof p === 'string' && p.length > 0)) {
    throw new Error("MALFORMED_RESPONSE: Invalid story_pages content.");
  }

  if (!Array.isArray(resp.images) || resp.images.length !== 5) {
    throw new Error("MALFORMED_RESPONSE: images must be array of length 5.");
  }

  // Basic check for data URL format
  if (!resp.images.every((img: any) => typeof img === 'string' && img.startsWith('data:image/'))) {
    throw new Error("MALFORMED_RESPONSE: Images must be base64 data URLs.");
  }

  if (typeof resp.credits_remaining !== 'number' || resp.credits_remaining < 0) {
    throw new Error("MALFORMED_RESPONSE: Invalid credits_remaining.");
  }

  if (typeof resp.credits_reset_at !== 'string' || isNaN(Date.parse(resp.credits_reset_at))) {
    throw new Error("MALFORMED_RESPONSE: Invalid credits_reset_at ISO date.");
  }

  return resp as GenerateCaseResponse;
};
