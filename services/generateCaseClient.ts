import { GenerateCaseResponse, validateGenerateCaseResponse } from '../types/caseContract';
import { authService } from './authService';

// Use relative path so it works with Firebase Hosting rewrites (local and prod)
const FUNCTIONS_URL = '/api/generateCase'; 
const REQUEST_TIMEOUT_MS = 90000; // 90 seconds for full story generation

export const generateCaseClient = async (nonce: string): Promise<GenerateCaseResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const token = await authService.getAuthToken();

    const response = await fetch(FUNCTIONS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': nonce,
      },
      body: JSON.stringify({ nonce }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      switch (response.status) {
        case 401:
        case 403:
          throw new Error("AUTH_REQUIRED");
        case 402:
          throw new Error("NO_CREDITS");
        case 404: 
          throw new Error("ENDPOINT_NOT_FOUND");
        case 409:
          throw new Error("REQUEST_CONFLICT");
        case 429:
          throw new Error("RATE_LIMITED");
        default:
          throw new Error("SERVER_ERROR");
      }
    }

    const json = await response.json();
    const validatedData = validateGenerateCaseResponse(json);

    // DEV-ONLY LOGGING
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[generateCase] ok case_id=${validatedData.case_id}`);
    }

    return validatedData;

  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("TIMEOUT: Neural uplink timed out.");
    }
    throw error;
  }
};