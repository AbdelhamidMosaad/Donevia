
import { z } from 'zod';

// ========== Input Schemas ==========

export const NotesOptionsSchema = z.object({
  style: z.enum(['detailed', 'bullet', 'outline', 'summary', 'concise']),
  complexity: z.enum(['simple', 'medium', 'advanced']),
});

export const QuizOptionsSchema = z.object({
  numQuestions: z.number().min(1).max(50),
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

// Quiz
export const QuizQuestionSchema = z.object({
  questionText: z.string().describe('The text of the question.'),
  questionType: z.enum(['multiple-choice', 'true-false', 'short-answer']).describe('The type of the question.'),
  options: z.array(z.string()).optional().describe('An array of possible answers for multiple-choice or true-false questions. This field is only required for multiple-choice questions.'),
  correctAnswer: z.string().describe('The correct answer. For multiple-choice, this is the exact text of the correct option. For true/false, it is "True" or "False".'),
  explanation: z.string().describe('A brief explanation of why the correct answer is correct.'),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

// Flashcards
export const FlashcardSchema = z.object({
  front: z.string().describe('The content for the front of the flashcard (e.g., a term or a question).'),
  back: z.string().describe('The content for the back of the flashcard (e.g., a definition or an answer).'),
});
export type Flashcard = z.infer<typeof FlashcardSchema>;

// Notes (structured)
const NotePointSchema = z.object({
  text: z.string().describe('The text of the bullet point.'),
  isKeyPoint: z.boolean().optional().describe('Set to true if this is a critical key point.'),
});

const TableSchema = z.object({
    headers: z.array(z.string()).describe('The header row for the table.'),
    rows: z.array(z.array(z.string())).describe('The data rows for the table.'),
});

export const LectureNoteSectionSchema = z.object({
  heading: z.string().describe('Section heading (e.g., "Introduction to Accounting").'),
  content: z.array(NotePointSchema).describe('Bullet-point content for the section.'),
  table: TableSchema.optional().describe('A table extracted from the source text, if applicable.'),
  subsections: z.array(z.object({
    subheading: z.string().describe('Subsection heading (e.g., "Three Basic Activities of Accounting").'),
    content: z.array(NotePointSchema).describe('Bullet-point content for the subsection.'),
    table: TableSchema.optional().describe('A table for this subsection.'),
  })).optional(),
  addDividerAfter: z.boolean().optional().describe('If true, a horizontal line (---) should be added after this section.')
});

export const NotesContentSchema = z.object({
  introduction: z.string().describe('A short overview paragraph for context.'),
  sections: z.array(LectureNoteSectionSchema).describe('Organized sections of the lecture notes.')
});

// Main Response
export const StudyMaterialResponseSchema = z.object({
  title: z.string().describe('A concise and relevant title for the generated material.'),
  materialType: z.enum(['notes', 'quiz', 'flashcards']),
  notesContent: NotesContentSchema.optional().describe('Structured lecture notes with sections, bullet points, subsections, and optional dividers. Required if materialType is "notes".'),
  quizContent: z.array(QuizQuestionSchema).optional().describe('An array of quiz questions. Required if materialType is "quiz".'),
  flashcardContent: z.array(FlashcardSchema).optional().describe('An array of flashcards. Required if materialType is "flashcards".'),
});
export type StudyMaterialResponse = z.infer<typeof StudyMaterialResponseSchema>;
