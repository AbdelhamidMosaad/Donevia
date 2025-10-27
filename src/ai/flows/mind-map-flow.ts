'use server';
/**
 * @fileOverview An AI flow for generating a mind map from text.
 * - generateMindMap - A function that uses Gemini to generate a structured mind map.
 */

import { ai } from '@/ai/genkit';
import { MindMapRequestSchema, MindMapResponseSchema, type MindMapRequest, type MindMapResponse } from '@/lib/types/mindmap-generator';

const mindMapPrompt = ai.definePrompt({
  name: 'mindMapPrompt',
  input: { schema: MindMapRequestSchema },
  output: { schema: MindMapResponseSchema },
  prompt: `
    You are an expert at structuring information. Your task is to convert the following text into a hierarchical mind map structure.

    **Source Text:**
    ---
    {{{sourceText}}}
    ---

    **Instructions:**

    1.  **Identify the Central Topic**: Determine the main subject of the text. This will be the root of the mind map. Place this in the \`centralTopic\` field.
    
    2.  **Extract Main Branches**: Identify 3-5 main ideas or top-level categories that branch directly from the central topic. These will be the \`mainBranches\`.

    3.  **Extract Sub-Branches**: For each main branch, identify 2-4 key points, details, or sub-categories. These will be the children of their respective main branch. You can go one level deeper if necessary (sub-sub-branches).

    4.  **Keep it Concise**: Node text should be brief and to the point. Use keywords or short phrases.

    5.  **JSON Output**: Ensure your entire output is a single, valid JSON object that strictly adheres to the required format, including nested children.
  `,
});

const generateMindMapFlow = ai.defineFlow(
  {
    name: 'generateMindMapFlow',
    inputSchema: MindMapRequestSchema,
    outputSchema: MindMapResponseSchema,
  },
  async (input) => {
    const { output } = await mindMapPrompt(input);
    if (!output) {
      throw new Error('The AI failed to generate a mind map.');
    }
    return output;
  }
);

export async function generateMindMap(input: MindMapRequest): Promise<MindMapResponse> {
  return generateMindMapFlow(input);
}
