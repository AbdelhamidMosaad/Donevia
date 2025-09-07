
'use server';
/**
 * @fileOverview AI flow for generating various study materials from source text.
 * - generateStudyMaterial - A function that generates quizzes, flashcards, or notes.
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
You are an expert at creating educational materials. Your task is to convert the provided source text into the specified type of study material.

Follow these instructions precisely:
1.  **Material Type**: The output must be a "{{generationType}}".
2.  **Source Text**: The content must be based *only* on the following text. Do not add external information.
3.  **For Quizzes**:
    - Generate exactly {{quizOptions.numQuestions}} questions.
    - Include the following question types: {{quizOptions.questionTypes}}.
    - The difficulty level should be "{{quizOptions.difficulty}}".
    - For each question, provide a brief but clear explanation for the correct answer.
4.  **For Flashcards**:
    - Generate a set of flashcards covering the key concepts.
    - Each flashcard should have a 'term' and a 'definition'.
5.  **For Notes**:
    - The notes style must be "{{notesOptions.style}}".
    - The complexity level must be "{{notesOptions.complexity}}".

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
    return output;
  }
);

// ========== API Function Export ==========

export async function generateStudyMaterial(
  input: z.infer<typeof StudyMaterialRequestSchema>
): Promise<z.infer<typeof StudyMaterialResponseSchema>> {
  return generateStudyMaterialFlow(input);
}
