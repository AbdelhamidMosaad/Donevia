
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
import { RecapRequestSchema, RecapResponseSchema } from '@/lib/types';

// ========== Prompt Template ==========

const recapPrompt = ai.definePrompt({
  name: 'recapPrompt',
  input: { schema: RecapRequestSchema },
  output: { schema: RecapResponseSchema },
  prompt: `
You are an expert productivity coach. Your task is to generate a comprehensive, insightful, and encouraging recap of a user's progress for a given period. The tone should be positive and motivational, but also direct about challenges.

Analyze the following tasks provided for the user's {{period}} recap.
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

Based on this data, generate the following structured response:

1.  **title**: A short, engaging title for the recap (e.g., "Your Weekly Wins & Insights!" or "Daily Progress Breakdown").

2.  **quantitativeSummary**:
    -   **tasksCompleted**: Accurately count the number of tasks marked as 'Done' or a similar completed status.
    -   **tasksCreated**: Accurately count the total number of tasks in the list.
    -   **tasksOverdue**: Accurately count the number of tasks whose due date is in the past and are not marked as 'Done'.

3.  **accomplishments**: A bulleted list of 2-4 key achievements. Focus on completed high-priority tasks, finishing multiple tasks in a single day, or consistent progress. Be specific (e.g., "Completed the high-priority task: 'Implement Google Authentication'").

4.  **challenges**: A bulleted list of 1-3 challenges or overdue items. Be gentle but clear. If there are overdue tasks, mention one or two important ones. If there are no challenges, state something positive like "Great work, no major roadblocks this period!"

5.  **productivityInsights**: A 2-3 sentence paragraph offering one key observation or piece of advice. For example, "It looks like you're making great strides on front-end tasks. To maintain balance, consider dedicating a block of time for the backend items next week." or "You have a few high-priority tasks due soon. It might be helpful to tackle one of those first to build momentum."

6.  **nextPeriodFocus**: A 1-2 sentence summary suggesting a focus for the next period. For example, "For the upcoming week, focusing on the 'Database Schema' task could unblock several other items."
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
