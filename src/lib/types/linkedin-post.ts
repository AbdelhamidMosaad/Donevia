
import { z } from 'zod';

export const LinkedInPostRequestSchema = z.object({
  draftText: z.string().min(10, { message: 'The post draft must be at least 10 characters long.' }),
  notes: z.string().optional().describe('Optional notes or specific instructions for the AI.'),
});
export type LinkedInPostRequest = z.infer<typeof LinkedInPostRequestSchema>;


export const LinkedInPostResponseSchema = z.object({
  enhancedPost: z.string().describe("The rewritten and polished version of the LinkedIn post."),
  explanation: z.string().describe("A brief explanation of the key improvements made to the post."),
});
export type LinkedInPostResponse = z.infer<typeof LinkedInPostResponseSchema>;
