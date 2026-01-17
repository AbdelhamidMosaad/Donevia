'use server';

/**
 * @fileOverview An AI flow for generating structured, professional lecture notes from a given text.
 * This flow uses a two-step process to handle large documents:
 * 1. Generate a high-level outline.
 * 2. Generate detailed notes for each section of the outline.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { 
    LectureNotesRequestSchema, 
    LectureNotesResponseSchema, 
    LectureOutlineSchema,
    type LectureNotesRequest, 
    type LectureNotesResponse 
} from '@/lib/types/lecture-notes';

// ========== Step 1: Outline Generation Prompt ==========

const outlinePrompt = ai.definePrompt({
    name: 'generateLectureOutlinePrompt',
    input: { schema: LectureNotesRequestSchema },
    output: { schema: LectureOutlineSchema },
    prompt: `
        Role: Act as a content structurer.

        Task: Read the entire provided source text and create a high-level outline.
        
        Instructions:
        1.  **Create a Title**: Generate a concise, descriptive title for the entire text.
        2.  **Identify Main Sections**: Break down the content into logical main sections. Create a list of 3-7 section titles.
        3.  **Ensure Full Coverage**: The sections combined must cover the entire scope of the source text.
        
        ---
        **Source Text:**
        {{{sourceText}}}
        ---
    `
});

// ========== Step 2: Section Notes Generation Prompt ==========

const SectionNotesRequestSchema = z.object({
    sourceText: z.string(),
    sectionTitle: z.string(),
});

const sectionNotesPrompt = ai.definePrompt({
    name: 'generateSectionNotesPrompt',
    input: { schema: SectionNotesRequestSchema },
    output: { schema: z.object({ sectionNotes: z.string().describe("The detailed markdown notes for the requested section.") }) },
    prompt: `
        Role: Act as a Senior University Teaching Assistant and Subject Matter Expert.

        Task: From the full source text provided, generate detailed, professional lecture notes *only* for the specified section.

        **CRITICAL INSTRUCTION**: Focus exclusively on the content relevant to the section titled "{{sectionTitle}}". Do not include a title for the section itself; just begin writing the notes for it. Use subheadings (##, ###) as needed within the section.

        Core Note-Taking Rules:
        -   Summarize points concisely.
        -   Use **bolding** for key terms.
        -   Use bullet points for lists.

        ---
        **Full Source Text (for context):**
        {{{sourceText}}}
        ---
    `
});

// ========== Main Flow Definition ==========

const generateLectureNotesFlow = ai.defineFlow(
  {
    name: 'generateLectureNotesFlow',
    inputSchema: LectureNotesRequestSchema,
    outputSchema: LectureNotesResponseSchema,
  },
  async (input) => {
    // Step 1: Generate the outline
    const outlineResponse = await outlinePrompt(input);
    if (!outlineResponse.output || !outlineResponse.output.sections) {
      throw new Error('The AI failed to generate a document outline.');
    }
    const { title, sections } = outlineResponse.output;

    // Step 2: Generate notes for each section sequentially to avoid rate limiting
    const generatedSections = [];
    for (const sectionTitle of sections) {
        const sectionResponse = await sectionNotesPrompt({
            sourceText: input.sourceText,
            sectionTitle,
        });
        generatedSections.push(`## ${sectionTitle}\n\n${sectionResponse.output?.sectionNotes || ''}`);
    }

    // Step 3: Combine all sections into a single markdown string
    const finalNotes = generatedSections.join('\n\n');

    return { title, notes: finalNotes };
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
    // Provide a more user-friendly error message
    throw new Error(
      error instanceof Error 
      ? `AI processing failed: ${error.message}. The document might be too complex or in an unsupported format.`
      : 'An unexpected error occurred while generating notes.'
    );
  }
}
