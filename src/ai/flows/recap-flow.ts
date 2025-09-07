
'use server';
/**
 * @fileOverview AI flow for generating daily or weekly recaps.
 *
 * - generateRecap - A function that generates a user progress summary.
 * - RecapRequest - The input type for the generation.
 * - RecapResponse - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { TaskSchema, RecapRequestSchema, RecapResponseSchema } from '@/lib/types';

// ========== Prompt Template ==========

const recapPrompt = ai.definePrompt({
  name: 'recapPrompt',
  input: { schema: RecapRequestSchema },
  output: { schema: RecapResponseSchema },
  prompt: `
You are a productivity coach bot. Your task is to generate a concise, encouraging, and insightful recap of a user's progress for a given period.

Analyze the following tasks for the user's {{period}} recap.
The current date is ${new Date().toLocaleDateString()}.

Tasks:
---
{{#each tasks}}
- Title: {{this.title}}
  Status: {{this.status}}
  Priority: {{this.priority}}
  Due Date: {{this.dueDate}}
  Created At: {{this.createdAt}}
{{/each}}
---

Based on the tasks, generate the following:
1.  **title**: A short, engaging title for the recap (e.g., "Your Weekly Wins!" or "Daily Progress Report").
2.  **summary**: A 2-3 sentence paragraph summarizing the user's activity. Mention the number of tasks completed and any upcoming or missed deadlines. Be encouraging.
3.  **highlights**: A bulleted list of 2-4 key highlights. These could be completing a high-priority task, making progress on multiple items, or being consistent. Find the most positive and impactful points to mention.
  `,
});

// ========== Flow Definition ==========

const generateRecapFlow = ai.defineFlow(
  {
    name: 'generateRecapFlow',
    inputSchema: RecapRequestSchema,
    outputSchema: RecapResponseSchema,
  },
  async (input) => {
    // The Zod schema in the prompt is enough for structured output,
    // but you could add more logic here if needed, e.g., fetching more data.
    const { output } = await recapPrompt(input);
    if (!output) {
        throw new Error('The AI failed to generate a recap. Please try again.');
    }
    return output;
  }
);

// ========== API Function Export ==========

export async function generateRecap(
  input: z.infer<typeof RecapRequestSchema>
): Promise<z.infer<typeof RecapResponseSchema>> {
  return generateRecapFlow(input);
}
