
import { z } from 'zod';

export const GrammarCorrectionRequestSchema = z.object({
  text: z.string().min(5, { message: 'Text must be at least 5 characters.' }),
});
export type GrammarCorrectionRequest = z.infer<typeof GrammarCorrectionRequestSchema>;

const ErrorDetailSchema = z.object({
    original: z.string().describe("The original incorrect phrase from the text."),
    correction: z.string().describe("The suggested correction for the phrase."),
    explanation: z.string().describe("A brief, clear explanation of why the correction is needed (e.g., 'Incorrect tense', 'Punctuation error').")
});

export const GrammarCorrectionResponseSchema = z.object({
  corrected_text: z.string().describe("The full, corrected version of the original text."),
  errors: z.array(ErrorDetailSchema).describe("An array of objects, each detailing a specific error found in the original text."),
});
export type GrammarCorrectionResponse = z.infer<typeof GrammarCorrectionResponseSchema>;
