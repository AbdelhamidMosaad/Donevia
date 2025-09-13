'use server';
/**
 * @fileOverview An AI flow for generating an article for shadowing practice.
 * - generateShadowingArticle - A function that uses Gemini to generate a short article broken into sentences.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ShadowingRequestSchema = z.object({
  topic: z.string().describe('The topic for the article to be generated.'),
});

const ShadowingResponseSchema = z.object({
  title: z.string().describe('A suitable title for the article.'),
  phrases: z.array(z.string()).describe('The article content, broken down into individual sentences or short, manageable phrases for shadowing.'),
});

export type ShadowingRequest = z.infer<typeof ShadowingRequestSchema>;
export type ShadowingResponse = z.infer<typeof ShadowingResponseSchema>;


const shadowingPrompt = ai.definePrompt({
  name: 'shadowingCoachPrompt',
  input: { schema: ShadowingRequestSchema },
  output: { schema: ShadowingResponseSchema },
  prompt: `
    You are an English teacher creating a pronunciation exercise. Your task is to generate a short article about the topic "{{topic}}".

    **Instructions:**
    1.  **Title**: Create a simple and relevant title for the article.
    2.  **Article Content**: Write a coherent and interesting article of about 150-200 words. The language and vocabulary should be clear and easy to pronounce, suitable for an intermediate English learner.
    3.  **Breakdown**: Break the entire article down into individual sentences or very short, manageable phrases. Each sentence/phrase must be a separate string in the "phrases" array. Do not include numbering or bullet points in the phrases.
    4.  **JSON Output**: Ensure your entire output is a single, valid JSON object that strictly adheres to the required format.
  `,
});


const generateShadowingArticleFlow = ai.defineFlow(
  {
    name: 'generateShadowingArticleFlow',
    inputSchema: ShadowingRequestSchema,
    outputSchema: ShadowingResponseSchema,
  },
  async (input) => {
    const { output } = await shadowingPrompt(input);
    if (!output) {
      throw new Error('The AI failed to generate an article. Please try again.');
    }
    return output;
  }
);


export async function generateShadowingArticle(
  input: ShadowingRequest
): Promise<ShadowingResponse> {
  return await generateShadowingArticleFlow(input);
}
