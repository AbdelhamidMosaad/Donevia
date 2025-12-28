
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
  notes: z.string().describe("The main body of the notes, structured with Markdown headings, lists, and bolded key terms."),
});
export type LectureNotesResponse = z.infer<typeof LectureNotesResponseSchema>;

// ========== Prompt Template ==========
const lectureNotesPrompt = ai.definePrompt({
    name: 'lectureNotesPrompt',
    input: { schema: LectureNotesRequestSchema },
    output: { schema: LectureNotesResponseSchema },
    prompt: `
    Role: Act as a Senior University Teaching Assistant and Subject Matter Expert.

    Task: Transform the provided raw content into a structured, professional set of lecture notes suitable for an executive-level or graduate-level course.

    Formatting Requirements:
    1. **Title**: Create a clear and descriptive title.
    2. **Hierarchical Structure**: Use Markdown headings (#, ##, ###).
    3. **Best Practices**: Group procedural lists into a strategic section.
    4. **Visual Placeholders**: Include [Diagram: Description] for trends or processes.
    
    Tone and Style:
    * Objective and professional.
    * Use **bolding** for key terms.
    * Use bullet points for complex procedures.

    Source Text:
    {{sourceText}}
  `
});

// ========== Flow Definition ==========
const generateLectureNotesFlow = ai.defineFlow(
  {
    name: 'generateLectureNotesFlow',
    inputSchema: LectureNotesRequestSchema,
    outputSchema: LectureNotesResponseSchema,
  },
  async (input) => {
    // Calling the prompt and awaiting the response
    const { output } = await lectureNotesPrompt(input);
    
    if (!output) {
      throw new Error('The AI failed to generate structured output.');
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
