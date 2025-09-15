'use server';
/**
 * @fileOverview An AI flow for generating a reading comprehension exercise.
 * - generateReadingExercise - A function that uses Gemini to generate a passage, vocabulary, and questions.
 */

import { ai } from '@/ai/genkit';
import { ReadingComprehensionRequestSchema, ReadingComprehensionExerciseSchema } from '@/lib/types/reading-comprehension';
import type { ReadingComprehensionRequest, ReadingComprehensionExercise } from '@/lib/types/reading-comprehension';


const readingComprehensionPrompt = ai.definePrompt({
  name: 'readingComprehensionPrompt',
  input: { schema: ReadingComprehensionRequestSchema },
  output: { schema: ReadingComprehensionExerciseSchema },
  prompt: `
    You are an English Reading & Comprehension Coach. Your role is to create an engaging and level-appropriate reading exercise for an English language learner.

    The user has requested an exercise with the following parameters:
    - **Learner Level:** {{level}}
    - **Topic:** {{topic}}

    Please generate a complete exercise in a valid JSON format. Follow these steps precisely:

    1.  **Generate a Reading Passage**:
        -   Create a short, interesting passage of 50-200 words.
        -   The language, grammar, and vocabulary must be suitable for a **{{level}}** learner.
        -   The passage should be about **{{topic}}**.
        -   Give the passage a suitable title and place it in the \`passageTitle\` field.
        -   Place the full text of the passage in the \`readingPassage\` field.

    2.  **Extract Key Vocabulary**:
        -   Identify 5-7 key vocabulary words from the passage that are important for understanding the text and appropriate for the learner's level.
        -   For each word, create a vocabulary object with:
            -   \`word\`: The vocabulary word itself.
            -   \`definition\`: A simple, clear definition suitable for a **{{level}}** learner.
            -   \`pronunciation\`: The phonetic pronunciation (e.g., /ɪnˈɡeɪdʒɪŋ/).
            -   \`example\`: A new, simple sentence that shows the word in a different context.
        -   Place these objects in the \`vocabulary\` array.

    3.  **Create Comprehension Questions**:
        -   Generate 5-7 questions to test understanding of the passage.
        -   The questions must be a mix of the following types: \`multiple-choice\`, \`true/false\`, \`short-answer\`, and \`sequencing\`.
        -   For each question:
            -   \`question\`: The text of the question.
            -   \`type\`: The question type.
            -   \`options\`: For 'multiple-choice', provide an array of 3-4 strings.
            -   \`answer\`: The correct answer. For multiple choice, this should be the exact text of the correct option.
        -   Place these question objects in the \`comprehensionQuestions\` array.

    4.  **Create a Summary Exercise**:
        -   Create an object for the \`summaryExercise\` field with:
            -   \`prompt\`: A prompt asking the learner to summarize the passage in 1-3 sentences.
            -   \`exampleAnswer\`: A model summary that correctly and concisely summarizes the passage.

    5.  **Suggest Follow-up Practice**:
        -   Create an object for the \`followUpPractice\` field with:
            -   \`prompt\`: A short, creative writing or speaking prompt related to the passage's theme (e.g., "Write 3 sentences about...", "Discuss what you would do if...").

    Ensure the entire output is a single, valid JSON object that strictly adheres to the specified schema.
  `,
});


const generateReadingExerciseFlow = ai.defineFlow(
  {
    name: 'generateReadingExerciseFlow',
    inputSchema: ReadingComprehensionRequestSchema,
    outputSchema: ReadingComprehensionExerciseSchema,
  },
  async (input) => {
    const { output } = await readingComprehensionPrompt(input);
    if (!output) {
      throw new Error('The AI failed to generate a reading exercise. Please try again.');
    }
    return output;
  }
);


export async function generateReadingExercise(
  input: ReadingComprehensionRequest
): Promise<ReadingComprehensionExercise> {
  return await generateReadingExerciseFlow(input);
}
