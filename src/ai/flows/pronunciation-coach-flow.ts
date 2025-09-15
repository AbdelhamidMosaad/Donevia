'use server';
/**
 * @fileOverview An AI flow for generating pronunciation practice exercises.
 * - generatePronunciationPractice - A function that uses Gemini to generate a list of words and phrases.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const PronunciationPracticeRequestSchema = z.object({
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  topic: z.string().describe('The difficult sound or pattern to focus on, e.g., "th", "r/l".'),
});

const PracticeItemSchema = z.object({
  text: z.string().describe('The word or short phrase to practice, with the target sound wrapped in markdown bold (**). E.g., "**th**ink" or "li**gh**t".'),
  ipa: z.string().describe('The International Phonetic Alphabet (IPA) transcription.'),
});

const PronunciationPracticeResponseSchema = z.object({
  focus: z.string().describe('A confirmation of the pronunciation focus for the session.'),
  practiceTip: z.string().describe('A single, actionable tip for the user to keep in mind during practice.'),
  practiceItems: z.array(PracticeItemSchema).length(10).describe('An array of 10 words or short phrases for practice.'),
});

export type PronunciationPracticeRequest = z.infer<typeof PronunciationPracticeRequestSchema>;
export type PronunciationPracticeResponse = z.infer<typeof PronunciationPracticeResponseSchema>;


const pronunciationCoachPrompt = ai.definePrompt({
  name: 'pronunciationCoachPrompt',
  input: { schema: PronunciationPracticeRequestSchema },
  output: { schema: PronunciationPracticeResponseSchema },
  prompt: `
    You are an English Pronunciation Coach. Your task is to create a practice session for a learner.

    **Instructions:**
    1.  **Acknowledge Focus**: In the 'focus' field, confirm the pronunciation topic. For example, if the topic is 'th', you could say 'The "th" sound'.
    2.  **Provide a Tip**: In the 'practiceTip' field, provide one clear, simple, and actionable tip for producing the sound.
    3.  **Generate Items**: Create exactly 10 practice items (a mix of single words and short, common phrases) that are appropriate for a {{level}} learner and target the '{{topic}}' sound.
    4.  **Highlight the Sound**: For each item in 'practiceItems', wrap the specific letters that make the target sound in markdown bold (**). For example, if the topic is 'sh', 'she sells' should be '**sh**e sells'. If the sound appears multiple times, highlight the most prominent one.
    5.  **Provide IPA**: For each item, provide its IPA transcription in the 'ipa' field.
    6.  **JSON Output**: Ensure your entire output is a single, valid JSON object.
  `,
});


const generatePronunciationPracticeFlow = ai.defineFlow(
  {
    name: 'generatePronunciationPracticeFlow',
    inputSchema: PronunciationPracticeRequestSchema,
    outputSchema: PronunciationPracticeResponseSchema,
  },
  async (input) => {
    const { output } = await pronunciationCoachPrompt(input);
    if (!output) {
      throw new Error('The AI failed to generate a pronunciation exercise.');
    }
    return output;
  }
);


export async function generatePronunciationPractice(
  input: PronunciationPracticeRequest
): Promise<PronunciationPracticeResponse> {
  return await generatePronunciationPracticeFlow(input);
}
