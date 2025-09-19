
'use server';
/**
 * @fileOverview AI flow for generating a full conversation practice session.
 * - generateConversation - Generates a conversation, phrases, questions, and audio.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';
import { ConversationCoachRequestSchema, ConversationCoachResponseSchema, type ConversationCoachRequest, type ConversationCoachResponse } from '@/lib/types/conversation-coach';

const ConversationTextResponseSchema = ConversationCoachResponseSchema.omit({ audio: true });
export type ConversationTextResponse = z.infer<typeof ConversationTextResponseSchema>;

const ConversationAudioRequestSchema = z.object({
    conversation: z.array(z.object({ speaker: z.string(), line: z.string() })),
    voices: z.array(z.string()).optional(),
});
type ConversationAudioRequest = z.infer<typeof ConversationAudioRequestSchema>;

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


// ========== Audio Generation Flow ==========

const generateConversationAudioFlow = ai.defineFlow(
  {
    name: 'generateConversationAudioFlow',
    inputSchema: ConversationAudioRequestSchema,
    outputSchema: z.object({ audio: z.string() }),
  },
  async (input) => {
    const speakers = Array.from(new Set(input.conversation.map(c => c.speaker)));
    const defaultVoices = ['Algenib', 'Achernar', 'Sirius'];
    const selectedVoices = input.voices && input.voices.length > 0 ? input.voices : defaultVoices;
    
    const multiSpeakerVoiceConfig = {
      speakerVoiceConfigs: speakers.map((speaker, index) => ({
        speaker,
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: selectedVoices[index % selectedVoices.length] },
        },
      })),
    };
    
    const promptText = input.conversation.map(c => `${c.speaker}: ${c.line}`).join('\n');

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: { multiSpeakerVoiceConfig },
      },
      prompt: promptText,
    });
    
    if (!media) {
      throw new Error('Failed to generate audio for the conversation.');
    }
    
    const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    const audioDataUri = 'data:audio/wav;base64,' + (await toWav(audioBuffer));

    return { audio: audioDataUri };
  }
);


// ========== API Function Exports ==========

export async function generateConversationText(input: Omit<ConversationCoachRequest, 'voices'>): Promise<ConversationTextResponse> {
  return await generateConversationTextFlow(input);
}

export async function generateConversationAudio(input: ConversationAudioRequest): Promise<{ audio: string }> {
  return await generateConversationAudioFlow(input);
}
