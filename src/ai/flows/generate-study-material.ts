
'use server';
/**
 * @fileOverview AI flow for generating various study materials from source text.
 * - generateStudyMaterial - A function that generates quizzes, etc.
 * - StudyMaterialRequest - The input type for the generation.
 * - StudyMaterialResponse - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { StudyMaterialRequestSchema, StudyMaterialResponseSchema } from './studying-assistant-flow';

// ========== Prompt Template ==========

const studyMaterialPrompt = ai.definePrompt({
  name: 'studyMaterialPrompt',
  input: { schema: StudyMaterialRequestSchema },
  output: { schema: StudyMaterialResponseSchema },
  prompt: `
You are a professional academic lecturer. Your goal is to generate exceptional study materials from a source text.
Follow these instructions precisely based on the requested 'generationType'.

---
**Source Text:**
{{{sourceText}}}
---

**Generation Type:** {{generationType}}

---
**QUIZ INSTRUCTIONS**
If the generationType is 'quiz', you must follow these instructions:
1.  **Number of Questions**: Generate exactly {{quizOptions.numQuestions}} questions.
2.  **Question Types**: The quiz must include the following question types: {{#each quizOptions.questionTypes}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}.
3.  **Difficulty**: The difficulty level for the questions must be "{{quizOptions.difficulty}}".
4.  **Content**: All questions must be based *only* on the provided source text.
5.  **Explanations**: Provide a brief, clear explanation for why the correct answer is correct for every question.
6.  **Clarity and Independence**: This is a critical rule. The generated questions and explanations must be completely self-contained. They MUST NOT refer to "the provided text", "the passage", "the article", "the lecture", or any similar phrases. The user should be able to understand and answer the question without any context about where it came from. For example, instead of "According to the text, what is the capital of France?", the question must be "What is the capital of France?".

---
**FLASHCARDS INSTRUCTIONS**
If the generationType is 'flashcards', you must follow these instructions:
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
        throw new Error('The AI failed to generate study material. The provided text might be too short or unclear. Please try again with different content.');
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
