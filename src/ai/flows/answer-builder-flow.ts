'use server';
/**
 * @fileOverview An AI flow for building and refining interview answers using the STAR method.
 * - buildAnswer - A function that uses Gemini to synthesize STAR points into a polished answer.
 * - AnswerBuilderRequest - The input type for the flow.
 * - AnswerBuilderResponse - The output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { AnswerBuilderRequestSchema, AnswerBuilderResponseSchema } from '@/lib/types/answer-builder';
import type { AnswerBuilderRequest, AnswerBuilderResponse } from '@/lib/types/answer-builder';


// ========== Prompt Template ==========

const answerBuilderPrompt = ai.definePrompt({
  name: 'answerBuilderPrompt',
  input: { schema: AnswerBuilderRequestSchema },
  output: { schema: AnswerBuilderResponseSchema },
  prompt: `
    You are an expert interview and career coach. Your task is to help a user construct a powerful and concise answer to a behavioral interview question using the STAR method.

    The user is answering the following question:
    **Question:** "{{question}}"

    The user has provided the following points for each section of the STAR method:
    - **Situation:** {{situation}}
    - **Task:** {{task}}
    - **Action:** {{action}}
    - **Result:** {{result}}

    **Your Instructions:**

    1.  **Synthesize the Answer**: Combine the user's points into a single, cohesive, and well-written paragraph. The answer should flow naturally and be presented in a professional tone suitable for a job interview. Place this final text in the \`builtAnswer\` field.
    
    2.  **Provide Actionable Feedback**: In the \`feedback\` array, provide 2-3 specific, constructive tips on how the user could improve their answer. Focus on making the story more impactful. Examples of feedback include:
        -   "Try to quantify the result. Instead of 'improved performance,' say 'increased performance by 15%'."
        -   "Your 'Action' section is strong. To make it even better, focus more on your specific contributions versus the team's."
        -   "The 'Situation' is a bit long. Try to summarize it in one sentence to get to the action faster."
        -   "Clearly state the 'Task' you were assigned to give the listener context for your actions."

    3.  **JSON Output**: Ensure your entire output is a single, valid JSON object. Do not include any text or formatting outside of this JSON structure.
  `,
});


// ========== Flow Definition ==========

const buildAnswerFlow = ai.defineFlow(
  {
    name: 'buildAnswerFlow',
    inputSchema: AnswerBuilderRequestSchema,
    outputSchema: AnswerBuilderResponseSchema,
  },
  async (input) => {
    const { output } = await answerBuilderPrompt(input);
    if (!output) {
      throw new Error('The AI failed to build an answer. Please try again.');
    }
    return output;
  }
);


// ========== API Function Export ==========

export async function buildAnswer(
  input: AnswerBuilderRequest
): Promise<AnswerBuilderResponse> {
  return await buildAnswerFlow(input);
}
