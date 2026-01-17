'use server';
/**
 * @fileOverview An AI flow for suggesting skills for a CV based on a job title.
 * - suggestSkills - A function that uses Gemini to suggest technical and soft skills.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const SuggestSkillsRequestSchema = z.object({
  jobTitle: z.string().describe("The job title to suggest skills for."),
});
export type SuggestSkillsRequest = z.infer<typeof SuggestSkillsRequestSchema>;

export const SuggestSkillsResponseSchema = z.object({
  technicalSkills: z.array(z.string()).describe("A list of 5-10 relevant technical skills."),
  softSkills: z.array(z.string()).describe("A list of 5-7 relevant soft skills."),
});
export type SuggestSkillsResponse = z.infer<typeof SuggestSkillsResponseSchema>;

const prompt = ai.definePrompt({
  name: 'suggestSkillsPrompt',
  input: { schema: SuggestSkillsRequestSchema },
  output: { schema: SuggestSkillsResponseSchema },
  prompt: `
    You are an expert resume writer and career coach.
    Based on the job title "{{jobTitle}}", generate a list of relevant technical and soft skills for a CV.

    Provide 5-10 technical skills and 5-7 soft skills.
  `,
});

export async function suggestSkills(input: SuggestSkillsRequest): Promise<SuggestSkillsResponse> {
  const { output } = await prompt(input);
  if (!output) {
    throw new Error('The AI failed to suggest skills. Please try again.');
  }
  return output;
}
