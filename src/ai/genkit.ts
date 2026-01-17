import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
// import { dotprompt } from '@genkit-ai/dotprompt';

// Firebase Admin SDK initialization (Build-safe)
let firebaseAdminInitialized = false;

try {
  // Only attempt Firebase initialization if we have the required environment variables
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    // Dynamic import to prevent build-time errors
    const { initializeApp, cert, getApps } = await import('firebase-admin/app');
    
    const firebaseConfig = {
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    };

    if (getApps().length === 0) {
      initializeApp(firebaseConfig);
      firebaseAdminInitialized = true;
      console.log('Firebase Admin SDK initialized successfully');
    } else {
      firebaseAdminInitialized = true;
      console.log('Firebase Admin SDK already initialized');
    }
  } else {
    console.warn('Firebase Admin SDK: Missing environment variables, skipping initialization');
  }
} catch (error) {
  // Don't crash during build - just log a warning
  console.warn('Firebase Admin SDK initialization skipped during build:', error.message);
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
      apiVersion: 'v1beta',
    }),
    // dotprompt(),
  ],
  model: 'googleai/gemini-2.5-flash',
});

// Optional: Export firebaseAdmin if needed elsewhere
export { firebaseAdminInitialized };
