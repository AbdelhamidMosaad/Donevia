'use server';

/**
 * @fileOverview An AI flow for generating structured, professional lecture notes from a given text.
 * This flow uses an iterative, chunk-based approach to handle large inputs safely.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { 
    LectureNotesRequestSchema, 
    LectureNotesResponseSchema, 
    type LectureNotesRequest, 
    type LectureNotesResponse 
} from '@/lib/types/lecture-notes';


// ========== Internal Schemas for Chunked Generation ==========

const ContinueNotesRequestSchema = z.object({
    sourceText: z.string(),
    existingNotes: z.string().describe("The notes that have been generated so far. This will be empty on the first run."),
});

const ContinueNotesResponseSchema = z.object({
    notesChunk: z.string().describe("The next chunk of notes, formatted in Markdown. This should be a logical continuation of the existing notes."),
    isComplete: z.boolean().describe("Set to true only when the entire source text has been fully processed and no more notes need to be written."),
});

const FinalSummaryRequestSchema = z.object({
    notes: z.string(),
});

const FinalSummaryResponseSchema = z.object({
    title: z.string().describe("A concise and relevant title for the generated material."),
    learningObjectives: z.array(z.string()).describe("An array of 3-5 key learning objectives based on the notes."),
    learningSummary: z.string().describe("A 2-3 sentence paragraph that concisely summarizes the main takeaways."),
});

// ========== Internal Prompts for Flow Logic ==========

const continueNotesPrompt = ai.definePrompt({
    name: 'continueLectureNotesPrompt',
    model: 'googleai/gemini-2.0-flash',
    input: { schema: ContinueNotesRequestSchema },
    output: { schema: ContinueNotesResponseSchema },
    prompt: `
        You are an expert at creating structured, academic lecture notes from a source text.
        
        Your task is to analyze the full source text and the notes generated so far, and then write the *next* logical section of the notes.
        
        **Instructions:**
        1.  **Analyze**: Review the \`sourceText\` and the \`existingNotes\` to understand what has already been covered.
        2.  **Continue**: Identify the next main topic or section from the source text that needs to be documented.
        3.  **Generate Chunk**: Write the notes for that section only. Use clear Markdown formatting (headings, lists, bolding for key terms).
        4.  **Do Not Repeat**: Crucially, do not repeat any information that is already present in the \`existingNotes\`.
        5.  **Check for Completion**: After generating the chunk, decide if the *entire* source text has now been covered.
            - If yes, set \`isComplete\` to \`true\`.
            - If there is more content to process, set \`isComplete\` to \`false\`.

        ---
        **Full Source Text:**
        {{{sourceText}}}
        ---
        **Existing Notes (what you've written so far):**
        {{{existingNotes}}}
        ---
    `
});

const finalSummaryPrompt = ai.definePrompt({
    name: 'finalSummaryPrompt',
    model: 'googleai/gemini-2.0-flash',
    input: { schema: FinalSummaryRequestSchema },
    output: { schema: FinalSummaryResponseSchema },
    prompt: `
        Based on the complete set of lecture notes provided below, please generate the following:
        1.  **Title**: A concise and relevant title for the entire lecture.
        2.  **Learning Objectives**: A list of 3-5 key learning objectives that a student should achieve after reviewing these notes.
        3.  **Learning Summary**: A 2-3 sentence paragraph that concisely summarizes the main takeaways.

        ---
        **Complete Lecture Notes:**
        {{{notes}}}
        ---
    `
});


// ========== Flow Definition (Iterative Process) ==========

const generateLectureNotesFlow = ai.defineFlow(
  {
    name: 'generateLectureNotesFlow',
    inputSchema: LectureNotesRequestSchema,
    outputSchema: LectureNotesResponseSchema,
  },
  async (input) => {
    let allNotes = '';
    let isComplete = false;
    const MAX_ITERATIONS = 8; // Safety break to prevent infinite loops

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const result = await continueNotesPrompt({
            sourceText: input.sourceText,
            existingNotes: allNotes,
        });

        if (result.output) {
            allNotes += result.output.notesChunk + '\n\n';
            isComplete = result.output.isComplete;
        }

        if (isComplete) {
            break; // Exit loop if AI signals completion
        }
    }

    if (!isComplete) {
        console.warn('Lecture notes generation may have been truncated (max iterations reached).');
    }

    // Once all note chunks are assembled, generate the final summary and title.
    const finalSummaryResult = await finalSummaryPrompt({ notes: allNotes });

    if (!finalSummaryResult.output) {
        throw new Error('The AI failed to generate the final summary and title.');
    }

    // Combine results and return in the expected public format
    return {
      title: finalSummaryResult.output.title,
      notes: allNotes.trim(),
      learningObjectives: finalSummaryResult.output.learningObjectives,
      learningSummary: finalSummaryResult.output.learningSummary,
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
