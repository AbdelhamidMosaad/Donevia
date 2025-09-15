import { z } from 'zod';

export const InterviewQuestionsRequestSchema = z.object({
  jobTitle: z.string().describe('The job title the user is applying for.'),
  industry: z.string().describe('The industry of the job.'),
  experienceLevel: z.enum(['entry', 'mid', 'senior']).describe('The user\'s experience level.'),
});
export type InterviewQuestionsRequest = z.infer<typeof InterviewQuestionsRequestSchema>;


export const InterviewQuestionSchema = z.object({
  questionText: z.string().describe('The full text of the interview question.'),
  category: z.enum(['Behavioral', 'Technical', 'General']).describe('The category of the question.'),
});
export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>;
