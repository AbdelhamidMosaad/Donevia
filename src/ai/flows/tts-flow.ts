
'use server';
/**
 * @fileOverview A flow for converting text to speech using Google AI.
 * - generateAudio - Converts a given string of text into a playable audio data URI.
 */
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import wav from 'wav';

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const GenerateAudioRequestSchema = z.object({
  text: z.string(),
  voice: z.string().optional().default('Algenib'),
});
type GenerateAudioRequest = z.infer<typeof GenerateAudioRequestSchema>;


const generateAudioFlow = ai.defineFlow(
  {
    name: 'generateAudioFlow',
    inputSchema: GenerateAudioRequestSchema,
    outputSchema: z.object({ media: z.string() }),
  },
  async ({ text, voice }) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Algenib' },
          },
        },
      },
      prompt: text,
    });
    if (!media) {
      throw new Error('No audio data was returned from the AI.');
    }
    // The response is raw PCM data, so we need to convert it to a playable WAV format.
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    return {
      media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);

export async function generateAudio(request: GenerateAudioRequest): Promise<{ media: string }> {
  return await generateAudioFlow(request);
}
