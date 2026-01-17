
'use server';

/**
 * @fileOverview An AI flow for generating structured, professional lecture notes from a given text.
 */

import { ai } from '@/ai/genkit';
import { LectureNotesRequestSchema, LectureNotesResponseSchema, type LectureNotesRequest, type LectureNotesResponse } from '@/lib/types/lecture-notes';


// ========== Prompt Definition ==========

const lectureNotesPrompt = ai.definePrompt({
    name: 'generateLectureNotesPrompt',
    input: { schema: LectureNotesRequestSchema },
    output: { schema: LectureNotesResponseSchema },
    model: 'googleai/gemini-2.5-flash',
    prompt: `
        Role: Act as a Senior University Teaching Assistant and Subject Matter Expert.

        Task: Transform the provided raw content into a structured, professional set of lecture notes.
        Your entire output must be a single, well-formatted Markdown string.

        Core Instructions:
        1.  **Title**: Create a clear and descriptive title for the material.
        2.  **Coverage**: You MUST process the entire source text. Your primary goal is to ensure all topics are covered.
        3.  **Conciseness**: Summarize points and avoid verbose explanations. Your goal is to be thorough but brief.
        4.  **Structure and Formatting**:
            -   Use Markdown headings (#, ##, ###) for a hierarchical structure.
            -   Use **bolding** for key terms and concepts.
            -   Use bullet points for lists.
        
        ---
        **Source Text:**
        {{{sourceText}}}
        ---
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
    const { output } = await lectureNotesPrompt(input);
    if (!output) {
      throw new Error('The AI failed to generate lecture notes.');
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
