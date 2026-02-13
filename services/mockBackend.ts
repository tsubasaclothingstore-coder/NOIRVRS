import { UserProfile } from '../types';

const STORAGE_KEY = 'noirvrs_guest_profile';

const toBase64 = (str: string) => {
  try {
    return window.btoa(str);
  } catch (e) {
    // Fallback for utf8 strings
    return window.btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      function toSolidBytes(match, p1) {
          return String.fromCharCode(parseInt(p1, 16));
      }));
  }
};

const getPlaceholder = (index: number) => {
  // SVG Template
  const svg = `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#0B0D10"/>
    <rect x="20" y="20" width="984" height="984" fill="none" stroke="#1F1F1F" stroke-width="4"/>
    <line x1="20" y1="20" x2="150" y2="150" stroke="#76F3FF" stroke-width="2"/>
    <line x1="1004" y1="1004" x2="874" y2="874" stroke="#76F3FF" stroke-width="2"/>
    <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="60" fill="#333" font-weight="bold" letter-spacing="4">NOIRVRS</text>
    <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="40" fill="#76F3FF" letter-spacing="8">PANEL ${index + 1}</text>
    <rect x="412" y="600" width="200" height="2" fill="#76F3FF" opacity="0.5"/>
  </svg>
  `.trim().replace(/\s+/g, ' ');
  
  return `data:image/svg+xml;base64,${toBase64(svg)}`;
};

const MOCK_STORY_PAGES = [
  "The neon rain slashed against the glass of the precinct tower. Detective Vance adjusted his collar, staring at the reflection of a city that had forgotten how to sleep. The prompt on his terminal blinked: 'SIGNAL LOST'.",
  "He stepped out into the smog. The streets smelled of ozone and cheap synthetic noodles. A courier drone buzzed past, its red eye scanning his badge. 'Restricted Zone,' it chirped. Vance ignored it. He wasn't here for protocol.",
  "The alleyway was darker than the void between stars. He found the contact leaning against a dumpster, a figure wrapped in kinetic shielding. 'You brought the drive?' the figure asked. Vance nodded, his hand drifting to his sidearm.",
  "It was a trap. It always was. Shadows detached themselves from the walls, taking the shape of corporate enforcers. Vance didn't flinch. He triggered the EMP charge in his coat pocket. The lights died. The real negotiation began.",
  "Silence returned to the Sprawl. Vance stood alone, the data drive crushed in his mechanical hand. The conspiracy went deeper than the code. It was written in the blood of the city itself. He lit a cigarette. Case closed."
];

export const getMockSession = async (nonce: string) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    case_id: `MOCK_${Date.now()}`,
    seed: nonce,
    story_pages: MOCK_STORY_PAGES,
    images: MOCK_STORY_PAGES.map((_, i) => getPlaceholder(i)),
    credits_remaining: 4,
    credits_reset_at: new Date(Date.now() + 86400000).toISOString()
  };
};

export const getLocalProfile = (): UserProfile => {
  if (typeof window === 'undefined') return {} as any;
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  const now = Date.now();
  const profile: any = {
    citizenId: `Citizen #${Math.floor(100000 + Math.random() * 900000)}`,
    installationDate: now,
    lastLoginAt: now,
    isSubscribed: false,
    subscriptionTier: 'free',
    plan: 'free',
    completedStories: [],
    total_cases: 0,
    current_streak: 0,
    threads_remaining: 5,
    cycle_start: now,
    cycle_end: now + (30 * 24 * 60 * 60 * 1000),
    notificationsEnabled: true,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  return profile;
};

export const updateLocalProfile = (updates: Partial<UserProfile>): UserProfile => {
  if (typeof window === 'undefined') return {} as any;

  const current = getLocalProfile();
  const updated = { ...current, ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};