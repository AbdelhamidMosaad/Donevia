
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

Analyze the following user data for the {{period}} recap.
The current date is ${new Date().toLocaleDateString()}.

{{#if tasks}}
---
**TASKS**
{{#if tasks.length}}
{{#each tasks}}
- Title: {{this.title}}
  Status: {{this.status}}
  Priority: {{this.priority}}
  Due Date: {{this.dueDate}}
  Created At: {{this.createdAt}}
{{/each}}
{{else}}
No task activity in this period.
{{/if}}
---
{{/if}}

{{#if goals}}
**GOALS & MILESTONES**
{{#if goals.length}}
{{#each goals}}
- Goal: {{this.title}} (Target: {{this.targetDate}})
  {{#if this.milestones.length}}
    {{#each this.milestones}}
    - Milestone: {{this.title}} (Due: {{this.dueDate}}) - Status: {{#if this.isCompleted}}Completed{{else}}Pending{{/if}}
    {{/each}}
  {{else}}
    - No milestones for this goal.
  {{/if}}
{{/each}}
{{else}}
No goal activity.
{{/if}}
---
{{/if}}

{{#if studyData}}
**STUDY TRACKER DATA**
{{#if studyData.studySessions.length}}
Total Study Sessions: {{studyData.studySessions.length}}
Total Time Studied: {{#with (calculateTotalStudyTime studyData.studySessions)}}{{this.hours}}h {{this.minutes}}m{{/with}}

Completed Subtopics:
{{#each studyData.studySubtopics}}
{{#if this.isCompleted}}
- {{this.title}} (from Chapter: {{lookup ../studyData.studyChapters 'id' this.chapterId 'title'}}, Goal: {{lookup ../studyData.studyGoals 'id' this.goalId 'title'}})
{{/if}}
{{/each}}

{{else}}
No study sessions logged in this period.
{{/if}}
---
{{/if}}


Based on this data, generate the following structured response:

1.  **title**: A short, engaging title for the recap (e.g., "Your Weekly Wins & Insights!" or "Daily Progress Breakdown" or "Study Session Analysis").

2.  **quantitativeSummary**:
    -   **tasksCompleted**: Accurately count the number of tasks marked as 'Done' or a similar completed status.
    -   **milestonesCompleted**: Accurately count the number of milestones marked as 'Completed'.
    -   **tasksCreated**: Accurately count the total number of tasks in the list.

3.  **accomplishments**: A bulleted list of 2-4 key achievements. Focus on completed high-priority tasks, milestones, and study goals. Connect completed items to their parent goals where possible (e.g., "Made progress on 'Learn Guitar' by completing the 'Practice Chords' task." or "Finished the 'React Hooks' chapter for your 'Master Frontend Development' study goal.").

4.  **challenges**: A bulleted list of 1-3 challenges or overdue items. Be gentle but clear. If there are overdue tasks, mention one or two important ones. If goals have many pending milestones, mention it. If there are no challenges, state something positive like "Great work, no major roadblocks this period!"

5.  **productivityInsights**: A 2-3 sentence paragraph offering one key observation or piece of advice. For example, "It looks like you're making great strides on front-end tasks. To maintain balance, consider dedicating a block of time for the backend items next week." or "You have a few high-priority tasks due soon. It might be helpful to tackle one of those first to build momentum." or "You dedicated a significant amount of time to studying this week, which correlated with completing several key subtopics. Keep up the great work!".

6.  **nextPeriodFocus**: A 1-2 sentence summary suggesting a focus for the next period, prioritizing tasks, milestones, or study areas that will unblock other items or contribute to an upcoming deadline.
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
    const { output } = await recapPrompt(input, {
        helpers: {
            calculateTotalStudyTime(sessions: any[]) {
                const totalSeconds = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                return { hours, minutes };
            },
            lookup(array: any[], fromKey: string, fromValue: any, toKey: string) {
                const item = array.find(i => i[fromKey] === fromValue);
                return item ? item[toKey] : 'Unknown';
            }
        }
    });
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
