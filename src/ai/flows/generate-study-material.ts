
'use server';
/**
 * @fileOverview AI flow for generating various study materials from source text.
 * - generateStudyMaterial - A function that generates notes, quizzes, etc.
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
You are an expert at creating educational materials. Your task is to convert the provided source text into the specified format.

Follow these instructions precisely based on the requested 'generationType'.

---
**Source Text:**
{{{sourceText}}}
---

**Generation Type:** {{generationType}}

---
**NOTES INSTRUCTIONS**
If the generation type is 'notes', you must follow these instructions:
1. **Output Format**: Plain text only. Use line breaks for structure. No markdown symbols like # or *.
2. **Note Style**: The notes must follow the structure requested in 'notesOptions.style'.
3. **Complexity**: Must match "{{notesOptions.complexity}}".
4. **Content**: Use only the provided source text. Do not add external content.

---
**QUIZ INSTRUCTIONS**
If the generation type is 'quiz', you must follow these instructions:
1.  **Number of Questions**: Generate exactly {{quizOptions.numQuestions}} questions.
2.  **Question Types**: The quiz must include the following question types: {{#each quizOptions.questionTypes}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}.
3.  **Difficulty**: The difficulty level for the questions must be "{{quizOptions.difficulty}}".
4.  **Content**: All questions must be based *only* on the provided source text.
5.  **Explanations**: Provide a brief, clear explanation for why the correct answer is correct for every question.
6.  **Options**: For multiple-choice questions, provide exactly four options.

---
**FLASHCARDS INSTRUCTIONS**
If the generation type is 'flashcards', you must follow these instructions:
1.  **Number of Flashcards**: Generate exactly {{flashcardsOptions.numCards}} flashcards.
2.  **Card Style**: The flashcards must be in the "{{flashcardsOptions.style}}" style.
3.  **Content**: All flashcards must be based *only* on the provided source text. Create concise terms/questions for the front and clear, comprehensive definitions/answers for the back.
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
    
    // The AI model should correctly set the materialType based on the prompt.
    // This is a fallback to ensure it's always set.
    if (!output.materialType) {
        output.materialType = input.generationType;
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
