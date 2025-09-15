'use server';
/**
 * @fileOverview An AI flow for generating interview questions.
 * - generateInterviewQuestions - A function that uses Gemini to generate a list of tailored interview questions.
 * - InterviewQuestionsRequest - The input type for the flow.
 * - InterviewQuestion - The schema for a single generated question.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { InterviewQuestionsRequestSchema, InterviewQuestionSchema } from '@/lib/types/interview-prep';
import type { InterviewQuestionsRequest, InterviewQuestion } from '@/lib/types/interview-prep';


// ========== Prompt Template ==========

const generateInterviewQuestionsPrompt = ai.definePrompt({
  name: 'generateInterviewQuestionsPrompt',
  input: { schema: InterviewQuestionsRequestSchema },
  output: { schema: z.array(InterviewQuestionSchema) },
  prompt: `
    You are an expert career coach and hiring manager. Your task is to generate a list of 10 interview questions for a mock interview session.

    The user is preparing for a job interview with the following details:
    - **Job Title:** {{{jobTitle}}}
    - **Industry:** {{{industry}}}
    - **Experience Level:** {{{experienceLevel}}}

    **Instructions:**
    1.  **Generate 10 Questions**: Create exactly 10 questions in total.
    2.  **Mix Question Types**: The list must include a mix of the following categories:
        -   **Behavioral**: 2-3 questions. These should probe past experiences (e.g., "Tell me about a time...", "Describe a situation...").
        -   **Technical**: 4-5 questions. These should be specific to the skills and knowledge required for the '{{{jobTitle}}}' role in the '{{{industry}}}' industry.
        -   **HR/General**: 2-3 questions. These should be common screening questions (e.g., "What are your salary expectations?", "Why do you want to work here?").
    3.  **Categorize Each Question**: For each question, you must set the 'category' field to one of 'Behavioral', 'Technical', or 'General'.
    4.  **Tailor Difficulty**: Adjust the complexity of the questions based on the '{{{experienceLevel}}}' level.
    5.  **JSON Output**: Ensure your entire output is a single, valid JSON array of question objects. Do not include any text or formatting outside of this JSON structure.
  `,
});


// ========== Flow Definition ==========

const generateInterviewQuestionsFlow = ai.defineFlow(
  {
    name: 'generateInterviewQuestionsFlow',
    inputSchema: InterviewQuestionsRequestSchema,
    outputSchema: z.array(InterviewQuestionSchema),
  },
  async (input) => {
    const { output } = await generateInterviewQuestionsPrompt(input);
    if (!output) {
      throw new Error('The AI failed to generate interview questions. Please try again.');
    }
    return output;
  }
);

// ========== API Function Export ==========

export async function generateInterviewQuestions(
  input: InterviewQuestionsRequest
): Promise<InterviewQuestion[]> {
  return await generateInterviewQuestionsFlow(input);
}
