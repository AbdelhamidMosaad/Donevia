'use server';
/**
 * @fileOverview An AI flow for checking English grammar and providing detailed feedback.
 * - checkGrammar - A function that analyzes text for grammatical errors.
 * - GrammarCorrectionInput - The input type for the grammar check.
 * - GrammarCorrectionResponse - The return type with detailed analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// ========== Input / Output Schemas ==========

export const GrammarCorrectionInputSchema = z.object({
  text: z.string().min(5, { message: 'Text must be at least 5 characters.' }),
});
export type GrammarCorrectionInput = z.infer<typeof GrammarCorrectionInputSchema>;

export const GrammarCorrectionResponseSchema = z.object({
  analysis: z.array(z.object({
    original: z.string().describe("The original sentence or phrase from the user's text."),
    issues: z.array(z.string()).describe("A list of specific grammatical or stylistic issues found in the original phrase."),
    correction: z.string().describe("The corrected version of the sentence or phrase."),
  })).describe("An array of analyses for each segment of the original text."),
  finalPolishedVersion: z.string().describe("The fully corrected and polished version of the entire text."),
});
export type GrammarCorrectionResponse = z.infer<typeof GrammarCorrectionResponseSchema>;


// ========== Prompt Template ==========

const grammarCoachPrompt = ai.definePrompt({
  name: 'grammarCoachPrompt',
  input: { schema: GrammarCorrectionInputSchema },
  output: { schema: GrammarCorrectionResponseSchema },
  prompt: `
    You are an expert English grammar and style coach.
    Analyze the user's text. For each sentence or logical phrase, provide the original text, a list of specific issues, and the corrected version.
    After analyzing all parts, provide a final, polished version of the entire text.

    Analyze the following text:
    ---
    {{{text}}}
    ---
  `,
});

// ========== Flow Definition ==========

const grammarCoachFlow = ai.defineFlow(
  {
    name: 'grammarCoachFlow',
    inputSchema: GrammarCorrectionInputSchema,
    outputSchema: GrammarCorrectionResponseSchema,
  },
  async (input) => {
    const { output } = await grammarCoachPrompt(input);
    if (!output) {
      throw new Error('The AI failed to provide a grammar analysis. Please try again.');
    }
    return output;
  }
);


// ========== API Function Export ==========

export async function checkGrammar(
  input: GrammarCorrectionInput
): Promise<GrammarCorrectionResponse> {
  return await grammarCoachFlow(input);
}
