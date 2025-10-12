
import { z } from 'zod';

export const PresentationRequestSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters.' }),
  audience: z.string().min(3, { message: 'Audience must be at least 3 characters.' }),
  numSlides: z.coerce.number().min(3, { message: 'Must generate at least 3 slides.' }).max(15, { message: 'Cannot generate more than 15 slides.' }),
});

export type PresentationRequest = z.infer<typeof PresentationRequestSchema>;

export const SlideSchema = z.object({
  title: z.string().describe("The title of the slide."),
  content: z.array(z.string()).describe("An array of bullet points for the slide's main content."),
  speakerNotes: z.string().describe("Notes for the presenter for this specific slide."),
});

export type Slide = z.infer<typeof SlideSchema>;

export const PresentationResponseSchema = z.object({
  title: z.string().describe("An engaging title for the overall presentation."),
  slides: z.array(SlideSchema).describe("An array of slide objects."),
});

export type PresentationResponse = z.infer<typeof PresentationResponseSchema>;
