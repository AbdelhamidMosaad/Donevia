
'use server';
/**
 * @fileOverview An AI flow for checking grammar and providing corrections.
 *
 * - checkGrammarWithAI - A function that uses Gemini to correct English text.
 */

import { ai } from '@/ai/genkit';
import { GrammarCorrectionRequestSchema, GrammarCorrectionResponseSchema, type GrammarCorrectionRequest, type GrammarCorrectionResponse } from '@/lib/types/grammar';


// ========== Prompt Template ==========

const grammarCheckPrompt = ai.definePrompt({
  name: 'grammarCheckPrompt',
  input: { schema: GrammarCorrectionRequestSchema },
  output: { schema: GrammarCorrectionResponseSchema },
  prompt: `
    You are an expert English grammar and style checker. Your task is to analyze the provided text, correct any errors, and explain your changes.

    The user has provided the following text:
    ---
    {{{text}}}
    ---

    Please provide your response in a valid JSON format that strictly adheres to the following structure:
    {
      "corrected_text": "The full, polished version of the text with all corrections applied.",
      "errors": [
        {
          "original": "The specific incorrect phrase or word from the original text.",
          "correction": "The corrected version of that phrase or word.",
          "explanation": "A concise explanation of the grammatical rule or style improvement."
        }
      ]
    }

    **Instructions:**
    1.  **Analyze**: Carefully read the text and identify all grammatical errors, spelling mistakes, punctuation issues, and awkward phrasing.
    2.  **Correct**: Create a complete, corrected version of the text and place it in the \`corrected_text\` field.
    3.  **Detail Errors**: For each error you find, create an object in the \`errors\` array.
        -   The \`original\` field must contain the exact text of the error.
        -   The \`correction\` field must contain the suggested improvement.
        -   The \`explanation\` field must clearly and briefly explain the reason for the change.
    4.  **No Errors**: If the text is perfect and has no errors, return an empty \`errors\` array and the original text in the \`corrected_text\` field.
    5.  **JSON Format**: Ensure your entire output is a single, valid JSON object. Do not include any text or formatting outside of the JSON structure.
  `,
});


// ========== Flow Definition ==========

const grammarCheckFlow = ai.defineFlow(
  {
    name: 'grammarCheckFlow',
    inputSchema: GrammarCorrectionRequestSchema,
    outputSchema: GrammarCorrectionResponseSchema,
  },
  async (input) => {
    const { output } = await grammarCheckPrompt(input);
    if (!output) {
      throw new Error('The AI failed to generate a grammar correction. Please try again.');
    }
    return output;
  }
);

// ========== API Function Export ==========

export async function checkGrammarWithAI(
  input: GrammarCorrectionRequest
): Promise<GrammarCorrectionResponse> {
  return await grammarCheckFlow(input);
}
