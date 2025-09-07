
import { z } from 'zod';

// ========== Input Schemas ==========

export const QuizOptionsSchema = z.object({
  numQuestions: z.number().min(1).max(20),
  questionTypes: z.array(z.enum(['multiple-choice', 'true-false', 'short-answer'])),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

export const NotesOptionsSchema = z.object({
  style: z.enum(['detailed', 'bullet', 'outline', 'summary']),
  complexity: z.enum(['simple', 'medium', 'advanced']),
});

export const StudyMaterialRequestSchema = z.object({
  sourceText: z.string().min(50, { message: 'Source text must be at least 50 characters.' }),
  generationType: z.enum(['quiz', 'flashcards', 'notes']),
  quizOptions: QuizOptionsSchema.optional(),
  notesOptions: NotesOptionsSchema.optional(),
});
export type StudyMaterialRequest = z.infer<typeof StudyMaterialRequestSchema>;


// ========== Output Schemas ==========

export const QuizQuestionSchema = z.object({
  questionText: z.string(),
  questionType: z.enum(['multiple-choice', 'true-false', 'short-answer']),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().describe('The correct answer. For multiple-choice, this is the exact text of the correct option.'),
  explanation: z.string(),
});

export const FlashcardSchema = z.object({
  term: z.string(),
  definition: z.string(),
});

export const StudyMaterialResponseSchema = z.object({
  title: z.string().describe('A concise and relevant title for the generated material.'),
  materialType: z.enum(['quiz', 'flashcards', 'notes']),
  quizContent: z.array(QuizQuestionSchema).optional(),
  flashcardContent: z.array(FlashcardSchema).optional(),
  notesContent: z.string().optional(),
});
export type StudyMaterialResponse = z.infer<typeof StudyMaterialResponseSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type Flashcard = z.infer<typeof FlashcardSchema>;
