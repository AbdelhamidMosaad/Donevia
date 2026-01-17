
'use server';

/**
 * @fileOverview An AI flow for generating structured, professional lecture notes from a given text.
 */

import { ai } from '@/ai/genkit';
import { LectureNotesRequestSchema, LectureNotesResponseSchema, type LectureNotesRequest, type LectureNotesResponse } from '@/lib/types/lecture-notes';


// ========== STEP 1: Generate Core Notes ==========

const CoreNotesSchema = LectureNotesResponseSchema.pick({ title: true, notes: true });

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
        1.  **Coverage**: You MUST process the entire source text. Your primary goal is to ensure all topics are covered.
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

const SummaryRequestSchema = LectureNotesResponseSchema.pick({ notes: true });
const SummaryResponseSchema = LectureNotesResponseSchema.pick({ learningObjectives: true, learningSummary: true });


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

    // Step 3: Combine and return the final result.
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
