
'use server';
/**
 * @fileOverview An AI flow for summarizing a collection of journal entries.
 * - summarizeJournalEntries - A function that uses Gemini to generate a summary.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const JournalEntryInputSchema = z.object({
  date: z.string().describe("The date of the entry in 'YYYY-MM-DD' format."),
  content: z.string().describe("The text content of the journal entry."),
});

const JournalSummaryRequestSchema = z.object({
  entries: z.array(JournalEntryInputSchema).describe("An array of journal entries to be summarized."),
});

const JournalSummaryResponseSchema = z.object({
  summary: z.string().describe("A 3-4 sentence summary of the themes, moods, and key events from the provided journal entries."),
  keyThemes: z.array(z.string()).describe("A list of 3-5 key themes or recurring topics found in the entries."),
});

export type JournalSummaryResponse = z.infer<typeof JournalSummaryResponseSchema>;


const prompt = ai.definePrompt({
  name: 'journalSummaryPrompt',
  input: { schema: JournalSummaryRequestSchema },
  output: { schema: JournalSummaryResponseSchema },
  prompt: `
    You are a reflective and insightful assistant. You will be given a series of journal entries.
    
    Your task is to:
    1.  Read all the entries and generate a concise summary (3-4 sentences) that captures the main moods, events, and feelings expressed during this period.
    2.  Identify 3-5 recurring key themes or topics from the entries.

    Journal Entries:
    ---
    {{#each entries}}
    Date: {{date}}
    {{content}}
    ---
    {{/each}}
  `,
});

export async function summarizeJournalEntries(
  input: z.infer<typeof JournalSummaryRequestSchema>
): Promise<JournalSummaryResponse> {
  const { output } = await prompt(input);
   if (!output) {
      throw new Error('The AI failed to generate a summary.');
    }
  return output;
}
