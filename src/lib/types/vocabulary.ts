import { z } from 'zod';

export const VocabularyLevelSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
export type VocabularyLevel = z.infer<typeof VocabularyLevelSchema>;

export const VocabularyCoachRequestSchema = z.object({
  level: VocabularyLevelSchema.describe('The CEFR level of the user (A1-C2).'),
});
export type VocabularyCoachRequest = z.infer<typeof VocabularyCoachRequestSchema>;

const HighlightedWordSchema = z.object({
  word: z.string().describe('The vocabulary word that was highlighted in the story.'),
  meaning: z.string().describe('A clear and simple definition of the word.'),
  example: z.string().describe('A new, distinct sentence showing how to use the word.'),
  pronunciation: z.string().describe('The phonetic pronunciation of the word (e.g., /prəˌnʌnsiˈeɪʃən/).'),
});
export type HighlightedWord = z.infer<typeof HighlightedWordSchema>;

export const VocabularyCoachResponseSchema = z.object({
  story: z.string().describe('A short story of at least 100 words, using vocabulary appropriate for the requested level. Five key vocabulary words must be wrapped in **markdown bold** syntax.'),
  vocabulary: z.array(HighlightedWordSchema).describe('An array of exactly 5 objects, each detailing one of the highlighted words from the story.'),
});
export type VocabularyCoachResponse = z.infer<typeof VocabularyCoachResponseSchema>;

export const MasteryLevelSchema = z.enum(['Novice', 'Intermediate', 'Mastered']);
export type MasteryLevel = z.infer<typeof MasteryLevelSchema>;
