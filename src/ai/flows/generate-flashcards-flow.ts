
'use server';
/**
 * @fileOverview AI flow for generating flashcards from source text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { FlashcardSchema } from '@/lib/types';


// ========== Input Schema ==========
const GenerateFlashcardsRequestSchema = z.object({
  sourceText: z.string().min(50, { message: 'Source text must be at least 50 characters.' }),
});

// ========== Output Schema ==========
const GenerateFlashcardsResponseSchema = z.object({
  cards: z.array(FlashcardSchema).describe('An array of generated flashcards.'),
});

// ========== Prompt Template ==========
const flashcardPrompt = ai.definePrompt({
  name: 'generateFlashcardsPrompt',
  input: { schema: GenerateFlashcardsRequestSchema },
  output: { schema: GenerateFlashcardsResponseSchema },
  prompt: `
You are an expert at creating concise and effective flashcards for studying.
Your task is to analyze the following source text and generate a set of flashcards from it.

Each flashcard should consist of a 'front' (a clear question or term) and a 'back' (a concise and accurate answer or definition).

Based on the text provided, generate a list of flashcards.

---
**Source Text:**
{{{sourceText}}}
---
`,
});


// ========== Flow Definition ==========
const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsRequestSchema,
    outputSchema: GenerateFlashcardsResponseSchema,
  },
  async (input) => {
    const { output } = await flashcardPrompt(input);
    if (!output || !output.cards || output.cards.length === 0) {
        throw new Error('The AI failed to generate any flashcards from the provided text.');
    }
    return output;
  }
);


// ========== API Function Export ==========
export async function generateFlashcards(
  input: z.infer<typeof GenerateFlashcardsRequestSchema>
): Promise<z.infer<typeof GenerateFlashcardsResponseSchema>> {
  return generateFlashcardsFlow(input);
}
