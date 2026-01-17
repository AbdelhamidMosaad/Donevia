
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


// ========== STEP 1: Generate Core Notes ==========

const CoreNotesSchema = z.object({
    title: z.string().describe("A concise and relevant title for the generated material."),
    notes: z.string().describe("The main body of the notes, structured with Markdown headings, lists, and bolded key terms."),
});

const coreNotesPrompt = ai.definePrompt({
    name: 'coreLectureNotesPrompt',
    input: { schema: LectureNotesRequestSchema },
    output: { schema: CoreNotesSchema },
    prompt: `
        Your task is to transform the provided source text into a complete and well-structured set of academic lecture notes.

        **Instructions:**
        1.  **Generate a Title**: Create a concise and descriptive title for the lecture notes.
        2.  **Structure the Content**: Organize the information using a clear hierarchy with Markdown headings (#, ##, ###).
        3.  **Format for Clarity**:
            *   Use **bold formatting** for all key terms, definitions, and important concepts.
            *   Use bullet points for lists, steps, or features.
        4.  **Ensure Completeness**: You MUST process the entire source text from beginning to end. Do not omit any sections or concepts. Your output must not be truncated.

        The final output should be a professional, easy-to-read document ready for distribution. Do not add any information that is not present in the source text.

        ---
        **Source Text:**
        {{{sourceText}}}
        ---
    `
});

// ========== STEP 2: Generate Summary and Objectives from Notes ==========

const SummaryRequestSchema = z.object({
    notes: z.string(),
});

const SummaryResponseSchema = z.object({
    learningObjectives: z.array(z.string()).describe("An array of 3-5 key learning objectives based on the provided notes."),
    learningSummary: z.string().describe("A 2-3 sentence paragraph that concisely summarizes the key takeaways of the notes."),
});

const summaryPrompt = ai.definePrompt({
    name: 'lectureSummaryPrompt',
    input: { schema: SummaryRequestSchema },
    output: { schema: SummaryResponseSchema },
    prompt: `
        Based on the following lecture notes, please generate:
        1. A list of 3-5 key learning objectives.
        2. A concise 2-3 sentence summary of the main takeaways.

        ---
        **Lecture Notes:**
        {{{notes}}}
        ---
    `
});


// ========== Flow Definition (Two-step process) ==========
const generateLectureNotesFlow = ai.defineFlow(
  {
    name: 'generateLectureNotesFlow',
    inputSchema: LectureNotesRequestSchema,
    outputSchema: LectureNotesResponseSchema,
  },
  async (input) => {
    // Step 1: Generate the core title and notes.
    const coreResult = await coreNotesPrompt(input);
    if (!coreResult.output || !coreResult.output.notes) {
      throw new Error('The AI failed to generate the core lecture notes.');
    }
    const { title, notes } = coreResult.output;

    // Step 2: Generate summary and objectives from the notes.
    const summaryResult = await summaryPrompt({ notes });
     if (!summaryResult.output) {
      throw new Error('The AI failed to generate the summary and objectives.');
    }
    const { learningObjectives, learningSummary } = summaryResult.output;

    // Combine results and return
    return {
      title,
      notes,
      learningObjectives,
      learningSummary,
    };
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

