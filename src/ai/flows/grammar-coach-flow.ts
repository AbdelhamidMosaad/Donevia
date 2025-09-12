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
    Your task is to analyze the provided text and return a JSON object.

    The JSON object must have two keys:
    1.  "corrected_text": A string containing the fully corrected and polished version of the entire text.
    2.  "errors": An array of objects. Each object must detail a specific error and have three keys:
        - "original": The exact incorrect word or phrase.
        - "correction": The suggested fix.
        - "explanation": A brief, clear explanation of the mistake and correction.

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
