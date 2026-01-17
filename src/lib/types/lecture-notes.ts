import { z } from 'zod';

export const LectureNotesRequestSchema = z.object({
  sourceText: z.string().min(50, { message: 'Source text must be at least 50 characters.' }),
});
export type LectureNotesRequest = z.infer<typeof LectureNotesRequestSchema>;

export const LectureNotesResponseSchema = z.object({
  title: z.string().describe("A concise and relevant title for the generated material."),
  learningObjectives: z.array(z.string()).describe("An array of 3-5 key learning objectives based on the source text."),
  notes: z.string().describe("The main body of the notes, structured with Markdown headings, lists, and bolded key terms."),
  learningSummary: z.string().describe("A 2-3 sentence paragraph that concisely summarizes the key takeaways of the lecture notes."),
});
export type LectureNotesResponse = z.infer<typeof LectureNotesResponseSchema>;
