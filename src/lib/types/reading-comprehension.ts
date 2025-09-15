import { z } from 'zod';

export const ReadingComprehensionRequestSchema = z.object({
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  topic: z.string(),
});

export type ReadingComprehensionRequest = z.infer<typeof ReadingComprehensionRequestSchema>;

const VocabularyItemSchema = z.object({
  word: z.string().describe('The vocabulary word.'),
  definition: z.string().describe('A simple definition of the word.'),
  pronunciation: z.string().describe('Phonetic pronunciation.'),
  example: z.string().describe('An example sentence using the word.'),
});

const ComprehensionQuestionSchema = z.object({
  question: z.string().describe('The comprehension question.'),
  type: z.enum(['multiple-choice', 'true/false', 'short-answer', 'sequencing']),
  options: z.array(z.string()).optional().describe('Options for multiple-choice questions.'),
  answer: z.string().describe('The correct answer to the question.'),
});

const SummaryExerciseSchema = z.object({
  prompt: z.string().describe('The prompt for the summary exercise.'),
  exampleAnswer: z.string().describe('An example of a good summary.'),
});

const FollowUpPracticeSchema = z.object({
  prompt: z.string().describe('A prompt for a follow-up writing or speaking activity.'),
});

export const ReadingComprehensionExerciseSchema = z.object({
  passageTitle: z.string().describe('A suitable title for the reading passage.'),
  readingPassage: z.string().describe('The generated reading passage (50-200 words).'),
  vocabulary: z.array(VocabularyItemSchema).describe('An array of 5-7 key vocabulary words.'),
  comprehensionQuestions: z.array(ComprehensionQuestionSchema).describe('An array of 5-7 comprehension questions.'),
  summaryExercise: SummaryExerciseSchema.describe('An object containing the summary exercise.'),
  followUpPractice: FollowUpPracticeSchema.describe('An object containing the follow-up practice prompt.'),
});

export type ReadingComprehensionExercise = z.infer<typeof ReadingComprehensionExerciseSchema>;
