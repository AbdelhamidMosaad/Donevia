
'use server';
/**
 * @fileOverview AI flow for generating various study materials from source text.
 * - generateStudyMaterial - A function that generates notes.
 * - StudyMaterialRequest - The input type for the generation.
 * - StudyMaterialResponse - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { StudyMaterialRequestSchema, StudyMaterialResponseSchema } from './learning-tool-flow';

// ========== Prompt Template ==========

const studyMaterialPrompt = ai.definePrompt({
  name: 'studyMaterialPrompt',
  input: { schema: StudyMaterialRequestSchema },
  output: { schema: StudyMaterialResponseSchema },
  prompt: `
You are an expert at creating educational materials. Your task is to convert the provided source text into lecture notes.

Follow these instructions precisely:
1.  **Output Format**: The output must be plain text, not markdown. Use line breaks for structure.
2.  **Note Style**: The notes must be in the "{{notesOptions.style}}" style.
3.  **Complexity**: The complexity level must be "{{notesOptions.complexity}}".
4.  **Content**: The content must be based *only* on the source text provided below. Do not add any external information.

Source Text:
---
{{sourceText}}
---
  `,
});

// ========== Flow Definition ==========

const generateStudyMaterialFlow = ai.defineFlow(
  {
    name: 'generateStudyMaterialFlow',
    inputSchema: StudyMaterialRequestSchema,
    outputSchema: StudyMaterialResponseSchema,
  },
  async (input) => {
    const { output } = await studyMaterialPrompt(input);
    if (!output) {
        throw new Error('The AI failed to generate study material. Please try again.');
    }
    // Ensure notesContent is a string, even if the AI messes up.
    if (typeof output.notesContent !== 'string') {
        output.notesContent = JSON.stringify(output.notesContent, null, 2);
    }
    return output;
  }
);

// ========== API Function Export ==========

export async function generateStudyMaterial(
  input: z.infer<typeof StudyMaterialRequestSchema>
): Promise<z.infer<typeof StudyMaterialResponseSchema>> {
  return generateStudyMaterialFlow(input);
}
