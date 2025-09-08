
import { z } from 'zod';

// ========== Input Schemas ==========

export const NotesOptionsSchema = z.object({
  style: z.enum(['detailed', 'bullet', 'outline', 'summary', 'concise']),
  complexity: z.enum(['simple', 'medium', 'advanced']),
});

export const QuizOptionsSchema = z.object({
    numQuestions: z.number().min(1).max(20),
    questionTypes: z.array(z.enum(['multiple-choice', 'true-false', 'short-answer'])),
    difficulty: z.enum(['easy', 'medium', 'hard']),
});

export const FlashcardsOptionsSchema = z.object({
    numCards: z.number().min(1).max(30),
    style: z.enum(['basic', 'detailed', 'question']),
});

export const StudyMaterialRequestSchema = z.object({
  sourceText: z.string().min(50, { message: 'Source text must be at least 50 characters.' }),
  generationType: z.enum(['notes', 'quiz', 'flashcards']),
  notesOptions: NotesOptionsSchema.optional(),
  quizOptions: QuizOptionsSchema.optional(),
  flashcardsOptions: FlashcardsOptionsSchema.optional(),
});
export type StudyMaterialRequest = z.infer<typeof StudyMaterialRequestSchema>;


// ========== Output Schemas ==========

export const QuizQuestionSchema = z.object({
  questionText: z.string().describe('The text of the question.'),
  questionType: z.enum(['multiple-choice', 'true-false', 'short-answer']).describe('The type of the question.'),
  options: z.array(z.string()).optional().describe('An array of possible answers for multiple-choice or true-false questions.'),
  correctAnswer: z.string().describe('The correct answer. For multiple-choice, this is the exact text of the correct option. For true/false, it is "True" or "False".'),
  explanation: z.string().describe('A brief explanation of why the correct answer is correct.'),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const FlashcardSchema = z.object({
    front: z.string().describe('The content for the front of the flashcard (e.g., a term or a question).'),
    back: z.string().describe('The content for the back of the flashcard (e.g., a definition or an answer).'),
});
export type Flashcard = z.infer<typeof FlashcardSchema>;


export const StudyMaterialResponseSchema = z.object({
  title: z.string().describe('A concise and relevant title for the generated material.'),
  materialType: z.enum(['notes', 'quiz', 'flashcards']),
  notesContent: z.string().optional().describe('The generated notes as a single plain text string.'),
  quizContent: z.array(QuizQuestionSchema).optional().describe('An array of quiz questions.'),
  flashcardContent: z.array(FlashcardSchema).optional().describe('An array of flashcards.'),
});
export type StudyMaterialResponse = z.infer<typeof StudyMaterialResponseSchema>;

    