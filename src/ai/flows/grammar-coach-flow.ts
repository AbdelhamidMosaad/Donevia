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
    You are an expert English grammar and style coach. Your task is to analyze the provided text, identify grammatical errors, awkward phrasing, and style issues.

    For each sentence or logical phrase in the user's text, you must provide:
    1.  **original**: The exact original sentence or phrase.
    2.  **issues**: A bullet-point list of all the problems found. Be specific. For example, instead of "verb tense incorrect", say "'did' is not the best verb; 'performed' is more precise."
    3.  **correction**: The corrected version of that single sentence or phrase.

    After analyzing all parts of the text, you must provide a final, polished version of the entire text that combines all the corrections into a cohesive whole.

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
