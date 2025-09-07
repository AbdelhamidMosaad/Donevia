
'use server';
/**
 * @fileOverview AI flow for generating various types of learning materials.
 *
 * - generateLearningContent - A function that generates notes, quizzes, or flashcards.
 * - LearningContentRequest - The input type for the generation.
 * - GeneratedLearningContent - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { LearningContentRequestSchema, GeneratedLearningContentSchema, LearningContentRequest } from '@/lib/types';


// ========== Prompt Template ==========

const learningContentPrompt = ai.definePrompt({
  name: 'learningContentPrompt',
  input: { schema: LearningContentRequestSchema },
  output: { schema: GeneratedLearningContentSchema },
  prompt: `
You are an expert instructional designer. Your task is to generate high-quality learning materials based on the provided text context.

The user has requested the following type of content: {{type}}

{{#if (eq type 'notes')}}
Please generate comprehensive, well-structured lecture notes from the context below. The notes should be in Markdown format.
- Use headings (#, ##, ###) for topics and sub-topics.
- Use bullet points (-) for key information.
- Use bold text (**) to highlight important terms.
- Summarize complex ideas into clear, concise points.
{{/if}}

{{#if (eq type 'quiz')}}
Please generate a quiz based on the context below.
- Create exactly {{quizOptions.numQuestions}} questions.
- The question types should be a mix of the following: {{#each quizOptions.questionTypes}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}.
- For each question, provide the question, the type, options (for multiple-choice), the correct answer, and a brief explanation for the answer.
- Ensure the questions cover a range of topics from the text and vary in difficulty.
{{/if}}

{{#if (eq type 'flashcards')}}
Please generate a set of flashcards from the context below.
- Each flashcard should have a 'front' (a key term or concept) and a 'back' (a concise definition or explanation).
- Aim for at least 10-15 high-quality flashcards.
- The flashcards should focus on the most important vocabulary and concepts from the text.
{{/if}}

--- TEXT CONTEXT ---
{{{context}}}
--- END CONTEXT ---
`,
});


// ========== Flow Definition ==========

const generateLearningContentFlow = ai.defineFlow(
  {
    name: 'generateLearningContentFlow',
    inputSchema: LearningContentRequestSchema,
    outputSchema: GeneratedLearningContentSchema,
  },
  async (input) => {
    const { output } = await learningContentPrompt(input);
    if (!output) {
        throw new Error('The AI failed to generate learning content. Please try again.');
    }
    return output;
  }
);


// ========== API Function Export ==========

export async function generateLearningContent(
  input: LearningContentRequest
): Promise<z.infer<typeof GeneratedLearningContentSchema>> {
  return generateLearningContentFlow(input);
}
