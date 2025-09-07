import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {defineDotprompt, dotprompt} from '@genkit-ai/dotprompt';
import {google} from 'googleapis';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
    dotprompt(),
  ],
  model: 'googleai/gemini-2.5-flash',
});
