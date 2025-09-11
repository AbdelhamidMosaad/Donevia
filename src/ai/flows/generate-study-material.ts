
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

Follow these instructions precisely:

---
**Source Text:**
{{{sourceText}}}
---

**Generation Type:** {{generationType}}

{{#if notesOptions}}
---
**NOTES INSTRUCTIONS**
1. **Output Format**: Plain text only. Use line breaks for structure. No markdown symbols like # or *.
2. **Note Style**: The notes must follow this structure:

Lecture Notes: [Title]

1. Main Section Heading
- Bullet points with details
- Sub-points indented where necessary

2. Next Section Heading
- Same formatting

...
At the end:
Key Takeaways
- Summarized key points in bullet format

3. **Complexity**: Must match "{{notesOptions.complexity}}".
4. **Content**: Use only the provided source text. Do not add external content.
---
{{/if}}


{{#if quizOptions}}
---
**QUIZ INSTRUCTIONS**
1.  **Number of Questions**: Generate exactly {{quizOptions.numQuestions}} questions.
2.  **Question Types**: The quiz must include the following question types: {{#each quizOptions.questionTypes}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}.
3.  **Difficulty**: The difficulty level for the questions must be "{{quizOptions.difficulty}}".
4.  **Content**: All questions must be based *only* on the provided source text.
5.  **Explanations**: Provide a brief, clear explanation for why the correct answer is correct for every question.
6.  **Options**: For multiple-choice questions, provide exactly four options.
---
{{/if}}

{{#if flashcardsOptions}}
---
**FLASHCARDS INSTRUCTIONS**
1.  **Number of Flashcards**: Generate exactly {{flashcardsOptions.numCards}} flashcards.
2.  **Card Style**: The flashcards must be in the "{{flashcardsOptions.style}}" style.
3.  **Content**: All flashcards must be based *only* on the provided source text. Create concise terms/questions for the front and clear, comprehensive definitions/answers for the back.
---
{{/if}}
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
    // Ensure notesContent is a string if it's the output type.
    if (input.generationType === 'notes' && typeof output.notesContent !== 'string') {
        output.notesContent = JSON.stringify(output.notesContent, null, 2);
    }
    // Ensure the response has the correct materialType.
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
