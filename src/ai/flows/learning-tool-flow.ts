
import { z } from 'zod';

// ========== Input Schemas ==========

export const NotesOptionsSchema = z.object({
  style: z.enum(['detailed', 'bullet', 'outline', 'summary', 'concise']),
  complexity: z.enum(['simple', 'medium', 'advanced']),
});

export const StudyMaterialRequestSchema = z.object({
  sourceText: z.string().min(50, { message: 'Source text must be at least 50 characters.' }),
  generationType: z.enum(['notes']), // Only notes are supported now
  notesOptions: NotesOptionsSchema,
});
export type StudyMaterialRequest = z.infer<typeof StudyMaterialRequestSchema>;


// ========== Output Schemas ==========

export const StudyMaterialResponseSchema = z.object({
  title: z.string().describe('A concise and relevant title for the generated material.'),
  materialType: z.enum(['notes']),
  notesContent: z.string().describe('The generated notes as a single plain text string.'),
});
export type StudyMaterialResponse = z.infer<typeof StudyMaterialResponseSchema>;
