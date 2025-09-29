
'use server';
/**
 * @fileOverview An AI flow for analyzing a journal entry.
 * - analyzeJournalEntry - A function that uses Gemini to check grammar, and analyze tone.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const JournalAnalysisRequestSchema = z.object({
  text: z.string().describe("The user's journal entry text."),
});

const GrammarErrorSchema = z.object({
  original: z.string().describe("The incorrect phrase."),
  correction: z.string().describe("The corrected version."),
});

const JournalAnalysisResponseSchema = z.object({
  grammar: z.array(GrammarErrorSchema).describe("An array of grammar corrections."),
  tone: z.string().describe("A one-word description of the overall tone (e.g., 'Reflective', 'Anxious', 'Joyful')."),
  suggestions: z.array(z.string()).describe("A few suggestions for cleaner or more expressive writing."),
});

export type JournalAnalysisResponse = z.infer<typeof JournalAnalysisResponseSchema>;


const prompt = ai.definePrompt({
  name: 'journalAnalysisPrompt',
  input: { schema: JournalAnalysisRequestSchema },
  output: { schema: JournalAnalysisResponseSchema },
  prompt: `
    You are an empathetic writing coach. Analyze the user's journal entry.

    1.  **Check Grammar**: Identify any grammatical errors. For each error, provide the original phrase and a corrected version. If there are no errors, return an empty array for 'grammar'.
    2.  **Analyze Tone**: Describe the overall tone of the entry in a single word (e.g., Reflective, Optimistic, Frustrated).
    3.  **Provide Suggestions**: Offer 2-3 brief, constructive suggestions to improve the writing's clarity or emotional expression.

    User's journal entry:
    ---
    {{{text}}}
    ---
  `,
});

export async function analyzeJournalEntry(
  input: z.infer<typeof JournalAnalysisRequestSchema>
): Promise<JournalAnalysisResponse> {
  const { output } = await prompt(input);
    if (!output) {
      throw new Error('The AI failed to analyze the journal entry.');
    }
  return output;
}
