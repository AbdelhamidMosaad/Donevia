
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
// import {dotprompt} from '@genkit-ai/dotprompt';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
    // dotprompt(),
  ],
  model: 'googleai/gemini-2.5-flash',
});
