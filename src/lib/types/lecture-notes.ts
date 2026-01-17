import { z } from 'zod';

export const LectureNotesRequestSchema = z.object({
  sourceText: z.string().min(50, { message: 'Source text must be at least 50 characters.' }),
});
export type LectureNotesRequest = z.infer<typeof LectureNotesRequestSchema>;

export const LectureNotesResponseSchema = z.object({
  title: z.string().describe("A concise and relevant title for the generated material."),
  notes: z.string().describe("The main body of the notes, structured with Markdown headings, lists, and bolded key terms."),
});
export type LectureNotesResponse = z.infer<typeof LectureNotesResponseSchema>;
