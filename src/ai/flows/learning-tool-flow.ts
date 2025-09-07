
'use server';

/**
 * @fileOverview An AI agent for generating learning materials.
 *
 * - generateLearningContent - A function that handles the generation process.
 * - LearningContentRequest - The input type for the generation function.
 * - GeneratedLearningContent - The return type for the generation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { QuizQuestion, Flashcard } from '@/lib/types';

// Input Schema
const LearningContentRequestSchema = z.object({
  context: z.string().describe('The source text from which to generate the learning materials.'),
  generateNotes: z.boolean().describe('Whether to generate lecture notes.'),
  generateQuiz: z.boolean().describe('Whether to generate a quiz.'),
  generateFlashcards: z.boolean().describe('Whether to generate flashcards.'),
  quizType: z.enum(['multiple-choice', 'true-false', 'short-answer']).describe('The type of quiz questions to generate.'),
  numQuestions: z.number().int().min(1).max(20).describe('The number of quiz questions to generate.'),
});
export type LearningContentRequestInternal = z.infer<typeof LearningContentRequestSchema>;

// Output Schema
const QuizQuestionSchema = z.object({
  question: z.string().describe('The quiz question.'),
  options: z.array(z.string()).optional().describe('A list of options for multiple-choice questions.'),
  answer: z.string().describe('The correct answer to the question.'),
  explanation: z.string().describe('A brief explanation for why the answer is correct.'),
});

const FlashcardSchema = z.object({
  front: z.string().describe('The front side of the flashcard (e.g., a term or a question).'),
  back: z.string().describe('The back side of the flashcard (e.g., the definition or the answer).'),
});

const GeneratedLearningContentSchema = z.object({
  lectureNotes: z.string().describe('Well-structured, comprehensive lecture notes in markdown format based on the provided text. Use headings, lists, and bold text to organize the information clearly.'),
  quiz: z.array(QuizQuestionSchema).describe('An array of quiz questions based on the request.'),
  flashcards: z.array(FlashcardSchema).describe('An array of flashcards for key terms and concepts.'),
});
export type GeneratedLearningContent = z.infer<typeof GeneratedLearningContentSchema>;


// The exported function that will be called from the API route
export async function generateLearningContent(input: LearningContentRequestInternal): Promise<GeneratedLearningContent> {
  return learningToolFlow(input);
}

// Genkit Prompt Definition
const learningToolPrompt = ai.definePrompt({
  name: 'learningToolPrompt',
  input: { schema: LearningContentRequestSchema },
  output: { schema: GeneratedLearningContentSchema },
  prompt: `You are an expert educational assistant. Your task is to generate a comprehensive set of learning materials based on the provided text and user requirements.

  **Source Text:**
  {{{context}}}
  
  **Instructions:**
  
  1.  **Lecture Notes:**
      {{#if generateNotes}}
      Generate a set of well-organized and easy-to-read lecture notes from the source text.
      - The notes should be in markdown format.
      - Use headings (#, ##, ###), bullet points (-), numbered lists (1.), and bold text (**) to structure the content logically.
      - Summarize key concepts, define important terms, and capture the main ideas of the text.
      {{else}}
      The user has not requested lecture notes. The lectureNotes field should be an empty string.
      {{/if}}
  
  2.  **Quiz:**
      {{#if generateQuiz}}
      Create a quiz with {{numQuestions}} questions of the '{{quizType}}' type.
      - Each question must be relevant to the source text.
      - For each question, provide the correct answer and a brief explanation.
      - For 'multiple-choice' questions, provide 4 distinct options, including the correct answer.
      {{else}}
      The user has not requested a quiz. The quiz field should be an empty array.
      {{/if}}
  
  3.  **Flashcards:**
      {{#if generateFlashcards}}
      Generate a set of flashcards for the most important terms, concepts, or key questions from the text.
      - The "front" of the card should be a term or a concise question.
      - The "back" of the card should be the corresponding definition or answer.
      - Generate at least 5-10 relevant flashcards.
      {{else}}
      The user has not requested flashcards. The flashcards field should be an empty array.
      {{/if}}
  
  Ensure your entire response is a single, valid JSON object that conforms to the specified output schema.
  `,
});

// Genkit Flow Definition
const learningToolFlow = ai.defineFlow(
  {
    name: 'learningToolFlow',
    inputSchema: LearningContentRequestSchema,
    outputSchema: GeneratedLearningContentSchema,
  },
  async (input) => {
    const { output } = await learningToolPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate a valid response.');
    }
    return output;
  }
);
