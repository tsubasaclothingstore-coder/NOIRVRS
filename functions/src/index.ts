
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Buffer } from 'buffer';

admin.initializeApp();
const db = admin.firestore();

// --- AUTH TRIGGER ---
export const onUserCreate = functions
  .region("europe-west1")
  .auth.user()
  .onCreate(async (user) => {
    const now = admin.firestore.FieldValue.serverTimestamp();
    const date = new Date();
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

    await db.collection("users").doc(user.uid).set({
      uid: user.uid,
      email: user.email || "",
      plan: "free",
      credits_remaining: 5,
      credits_reset_at: nextMonth.toISOString(),
      last_request_at: null,
      created_at: now,
      updated_at: now,
    });
  });

// --- GENERATE CASE ENDPOINT ---
export const generateCase = functions
  .region("europe-west1")
  .https.onRequest(async (req, res) => {
    // CORS
    res.set('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const caseId = `CASE_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const seed = req.body.nonce || Math.random().toString(36);

      const storyPages = [
        "The neon rain slashed against the glass of the precinct tower. Detective Vance adjusted his collar, staring at the reflection of a city that had forgotten how to sleep. The prompt on his terminal blinked: 'SIGNAL LOST'.",
        "He stepped out into the smog. The streets smelled of ozone and cheap synthetic noodles. A courier drone buzzed past, its red eye scanning his badge. 'Restricted Zone,' it chirped. Vance ignored it. He wasn't here for protocol.",
        "The alleyway was darker than the void between stars. He found the contact leaning against a dumpster, a figure wrapped in kinetic shielding. 'You brought the drive?' the figure asked. Vance nodded, his hand drifting to his sidearm.",
        "It was a trap. It always was. Shadows detached themselves from the walls, taking the shape of corporate enforcers. Vance didn't flinch. He triggered the EMP charge in his coat pocket. The lights died. The real negotiation began.",
        "Silence returned to the Sprawl. Vance stood alone, the data drive crushed in his mechanical hand. The conspiracy went deeper than the code. It was written in the blood of the city itself. He lit a cigarette. Case closed."
      ];

      // Visible SVG Placeholders
      const images = Array.from({ length: 5 }).map((_, i) => {
        const svg = `
          <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#0B0D10"/>
            <rect x="20" y="20" width="984" height="984" fill="none" stroke="#1F1F1F" stroke-width="4"/>
            <line x1="20" y1="20" x2="150" y2="150" stroke="#76F3FF" stroke-width="2"/>
            <line x1="1004" y1="1004" x2="874" y2="874" stroke="#76F3FF" stroke-width="2"/>
            <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="60" fill="#333" font-weight="bold" letter-spacing="4">NOIRVRS</text>
            <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="40" fill="#76F3FF" letter-spacing="8">PANEL ${i + 1}</text>
            <rect x="412" y="600" width="200" height="2" fill="#76F3FF" opacity="0.5"/>
          </svg>
        `.trim().replace(/\s+/g, ' ');
        return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
      });

      const response = {
        case_id: caseId,
        seed: seed,
        story_pages: storyPages,
        images: images,
        credits_remaining: 4, 
        credits_reset_at: new Date(Date.now() + 86400000).toISOString()
      };

      res.status(200).json(response);

    } catch (err: any) {
      console.error("Function Error:", err);
      res.status(500).json({ error: "INTERNAL_SYSTEM_FAILURE" });
    }
  });
