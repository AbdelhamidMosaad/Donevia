
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
    model: 'googleai/gemini-2.5-flash',
    prompt: `
        Role: Act as a Senior University Teaching Assistant and Subject Matter Expert.

        Task: Transform the provided raw content into a structured, professional set of lecture notes.
        Your entire output must be a single, well-formatted Markdown string.

        Core Instructions:
        1.  **Comprehensive Coverage**: You MUST process the entire source text. Your primary goal is to ensure all topics are covered.
        2.  **Conciseness**: Summarize points and avoid verbose explanations. Your goal is to be thorough but brief.
        3.  **Structure and Formatting**:
            -   Create a clear and descriptive title for the material.
            -   Use Markdown headings (#, ##, ###) for a hierarchical structure.
            -   Use **bolding** for key terms and concepts.
            -   Use bullet points for lists.
        
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
    model: 'googleai/gemini-2.5-flash',
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
    if (!coreResult.output) {
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
