
import { z } from 'zod';

export const RephraseRequestSchema = z.object({
  text: z.string().min(5, { message: 'Text must be at least 5 characters.' }),
});
export type RephraseRequest = z.infer<typeof RephraseRequestSchema>;

const RephrasedVersionSchema = z.object({
  version: z.string().describe("The improved version of the text."),
  explanation: z.string().describe("A clear explanation of why this version is better (e.g., more concise, more formal)."),
});

export const RephraseResponseSchema = z.object({
  rephrasedVersions: z.array(RephrasedVersionSchema).describe("An array containing at least two rephrased versions of the original text."),
});
export type RephraseResponse = z.infer<typeof RephraseResponseSchema>;
