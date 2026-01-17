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
