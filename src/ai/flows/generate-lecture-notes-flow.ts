'use server';

/**
 * @fileOverview An AI flow for generating structured, professional lecture notes from a given text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const LectureNotesRequestSchema = z.object({
  sourceText: z.string().min(50, { message: 'Source text must be at least 50 characters.' }),
});
export type LectureNotesRequest = z.infer<typeof LectureNotesRequestSchema>;

const LectureNotesResponseSchema = z.object({
  title: z.string().describe("A concise and relevant title for the generated material."),
  learningObjectives: z.array(z.string()).describe("An array of 3-5 key learning objectives based on the source text."),
  notes: z.string().describe("The main body of the notes, structured with Markdown headings, lists, and bolded key terms."),
  learningSummary: z.string().describe("A 2-3 sentence paragraph that concisely summarizes the key takeaways of the lecture notes."),
});
export type LectureNotesResponse = z.infer<typeof LectureNotesResponseSchema>;


// ========== SINGLE COMBINED PROMPT ==========

const generateLectureNotesPrompt = ai.definePrompt({
    name: 'generateFullLectureNotesPrompt',
    input: { schema: LectureNotesRequestSchema },
    output: { schema: LectureNotesResponseSchema },
    prompt: `
        Role: Act as a Senior University Teaching Assistant and Subject Matter Expert.

        Task: Transform the provided raw content into a comprehensive set of study materials.

        Your entire output must be a single, valid JSON object that adheres to the schema.

        Instructions:

        1.  **Title**: Create a clear and descriptive title for the material.
        2.  **Learning Objectives**: Generate a list of 3-5 key learning objectives based on the source text.
        3.  **Notes**: Transform the entire source text into structured, professional lecture notes.
            -   Use Markdown headings (#, ##, ###) for a hierarchical structure.
            -   Use **bolding** for key terms and concepts.
            -   Use bullet points for lists.
            -   Ensure all topics from the source text are covered concisely.
        4.  **Learning Summary**: Write a concise 2-3 sentence summary of the main takeaways from the notes.
        
        ---
        **Source Text:**
        {{{sourceText}}}
        ---
    `
});


// ========== Flow Definition (Single-step process) ==========
const generateLectureNotesFlow = ai.defineFlow(
  {
    name: 'generateLectureNotesFlow',
    inputSchema: LectureNotesRequestSchema,
    outputSchema: LectureNotesResponseSchema,
  },
  async (input) => {
    const { output } = await generateLectureNotesPrompt(input);
    if (!output) {
      throw new Error('The AI failed to generate the lecture notes.');
    }
    return output;
  }
);

// ========== API Function Export (Server Action) ==========
export async function generateLectureNotes(
  input: LectureNotesRequest
): Promise<LectureNotesResponse> {
  try {
    const result = await generateLectureNotesFlow(input);
    return result;
  } catch (error) {
    console.error('Lecture Notes Flow Error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'An unexpected error occurred while generating notes.'
    );
  }
}
