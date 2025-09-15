import { z } from 'zod';

export const AnswerBuilderRequestSchema = z.object({
  question: z.string().describe("The interview question the user is trying to answer."),
  situation: z.string().describe("The user's description of the situation or context."),
  task: z.string().describe("The user's description of the task or goal."),
  action: z.string().describe("The user's description of the actions they took."),
  result: z.string().describe("The user's description of the outcome or result."),
});
export type AnswerBuilderRequest = z.infer<typeof AnswerBuilderRequestSchema>;


export const AnswerBuilderResponseSchema = z.object({
  builtAnswer: z.string().describe("The full, polished answer synthesized from the user's STAR points."),
  feedback: z.array(z.string()).describe("An array of actionable feedback tips to help the user improve their answer."),
});
export type AnswerBuilderResponse = z.infer<typeof AnswerBuilderResponseSchema>;
