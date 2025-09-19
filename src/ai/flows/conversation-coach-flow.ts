
'use server';
/**
 * @fileOverview AI flow for generating a full conversation practice session.
 * - generateConversation - Generates a conversation, phrases, questions, and audio.
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

// ========== Text & Audio Generation Flow ==========

const conversationPrompt = ai.definePrompt({
  name: 'conversationCoachPrompt',
  input: { schema: ConversationCoachRequestSchema },
  output: { schema: ConversationCoachResponseSchema.omit({ audio: true }) }, // AI doesn't generate the audio field
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
    // 1. Generate the text content
    const { output: textOutput } = await conversationPrompt(input);
    if (!textOutput) {
      throw new Error('The AI failed to generate a conversation. Please try again.');
    }
    
    // 2. Generate the audio content from the generated text
    const speakers = Array.from(new Set(textOutput.conversation.map(c => c.speaker)));
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
    
    const promptText = textOutput.conversation.map(c => `${c.speaker}: ${c.line}`).join('\n');

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: { multiSpeakerVoiceConfig },
      },
      prompt: promptText,
    });
    
    if (!media) {
      // If audio fails, we can still return the text content.
      return textOutput;
    }
    
    const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    const audioDataUri = 'data:audio/wav;base64,' + (await toWav(audioBuffer));

    // 3. Combine text and audio into the final response
    return {
      ...textOutput,
      audio: audioDataUri,
    };
  }
);


// ========== API Function Exports ==========

export async function generateConversation(input: ConversationCoachRequest): Promise<ConversationCoachResponse> {
  return await generateConversationFlow(input);
}
