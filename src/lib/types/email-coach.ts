
import { z } from 'zod';

export const EmailCoachRequestSchema = z.object({
  emailText: z.string().min(20, { message: 'Email text must be at least 20 characters.' }),
  context: z.string().min(5, { message: 'Context must be at least 5 characters.' }),
});
export type EmailCoachRequest = z.infer<typeof EmailCoachRequestSchema>;


const CorrectionSchema = z.object({
  original: z.string().describe("The specific incorrect phrase from the original email."),
  correction: z.string().describe("The suggested replacement for that phrase."),
  explanation: z.string().describe("A brief explanation of the grammar, style, or tone improvement."),
});

const TipSchema = z.object({
  tip: z.string().describe("A general tip for improving the email's professionalism, clarity, or tone."),
  example: z.string().optional().describe("A brief example illustrating the tip in practice."),
});

export const EmailCoachResponseSchema = z.object({
  improvedEmail: z.string().describe("The full, rewritten version of the email, incorporating all improvements."),
  corrections: z.array(CorrectionSchema).describe("An array of specific corrections made to the original text."),
  tips: z.array(TipSchema).describe("An array of high-level tips for better email writing."),
});
export type EmailCoachResponse = z.infer<typeof EmailCoachResponseSchema>;
