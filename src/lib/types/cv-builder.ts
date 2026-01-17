import { z } from 'zod';

export const CVSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
});

export const CVDataSchema = z.object({
  personalDetails: z.object({
    fullName: z.string(),
    email: z.string(),
    phone: z.string(),
    address: z.string(),
    linkedIn: z.string().optional(),
    website: z.string().optional(),
  }),
  summary: z.string(),
  experience: z.array(z.object({
    id: z.string(),
    jobTitle: z.string(),
    company: z.string(),
    location: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    description: z.string(),
  })),
  education: z.array(z.object({
    id: z.string(),
    degree: z.string(),
    school: z.string(),
    location: z.string(),
    graduationDate: z.string(),
  })),
  skills: z.string(),
});

export type CVData = z.infer<typeof CVDataSchema>;

export const CVSectionEnhancementRequestSchema = z.object({
  section: z.string().describe("The name of the CV section (e.g., 'Work Experience Description', 'Summary')."),
  originalText: z.string().describe("The user's original text for that section."),
  jobTitle: z.string().optional().describe("The user's job title for context."),
});
export type CVSectionEnhancementRequest = z.infer<typeof CVSectionEnhancementRequestSchema>;

export const CVSectionEnhancementResponseSchema = z.object({
  enhancedText: z.string().describe("The improved, ATS-friendly version of the text."),
  tips: z.array(z.string()).describe("A list of tips explaining the improvements made."),
});
export type CVSectionEnhancementResponse = z.infer<typeof CVSectionEnhancementResponseSchema>;
