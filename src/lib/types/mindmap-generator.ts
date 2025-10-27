import { z } from 'zod';

export const MindMapRequestSchema = z.object({
  sourceText: z.string().min(50, { message: 'Source text must be at least 50 characters.' }),
});

export type MindMapRequest = z.infer<typeof MindMapRequestSchema>;

const MindMapNodeSchema = z.object({
  id: z.string(),
  text: z.string(),
  children: z.array(z.lazy(() => MindMapNodeSchema)).optional(),
});

export const MindMapResponseSchema = z.object({
  centralTopic: z.string(),
  mainBranches: z.array(MindMapNodeSchema),
});

export type MindMapResponse = z.infer<typeof MindMapResponseSchema>;
export type MindMapNode = z.infer<typeof MindMapNodeSchema>;
