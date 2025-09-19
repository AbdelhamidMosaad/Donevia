
import { z } from 'zod';

export const VocabularyLevelSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

export const ConversationCoachRequestSchema = z.object({
  topic: z.string().describe('The topic for the conversation.'),
  numSpeakers: z.number().min(2).max(3).describe('The number of speakers in the conversation (2 or 3).'),
  level: VocabularyLevelSchema.describe('The CEFR level of the user.'),
  voices: z.array(z.string()).optional().describe('The selected voices for the speakers.'),
});
export type ConversationCoachRequest = z.infer<typeof ConversationCoachRequestSchema>;


const ConversationLineSchema = z.object({
  speaker: z.string().describe('The real name of the speaker, e.g., "Sarah".'),
  line: z.string().describe('The text of the line spoken by the speaker.'),
});

const PhraseExplanationSchema = z.object({
  phrase: z.string().describe('The extracted phrase or idiom.'),
  explanation: z.string().describe('A clear explanation of the phrase\'s meaning and usage.'),
});

const ComprehensionQuestionSchema = z.object({
  question: z.string().describe('The text of the comprehension question.'),
  options: z.array(z.string()).describe('An array of 3-4 possible answers.'),
  answer: z.string().describe('The correct answer from the options array.'),
});

export const ConversationCoachResponseSchema = z.object({
  title: z.string().describe('A suitable title for the conversation.'),
  conversation: z.array(ConversationLineSchema).describe('The full conversation script, broken down by speaker and line.'),
  phrases: z.array(PhraseExplanationSchema).describe('An array of 5 key phrases with explanations.'),
  questions: z.array(ComprehensionQuestionSchema).describe('An array of 5 multiple-choice questions about the conversation.'),
  audio: z.string().optional().describe('The base64 encoded WAV audio data URI for the conversation.'),
});
export type ConversationCoachResponse = z.infer<typeof ConversationCoachResponseSchema>;
