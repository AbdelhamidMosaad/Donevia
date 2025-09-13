'use server';
/**
 * @fileOverview An AI flow for generating a vocabulary-in-context story.
 *
 * - generateVocabularyStory - A function that uses Gemini to generate a story.
 */

import { ai } from '@/ai/genkit';
import { VocabularyCoachRequestSchema, VocabularyCoachResponseSchema, type VocabularyCoachRequest, type VocabularyCoachResponse } from '@/lib/types/vocabulary';

// ========== Prompt Template ==========

const vocabularyCoachPrompt = ai.definePrompt({
  name: 'vocabularyCoachPrompt',
  input: { schema: VocabularyCoachRequestSchema },
  output: { schema: VocabularyCoachResponseSchema },
  prompt: `
    You are an expert English teacher creating a learning exercise. Your task is to generate a short story for a student at the {{level}} CEFR level.

    **Instructions:**
    1.  **Generate a Story**: Write a coherent and interesting story that is at least 100 words long. The language and vocabulary used must be appropriate for a {{level}} learner.
    2.  **Highlight Words**: Identify exactly 5 key vocabulary words in the story that are suitable for the student's level. In the story text, wrap each of these 5 words in **markdown bold** (e.g., "The cat was very **curious**.").
    3.  **Define Vocabulary**: For each of the 5 highlighted words, you must create a corresponding vocabulary object.
        -   \`word\`: The highlighted word.
        -   \`meaning\`: A simple, clear definition of the word, suitable for a {{level}} learner.
        -   \`example\`: A new, distinct sentence that correctly uses the word in a different context from the story.
        -   \`pronunciation\`: The phonetic pronunciation of the word (e.g., "/kəˈriəs/").
    4.  **JSON Output**: Ensure your entire output is a single, valid JSON object that strictly adheres to the required format. Do not include any text or formatting outside of the JSON structure.
  `,
});

// ========== Flow Definition ==========

const vocabularyCoachFlow = ai.defineFlow(
  {
    name: 'vocabularyCoachFlow',
    inputSchema: VocabularyCoachRequestSchema,
    outputSchema: VocabularyCoachResponseSchema,
  },
  async (input) => {
    const { output } = await vocabularyCoachPrompt(input);
    if (!output) {
      throw new Error('The AI failed to generate a vocabulary story. Please try again.');
    }
    return output;
  }
);

// ========== API Function Export ==========

export async function generateVocabularyStory(
  input: VocabularyCoachRequest
): Promise<VocabularyCoachResponse> {
  return await vocabularyCoachFlow(input);
}
