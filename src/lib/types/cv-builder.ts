import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

export const CVSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
});

export const CVDataSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'CV Name is required.'),
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
  courses: z.array(z.object({
    id: z.string(),
    courseName: z.string(),
    institution: z.string(),
    completionDate: z.string(),
  })),
  languages: z.array(z.object({
    id: z.string(),
    language: z.string(),
    proficiency: z.string(),
  })).optional(),
  technicalSkills: z.string(),
  softSkills: z.string(),
});

export type CVData = z.infer<typeof CVDataSchema>;

const FirebaseTimestampSchema = z.custom<Timestamp>((val) => val instanceof Timestamp);
export const CVDraftSchema = CVDataSchema.extend({
    id: z.string(),
    ownerId: z.string(),
    updatedAt: z.any(),
});
export type CVDraft = z.infer<typeof CVDraftSchema>;


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

    