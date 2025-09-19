
'use server';
/**
 * @fileOverview AI flow for generating a full conversation practice session.
 * - generateConversation - Generates a conversation, phrases, and questions.
 * - generateConversationAudio - Generates audio for the conversation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';
import { ConversationCoachRequestSchema, ConversationCoachResponseSchema, type ConversationCoachRequest, type ConversationCoachResponse } from '@/lib/types/conversation-coach';


async function toWav(pcmData: Buffer, channels = 1, rate = 24000, sampleWidth = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({ channels, sampleRate: rate, bitDepth: sampleWidth * 8 });
    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));
    writer.write(pcmData);
    writer.end();
  });
}

// ========== Text Generation Flow ==========

const conversationPrompt = ai.definePrompt({
  name: 'conversationCoachPrompt',
  input: { schema: ConversationCoachRequestSchema },
  output: { schema: ConversationCoachResponseSchema },
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

const generateConversationFlow = ai.defineFlow(
  {
    name: 'generateConversationFlow',
    inputSchema: ConversationCoachRequestSchema,
    outputSchema: ConversationCoachResponseSchema,
  },
  async (input) => {
    const { output } = await conversationPrompt(input);
    if (!output) {
      throw new Error('The AI failed to generate a conversation. Please try again.');
    }
    return output;
  }
);


// ========== Audio Generation Flow ==========

const AudioRequestSchema = z.object({
  conversation: z.array(z.object({
    speaker: z.string(),
    line: z.string(),
  })),
});

const generateAudioFlow = ai.defineFlow(
  {
    name: 'generateConversationAudioFlow',
    inputSchema: AudioRequestSchema,
    outputSchema: z.object({ media: z.string() }),
  },
  async ({ conversation }) => {
    const speakers = Array.from(new Set(conversation.map(c => c.speaker)));
    const voices = ['Algenib', 'Achernar', 'Sirius']; // Pre-defined voices for speakers

    const multiSpeakerVoiceConfig = {
      speakerVoiceConfigs: speakers.map((speaker, index) => ({
        speaker,
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voices[index % voices.length] },
        },
      })),
    };
    
    const promptText = conversation.map(c => `${c.speaker}: ${c.line}`).join('\n');

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: { multiSpeakerVoiceConfig },
      },
      prompt: promptText,
    });

    if (!media) {
      throw new Error('No audio data was returned from the AI.');
    }
    
    const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    return {
      media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);


// ========== API Function Exports ==========

export async function generateConversation(input: ConversationCoachRequest): Promise<ConversationCoachResponse> {
  return await generateConversationFlow(input);
}

export async function generateConversationAudio(input: z.infer<typeof AudioRequestSchema>): Promise<{ media: string }> {
  return await generateAudioFlow(input);
}
