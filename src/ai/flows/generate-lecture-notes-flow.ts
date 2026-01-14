
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
  learningSummary: z.string().describe("A 2-3 sentence paragraph that concisely summarizes the key takeaways of the lecture notes."),
});
export type LectureNotesResponse = z.infer<typeof LectureNotesResponseSchema>;

// ========== Prompt Template ==========
const lectureNotesPrompt = ai.definePrompt({
    name: 'lectureNotesPrompt',
    input: { schema: LectureNotesRequestSchema },
    output: { schema: LectureNotesResponseSchema },
    model: 'googleai/gemini-2.5-flash',
    prompt: `
    Role: Act as a Senior University Teaching Assistant and Subject Matter Expert.

    Task: Transform the provided raw content into a structured, professional set of lecture notes suitable for an executive-level or graduate-level course.

    Core Instructions:
    1.  **Comprehensive Coverage**: You MUST process the entire source text provided below. Your primary goal is to ensure all topics mentioned in the input are covered in the output.
    2.  **Conciseness is Key**: To avoid being cut off, be concise. Summarize points and avoid verbose explanations. Your goal is to be thorough but brief.
    3.  **Structure and Formatting**:
        -   Create a clear and descriptive title.
        -   Use Markdown headings (#, ##, ###) for a hierarchical structure.
        -   Use **bolding** for key terms and concepts.
        -   Use bullet points for lists and complex procedures.
        -   Where a diagram would be useful, include a placeholder like [Diagram: A flowchart illustrating the process].

    4.  **Learning Summary**: At the very end of the notes, add a "## Learning Summary" section. This section must contain a 2-3 sentence paragraph that concisely summarizes the key takeaways of the entire text. Place this summary text into the 'learningSummary' output field.

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
