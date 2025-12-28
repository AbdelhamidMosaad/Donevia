
'use server';
/**
 * @fileOverview AI flow for generating a full conversation practice session.
 * - generateConversation - Generates a conversation, phrases, questions, and audio.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { ConversationCoachRequestSchema, ConversationCoachResponseSchema, type ConversationCoachRequest, type ConversationCoachResponse } from '@/lib/types/conversation-coach';

const ConversationTextResponseSchema = ConversationCoachResponseSchema.omit({ audio: true });
export type ConversationTextResponse = z.infer<typeof ConversationTextResponseSchema>;

// ========== Text Generation Flow ==========

const conversationTextPrompt = ai.definePrompt({
  name: 'conversationCoachTextPrompt',
  input: { schema: ConversationCoachRequestSchema.omit({ voices: true }) }, // Text prompt doesn't need voices
  output: { schema: ConversationTextResponseSchema }, 
  prompt: `
    You are an expert English teacher creating a practice exercise. Your task is to generate a full conversation session based on the user's request.

    **User Request:**
    - **Topic:** {{topic}}
    - **Number of Speakers:** {{numSpeakers}}
    - **Learner Level:** {{level}} (CEFR)

    **Instructions:**

    1.  **Title**: Create a simple and relevant title for the conversation.
    2.  **Conversation Script**:
        -   Write a natural, coherent, and interesting conversation about the specified topic.
        -   The language, vocabulary, and sentence structure must be appropriate for a **{{level}}** learner.
        -   Use exactly **{{numSpeakers}}** speakers. You must assign a common, real first name to each speaker (e.g., "Sarah", "John").
        -   The conversation should have at least 8-12 turns to be meaningful.
    3.  **Extract Key Phrases**:
        -   From the conversation, identify exactly 5 common, useful English phrases or idioms that would be valuable for a **{{level}}** learner.
        -   For each phrase, provide a clear explanation of its meaning and in what situations it can be used.
    4.  **Create Comprehension Questions**:
        -   Generate exactly 5 multiple-choice questions to test the user's understanding of the conversation.
        -   For each question, provide 3-4 plausible options.
        -   Clearly indicate the correct answer.

    Ensure your entire output is a single, valid JSON object that strictly adheres to the required format.
  `,
});

const generateConversationTextFlow = ai.defineFlow(
  {
    name: 'generateConversationTextFlow',
    inputSchema: ConversationCoachRequestSchema.omit({ voices: true }),
    outputSchema: ConversationTextResponseSchema,
  },
  async (input) => {
    const { output } = await conversationTextPrompt(input);
    if (!output) {
      throw new Error('The AI failed to generate a conversation. Please try again.');
    }
    return output;
  }
);


// ========== API Function Exports ==========

export async function generateConversationText(input: Omit<ConversationCoachRequest, 'voices'>): Promise<ConversationTextResponse> {
  return await generateConversationTextFlow(input);
}
