'use server';

/**
 * @fileOverview Provides AI-driven contextual task suggestions for the task management board.
 *
 * - getContextualTaskSuggestions - A function that generates task suggestions based on context.
 * - ContextualTaskSuggestionsInput - The input type for the getContextualTaskSuggestions function.
 * - ContextualTaskSuggestionsOutput - The return type for the getContextualTaskSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContextualTaskSuggestionsInputSchema = z.object({
  currentTasks: z
    .string()
    .describe('A comma separated list of current tasks in the task management board.'),
  userGoal: z
    .string()
    .describe('The overall goal the user is trying to achieve with the tasks.'),
});

export type ContextualTaskSuggestionsInput = z.infer<
  typeof ContextualTaskSuggestionsInputSchema
>;

const ContextualTaskSuggestionsOutputSchema = z.object({
  suggestedTasks: z
    .array(z.string())
    .describe('An array of suggested tasks related to the current tasks and user goal.'),
});

export type ContextualTaskSuggestionsOutput = z.infer<
  typeof ContextualTaskSuggestionsOutputSchema
>;

export async function getContextualTaskSuggestions(
  input: ContextualTaskSuggestionsInput
): Promise<ContextualTaskSuggestionsOutput> {
  return contextualTaskSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'contextualTaskSuggestionsPrompt',
  input: {schema: ContextualTaskSuggestionsInputSchema},
  output: {schema: ContextualTaskSuggestionsOutputSchema},
  prompt: `You are an AI assistant designed to provide smart, in-context suggestions of related or prerequisite tasks for a user's task management board.

  The user is currently working on the following tasks: {{{currentTasks}}}

  The user's overall goal is: {{{userGoal}}}

  Suggest a list of tasks that the user should add to their task management board to achieve their goal, given the tasks they are already working on.  The suggested tasks should be concise.
  Respond with an array of strings.`,
});

const contextualTaskSuggestionsFlow = ai.defineFlow(
  {
    name: 'contextualTaskSuggestionsFlow',
    inputSchema: ContextualTaskSuggestionsInputSchema,
    outputSchema: ContextualTaskSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
