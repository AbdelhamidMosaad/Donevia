
'use server';
/**
 * @fileOverview An AI flow for rephrasing sentences to be more natural and effective.
 *
 * - rephraseText - A function that uses Gemini to generate improved versions of a text.
 */

import { ai } from '@/ai/genkit';
import { RephraseRequestSchema, RephraseResponseSchema, type RephraseRequest, type RephraseResponse } from '@/lib/types/rephrase';

const rephrasePrompt = ai.definePrompt({
  name: 'rephrasePrompt',
  input: { schema: RephraseRequestSchema },
  output: { schema: RephraseResponseSchema },
  prompt: `
    You are an English writing coach. The user will provide a sentence or short text. Your job is to rephrase it into at least two improved versions that sound natural, fluent, and more effective. For each new version, explain why it is better than the original (e.g., clearer, more concise, more formal, more engaging, or grammatically correct). Always keep the meaning of the original text, but make it easier to understand or more polished.

    Original text from user:
    ---
    {{{text}}}
    ---

    Provide your response as a valid JSON object.
  `,
});


const rephraseFlow = ai.defineFlow(
  {
    name: 'rephraseFlow',
    inputSchema: RephraseRequestSchema,
    outputSchema: RephraseResponseSchema,
  },
  async (input) => {
    const { output } = await rephrasePrompt(input);
    if (!output) {
      throw new Error('The AI failed to generate rephrased versions. Please try again.');
    }
    return output;
  }
);


export async function rephraseText(
  input: RephraseRequest
): Promise<RephraseResponse> {
  return await rephraseFlow(input);
}
