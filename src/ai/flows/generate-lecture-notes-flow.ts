
'use server';
/**
 * @fileOverview AI flow for generating lecture notes from source text.
 * - generateLectureNotes - A function that generates notes based on style and complexity.
 * - LectureNotesRequest - The input type for the generation.
 * - LectureNotesResponse - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { LectureNotesRequestSchema, LectureNotesResponseSchema } from '@/lib/types';

// ========== Prompt Template ==========

const lectureNotesPrompt = ai.definePrompt({
  name: 'lectureNotesPrompt',
  input: { schema: LectureNotesRequestSchema },
  output: { schema: LectureNotesResponseSchema },
  prompt: `
You are an expert at creating educational materials. Your task is to convert the provided source text into structured lecture notes.

Follow these instructions precisely:
1.  **Note Style**: The output format must be in "{{style}}" format.
2.  **Complexity**: The content's complexity level must be "{{complexity}}".
    - For "Simple" complexity, use basic vocabulary and shorter sentences. Avoid jargon.
    - For "Medium" complexity, assume a baseline understanding of the topic.
    - For "Advanced" complexity, include nuanced details and technical terms where appropriate.
3.  **Content**: Focus on extracting key concepts, definitions, important facts, and logical flows from the source text. Do not add information that is not present in the text.
4.  **Structure**: Organize the content in a logical and easy-to-follow structure suitable for studying.

Source Text to be converted into lecture notes:
---
{{sourceText}}
---
  `,
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
        throw new Error('The AI failed to generate lecture notes. Please try again.');
    }
    return output;
  }
);

// ========== API Function Export ==========

export async function generateLectureNotes(
  input: z.infer<typeof LectureNotesRequestSchema>
): Promise<z.infer<typeof LectureNotesResponseSchema>> {
  return generateLectureNotesFlow(input);
}
