'use server';
/**
 * @fileOverview Learning content generation AI flow.
 *
 * - generateLearningContent - A function that generates learning materials from source text.
 * - LearningContentRequest - The input type for the generation.
 * - GeneratedLearningContent - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// ========== Zod Schemas ==========

const QuizQuestionSchema = z.object({
  question: z.string().describe('The question being asked.'),
  type: z.enum(['multiple-choice', 'true-false', 'short-answer']).describe('The type of question.'),
  options: z.array(z.string()).optional().describe('A list of possible answers for multiple-choice questions.'),
  answer: z.string().describe('The correct answer to the question.'),
  explanation: z.string().describe('A brief explanation of why the answer is correct.'),
});

const GeneratedLearningContentSchema = z.object({
  lectureNotes: z.string().optional().describe('Well-structured, comprehensive lecture notes in Markdown format. Use headings, lists, and bold text for clarity.'),
  quiz: z.array(QuizQuestionSchema).optional().describe('An array of quiz questions based on the provided options.'),
  flashcards: z.array(z.object({
    front: z.string().describe('The front of the flashcard, typically a term or concept.'),
    back: z.string().describe('The back of the flashcard, typically the definition or explanation.'),
  })).optional().describe('An array of flashcards.'),
});

const LearningContentRequestSchema = z.object({
  context: z.string().describe('The source text from which to generate learning materials.'),
  type: z.enum(['notes', 'quiz', 'flashcards']),
  quizOptions: z.object({
    numQuestions: z.number().int().min(1).max(25),
    questionTypes: z.array(z.enum(['multiple-choice', 'true-false', 'short-answer'])),
  }).optional(),
});

// ========== Prompt Template ==========

const learningContentPrompt = ai.definePrompt({
  name: 'learningContentPrompt',
  input: { schema: LearningContentRequestSchema },
  output: { schema: GeneratedLearningContentSchema },
  prompt: `
You are an expert instructional designer. Your task is to generate learning materials based on the provided text and user request.

Generate the content for the following type: {{{type}}}.

{{#if (eq type "quiz")}}
Create a quiz with {{quizOptions.numQuestions}} questions.
The quiz should include the following types of questions: {{#each quizOptions.questionTypes}}- {{this}} {{/each}}.
Ensure questions cover the key concepts in the text and that answers are accurate.
{{/if}}

{{#if (eq type "notes")}}
Create a comprehensive set of lecture notes in Markdown format. Organize the content logically with headings, subheadings, bullet points, and bolded keywords.
{{/if}}

{{#if (eq type "flashcards")}}
Create a set of flashcards covering the key terms and concepts from the text.
{{/if}}

Source Text:
---
{{{context}}}
---
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
    try {
      const { output } = await ai.generate({
        prompt: learningContentPrompt,
        model: 'googleai/gemini-pro',
        input,
        config: {
          temperature: 0.5,
        },
      });
      if (!output) {
        throw new Error('AI did not return any content.');
      }
      // Optional: Validate the output with schema for extra safety
      const parsedOutput = GeneratedLearningContentSchema.safeParse(output);
      if (!parsedOutput.success) {
        throw new Error(`Invalid AI output format: ${JSON.stringify(parsedOutput.error.issues)}`);
      }
      return parsedOutput.data;
    } catch (err) {
      // Log the error for debugging and re-throw a user-friendly error
      console.error('Error in generateLearningContentFlow:', err);
      throw new Error(
        err instanceof Error
          ? `Failed to generate learning content: ${err.message}`
          : 'Failed to generate learning content due to an unknown error.'
      );
    }
  }
);

// ========== API Function Export ==========

export async function generateLearningContent(
  input: z.infer<typeof LearningContentRequestSchema>
): Promise<z.infer<typeof GeneratedLearningContentSchema>> {
  return generateLearningContentFlow(input);
}