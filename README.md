# NOIRVRS

A minimalist daily noir reading ritual.

## Deployment Checklist

Run these commands in order to deploy the full stack:

1. **Install Dependencies**
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

2. **Build the Web App**
   This generates the SPA bundle in the `dist` folder.
   ```bash
   npm run build:web
   ```

3. **Deploy Backend (Firestore & Functions)**
   ```bash
   firebase deploy --only firestore
   firebase deploy --only functions
   ```

4. **Deploy Frontend (Hosting)**
   ```bash
   firebase deploy --only hosting
   ```

## Architecture

- **Frontend**: React (Expo Web Single-Page App) -> served from `dist/`
- **Backend**: Firebase Cloud Functions (Node 20) -> `functions/`
- **Database**: Firestore -> `firestore.rules`
- **Routing**: `firebase.json` rewrites `/api/*` to Functions and `**` to `index.html`.
