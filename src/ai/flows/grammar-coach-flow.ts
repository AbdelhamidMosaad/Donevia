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
  corrected_text: z.string().describe("The fully corrected and polished version of the entire text."),
  errors: z.array(z.object({
      original: z.string().describe("The original incorrect word or phrase."),
      correction: z.string().describe("The suggested correct word or phrase."),
      explanation: z.string().describe("A brief explanation of the grammatical error and the correction.")
  })).describe("An array of specific errors found in the text."),
});
export type GrammarCorrectionResponse = z.infer<typeof GrammarCorrectionResponseSchema>;


// ========== Prompt Template ==========

const grammarCoachPrompt = ai.definePrompt({
  name: 'grammarCoachPrompt',
  input: { schema: GrammarCorrectionInputSchema },
  output: { schema: GrammarCorrectionResponseSchema },
  prompt: `
    You are an expert English grammar and style coach.
    Analyze the following text.
    Return a JSON object with two keys:
    1. "corrected_text": The fully corrected and polished version of the entire text.
    2. "errors": An array of objects, where each object details a specific error. Each error object should have three keys: "original" (the incorrect phrase), "correction" (the suggested fix), and "explanation" (why it was wrong).

    Analyze this text:
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
