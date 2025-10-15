
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
You are a professional academic lecturer. Your goal is to generate exceptional study materials from a source text.
Follow these instructions precisely based on the requested 'generationType'.

---
**Source Text:**
{{{sourceText}}}
---

**Generation Type:** {{generationType}}

---
**NOTES INSTRUCTIONS**
If the generationType is 'notes', you must follow these instructions:
1.  **Title**: Create a direct and concise title for the material based on its content. Do NOT use prefixes like "Lecture Notes for..." or "University Notes on...". Just state the topic.
2.  **Output Format**: Produce a well-structured JSON output. Do not use Markdown for formatting within the JSON fields, but you MUST wrap key terms with **markdown bold**.
3.  **Introduction**: Start with a concise introductory paragraph in the 'introduction' field that provides context for the entire text.
4.  **Structure**:
    -   Create distinct sections for each major topic. Each section should have a clear 'heading'.
    -   For each section, provide the main content as an array of 'content' blocks.
    -   Where appropriate, break down complex sections into smaller 'subsections', each with its own 'subheading' and 'content' blocks.
5.  **Content Style (CRITICAL)**:
    -   You MUST use a mix of content block types: 'paragraph', 'bullet-list', and 'numbered-list'.
    -   Use 'paragraph' for explanatory text and general descriptions. The 'content' field for a paragraph should be a single string.
    -   Use 'bullet-list' ONLY for unordered lists of items (e.g., characteristics, examples). The 'content' field for a list must be an array of strings.
    -   Use 'numbered-list' ONLY for sequential steps or ordered items. The 'content' field for a list must be an array of strings.
    -   **DO NOT** create a list where every item is a full paragraph. Combine related sentences into a single, coherent 'paragraph' block. Use lists for concise points.
    -   The note style should be '{{notesOptions.style}}' and complexity must match '{{notesOptions.complexity}}'.
6.  **Key Points**: In each section or subsection's content, identify 1-2 "key points" that are critical to understand. For these specific content blocks, set the 'isKeyPoint' flag to true.
7.  **Tables**: If the source text contains tabular data, you MUST represent it as a table in your JSON output. Fill the 'table' field for the relevant section or subsection.
8.  **Source Adherence**: Use only the provided source text. Do not add external content.

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
