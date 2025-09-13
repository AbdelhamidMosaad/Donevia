
'use server';
/**
 * @fileOverview An AI flow for improving email writing.
 *
 * - improveEmail - A function that uses Gemini to refine an email.
 */

import { ai } from '@/ai/genkit';
import { EmailCoachRequestSchema, EmailCoachResponseSchema, type EmailCoachRequest, type EmailCoachResponse } from '@/lib/types/email-coach';

// ========== Prompt Template ==========

const emailCoachPrompt = ai.definePrompt({
  name: 'emailCoachPrompt',
  input: { schema: EmailCoachRequestSchema },
  output: { schema: EmailCoachResponseSchema },
  prompt: `
    You are an expert professional writing coach, specializing in email communication. Your task is to analyze the user's email draft and provide comprehensive feedback to help them improve.

    The user is writing an email with the following context:
    **Context:** {{{context}}}

    Here is the user's original email draft:
    ---
    {{{emailText}}}
    ---

    Please provide your response in a valid JSON format that strictly adheres to the following structure.

    **Instructions:**

    1.  **Rewrite the Email**: Create a polished, professional, and improved version of the entire email. Place this in the \`improvedEmail\` field. The tone should be appropriate for the provided context.

    2.  **Identify Specific Corrections**: In the \`corrections\` array, detail at least 3-5 specific changes you made. For each correction:
        -   \`original\`: The exact phrase or sentence from the original text.
        -   \`correction\`: The improved version of that phrase.
        -   \`explanation\`: A clear, concise reason for the change (e.g., "Improved for conciseness," "Corrected grammatical error," "Adjusted tone to be more formal").

    3.  **Provide General Tips**: In the \`tips\` array, provide 2-3 high-level, actionable tips for better email writing based on the user's draft. Each tip should be a general principle they can apply to future emails. For example:
        -   Tip: "Use a clear and direct subject line." Example: "Instead of 'Question', try 'Question Regarding Q3 Project Timeline'."
        -   Tip: "End with a clear call to action."

    4.  **JSON Output**: Ensure your entire output is a single, valid JSON object. Do not include any text or formatting outside of this JSON structure.
  `,
});


// ========== Flow Definition ==========

const improveEmailFlow = ai.defineFlow(
  {
    name: 'improveEmailFlow',
    inputSchema: EmailCoachRequestSchema,
    outputSchema: EmailCoachResponseSchema,
  },
  async (input) => {
    const { output } = await emailCoachPrompt(input);
    if (!output) {
      throw new Error('The AI failed to generate email feedback. Please try again.');
    }
    return output;
  }
);

// ========== API Function Export ==========

export async function improveEmail(
  input: EmailCoachRequest
): Promise<EmailCoachResponse> {
  return await improveEmailFlow(input);
}
