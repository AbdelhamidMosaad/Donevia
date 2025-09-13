
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
You are a professional academic lecturer. Generate lecture notes for a university-level from the provided text.The notes should be structured, easy to read, and highlight key terms.
Follow these instructions precisely based on the requested 'generationType'.

---
**Source Text:**
{{{sourceText}}}
---

**Generation Type:** {{generationType}}

---
**NOTES INSTRUCTIONS**
If the generation type is 'notes', you must follow these instructions:
1. **Output Format**: You must produce a structured JSON output. Do not use Markdown.
2. **Icons**: For the main title, and each section and subsection, you MUST select a relevant emoji from this list: [📌, 📚, 💡, 📋, ✨, 🚀, ❓] and place it in the 'icon' field.
3. **Key Points**: For each section's content, identify 1-2 "key points" that are critical to understand. For these specific bullet points, set the 'isKeyPoint' flag to true and assign a relevant emoji from the list to the 'icon' field. For all other points, do not set these fields.
4. **Note Style**: The notes must follow the structure requested in 'notesOptions.style' and be formatted like professional lecture notes.
5. **Complexity**: Must match "{{notesOptions.complexity}}".
6. **Content**: Use only the provided source text. Do not add external content.
7. **Structure**: The notes should start with a clear, concise title and an introductory summary. Use distinct headings for each major topic covered in the source text. Use bold text to highlight key terms and concepts, and use bullet points to break down complex information into digestible points.
8. **Tone**: Adopt a tone appropriate for a university-level lecture, making the content easy to understand and follow.

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
